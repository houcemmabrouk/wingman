import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.mastery import update_mastery_cascade
from app.services.weakness_detector import check_weakness
from app.services.planning_skill import invalidate_planning_cache

router = APIRouter(prefix="/api", tags=["performance"])


# ── Schemas ───────────────────────────────────────────────────

class SessionRecordRequest(BaseModel):
    lm_id: int
    session_type: str = "study"
    score_pct: float
    questions_total: int = 0
    questions_correct: int = 0
    duration_sec: int = 0


class SessionReportRequest(BaseModel):
    session_id: int


# ── POST /api/session/record ─────────────────────────────────

@router.post("/session/record")
async def record_session(
    req: SessionRecordRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Create session
    session_row = await db.execute(text("""
        INSERT INTO sessions (user_id, session_type, started_at, ended_at, duration_sec)
        VALUES (:uid, :stype, now() - make_interval(secs => :dur), now(), :dur)
        RETURNING id
    """), {"uid": user_id, "stype": req.session_type, "dur": req.duration_sec})
    session_id = session_row.scalar()

    # Create performance record
    await db.execute(text("""
        INSERT INTO performance_records (session_id, module_id, score, questions_total, questions_correct, time_spent_sec)
        VALUES (:sid, :mid, :score, :qt, :qc, :dur)
    """), {
        "sid": session_id, "mid": req.lm_id, "score": req.score_pct,
        "qt": req.questions_total, "qc": req.questions_correct, "dur": req.duration_sec
    })
    await db.commit()

    # Update mastery
    mastery_level = await update_mastery_cascade(db, user_id, req.lm_id)

    # Check weakness
    await check_weakness(db, user_id, req.lm_id, req.score_pct)

    # Invalidate planning DTO — performance changed, plan must regenerate
    await invalidate_planning_cache(user_id)

    return {"session_id": session_id, "mastery_level": mastery_level}


# ── GET /api/performance/history ──────────────────────────────

@router.get("/performance/history")
async def performance_history(
    lm_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT pr.id, pr.score, pr.questions_total, pr.questions_correct,
               pr.time_spent_sec, pr.created_at, s.session_type
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid AND pr.module_id = :mid
        ORDER BY pr.created_at DESC
    """), {"uid": user_id, "mid": lm_id})
    rows = result.mappings().all()
    return [
        {**dict(r), "created_at": str(r["created_at"]), "score": float(r["score"]) if r["score"] else 0}
        for r in rows
    ]


# ── GET /api/performance/curve ────────────────────────────────

@router.get("/performance/curve")
async def performance_curve(
    days: int = 30,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT pr.created_at::date AS date,
               ROUND(AVG(pr.score), 2) AS avg_score,
               COUNT(*) AS sessions_count
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid
          AND pr.created_at >= CURRENT_DATE - make_interval(days => :days)
        GROUP BY pr.created_at::date
        ORDER BY date
    """), {"uid": user_id, "days": days})
    rows = result.mappings().all()
    return [
        {"date": str(r["date"]), "avg_score": float(r["avg_score"]), "sessions_count": r["sessions_count"]}
        for r in rows
    ]


# ── GET /api/performance/export ───────────────────────────────

@router.get("/performance/export")
async def export_csv(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT pr.created_at::date AS date, lm.code AS lm_code, lm.title AS lm_title,
               pr.score AS score_pct, s.session_type, pr.time_spent_sec AS duration_sec
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        WHERE s.user_id = :uid
        ORDER BY pr.created_at DESC
    """), {"uid": user_id})
    rows = result.mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "lm_code", "lm_title", "score_pct", "session_type", "duration_sec"])
    for r in rows:
        writer.writerow([str(r["date"]), r["lm_code"], r["lm_title"],
                         float(r["score_pct"]) if r["score_pct"] else 0,
                         r["session_type"], r["duration_sec"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wingman_export.csv"},
    )


# ── POST /api/session/report ─────────────────────────────────

@router.post("/session/report")
async def session_report(
    req: SessionReportRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a simple text-based session report (PDF requires reportlab in container)."""
    # Scope by user_id so a stranger can't pull another user's session report
    # by guessing the integer session_id.
    result = await db.execute(text("""
        SELECT pr.score, pr.questions_total, pr.questions_correct, pr.time_spent_sec,
               lm.code, lm.title, s.session_type, s.started_at
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        WHERE s.id = :sid AND s.user_id = :uid
    """), {"sid": req.session_id, "uid": user_id})
    rows = result.mappings().all()

    if not rows:
        return {"error": "Session not found"}

    report_lines = [f"=== Wingman Session Report ===", f"Session #{req.session_id}", ""]
    for r in rows:
        report_lines.extend([
            f"Module: {r['code']} — {r['title']}",
            f"Type: {r['session_type']}",
            f"Score: {r['score']}%",
            f"Questions: {r['questions_correct']}/{r['questions_total']}",
            f"Duration: {r['time_spent_sec']}s",
            f"Date: {r['started_at']}",
            "",
        ])

    content = "\n".join(report_lines)
    return StreamingResponse(
        iter([content]),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=session_{req.session_id}_report.txt"},
    )
