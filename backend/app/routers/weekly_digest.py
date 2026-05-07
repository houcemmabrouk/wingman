"""HTTP layer for the weekly digest (Phase 1A — generate on demand, no persistence).

Endpoints:
    GET /api/v1/digest/current  — returns the current ISO week's digest
                                  (regenerated each call until Phase 2 lands a cache table)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.weekly_digest import generate_for_user

router = APIRouter(prefix="/api/v1/digest", tags=["weekly-digest"])


@router.get("/current")
async def get_current_digest(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await generate_for_user(db, user_id)
