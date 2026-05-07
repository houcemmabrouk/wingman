"""User profile CRUD — language, exam_date, daily_minutes_goal."""
from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.planning_skill import invalidate_planning_cache

router = APIRouter(prefix="/api/user/profile", tags=["user-profile"])


class ProfilePatch(BaseModel):
    language: Optional[Literal["fr", "en"]] = None
    exam_date: Optional[str] = None  # YYYY-MM-DD or empty string
    daily_minutes_goal: Optional[int] = Field(default=None, ge=10, le=600)


class ProfileOut(BaseModel):
    user_id: str
    language: str
    exam_date: Optional[str]
    daily_minutes_goal: int


@router.get("", response_model=ProfileOut)
async def get_profile(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        text(
            "SELECT user_id, language, exam_date, daily_minutes_goal "
            "FROM user_profiles WHERE user_id = :uid"
        ),
        {"uid": user_id},
    )
    p = row.mappings().first()
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut(
        user_id=str(p["user_id"]),
        language=p["language"] or "fr",
        exam_date=str(p["exam_date"]) if p["exam_date"] else None,
        daily_minutes_goal=int(p["daily_minutes_goal"]),
    )


@router.patch("", response_model=ProfileOut)
async def patch_profile(
    patch: ProfilePatch,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    fields: dict = {}
    if patch.language is not None:
        fields["language"] = patch.language
    if patch.exam_date is not None:
        if patch.exam_date == "" or patch.exam_date.lower() == "null":
            fields["exam_date"] = None
        else:
            try:
                fields["exam_date"] = date.fromisoformat(patch.exam_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="exam_date must be YYYY-MM-DD")
    if patch.daily_minutes_goal is not None:
        fields["daily_minutes_goal"] = patch.daily_minutes_goal

    if not fields:
        # Nothing to update — just return current profile.
        return await get_profile(user_id=user_id, db=db)

    set_clause = ", ".join(f"{k} = :{k}" for k in fields)
    await db.execute(
        text(f"UPDATE user_profiles SET {set_clause}, updated_at = now() WHERE user_id = :uid"),
        {**fields, "uid": user_id},
    )
    await db.commit()

    # Invalidate cached plan so the next fetch reflects the new language / exam date.
    await invalidate_planning_cache(user_id)

    return await get_profile(user_id=user_id, db=db)
