import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings

# Use SQLite if PostgreSQL is unavailable (content generation doesn't need DB)
_db_url = settings.database_url
if "postgresql" in _db_url:
    # Check if we should fall back to SQLite (no pg running)
    _use_sqlite = os.environ.get("WINGMAN_NO_DB", "0") == "1"
    if _use_sqlite:
        _db_url = "sqlite+aiosqlite:///./wingman_fallback.db"

_kwargs = {}
if "sqlite" not in _db_url:
    _kwargs = {"pool_size": 10, "max_overflow": 20, "pool_pre_ping": True}

engine = create_async_engine(_db_url, echo=False, **_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
