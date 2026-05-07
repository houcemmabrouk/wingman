"""V1 NBA endpoints — backed by the los_mastery_rolling view (migration 006).

Versioned under /api/v1/nba/* so the legacy /api/nba/action stays backward compatible
while we evolve the algorithm.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.nba_service import NBAService

router = APIRouter(prefix="/api/v1/nba", tags=["nba-v1"])

DEFAULT_EXAM_DATE = date(2026, 8, 18)


def _priority_from_score(urgency: float) -> str:
    if urgency >= 75:
        return "CRITICAL"
    if urgency >= 50:
        return "HIGH"
    if urgency >= 25:
        return "MEDIUM"
    return "LOW"


def _format_action(los_description: Optional[str]) -> str:
    desc = (los_description or "").strip().rstrip(".")
    if not desc:
        return "Review this learning outcome"
    return f"Review: {desc[0].upper() + desc[1:]}"


@router.get("/critical-path")
async def get_critical_path(
    user_id: str = Depends(current_user_id),
    limit: int = Query(1, ge=1, le=10, description="How many ranked LOS to return (default 1 = the most urgent)"),
    exam_date: Optional[str] = Query(None, description="ISO date YYYY-MM-DD; defaults to 2026-08-18"),
    db: AsyncSession = Depends(get_db),
):
    """Return the LOS at the head of the candidate's critical path.

    Backed by the `los_mastery_rolling` view (migration 006), which prefers
    the rolling 10-attempt average once the user has done >= 3 attempts on
    the LOS — so the engine reacts to recent regressions instead of being
    anchored to a stale lifetime average.

    Response (limit=1):
      {
        critical_path: { topic, lm, los, action_text, priority, deadline,
                         mastery_pct, exam_weight_pct, urgency_score, ... },
        ranked: [...]    # top-K LOS for diagnostics, [] if limit=1 only
      }
    """
    target_date = DEFAULT_EXAM_DATE
    if exam_date:
        try:
            target_date = date.fromisoformat(exam_date)
        except ValueError:
            pass

    # Pull top-K from the view, JOINed with a recent-errors subquery so LOS
    # the user has tripped on in the last 7 days get an additive urgency
    # boost (+5 per recent wrong answer). Wires question_attempts into NBA.
    rows = await db.execute(text("""
        SELECT
            lmr.topic_code, lmr.topic_name, lmr.weight_pct,
            lmr.module_code, lmr.module_title,
            lmr.los_code, lmr.los_description, lmr.bloom_level,
            lmr.lifetime_mastery, lmr.lifetime_attempts, lmr.lifetime_correct,
            lmr.attempts_last_10, lmr.rolling_pct_10,
            lmr.effective_mastery_pct, lmr.urgency_score AS base_urgency,
            lmr.last_attempt_at,
            COALESCE(re.cnt, 0)         AS recent_errors_count,
            re.last_error_at,
            (lmr.urgency_score + COALESCE(re.cnt, 0) * 5) AS adjusted_urgency
        FROM los_mastery_rolling lmr
        LEFT JOIN (
            SELECT q.outcome_id,
                   COUNT(*)           AS cnt,
                   MAX(qa.created_at) AS last_error_at
            FROM question_attempts qa
            JOIN questions q ON q.id = qa.question_id
            WHERE qa.user_id    = :uid
              AND qa.is_correct = false
              AND qa.created_at >= NOW() - INTERVAL '7 days'
              AND q.outcome_id IS NOT NULL
            GROUP BY q.outcome_id
        ) re ON re.outcome_id = lmr.outcome_id
        WHERE lmr.user_id = :uid
        ORDER BY adjusted_urgency DESC NULLS LAST,
                 lmr.attempts_last_10 ASC
        LIMIT :lim
    """), {"uid": user_id, "lim": limit})
    found = list(rows.mappings().all())

    if not found:
        # Cold start: pick first LOS of the heaviest topic (no user attempts yet).
        cold = await db.execute(text("""
            SELECT
                t.code AS topic_code, t.name AS topic_name,
                COALESCE(t.weight_pct, 10.0) AS weight_pct,
                lm.code AS module_code, lm.title AS module_title,
                lo.code AS los_code, lo.description AS los_description,
                lo.bloom_level AS bloom_level,
                0::numeric AS lifetime_mastery, 0 AS lifetime_attempts, 0 AS lifetime_correct,
                0 AS attempts_last_10, 0::numeric AS rolling_pct_10,
                0::numeric AS effective_mastery_pct,
                ROUND((100.0) * (COALESCE(t.weight_pct, 10.0) / 10.0), 2) AS base_urgency,
                NULL::timestamptz AS last_attempt_at,
                0 AS recent_errors_count,
                NULL::timestamptz AS last_error_at,
                ROUND((100.0) * (COALESCE(t.weight_pct, 10.0) / 10.0), 2) AS adjusted_urgency
            FROM learning_outcomes lo
            JOIN learning_modules lm ON lm.id = lo.module_id
            JOIN topics            t  ON t.id  = lm.topic_id
            ORDER BY t.weight_pct DESC NULLS LAST,
                     lm.sort_order ASC,
                     lo.sort_order ASC
            LIMIT :lim
        """), {"lim": limit})
        found = list(cold.mappings().all())

    def to_dto(r) -> dict:
        adjusted = float(r["adjusted_urgency"] or 0)
        return {
            "topic":                r["topic_code"],
            "lm":                   r["module_code"],
            "los":                  r["los_code"],
            "action_text":          _format_action(r["los_description"]),
            "priority":             _priority_from_score(adjusted),
            "deadline":             target_date.isoformat(),
            "mastery_pct":          float(r["effective_mastery_pct"] or 0),
            "lifetime_mastery_pct": float(r["lifetime_mastery"] or 0),
            "rolling_pct_10":       float(r["rolling_pct_10"] or 0),
            "attempts_last_10":     int(r["attempts_last_10"] or 0),
            "lifetime_attempts":    int(r["lifetime_attempts"] or 0),
            "exam_weight_pct":      float(r["weight_pct"] or 0),
            "urgency_score":        adjusted,
            "base_urgency":         float(r["base_urgency"] or 0),
            "recent_errors_count":  int(r["recent_errors_count"] or 0),
            "last_error_at":        str(r["last_error_at"]) if r["last_error_at"] else None,
            "module_title":         r["module_title"],
            "topic_name":           r["topic_name"],
            "los_description":      r["los_description"],
            "bloom_level":          r["bloom_level"],
            "last_attempt_at":      str(r["last_attempt_at"]) if r["last_attempt_at"] else None,
            "days_until_exam":      max(0, (target_date - date.today()).days),
        }

    if not found:
        return {
            "critical_path": {
                "topic": None, "lm": None, "los": None,
                "action_text": "Aucune donnée disponible. Lance une première session pour activer le moteur.",
                "priority": "LOW", "deadline": target_date.isoformat(),
                "mastery_pct": 0, "exam_weight_pct": 0, "urgency_score": 0,
                "days_until_exam": max(0, (target_date - date.today()).days),
            },
            "ranked": [],
        }

    dtos = [to_dto(r) for r in found]
    return {
        "critical_path": dtos[0],
        "ranked":        dtos if limit > 1 else [],
    }


@router.get("/failures/{los_code}")
async def get_failures_for_los(
    los_code: str,
    user_id: str = Depends(current_user_id),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Last N failed attempts on a specific LOS, with full diagnostic metadata.

    Used by the NBA detail view to surface what the user got wrong (the
    question, what they picked, the correct answer, the explanation, time
    spent, confidence, when) so the coach can tailor the next intervention.
    """
    failures = await NBAService.get_failure_metadata(db, user_id, los_code, limit=limit)
    return {
        "los_code":  los_code,
        "user_id":   user_id,
        "count":     len(failures),
        "failures":  failures,
    }


@router.get("/failures")
async def get_all_failures(
    user_id: str = Depends(current_user_id),
    limit: int = Query(200, ge=1, le=1000),
    topic_code: Optional[str] = None,
    module_code: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """All failed attempts for a user, most recent first.

    Backs the Error Log page so every wrong answer across every session
    appears automatically — same metadata shape as /failures/{los_code}
    but without the LOS filter. Optional topic_code / module_code narrow.
    """
    failures = await NBAService.get_all_failures(
        db, user_id, limit=limit, topic_code=topic_code, module_code=module_code,
    )
    return {
        "user_id": user_id,
        "count":   len(failures),
        "failures": failures,
    }

