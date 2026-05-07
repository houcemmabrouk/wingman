from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


# Paths whose responses must be embeddable in same-origin iframes (in-app viewers).
# Everything else stays X-Frame-Options: DENY to prevent clickjacking on app routes.
_FRAMABLE_PATH_PREFIXES = (
    "/api/content/generated/",
    "/api/content/setup/",
    "/api/sessions/checklist/",
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        if any(request.url.path.startswith(p) for p in _FRAMABLE_PATH_PREFIXES):
            # Drop X-Frame-Options and use CSP frame-ancestors instead — CSP
            # lets us whitelist cross-origin embedders (localhost:3000 ↔ :8000).
            response.headers["Content-Security-Policy"] = (
                "frame-ancestors 'self' http://localhost:3000 https://wingman.veridis.shop"
            )
        else:
            response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
