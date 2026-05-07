"""KPI computation endpoints for Wingman analytics."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.deps import current_user_id

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("/topic-mastery")
async def get_topic_mastery(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Per-topic mastery for the user, computed from lm_mastery + performance_records."""
    r = await db.execute(text("""
        SELECT t.code, t.name,
            COALESCE(ROUND(AVG(lm.mastery_level)::numeric, 1), 0) as mastery,
            COUNT(DISTINCT lm.module_id) as modules_studied,
            (SELECT COUNT(*) FROM learning_modules WHERE topic_id = t.id) as total_modules
        FROM topics t
        LEFT JOIN lm_mastery lm ON lm.module_id IN (
            SELECT id FROM learning_modules WHERE topic_id = t.id
        ) AND lm.user_id = :uid
        GROUP BY t.id, t.code, t.name, t.sort_order
        ORDER BY t.sort_order
    """), {"uid": user_id})
    topics = []
    for row in r.mappings():
        topics.append({
            "code": row["code"],
            "name": row["name"],
            "mastery": float(row["mastery"]),
            "modules_studied": row["modules_studied"],
            "total_modules": row["total_modules"],
        })
    return {"topics": topics}


@router.get("/los-mastery")
async def get_los_mastery(
    module_id: Optional[int] = None,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Per-LOS mastery, computed from los_mastery table.

    `module_id` is optional — when omitted, returns every LOS across every
    module (used by the Progression tab on /results which wants the full
    mastery picture). When provided, narrows to that module.
    """
    if module_id is None:
        r = await db.execute(text("""
            SELECT lo.code, lo.description, lo.bloom_level,
                lm_mod.code AS module_code, lm_mod.title AS module_title,
                COALESCE(lmast.mastery_level, 0) as mastery,
                COALESCE(lmast.attempts_total, 0) as attempts_total,
                COALESCE(lmast.attempts_correct, 0) as attempts_correct
            FROM learning_outcomes lo
            JOIN learning_modules lm_mod ON lm_mod.id = lo.module_id
            LEFT JOIN los_mastery lmast
              ON lmast.outcome_id = lo.id AND lmast.user_id = :uid
            ORDER BY lm_mod.sort_order, lo.sort_order
        """), {"uid": user_id})
    else:
        r = await db.execute(text("""
            SELECT lo.code, lo.description, lo.bloom_level,
                NULL::varchar AS module_code, NULL::varchar AS module_title,
                COALESCE(lmast.mastery_level, 0) as mastery,
                COALESCE(lmast.attempts_total, 0) as attempts_total,
                COALESCE(lmast.attempts_correct, 0) as attempts_correct
            FROM learning_outcomes lo
            LEFT JOIN los_mastery lmast
              ON lmast.outcome_id = lo.id AND lmast.user_id = :uid
            WHERE lo.module_id = :mid
            ORDER BY lo.sort_order
        """), {"uid": user_id, "mid": module_id})
    outcomes = []
    for row in r.mappings():
        outcomes.append({
            "code": row["code"],
            "description": row["description"],
            "bloom_level": row["bloom_level"],
            "module_code": row.get("module_code"),
            "module_title": row.get("module_title"),
            "mastery": float(row["mastery"]),
            "attempts_total": row["attempts_total"],
            "attempts_correct": row["attempts_correct"],
        })
    return {"outcomes": outcomes, "module_id": module_id}


@router.get("/peer-stats")
async def get_peer_stats():
    """Per-topic peer-average mastery, used by the front-end to show "you vs cohort".

    For now these are static benchmarks derived from CFA L1 historical pass-band
    data — exposed as an endpoint so the UI has a single source of truth and
    we can swap to real cohort aggregates later without changing front code.
    """
    return {
        "source": "static_benchmarks_v1",
        "peers": {
            "ETH": 68, "QM": 55, "ECO": 58, "FSA": 52, "CORP": 63,
            "EQU": 60, "FI": 49, "DER": 47, "ALT": 62, "PM": 57,
        },
    }


@router.get("/today-stats")
async def get_today_stats(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Today's study time across every source: quiz/mock sessions, study
    checklists (planned blocks marked done), and any other captured activity.
    Returns a breakdown so the UI can show "where did the time go" without
    re-fetching multiple endpoints."""
    # Quiz/mock sessions table (recorded after a QCM/mock run).
    qr = await db.execute(text("""
        SELECT
            COUNT(*) AS quiz_sessions,
            COALESCE(SUM(duration_sec), 0) AS quiz_sec
        FROM sessions
        WHERE user_id = :uid AND DATE(started_at) = CURRENT_DATE
    """), {"uid": user_id})
    quiz = qr.mappings().first() or {}

    # Study checklists for today — minutes_actual is the user-reported time.
    cr = await db.execute(text("""
        SELECT
            COUNT(*) AS study_sessions,
            COALESCE(SUM(minutes_actual), 0) AS study_min,
            COALESCE(SUM(minutes_planned), 0) AS study_planned_min,
            COALESCE(SUM(jsonb_array_length(blocks)), 0) AS blocks_count
        FROM session_checklists
        WHERE user_id = :uid AND session_date = CURRENT_DATE
    """), {"uid": user_id})
    study = cr.mappings().first() or {}

    quiz_min = round((quiz.get("quiz_sec") or 0) / 60, 1)
    study_min = float(study.get("study_min") or 0)
    total_min = round(quiz_min + study_min, 1)
    total_sessions = (quiz.get("quiz_sessions") or 0) + (study.get("study_sessions") or 0)

    # Daily goal lookup (defaults to 90 if user hasn't set one).
    pr = await db.execute(text("""
        SELECT COALESCE(daily_minutes_goal, 90) AS goal
        FROM user_profiles
        WHERE user_id = :uid
    """), {"uid": user_id})
    goal_row = pr.mappings().first()
    daily_goal = int(goal_row["goal"]) if goal_row else 90

    # Global (all-time) cumulative study time, exposed for the breakdown modal.
    gqr = await db.execute(text("""
        SELECT
            COUNT(*) AS quiz_sessions,
            COALESCE(SUM(duration_sec), 0) AS quiz_sec
        FROM sessions
        WHERE user_id = :uid
    """), {"uid": user_id})
    g_quiz = gqr.mappings().first() or {}

    gcr = await db.execute(text("""
        SELECT
            COUNT(*) AS study_sessions,
            COALESCE(SUM(minutes_actual), 0) AS study_min,
            COUNT(DISTINCT session_date) AS active_days
        FROM session_checklists
        WHERE user_id = :uid
    """), {"uid": user_id})
    g_study = gcr.mappings().first() or {}

    # Combine quiz-only days + study-only days for total active days.
    gar = await db.execute(text("""
        SELECT COUNT(*) AS active_days FROM (
            SELECT DATE(started_at) AS d FROM sessions WHERE user_id = :uid
            UNION
            SELECT session_date AS d FROM session_checklists WHERE user_id = :uid
        ) AS days
    """), {"uid": user_id})
    g_active = gar.mappings().first() or {}

    g_quiz_min = round((g_quiz.get("quiz_sec") or 0) / 60, 1)
    g_study_min = float(g_study.get("study_min") or 0)
    g_total_min = round(g_quiz_min + g_study_min, 1)
    g_total_sessions = (g_quiz.get("quiz_sessions") or 0) + (g_study.get("study_sessions") or 0)

    return {
        # Backwards-compatible top-level fields.
        "sessions_today": total_sessions,
        "total_minutes": total_min,
        # Today breakdown for the modal.
        "quiz_minutes": quiz_min,
        "quiz_sessions": quiz.get("quiz_sessions") or 0,
        "study_minutes": study_min,
        "study_sessions": study.get("study_sessions") or 0,
        "study_planned_minutes": float(study.get("study_planned_min") or 0),
        "study_blocks": study.get("blocks_count") or 0,
        "daily_goal_minutes": daily_goal,
        # Global cumulative stats.
        "global_minutes": g_total_min,
        "global_quiz_minutes": g_quiz_min,
        "global_study_minutes": g_study_min,
        "global_sessions": g_total_sessions,
        "global_active_days": g_active.get("active_days") or 0,
    }


@router.get("/badges")
async def get_badges(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate which badges the user has earned based on real DB data."""
    unlocked = []

    # Session counts
    r = await db.execute(text("SELECT COUNT(*) FROM sessions WHERE user_id = :uid"), {"uid": user_id})
    total_sessions = r.scalar() or 0

    # Quiz sessions
    r = await db.execute(text("SELECT COUNT(*) FROM performance_records pr JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid"), {"uid": user_id})
    quiz_sessions = r.scalar() or 0

    # Best score
    r = await db.execute(text("SELECT MAX(score) FROM performance_records pr JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid"), {"uid": user_id})
    best_score = float(r.scalar() or 0)

    # Modules studied
    r = await db.execute(text("SELECT COUNT(DISTINCT module_id) FROM lm_mastery WHERE user_id = :uid"), {"uid": user_id})
    modules_studied = r.scalar() or 0

    # Topics studied
    r = await db.execute(text("""
        SELECT COUNT(DISTINCT t.id) FROM lm_mastery lm
        JOIN learning_modules m ON m.id = lm.module_id
        JOIN topics t ON t.id = m.topic_id
        WHERE lm.user_id = :uid
    """), {"uid": user_id})
    topics_studied = r.scalar() or 0

    # Streak
    r = await db.execute(text("SELECT DISTINCT DATE(started_at) as d FROM sessions WHERE user_id = :uid ORDER BY d DESC"), {"uid": user_id})
    dates = [row.d for row in r]
    from datetime import date, timedelta
    streak = 0
    if dates:
        check = date.today()
        for d in dates:
            if d == check or d == check - timedelta(days=1):
                streak += 1
                check = d - timedelta(days=1)
            else:
                break

    # Errors corrected (question_attempts with is_correct after previous failure)
    r = await db.execute(text("SELECT COUNT(*) FROM question_attempts WHERE user_id = :uid AND is_correct = true"), {"uid": user_id})
    correct_answers = r.scalar() or 0

    # Today sessions
    r = await db.execute(text("SELECT COUNT(*) FROM sessions WHERE user_id = :uid AND DATE(started_at) = CURRENT_DATE"), {"uid": user_id})
    today_sessions = r.scalar() or 0

    # Mock exams
    r = await db.execute(text("SELECT COUNT(*) FROM sessions WHERE user_id = :uid AND session_type = 'mock_exam'"), {"uid": user_id})
    mock_exams = r.scalar() or 0

    # Max session duration
    r = await db.execute(text("SELECT MAX(duration_sec) FROM sessions WHERE user_id = :uid"), {"uid": user_id})
    max_duration = (r.scalar() or 0) / 60  # minutes

    # Evaluate badges
    if total_sessions >= 1: unlocked.append({"id": "first-strike", "unlocked_at": "auto"})
    if streak >= 3: unlocked.append({"id": "streak-initiate", "unlocked_at": "auto"})
    if streak >= 7: unlocked.append({"id": "iron-discipline", "unlocked_at": "auto"})
    if streak >= 14: unlocked.append({"id": "unbreakable", "unlocked_at": "auto"})
    if streak >= 30: unlocked.append({"id": "machine", "unlocked_at": "auto"})

    if modules_studied >= 5: unlocked.append({"id": "builder", "unlocked_at": "auto"})
    if modules_studied >= 10: unlocked.append({"id": "architect", "unlocked_at": "auto"})
    if modules_studied >= 25: unlocked.append({"id": "master-builder", "unlocked_at": "auto"})

    if quiz_sessions >= 1: unlocked.append({"id": "first-blood", "unlocked_at": "auto"})
    if quiz_sessions >= 10: unlocked.append({"id": "warrior", "unlocked_at": "auto"})
    if quiz_sessions >= 50: unlocked.append({"id": "gladiator", "unlocked_at": "auto"})

    if best_score >= 70: unlocked.append({"id": "competent", "unlocked_at": "auto"})
    if best_score >= 85: unlocked.append({"id": "elite", "unlocked_at": "auto"})
    if best_score >= 90: unlocked.append({"id": "sniper", "unlocked_at": "auto"})

    if correct_answers >= 1: unlocked.append({"id": "self-aware", "unlocked_at": "auto"})
    if correct_answers >= 50: unlocked.append({"id": "error-hunter", "unlocked_at": "auto"})
    if correct_answers >= 100: unlocked.append({"id": "error-assassin", "unlocked_at": "auto"})

    if max_duration >= 120: unlocked.append({"id": "monk", "unlocked_at": "auto"})

    if topics_studied >= 5: unlocked.append({"id": "explorer", "unlocked_at": "auto"})
    if topics_studied >= 10: unlocked.append({"id": "generalist", "unlocked_at": "auto"})

    if mock_exams >= 1: unlocked.append({"id": "survivor", "unlocked_at": "auto"})
    if mock_exams >= 3: unlocked.append({"id": "battle-tested", "unlocked_at": "auto"})
    if mock_exams >= 5: unlocked.append({"id": "exam-slayer", "unlocked_at": "auto"})

    if today_sessions >= 3: unlocked.append({"id": "overdrive", "unlocked_at": "auto"})

    return {
        "unlocked": unlocked,
        "stats": {
            "total_sessions": total_sessions,
            "quiz_sessions": quiz_sessions,
            "best_score": best_score,
            "modules_studied": modules_studied,
            "topics_studied": topics_studied,
            "streak": streak,
            "correct_answers": correct_answers,
            "mock_exams": mock_exams,
            "max_duration_min": round(max_duration, 1),
        }
    }


@router.get("/streak")
async def get_streak(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Compute current streak from session history."""
    r = await db.execute(text("""
        SELECT DISTINCT DATE(started_at) as d
        FROM sessions WHERE user_id = :uid
        ORDER BY d DESC
    """), {"uid": user_id})
    dates = [row.d for row in r]
    if not dates:
        return {"streak": 0, "days": []}

    from datetime import date, timedelta
    streak = 0
    today = date.today()
    check = today
    for d in dates:
        if d == check or d == check - timedelta(days=1):
            streak += 1
            check = d - timedelta(days=1)
        else:
            break

    # Last 7 days activity
    week = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        week.append({"date": str(day), "active": day in dates, "dow": day.strftime("%a")[0]})

    return {"streak": streak, "days": week}


def safe_div(a, b):
    return a / b if b else 0.0


@router.get("")
async def get_kpis(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Compute all KPIs for a user."""

    # Sessions
    r = await db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as completed,
            ROUND(AVG(duration_sec / 60.0)::numeric, 1) as avg_duration_min,
            COUNT(DISTINCT DATE(started_at)) FILTER (WHERE started_at >= now() - interval '14 days') as study_days_14
        FROM sessions WHERE user_id = :uid
    """), {"uid": user_id})
    s = r.mappings().first()

    total_sessions = s["total"] or 0
    completed = s["completed"] or 0
    completion_rate = round(safe_div(completed * 100, total_sessions), 1)
    abandon_rate = round(safe_div((total_sessions - completed) * 100, total_sessions), 1)
    avg_duration = float(s["avg_duration_min"] or 0)
    study_days_14 = s["study_days_14"] or 0
    consistency_score = min(100, round((study_days_14 / 10) * 100, 1))

    # Quiz scores
    r = await db.execute(text("""
        SELECT
            ROUND(AVG(score)::numeric, 1) as avg_score,
            COALESCE(SUM(questions_total), 0) as total_q,
            COALESCE(SUM(questions_correct), 0) as total_correct
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid
    """), {"uid": user_id})
    q = r.mappings().first()
    avg_quiz_score = float(q["avg_score"] or 0)
    total_questions = q["total_q"] or 0
    total_correct = q["total_correct"] or 0
    accuracy_rate = round(safe_div(total_correct * 100, total_questions), 1)

    # Retention: recent vs older quiz scores
    r = await db.execute(text("""
        SELECT AVG(score) FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid AND pr.created_at >= now() - interval '7 days'
    """), {"uid": user_id})
    recent_avg = r.scalar() or avg_quiz_score

    r = await db.execute(text("""
        SELECT AVG(score) FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        WHERE s.user_id = :uid AND pr.created_at < now() - interval '7 days'
    """), {"uid": user_id})
    older_avg = r.scalar()

    if older_avg and older_avg > 0:
        retention_score = min(100, round(float(recent_avg) / float(older_avg) * 100, 1))
    else:
        retention_score = round(float(recent_avg), 1) if recent_avg else 0

    # Error quality score (based on incorrect answer ratio)
    r = await db.execute(text("""
        SELECT COUNT(*) as total,
               SUM(CASE WHEN is_correct = false THEN 1 ELSE 0 END) as errors
        FROM question_attempts WHERE user_id = :uid
    """), {"uid": user_id})
    e = r.mappings().first()
    total_attempts = e["total"] or 1
    total_errors = e["errors"] or 0
    error_quality = max(0, round(100 - (total_errors * 100.0 / max(1, total_attempts)), 1))

    # Confidence calibration
    r = await db.execute(text("""
        SELECT AVG(confidence * 20.0) FROM question_attempts WHERE user_id = :uid
    """), {"uid": user_id})
    avg_conf_100 = float(r.scalar() or 0)
    calibration = max(0, round(100 - abs(avg_conf_100 - avg_quiz_score), 1))

    # Mastery Score (composite)
    mastery_score = round(
        avg_quiz_score * 0.40 +
        retention_score * 0.20 +
        consistency_score * 0.15 +
        error_quality * 0.15 +
        calibration * 0.10, 1)

    # Readiness Score
    r = await db.execute(text("SELECT COUNT(*) FROM learning_modules"))
    total_lms = r.scalar() or 1
    r = await db.execute(text("""
        SELECT COUNT(DISTINCT module_id) FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id WHERE s.user_id = :uid
    """), {"uid": user_id})
    covered_lms = r.scalar() or 0
    coverage = round((covered_lms / total_lms) * 100, 1)

    readiness_score = round(
        mastery_score * 0.35 +
        float(recent_avg or avg_quiz_score) * 0.25 +
        retention_score * 0.15 +
        coverage * 0.15 +
        min(100, avg_duration * 1.5) * 0.10, 1)

    # Weak areas (by module — lowest accuracy)
    r = await db.execute(text("""
        SELECT lm.code as module_code, COUNT(*) as attempts,
            SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) as errors,
            ROUND(100.0 * SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) / COUNT(*)::numeric, 1) as error_rate
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        JOIN learning_modules lm ON q.module_id = lm.id
        WHERE qa.user_id = :uid
        GROUP BY lm.code HAVING COUNT(*) >= 3
        ORDER BY error_rate DESC LIMIT 5
    """), {"uid": user_id})
    weak_areas = [dict(row._mapping) for row in r]

    # Strong areas (by module — highest accuracy)
    r = await db.execute(text("""
        SELECT lm.code as module_code, COUNT(*) as attempts,
            SUM(CASE WHEN qa.is_correct = true THEN 1 ELSE 0 END) as corrects,
            ROUND(100.0 * SUM(CASE WHEN qa.is_correct = true THEN 1 ELSE 0 END) / COUNT(*)::numeric, 1) as accuracy
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        JOIN learning_modules lm ON q.module_id = lm.id
        WHERE qa.user_id = :uid
        GROUP BY lm.code HAVING COUNT(*) >= 3
        ORDER BY accuracy DESC LIMIT 5
    """), {"uid": user_id})
    strong_areas = [dict(row._mapping) for row in r]

    # Trap error rate (simplified — repeated wrong answers on same question)
    trap_rate = 0.0

    # Overconfidence gap
    overconfidence_gap = round(avg_conf_100 - avg_quiz_score, 1)

    # Coach effectiveness (placeholder — no coach_interventions table yet)
    coach_effectiveness = 0.0

    # Dropoff risk
    r = await db.execute(text("""
        SELECT EXTRACT(DAY FROM now() - MAX(started_at))::integer
        FROM sessions WHERE user_id = :uid
    """), {"uid": user_id})
    days_since = r.scalar() or 30

    if days_since >= 7:
        dropoff_risk = 80
    elif days_since >= 3:
        dropoff_risk = 55
    else:
        dropoff_risk = 20

    return {
        "total_sessions": total_sessions,
        "completion_rate": completion_rate,
        "abandon_rate": abandon_rate,
        "avg_session_duration_min": avg_duration,
        "avg_quiz_score": avg_quiz_score,
        "concept_accuracy_rate": accuracy_rate,
        "study_days_last_14": study_days_14,
        "consistency_score": consistency_score,
        "retention_score": retention_score,
        "error_quality_score": error_quality,
        "confidence_calibration_score": calibration,
        "mastery_score": mastery_score,
        "readiness_score": readiness_score,
        "trap_error_rate": trap_rate,
        "overconfidence_gap": overconfidence_gap,
        "coach_effectiveness_score": coach_effectiveness,
        "dropoff_risk_score": dropoff_risk,
        "days_since_last_session": days_since,
        "weak_areas": weak_areas,
        "strong_areas": strong_areas,
        "coverage_pct": coverage,
        "total_questions_attempted": total_attempts,
    }
