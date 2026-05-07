"""HTTP layer for the unified NBA Inbox + hero card.

Endpoints:
    GET  /api/v1/nba/hero            — single most urgent action (hero card)
    GET  /api/v1/inbox               — unified list, sorted urgent→unread→chrono
    GET  /api/v1/inbox/unread-count  — lightweight count for sidebar badge
    POST /api/v1/inbox/mark-read     — { item_key }
    POST /api/v1/inbox/dismiss       — { item_key }
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.inbox_aggregator import (
    aggregate_inbox, count_unread, mark_read as svc_mark_read, dismiss as svc_dismiss,
)
from app.services.nba_service import NBAService

router = APIRouter(prefix="/api/v1", tags=["inbox"])


# ── Hero card ─────────────────────────────────────────────────

@router.get("/nba/hero")
async def get_nba_hero(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Single most urgent action — the hero card on /nba.

    Reuses NBAService.get_emergency_action() which returns:
        priority, topic, lm, los, action_text, mastery_pct, exam_weight_pct,
        urgency_score, deadline, days_until_exam, module_title, ...
    The frontend's HeroAction interface mirrors this shape.
    """
    return await NBAService.get_emergency_action(db, user_id)


# ── Inbox list ────────────────────────────────────────────────

@router.get("/inbox")
async def get_inbox(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Unified inbox aggregating 6 source streams. The hero LOS is excluded."""
    hero = await NBAService.get_emergency_action(db, user_id)
    return await aggregate_inbox(db, user_id, exclude_hero_los=hero.get("los"))


# ── Unread count (sidebar badge polling) ─────────────────────

@router.get("/inbox/unread-count")
async def get_unread_count(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    n = await count_unread(db, user_id)
    return {"unread_count": n}


# ── Mutations ────────────────────────────────────────────────

class ItemKeyRequest(BaseModel):
    item_key: str = Field(..., min_length=1, max_length=160)


@router.post("/inbox/mark-read")
async def post_mark_read(
    body: ItemKeyRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await svc_mark_read(db, user_id, body.item_key)
    return {"item_key": body.item_key, "read": True}


@router.post("/inbox/dismiss")
async def post_dismiss(
    body: ItemKeyRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await svc_dismiss(db, user_id, body.item_key)
    return {"item_key": body.item_key, "dismissed": True}
