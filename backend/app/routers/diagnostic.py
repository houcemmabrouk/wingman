from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.diagnostic_report import generate_diagnostic, generate_auto_diagnostic, PHASES

router = APIRouter(prefix="/api", tags=["diagnostic"])
router_v1 = APIRouter(prefix="/api/v1", tags=["diagnostic"])


@router_v1.get("/diagnostic/phases")
async def list_diagnostic_phases():
    return {
        "phases": [
            {"key": "discovery",     "label": "Découverte",    "description": "Vue d'ensemble, concepts à explorer"},
            {"key": "consolidation", "label": "Consolidation", "description": "Drill ciblé, fix misconceptions"},
            {"key": "simulation",    "label": "Simulation",    "description": "Pattern recognition examen, mocks"},
            {"key": "final_sprint",  "label": "Final Sprint",  "description": "Top 5 actions urgentes (J-14)"},
        ],
    }


@router_v1.post("/diagnostic/auto")
async def post_diagnostic_auto(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Auto-classify each touched LM into a phase (discovery/consolidation/simulation/
    final_sprint) based on the user's stats, then generate a unified diagnostic
    report with one section per LM."""
    try:
        result = await generate_auto_diagnostic(db=db, user_id=user_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


@router_v1.post("/diagnostic/{phase}")
async def post_diagnostic_phase(
    phase: str = Path(..., description=f"One of: {', '.join(PHASES)}"),
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a phase-specific diagnostic report (explicit phase override).
    Prefer /diagnostic/auto for normal use."""
    if phase not in PHASES:
        raise HTTPException(status_code=400, detail=f"Invalid phase. Must be one of: {', '.join(PHASES)}")
    try:
        result = await generate_diagnostic(db=db, user_id=user_id, phase=phase)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result


@router.get("/diagnostic")
async def diagnostic(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated diagnostic dashboard — single endpoint for all macro data."""

    # Daily brief
    from app.services.user_metrics import compute_streak
    brief = await db.execute(text("""
        SELECT u.display_name, up.streak_current, up.xp_total,
               up.daily_minutes_goal, up.exam_date,
               COALESCE((SELECT SUM(s.duration_sec)/60 FROM sessions s
                         WHERE s.user_id=u.id AND s.started_at::date=CURRENT_DATE), 0) AS today_minutes,
               COALESCE((SELECT COUNT(*) FROM sessions s
                         WHERE s.user_id=u.id AND s.started_at::date=CURRENT_DATE), 0) AS today_sessions
        FROM users u JOIN user_profiles up ON up.user_id = u.id
        WHERE u.id = :uid
    """), {"uid": user_id})
    brief_row = brief.mappings().first()
    streak_current = await compute_streak(db, user_id)

    days_to_exam = None
    if brief_row and brief_row["exam_date"]:
        days_to_exam = max(0, (brief_row["exam_date"] - date.today()).days)

    # Progress summary
    progress = await db.execute(text("""
        SELECT
            COUNT(DISTINCT pr.module_id) AS covered_lm,
            (SELECT COUNT(*) FROM learning_modules) AS total_lm,
            COALESCE(ROUND(AVG(pr.score), 1), 0) AS avg_score,
            COALESCE(SUM(s2.duration_sec)::float / 3600, 0) AS total_hours
        FROM performance_records pr
        JOIN sessions s2 ON s2.id = pr.session_id
        WHERE s2.user_id = :uid
    """), {"uid": user_id})
    prog = progress.mappings().first()
    total_lm = prog["total_lm"] or 1
    coverage_pct = round((prog["covered_lm"] / total_lm) * 100, 1)

    # Top 5 weaknesses
    weak = await db.execute(text("""
        SELECT lm.code, lm.title, ROUND(AVG(pr.score), 1) AS avg_score
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        WHERE s.user_id = :uid
        GROUP BY lm.code, lm.title
        ORDER BY AVG(pr.score) ASC
        LIMIT 5
    """), {"uid": user_id})
    top_weaknesses = [dict(r) for r in weak.mappings().all()]

    # Critical alerts
    alerts_r = await db.execute(text("""
        SELECT id, alert_type, title, body, created_at
        FROM alerts WHERE user_id = :uid AND is_read = false
        ORDER BY created_at DESC LIMIT 5
    """), {"uid": user_id})
    alerts = [{**dict(r), "created_at": str(r["created_at"])} for r in alerts_r.mappings().all()]

    # Plan completion this week
    plan_stats = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE pe.status = 'completed') AS completed,
            COUNT(*) AS total
        FROM plan_entries pe
        JOIN study_plans sp ON sp.id = pe.plan_id
        WHERE sp.user_id = :uid
          AND pe.scheduled_date >= date_trunc('week', CURRENT_DATE)
          AND pe.scheduled_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    """), {"uid": user_id})
    ps = plan_stats.mappings().first()
    plan_total = ps["total"] or 1
    plan_completion = round((ps["completed"] / plan_total) * 100, 1)

    # Mock trend (last 5)
    mocks = await db.execute(text("""
        SELECT pr.score, pr.created_at::date AS date
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid AND s.session_type = 'mock_exam'
        ORDER BY pr.created_at DESC LIMIT 5
    """), {"uid": user_id})
    mock_trend = [{"score": float(r["score"]), "date": str(r["date"])} for r in mocks.mappings().all()]

    # Next SRS due
    srs = await db.execute(text("""
        SELECT lm.code, lm.title, sq.next_review
        FROM srs_queue sq
        JOIN learning_modules lm ON lm.id = sq.card_id
        WHERE sq.user_id = :uid AND sq.card_type = 'question'
        ORDER BY sq.next_review ASC LIMIT 1
    """), {"uid": user_id})
    srs_row = srs.mappings().first()
    next_srs = None
    if srs_row:
        next_srs = {"code": srs_row["code"], "title": srs_row["title"],
                     "next_review": str(srs_row["next_review"])}

    # Estimated exam score
    mock_scores = [m["score"] for m in mock_trend]
    estimated_score = round(sum(mock_scores) / len(mock_scores), 1) if mock_scores else float(prog["avg_score"])

    return {
        "daily_brief": {
            "display_name": brief_row["display_name"] if brief_row else "",
            "streak_current": streak_current,
            "xp_total": brief_row["xp_total"] if brief_row else 0,
            "today_minutes": brief_row["today_minutes"] if brief_row else 0,
            "today_sessions": brief_row["today_sessions"] if brief_row else 0,
        },
        "progress": {
            "coverage_pct": coverage_pct,
            "avg_score_pct": float(prog["avg_score"]),
            "estimated_exam_score": estimated_score,
            "total_hours": round(float(prog["total_hours"]), 1),
            "days_to_exam": days_to_exam,
        },
        "top_weaknesses": top_weaknesses,
        "alerts": alerts,
        "plan_completion": plan_completion,
        "streak_days": streak_current,
        "next_srs": next_srs,
        "mock_trend": mock_trend,
    }
