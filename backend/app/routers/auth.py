import secrets
import smtplib
import ssl
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from logging.handlers import RotatingFileHandler

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from app.deps import current_user_id

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Auth Logger ─────────────────────────────────────────────────
LOG_DIR = "/var/log/wingman" if os.name != "nt" else os.path.join(os.path.dirname(__file__), "..", "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

auth_logger = logging.getLogger("wingman.auth")
auth_logger.setLevel(logging.INFO)
auth_logger.propagate = False

_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "auth.log"),
    maxBytes=5 * 1024 * 1024,  # 5 MB per file
    backupCount=10,
)
_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
))
auth_logger.addHandler(_handler)


def _client_ip(request: Request) -> str:
    """Extract real client IP from proxy headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Redis-backed rate limiting for magic-link auth ───────────────
# Why Redis directly instead of SlowAPI: redis==5.2.1 is already a hard dep
# (cache, planning state, jobs); pulling slowapi would add a second mechanism
# for the same job. Counters expire automatically via TTL.

async def _redis():
    import redis.asyncio as redis
    return redis.from_url(settings.redis_url, socket_timeout=2, decode_responses=True)


async def _check_and_incr(key: str, max_count: int, ttl_sec: int) -> tuple[bool, int]:
    """Atomically increment `key`, set TTL on first hit. Returns (allowed, current_count)."""
    try:
        r = await _redis()
        # Pipeline: INCR then EXPIRE only on first hit (NX semantics via SET on miss).
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, ttl_sec)
        return (count <= max_count, count)
    except Exception:
        if settings.auth_disabled:
            return (True, 0)
        auth_logger.error(f"RATE_LIMIT_UNAVAILABLE | key={key}")
        raise HTTPException(
            status_code=503,
            detail="Authentication rate limiter unavailable. Try again shortly.",
        )


SEND_CODE_PER_IP_PER_MIN = 5      # 5 send-code requests per IP per minute
SEND_CODE_PER_EMAIL_PER_HOUR = 10 # 10 codes per email per hour
VERIFY_MAX_ATTEMPTS = 5            # lock email after 5 wrong codes
VERIFY_LOCK_SECONDS = 3600         # 1h lock


def _ua(request: Request) -> str:
    """Short user-agent string."""
    ua = request.headers.get("user-agent", "")
    return ua[:120]

ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 30
COOKIE_NAME = "wingman_session"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# ── Helpers ──────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def verify_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


def set_session_cookie(response, token: str):
    """Set HTTP-only session cookie. Secure=False for localhost dev."""
    from app.config import settings
    is_prod = 'veridis.shop' in settings.frontend_url
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=TOKEN_EXPIRY_DAYS * 86400,
        path="/",
    )


def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None):
    """Send an email via SMTP. No-op if SMTP is not configured."""
    if not settings.smtp_pass:
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Wingman <{settings.smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(text_body or "", "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context) as server:
            server.login(settings.smtp_user, settings.smtp_pass)
            server.sendmail(settings.smtp_user, to_email, msg.as_string())
    except Exception:
        pass  # fail silently — caller handles fallback


def _wrap_email_html(content: str) -> str:
    """Wrap content in the standard Wingman email template."""
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0f1117; border-radius: 16px; padding: 40px 32px; text-align: center;">
        <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px 0;">
          <span style="color: #a855f7;">Wing</span>man
        </h1>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 32px 0;">CFA Level I Performance Copilot</p>
        {content}
      </div>
    </div>
    """


async def find_or_create_user(db: AsyncSession, email: str, display_name: str, provider: str, image: str | None = None) -> tuple[dict, bool]:
    """Find user by email or create new one. Returns (user_dict, is_new)."""
    row = await db.execute(
        text("SELECT id, email, display_name, is_active, provider, image FROM users WHERE email = :email"),
        {"email": email},
    )
    user = row.mappings().first()

    if user:
        updates = {"email": email}
        set_clauses = ["last_login_at = now()"]
        if image and provider == "google":
            set_clauses.append("image = :img")
            updates["img"] = image
        await db.execute(
            text(f"UPDATE users SET {', '.join(set_clauses)} WHERE email = :email"), updates
        )
        await db.commit()
        return dict(user), False

    # Create new user with is_active = false (requires admin activation)
    result = await db.execute(text("""
        INSERT INTO users (email, display_name, provider, image, is_active, last_login_at)
        VALUES (:email, :name, :provider, :image, false, now())
        RETURNING id, email, display_name, is_active, provider, image
    """), {"email": email, "name": display_name, "provider": provider, "image": image})
    new_user = dict(result.mappings().first())

    # exam_date intentionally NULL — a default 90-day placeholder produced a
    # phantom countdown ("D-78") for accounts that never actually set a date.
    # Front-end hides the topbar badge when daysToExam is null and shows a
    # "Set exam date" CTA in onboarding instead.
    await db.execute(text("""
        INSERT INTO user_profiles (user_id, exam_date, daily_minutes_goal)
        VALUES (:uid, NULL, 90)
    """), {"uid": str(new_user["id"])})
    await db.commit()

    return new_user, True


# ── Schemas ──────────────────────────────────────────────────

class UserResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    is_active: bool
    provider: str | None = None
    image: str | None = None


class MagicLinkRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class PasswordRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    if len(password) > 128:
        raise HTTPException(status_code=422, detail="Password is too long.")


def _user_response(user: dict) -> UserResponse:
    return UserResponse(
        user_id=str(user["id"]),
        email=user["email"],
        display_name=user["display_name"],
        is_active=user["is_active"],
        provider=user["provider"],
        image=user["image"],
    )


# ── Password Auth ───────────────────────────────────────────────

@router.post("/register")
async def register_with_password(req: PasswordRegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Create a password account. New accounts still require admin activation."""
    _validate_password(req.password)
    ip = _client_ip(request)
    email_lc = req.email.lower()
    display_name = (req.display_name or req.email.split("@")[0]).strip()[:100]

    existing = await db.execute(
        text("SELECT id, email, display_name, is_active, provider, image, password_hash FROM users WHERE lower(email) = :email"),
        {"email": email_lc},
    )
    row = existing.mappings().first()
    if row and row["password_hash"]:
        auth_logger.warning(f"REGISTER_FAIL| email={req.email} | ip={ip} | reason=already_exists")
        raise HTTPException(status_code=409, detail="An account already exists for this email.")

    password_hash = hash_password(req.password)
    if row:
        await db.execute(
            text("""
                UPDATE users
                SET password_hash = :password_hash,
                    provider = CASE WHEN provider = 'google' THEN provider ELSE 'password' END,
                    updated_at = now()
                WHERE id = :uid
            """),
            {"password_hash": password_hash, "uid": row["id"]},
        )
        await db.commit()
        user = dict(row)
        user["password_hash"] = password_hash
        auth_logger.info(f"REGISTER_OK  | email={req.email} | ip={ip} | user_id={user['id']} | existing=true")
    else:
        result = await db.execute(text("""
            INSERT INTO users (email, password_hash, display_name, provider, is_active)
            VALUES (:email, :password_hash, :display_name, 'password', false)
            RETURNING id, email, display_name, is_active, provider, image
        """), {"email": email_lc, "password_hash": password_hash, "display_name": display_name})
        user = dict(result.mappings().first())
        await db.execute(text("""
            INSERT INTO user_profiles (user_id, exam_date, daily_minutes_goal)
            VALUES (:uid, NULL, 90)
        """), {"uid": str(user["id"])})
        await db.commit()
        auth_logger.info(f"REGISTER_OK  | email={req.email} | ip={ip} | user_id={user['id']} | existing=false | status=pending_activation")

    if not user["is_active"]:
        return {
            "status": "pending_activation",
            "message": "Your account is registered but a supervisor must activate it before you can log in.",
        }
    return {"status": "ok", "user": _user_response(user)}


@router.post("/login")
async def login_with_password(req: PasswordLoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Log in with email and password, then set the HTTP-only session cookie."""
    ip = _client_ip(request)
    email_lc = req.email.lower()
    row = await db.execute(
        text("""
            SELECT id, email, display_name, is_active, provider, image, password_hash
            FROM users
            WHERE lower(email) = :email
        """),
        {"email": email_lc},
    )
    user = row.mappings().first()
    if not user or not verify_password(req.password, user["password_hash"]):
        auth_logger.warning(f"LOGIN_FAILED | email={req.email} | ip={ip} | provider=password | reason=bad_credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user["is_active"]:
        auth_logger.info(f"LOGIN_BLOCKED| email={req.email} | ip={ip} | reason=inactive_account | provider=password")
        return {"status": "pending_activation", "message": "Your account is pending activation by a supervisor."}

    await db.execute(text("UPDATE users SET last_login_at = now() WHERE id = :uid"), {"uid": user["id"]})
    await db.commit()
    token = create_access_token(str(user["id"]))
    set_session_cookie(response, token)
    auth_logger.info(f"LOGIN_OK     | email={req.email} | ip={ip} | user_id={user['id']} | provider=password")
    return {"status": "ok", "token": token, "user": _user_response(dict(user))}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    request: Request,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Change the password for the currently authenticated user."""
    _validate_password(req.new_password)
    ip = _client_ip(request)

    row = await db.execute(
        text("SELECT id, email, password_hash FROM users WHERE id = :uid"),
        {"uid": user_id},
    )
    user = row.mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not verify_password(req.current_password, user["password_hash"]):
        auth_logger.warning(f"PASSWORD_FAIL| email={user['email']} | ip={ip} | user_id={user_id} | reason=bad_current_password")
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    await db.execute(
        text("UPDATE users SET password_hash = :password_hash, provider = 'password', updated_at = now() WHERE id = :uid"),
        {"password_hash": hash_password(req.new_password), "uid": user_id},
    )
    await db.commit()
    auth_logger.info(f"PASSWORD_OK  | email={user['email']} | ip={ip} | user_id={user_id}")
    return {"status": "ok"}


# ── Email Magic Code Auth (Primary) ─────────────────────────

@router.post("/send-code")
async def send_login_code(req: MagicLinkRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Send a 6-digit login code to the user's email."""
    ip = _client_ip(request)

    # Rate limit per IP and per email — both checked atomically before generating
    # the code so a stampede doesn't waste DB writes. Per AUDIT C3.
    ip_ok, ip_count = await _check_and_incr(f"auth:send:ip:{ip}", SEND_CODE_PER_IP_PER_MIN, 60)
    if not ip_ok:
        auth_logger.warning(f"RATELIMIT    | email={req.email} | ip={ip} | scope=ip | count={ip_count}")
        raise HTTPException(status_code=429, detail="Too many requests, try again in a minute.")
    email_ok, email_count = await _check_and_incr(f"auth:send:email:{req.email.lower()}", SEND_CODE_PER_EMAIL_PER_HOUR, 3600)
    if not email_ok:
        auth_logger.warning(f"RATELIMIT    | email={req.email} | ip={ip} | scope=email | count={email_count}")
        raise HTTPException(status_code=429, detail="Too many codes requested for this email today.")

    auth_logger.info(f"CODE_REQUEST | email={req.email} | ip={ip} | ua={_ua(request)}")
    code = f"{secrets.randbelow(1000000):06d}"

    # Store code in magic_tokens table (reuse existing table)
    await db.execute(text("""
        DELETE FROM magic_tokens WHERE email = :email
    """), {"email": req.email})
    await db.execute(text("""
        INSERT INTO magic_tokens (email, token, expires_at)
        VALUES (:email, :code, now() + INTERVAL '10 minutes')
    """), {"email": req.email, "code": code})
    await db.commit()

    # Send email via SMTP
    if not settings.smtp_pass:
        # Dev fallback: return code in response
        return {"status": "sent", "message": "Code sent to your email", "_dev_code": code}

    html_content = f"""
        <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;">Your login code:</p>
        <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
          <span style="color: #a855f7; font-size: 36px; font-weight: 700; letter-spacing: 8px;">{code}</span>
        </div>
        <p style="color: #475569; font-size: 12px; margin: 0;">
          This code expires in 10 minutes.
        </p>
    """

    send_email(
        to_email=req.email,
        subject=f"Wingman Login Code: {code}",
        html_body=_wrap_email_html(html_content),
        text_body=f"Your Wingman login code is: {code}\n\nThis code expires in 10 minutes.",
    )

    return {"status": "sent", "message": "Code sent to your email"}


@router.post("/verify-code")
async def verify_login_code(req: VerifyCodeRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Verify the 6-digit code and log the user in."""
    ip = _client_ip(request)
    email_lc = req.email.lower()

    # Hard lock — email is locked for 1h after VERIFY_MAX_ATTEMPTS bad codes.
    # Implemented as a fixed-window counter on Redis so a brute-force at
    # 1000 req/min only buys 5 tries. Per AUDIT C3.
    try:
        r = await _redis()
        attempts = int(await r.get(f"auth:verify:fail:{email_lc}") or 0)
        if attempts >= VERIFY_MAX_ATTEMPTS:
            auth_logger.warning(f"VERIFY_LOCKED| email={req.email} | ip={ip} | attempts={attempts}")
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in an hour.")
    except HTTPException:
        raise
    except Exception:
        if not settings.auth_disabled:
            auth_logger.error(f"VERIFY_RATE_LIMIT_UNAVAILABLE | email={req.email} | ip={ip}")
            raise HTTPException(
                status_code=503,
                detail="Authentication rate limiter unavailable. Try again shortly.",
            )

    row = await db.execute(text("""
        SELECT id, email, token, used, expires_at FROM magic_tokens
        WHERE email = :email AND token = :code AND used = false AND expires_at > now()
        ORDER BY expires_at DESC LIMIT 1
    """), {"email": req.email, "code": req.code})
    magic_row = row.mappings().first()

    if not magic_row:
        # Increment fail counter; lock kicks in on the NEXT request after the threshold.
        try:
            r = await _redis()
            n = await r.incr(f"auth:verify:fail:{email_lc}")
            if n == 1:
                await r.expire(f"auth:verify:fail:{email_lc}", VERIFY_LOCK_SECONDS)
        except Exception:
            if not settings.auth_disabled:
                auth_logger.error(f"VERIFY_FAIL_COUNTER_UNAVAILABLE | email={req.email} | ip={ip}")
                raise HTTPException(
                    status_code=503,
                    detail="Authentication rate limiter unavailable. Try again shortly.",
                )
        auth_logger.warning(f"CODE_FAILED  | email={req.email} | ip={ip} | reason=invalid_or_expired")
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    # Reset fail counter on a successful match — fresh slate.
    try:
        r = await _redis()
        await r.delete(f"auth:verify:fail:{email_lc}")
    except Exception:
        pass

    # Mark as used
    await db.execute(text("UPDATE magic_tokens SET used = true WHERE id = :id"), {"id": magic_row["id"]})

    # Find or create user
    display_name = req.email.split("@")[0]
    user, is_new = await find_or_create_user(db, req.email, display_name, "email")

    # New user: send "pending activation" email, do NOT log in
    if is_new:
        auth_logger.info(f"NEW_USER     | email={req.email} | ip={ip} | provider=email | status=pending_activation")
        html_content = """
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;">Your account has been registered!</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">
              A supervisor must activate your account before you can log in.
              You will receive an email once your account is activated.
            </p>
            <div style="background: #1e1e2e; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
              <span style="color: #fbbf24; font-size: 14px;">&#9203; Pending activation</span>
            </div>
        """
        send_email(
            to_email=req.email,
            subject="Wingman - Account Registered (Pending Activation)",
            html_body=_wrap_email_html(html_content),
            text_body="Your Wingman account has been registered. A supervisor must activate it before you can log in. You will receive an email once activated.",
        )
        return {"status": "pending_activation", "message": "Your account is registered but a supervisor must activate it before you can log in."}

    # Existing user with is_active = false: show pending message
    if not user["is_active"]:
        auth_logger.info(f"LOGIN_BLOCKED| email={req.email} | ip={ip} | reason=inactive_account")
        return {"status": "pending_activation", "message": "Your account is pending activation by a supervisor."}

    # Active user: log in normally
    auth_logger.info(f"LOGIN_OK     | email={req.email} | ip={ip} | user_id={user['id']} | provider=email")
    token = create_access_token(str(user["id"]))
    set_session_cookie(response, token)

    return {
        "status": "ok",
        "token": token,
        "user": UserResponse(
            user_id=str(user["id"]),
            email=user["email"],
            display_name=user["display_name"],
            is_active=user["is_active"],
            provider=user["provider"],
            image=user["image"],
        ),
    }


# ── Google OAuth (Alternative) ───────────────────────────────

@router.get("/google")
async def google_login(request: Request):
    """Redirect to Google OAuth consent screen."""
    auth_logger.info(f"GOOGLE_START | ip={_client_ip(request)} | ua={_ua(request)}")
    if not settings.google_client_id:
        # Soft-fail: redirect back to /login with a flag instead of 500.
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_not_configured")

    params = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.frontend_url}/api/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(request: Request, code: str | None = None, error: str | None = None, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    ip = _client_ip(request)
    if error or not code:
        auth_logger.warning(f"GOOGLE_FAIL  | ip={ip} | error={error or 'no_code'}")
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_failed")

    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post("https://oauth2.googleapis.com/token", data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": f"{settings.frontend_url}/api/auth/google/callback",
                "grant_type": "authorization_code",
            })
            if token_res.status_code != 200:
                auth_logger.warning(f"GOOGLE_FAIL  | ip={ip} | error=token_exchange_failed")
                return RedirectResponse(f"{settings.frontend_url}/login?error=google_token_failed")
            tokens = token_res.json()

            user_res = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"})
            if user_res.status_code != 200:
                auth_logger.warning(f"GOOGLE_FAIL  | ip={ip} | error=userinfo_failed")
                return RedirectResponse(f"{settings.frontend_url}/login?error=google_userinfo_failed")
            google_user = user_res.json()
    except Exception as exc:
        auth_logger.warning(f"GOOGLE_FAIL  | ip={ip} | error=exception:{exc}")
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_failed")

    email = google_user.get("email")
    name = google_user.get("name", email.split("@")[0] if email else "User")
    image = google_user.get("picture")

    if not email:
        auth_logger.warning(f"GOOGLE_FAIL  | ip={ip} | error=no_email_in_profile")
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_no_email")

    user, is_new = await find_or_create_user(db, email, name, "google", image)

    # New user or inactive user: redirect to login with pending message
    if is_new:
        auth_logger.info(f"NEW_USER     | email={email} | ip={ip} | provider=google | status=pending_activation")
        html_content = """
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;">Your account has been registered!</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">
              A supervisor must activate your account before you can log in.
              You will receive an email once your account is activated.
            </p>
            <div style="background: #1e1e2e; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
              <span style="color: #fbbf24; font-size: 14px;">&#9203; Pending activation</span>
            </div>
        """
        send_email(
            to_email=email,
            subject="Wingman - Account Registered (Pending Activation)",
            html_body=_wrap_email_html(html_content),
            text_body="Your Wingman account has been registered. A supervisor must activate it before you can log in. You will receive an email once activated.",
        )
        return RedirectResponse(f"{settings.frontend_url}/login?pending=true")

    if not user["is_active"]:
        auth_logger.info(f"LOGIN_BLOCKED| email={email} | ip={ip} | reason=inactive_account | provider=google")
        return RedirectResponse(f"{settings.frontend_url}/login?pending=true")

    # Active user: log in normally
    auth_logger.info(f"LOGIN_OK     | email={email} | ip={ip} | user_id={user['id']} | provider=google")
    token = create_access_token(str(user["id"]))
    response = RedirectResponse(f"{settings.frontend_url}/auth/callback?token={token}")
    set_session_cookie(response, token)
    return response


# ── Session check ────────────────────────────────────────────

@router.get("/session")
async def check_session(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Check if user has a valid session cookie."""
    ip = _client_ip(request)
    cookie_token = request.cookies.get(COOKIE_NAME)
    if not cookie_token:
        raise HTTPException(status_code=401, detail="Not logged in")

    user_id = verify_token(cookie_token)
    if not user_id:
        auth_logger.warning(f"SESSION_EXPIRED | ip={ip}")
        raise HTTPException(status_code=401, detail="Session expired")

    row = await db.execute(
        text("SELECT id, email, display_name, is_active, provider, image FROM users WHERE id = :uid"),
        {"uid": user_id},
    )
    user = row.mappings().first()
    if not user:
        auth_logger.warning(f"SESSION_INVALID | ip={ip} | user_id={user_id} | reason=user_not_found")
        raise HTTPException(status_code=401, detail="User not found")

    auth_logger.info(f"SESSION_OK   | email={user['email']} | ip={ip} | user_id={user['id']}")
    set_session_cookie(response, cookie_token)
    return UserResponse(
        user_id=str(user["id"]),
        email=user["email"],
        display_name=user["display_name"],
        is_active=user["is_active"],
        provider=user["provider"],
        image=user["image"],
    )


@router.get("/auto-session")
async def auto_session_compat(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Backward compat alias."""
    return await check_session(request, response, db)


# ── Token Verification ───────────────────────────────────────

@router.get("/me/{token}")
async def get_me_by_token(token: str, response: Response, db: AsyncSession = Depends(get_db)):
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    row = await db.execute(
        text("SELECT id, email, display_name, is_active, provider, image FROM users WHERE id = :uid"),
        {"uid": user_id},
    )
    user = row.mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    set_session_cookie(response, token)
    return UserResponse(
        user_id=str(user["id"]),
        email=user["email"],
        display_name=user["display_name"],
        is_active=user["is_active"],
        provider=user["provider"],
        image=user["image"],
    )


# ── Logout ───────────────────────────────────────────────────

@router.post("/logout")
async def logout(request: Request, response: Response):
    ip = _client_ip(request)
    cookie_token = request.cookies.get(COOKIE_NAME)
    user_id = verify_token(cookie_token) if cookie_token else None
    auth_logger.info(f"LOGOUT       | ip={ip} | user_id={user_id or 'unknown'}")
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "logged_out"}
