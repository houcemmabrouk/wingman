from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT id, alert_type, title, body, is_read, created_at
        FROM alerts WHERE user_id = :uid AND is_read = false
        ORDER BY created_at DESC
    """), {"uid": user_id})
    return [
        {**dict(r), "created_at": str(r["created_at"])}
        for r in result.mappings().all()
    ]


@router.post("/{alert_id}/read")
async def mark_read(
    alert_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Scope by user_id so user A cannot mark user B's alerts as read.
    await db.execute(
        text("UPDATE alerts SET is_read = true WHERE id = :id AND user_id = :uid"),
        {"id": alert_id, "uid": user_id},
    )
    await db.commit()
    return {"status": "read", "alert_id": alert_id}
