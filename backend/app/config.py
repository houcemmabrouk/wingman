from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

# Sentinel default that MUST be replaced in any production deployment. The
# validator below refuses to start the app if this value leaks into prod.
DEFAULT_SECRET_PLACEHOLDER = "change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
    )

    database_url: str = "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman"
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = DEFAULT_SECRET_PLACEHOLDER
    access_token_expire_minutes: int = 60
    anthropic_api_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    resend_api_key: str = ""
    frontend_url: str = "https://wingman.veridis.shop"
    smtp_host: str = "smtp.hostinger.com"
    smtp_port: int = 465
    smtp_user: str = "contact@veridis.shop"
    smtp_pass: str = ""
    admin_secret_key: str = ""
    auth_disabled: bool = False
    groq_api_key: str = ""
    debug_overrides_enabled: bool = False  # gate ?debug_pct= etc. — opt-in, dev/QA only

    @model_validator(mode="after")
    def _enforce_prod_secrets(self) -> "Settings":
        """In production (auth enabled, frontend pointing at the real domain),
        refuse to start with insecure defaults. Per AUDIT C4.

        Dev (auth_disabled=true) bypasses this so localhost iteration isn't
        blocked, but the moment AUTH is on, the secrets must be set.
        """
        if self.auth_disabled:
            return self
        problems: list[str] = []
        if self.secret_key == DEFAULT_SECRET_PLACEHOLDER or not self.secret_key.strip():
            problems.append("secret_key is the default placeholder; set SECRET_KEY in env")
        if not self.admin_secret_key.strip():
            problems.append("admin_secret_key is empty; set ADMIN_SECRET_KEY in env")
        if problems:
            raise RuntimeError(
                "Refusing to start: insecure auth config — "
                + "; ".join(problems)
                + ". Set AUTH_DISABLED=true if running dev locally."
            )
        return self


_settings = Settings()

# Workaround: if a system env var is empty, re-read from .env directly
if not _settings.anthropic_api_key:
    from dotenv import dotenv_values
    _env_vals = dotenv_values(str(_ENV_FILE))
    if _env_vals.get("ANTHROPIC_API_KEY"):
        _settings.anthropic_api_key = _env_vals["ANTHROPIC_API_KEY"]

settings = _settings
