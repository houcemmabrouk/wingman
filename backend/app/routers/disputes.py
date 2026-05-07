"""
Disputes router — "Challenge Wingman" feature.

Users can contest a question they believe is wrong. The arbiter (Claude)
decides; if upheld, the question is quarantined, the user's wrong attempt
is reversed, and a small bonus is added to their LOS mastery.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.services.dispute_arbiter import submit_and_arbitrate

router = APIRouter(prefix="/api/v1", tags=["disputes"])


class DisputeRequest(BaseModel):
    selected_answer: Optional[str] = Field(default=None, description="What the user picked (A/B/C)")
    claimed_answer:  Optional[str] = Field(default=None, description="What the user thinks is right (A/B/C)")
    user_reason:     Optional[str] = Field(default=None, max_length=2000)
    attempt_id:      Optional[int] = None


def _require_user_id(request: Request) -> str:
    uid = getattr(request.state, "user_id", None)
    if not isinstance(uid, str) or not uid:
        raise HTTPException(status_code=401, detail="authentication required")
    return uid


def _verify_admin_key(key: str) -> None:
    if not settings.admin_secret_key or key != settings.admin_secret_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")


@router.post("/questions/{question_id}/dispute")
async def create_dispute(
    request: Request,
    body: DisputeRequest,
    question_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a dispute on a question. Synchronously runs the arbiter and
    returns the resolution (verdict + reason + any mastery bonus).
    """
    uid = _require_user_id(request)
    return await submit_and_arbitrate(
        db,
        user_id=uid,
        question_id=question_id,
        selected_answer=body.selected_answer,
        claimed_answer=body.claimed_answer,
        user_reason=body.user_reason,
        attempt_id=body.attempt_id,
    )


@router.get("/disputes/me")
async def list_my_disputes(request: Request, db: AsyncSession = Depends(get_db)):
    """The user's own dispute history (latest 50)."""
    uid = _require_user_id(request)
    rows = await db.execute(text("""
        SELECT d.id, d.question_id, d.status, d.arbiter_verdict,
               d.arbiter_confidence, d.arbiter_citation, d.arbiter_reason,
               d.mastery_bonus_pct, d.created_at, d.resolved_at,
               lm.code AS lm_code, lo.code AS los_code
        FROM question_disputes d
        JOIN questions q ON q.id = d.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        WHERE d.user_id = :uid
        ORDER BY d.created_at DESC
        LIMIT 50
    """), {"uid": uid})
    out = []
    for r in rows.mappings().all():
        d = dict(r)
        for k in ("created_at", "resolved_at"):
            if d.get(k) is not None:
                d[k] = str(d[k])
        out.append(d)
    return {"disputes": out}


# ── Admin ────────────────────────────────────────────────────────────────

@router.get("/admin/disputes")
async def admin_list_disputes(
    request: Request,
    key: str = "",
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    _require_user_id(request)
    _verify_admin_key(key)
    where = ""
    params: dict = {}
    if status:
        where = "WHERE d.status = :status"
        params["status"] = status
    rows = await db.execute(text(f"""
        SELECT d.id, d.question_id, d.user_id, d.status, d.arbiter_verdict,
               d.arbiter_confidence, d.arbiter_citation,
               d.mastery_bonus_pct, d.created_at, d.resolved_at,
               lm.code AS lm_code, lo.code AS los_code
        FROM question_disputes d
        JOIN questions q ON q.id = d.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        {where}
        ORDER BY d.created_at DESC
        LIMIT 200
    """), params)
    out = []
    for r in rows.mappings().all():
        d = dict(r)
        d["user_id"] = str(d["user_id"])
        for k in ("created_at", "resolved_at"):
            if d.get(k) is not None:
                d[k] = str(d[k])
        out.append(d)
    return {"disputes": out}


@router.get("/admin/audit/summary")
async def admin_audit_summary(
    request: Request,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    _require_user_id(request)
    _verify_admin_key(key)
    counts = await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM questions)                                    AS total_questions,
            (SELECT COUNT(*) FROM questions WHERE disabled_at IS NOT NULL)      AS disabled_questions,
            (SELECT COUNT(*) FROM question_audits)                              AS audit_runs_total,
            (SELECT COUNT(DISTINCT question_id) FROM question_audits)           AS audited_questions,
            (SELECT COUNT(*) FROM question_audits WHERE verdict <> 'correct')   AS audit_failures,
            (SELECT COUNT(*) FROM question_disputes)                            AS disputes_total,
            (SELECT COUNT(*) FROM question_disputes WHERE status = 'upheld')    AS disputes_upheld,
            (SELECT COUNT(*) FROM question_disputes WHERE status = 'rejected')  AS disputes_rejected,
            (SELECT COUNT(*) FROM question_disputes WHERE status = 'needs_human') AS disputes_needs_human,
            (SELECT COUNT(*) FROM question_disputes WHERE status IN ('pending','auto_review')) AS disputes_open
    """))
    summary = dict(counts.mappings().first() or {})

    # Per-LM failure rate (audited & at least one failure)
    by_lm = await db.execute(text("""
        SELECT lm.code AS lm_code,
               COUNT(DISTINCT qa.question_id) AS audited,
               COUNT(DISTINCT CASE WHEN qa.verdict <> 'correct' THEN qa.question_id END) AS flagged,
               COUNT(DISTINCT q.id) FILTER (WHERE q.disabled_at IS NOT NULL) AS disabled
        FROM learning_modules lm
        LEFT JOIN questions q       ON q.module_id  = lm.id
        LEFT JOIN question_audits qa ON qa.question_id = q.id
        GROUP BY lm.code
        HAVING COUNT(DISTINCT qa.question_id) > 0
        ORDER BY flagged DESC, lm.code
    """))
    return {
        "summary": summary,
        "by_lm": [dict(r) for r in by_lm.mappings().all()],
    }
