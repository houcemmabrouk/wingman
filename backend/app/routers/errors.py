"""System errors — automatic capture lane (frontend + backend exceptions)."""
import json
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/api/errors", tags=["errors"])

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


class ErrorLogIn(BaseModel):
    source: str = Field(..., pattern="^(frontend|backend)$")
    kind: str = Field(..., max_length=40)
    message: str = Field(..., max_length=4000)
    stack: Optional[str] = Field(None, max_length=20000)
    context: Optional[dict[str, Any]] = None


def _resolve_user_id(request: Request) -> Optional[str]:
    uid = getattr(request.state, "user_id", None)
    if isinstance(uid, str) and uid:
        return uid
    return None


def _verify_admin_key(key: str) -> None:
    if not settings.admin_secret_key or key != settings.admin_secret_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")


async def record_error(
    db: AsyncSession,
    *,
    user_id: Optional[str],
    source: str,
    kind: str,
    message: str,
    stack: Optional[str] = None,
    context: Optional[dict[str, Any]] = None,
) -> int:
    """Insert one error row. Designed to be safe in error paths — caller commits."""
    result = await db.execute(
        text(
            """
            INSERT INTO system_errors (user_id, source, kind, message, stack, context)
            VALUES (:uid, :src, :kind, :msg, :stack, CAST(:ctx AS JSONB))
            RETURNING id
            """
        ),
        {
            "uid": user_id,
            "src": source,
            "kind": kind[:40],
            "msg": message[:4000],
            "stack": (stack or "")[:20000] or None,
            "ctx": json.dumps(context) if context else None,
        },
    )
    await db.commit()
    return result.scalar_one()


@router.post("/log")
async def post_log(
    payload: ErrorLogIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Frontend posts a captured error. Returns the inserted id."""
    try:
        new_id = await record_error(
            db,
            user_id=_resolve_user_id(request),
            source=payload.source,
            kind=payload.kind,
            message=payload.message,
            stack=payload.stack,
            context=payload.context,
        )
        return {"id": new_id, "status": "logged"}
    except Exception as e:
        return {"status": "error", "detail": str(e)[:300]}


@router.get("")
async def list_errors(
    key: str = Query(""),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(200, ge=1, le=1000),
    source: Optional[str] = Query(None, pattern="^(frontend|backend)$"),
):
    """Recent errors, newest first. Capped at 1000."""
    _verify_admin_key(key)
    where = []
    params: dict[str, Any] = {"limit": limit}
    if source:
        where.append("source = :source")
        params["source"] = source
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    rows = await db.execute(
        text(
            f"""
            SELECT id, user_id, source, kind, message, stack, context, created_at
            FROM system_errors
            {where_sql}
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        params,
    )
    out = []
    for r in rows.mappings().all():
        d = dict(r)
        d["id"] = str(d["id"])
        d["user_id"] = str(d["user_id"]) if d["user_id"] else None
        d["created_at"] = str(d["created_at"])
        out.append(d)
    return {"errors": out, "count": len(out)}


@router.delete("")
async def clear_errors(key: str = Query(""), db: AsyncSession = Depends(get_db)):
    """Wipe all system_errors (admin / cleanup)."""
    _verify_admin_key(key)
    await db.execute(text("DELETE FROM system_errors"))
    await db.commit()
    return {"status": "cleared"}


@router.delete("/{error_id}")
async def delete_one(error_id: int, key: str = Query(""), db: AsyncSession = Depends(get_db)):
    _verify_admin_key(key)
    result = await db.execute(text("DELETE FROM system_errors WHERE id = :id"), {"id": error_id})
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Not found")
    return {"status": "deleted", "id": error_id}
