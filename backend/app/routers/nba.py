"""HTTP layer for the Next Best Action service."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.nba_service import NBAService, DEFAULT_EXAM_DATE

router = APIRouter(prefix="/api/nba", tags=["nba"])


@router.get("/action")
async def get_next_best_action(
    exam_date: Optional[str] = Query(None, description="ISO date (YYYY-MM-DD); defaults to August 18, 2026"),
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Single most urgent action the candidate should do right now."""
    parsed_date: Optional[date] = None
    if exam_date:
        try:
            parsed_date = date.fromisoformat(exam_date)
        except ValueError:
            parsed_date = None
    return await NBAService.get_emergency_action(db, user_id, parsed_date)


@router.get("/exam-date")
async def get_default_exam_date():
    """Currently configured CFA Level I exam date used by /action."""
    return {"exam_date": DEFAULT_EXAM_DATE.isoformat()}
