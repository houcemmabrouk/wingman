from jose import jwt, JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import settings

# Routes that don't require authentication
PUBLIC_PREFIXES = (
    "/health",
    "/api/auth/",
    "/docs",
    "/openapi.json",
    "/api/data-status",
)

ALGORITHM = "HS256"
COOKIE_NAME = "wingman_session"


DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Auth disabled → always inject demo user
        if settings.auth_disabled:
            request.state.user_id = DEMO_USER_ID
            return await call_next(request)

        path = request.url.path

        # Skip auth for public routes
        if any(path.startswith(p) for p in PUBLIC_PREFIXES):
            request.state.user_id = None
            return await call_next(request)

        user_id = None

        # 1. Try Authorization header (Bearer token)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
                user_id = payload.get("sub")
            except JWTError:
                pass

        # 2. Try session cookie
        if not user_id:
            cookie_token = request.cookies.get(COOKIE_NAME)
            if cookie_token:
                try:
                    payload = jwt.decode(cookie_token, settings.secret_key, algorithms=[ALGORITHM])
                    user_id = payload.get("sub")
                except JWTError:
                    pass

        # No fallback to ?user_id= — that was a critical impersonation hole
        # (AUDIT_PACKET.md C1). Caller must present a valid Bearer token or
        # session cookie; otherwise request.state.user_id stays None and the
        # router's per-endpoint check refuses the call.
        request.state.user_id = user_id
        return await call_next(request)
