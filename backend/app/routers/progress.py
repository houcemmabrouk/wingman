from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/summary")
async def progress_summary(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated progress summary with exam readiness estimate."""
    stats = await db.execute(text("""
        SELECT
            (SELECT COUNT(DISTINCT pr.module_id) FROM performance_records pr
             JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid) AS lm_with_sessions,
            (SELECT COUNT(*) FROM learning_modules) AS total_lm,
            COALESCE((SELECT ROUND(AVG(pr.score), 2) FROM performance_records pr
                      JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid), 0) AS avg_score_pct,
            COALESCE((SELECT SUM(s.duration_sec)::float / 3600 FROM sessions s
                      WHERE s.user_id = :uid), 0) AS total_hours,
            (SELECT exam_date FROM user_profiles WHERE user_id = :uid) AS exam_date
    """), {"uid": user_id})
    r = stats.mappings().first()

    total_lm = r["total_lm"] or 1
    coverage = round((r["lm_with_sessions"] / total_lm) * 100, 1)
    avg_score = float(r["avg_score_pct"])
    days_to_exam = None
    if r["exam_date"]:
        from datetime import date
        delta = r["exam_date"] - date.today()
        days_to_exam = max(0, delta.days)

    # Estimated exam score from last mock scores
    mocks = await db.execute(text("""
        SELECT pr.score FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid AND s.session_type = 'mock_exam'
        ORDER BY pr.created_at DESC LIMIT 10
    """), {"uid": user_id})
    mock_scores = [float(row[0]) for row in mocks if row[0] is not None]
    estimated_exam = round(sum(mock_scores) / len(mock_scores), 1) if mock_scores else avg_score

    # Readiness projection
    readiness_date = None
    if avg_score < 70 and avg_score > 0 and days_to_exam and days_to_exam > 0:
        # Simple linear projection
        gap = 70 - avg_score
        daily_improvement = 0.5  # assumed
        days_needed = int(gap / daily_improvement)
        from datetime import date, timedelta
        readiness_date = str(date.today() + timedelta(days=days_needed))

    return {
        "coverage_pct": coverage,
        "avg_score_pct": avg_score,
        "estimated_exam_score": estimated_exam,
        "readiness_date": readiness_date,
        "total_hours": round(float(r["total_hours"]), 1),
        "days_to_exam": days_to_exam,
    }


@router.get("/heatmap")
async def progress_heatmap(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return all 57 LMs with mastery level for heatmap display."""
    result = await db.execute(text("""
        SELECT lm.code AS lm_code, lm.title AS lm_title, t.code AS topic,
               COALESCE(m.mastery_level, 0) AS mastery_level,
               COALESCE(m.review_count, 0) AS attempts
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN lm_mastery m ON m.module_id = lm.id AND m.user_id = :uid
        ORDER BY t.sort_order, lm.sort_order
    """), {"uid": user_id})
    return [
        {**dict(r), "mastery_level": float(r["mastery_level"])}
        for r in result.mappings().all()
    ]


@router.get("/milestones")
async def progress_milestones(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return milestone status for 25/50/75/100% coverage."""
    result = await db.execute(text("""
        SELECT
            COUNT(DISTINCT pr.module_id) AS covered,
            (SELECT COUNT(*) FROM learning_modules) AS total
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid
    """), {"uid": user_id})
    r = result.mappings().first()
    covered = r["covered"]
    total = r["total"] or 1
    pct = (covered / total) * 100

    milestones = []
    for target in [25, 50, 75, 100]:
        reached = pct >= target
        milestones.append({
            "target_pct": target,
            "reached": reached,
            "reached_at": None,  # Would need snapshot history for exact date
        })

    return milestones


@router.get("/active-topics")
async def progress_active_topics(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Topics where the user has an OPEN session right now.

    Open = a row in `sessions` with ended_at IS NULL. We pick up the topics
    via performance_records (questions answered so far during the session).
    A session that just started with no answers yet returns no topics, which
    is the right call: the UI should highlight a topic only once activity is
    confirmed against it.
    """
    result = await db.execute(text("""
        SELECT DISTINCT t.code
        FROM sessions s
        JOIN performance_records pr ON pr.session_id = s.id
        JOIN learning_modules lm ON lm.id = pr.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE s.user_id = :uid AND s.ended_at IS NULL
    """), {"uid": user_id})
    return {"topics": [r["code"] for r in result.mappings().all()]}
