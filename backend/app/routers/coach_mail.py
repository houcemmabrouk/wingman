"""Coach mail — async mail-style exchange (Phase 1A, Redis-backed).

Endpoints:
    POST /api/coach/mail/send      — send a mail, get the coach reply back
    GET  /api/coach/mail/list      — list user threads
    GET  /api/coach/mail/{tid}     — fetch a single thread
    POST /api/coach/mail/{tid}/read — mark thread as read (idempotent)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services import coach_mail as svc

router = APIRouter(prefix="/api/coach/mail", tags=["coach-mail"])


class SendMailRequest(BaseModel):
    subject: str = Field("", max_length=140)
    body:    str = Field(..., min_length=1, max_length=4000)


@router.post("/send")
async def post_send(
    body: SendMailRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Pull display name for personalization (best-effort)
    display_name: str | None = None
    try:
        r = await db.execute(
            text("SELECT display_name FROM users WHERE id = :uid"),
            {"uid": user_id},
        )
        display_name = r.scalar()
    except Exception:
        pass

    return await svc.send_mail(
        user_id=user_id,
        subject=body.subject,
        body=body.body,
        display_name=display_name,
    )


@router.get("/list")
async def get_list(
    limit: int = 20,
    user_id: str = Depends(current_user_id),
):
    threads = await svc.list_threads(user_id, limit=max(1, min(limit, svc.LIST_LIMIT)))
    return {"threads": threads, "total": len(threads)}


@router.get("/{thread_id}")
async def get_one(
    thread_id: str,
    user_id: str = Depends(current_user_id),
):
    thread = await svc.get_thread(user_id, thread_id)
    if not thread:
        raise HTTPException(404, detail="thread not found")
    return thread


@router.post("/{thread_id}/read")
async def post_read(
    thread_id: str,
    user_id: str = Depends(current_user_id),
):
    ok = await svc.mark_read(user_id, thread_id)
    return {"thread_id": thread_id, "read": ok}
