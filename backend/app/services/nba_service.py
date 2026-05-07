"""Next Best Action service.

Picks the single most urgent thing the candidate should do *right now* —
the LOS with the lowest effective mastery, weighted by the topic's exam
weight so a 30%-mastery LOS in FSA (15% of the exam) beats a 30%-mastery
LOS in DER (5-8%).

Usage:
    from app.services.nba_service import NBAService
    action = await NBAService.get_emergency_action(db, user_id)

Return shape stays compatible with the original draft:
    {
        "topic":       "FSA",
        "lm":          "FSA-08",
        "los":         "FSA-08-LO01",
        "action_text": "Review long-term liabilities and equity ...",
        "priority":    "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        "deadline":    "2026-08-08",   # ISO date — J-10 before exam
        # Plus diagnostic fields for the UI
        "mastery_pct":      12.5,
        "exam_weight_pct":  15.0,
        "urgency_score":    87.5,
    }
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional, Union

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# Exam date currently hard-coded to August 18, 2026 (CFA L1 May/Aug window).
# Move this to settings.exam_date when we have a per-user exam-date field.
DEFAULT_EXAM_DATE = date(2026, 8, 18)


def _priority_from_score(urgency: float) -> str:
    if urgency >= 75:
        return "CRITICAL"
    if urgency >= 50:
        return "HIGH"
    if urgency >= 25:
        return "MEDIUM"
    return "LOW"


def _format_action(verb_hint: str, los_description: str) -> str:
    """Turn an LOS description into an imperative coach instruction."""
    desc = (los_description or "").strip().rstrip(".")
    if not desc:
        return "Review this learning outcome"
    # If the LOS already starts with a Bloom verb, prepend "Review:" so the
    # coach voice is unambiguous; otherwise format as "Review the topic of X".
    return f"Review: {desc[0].upper() + desc[1:]}"


class NBAService:
    """Stateless helpers — no instance state, easy to test."""

    @staticmethod
    async def get_emergency_action(
        db: AsyncSession,
        user_id: str,
        exam_date: Optional[date] = None,
    ) -> dict:
        """Return the single most urgent next action for the candidate.

        Picks the LOS with the highest urgency score:
            urgency = (100 - mastery_level) * (topic.weight_pct / 10)

        If the user has no LOS attempts yet, falls back to the highest-weight
        topic's first LOS so the UI always has something to show.
        """
        target_date = exam_date or DEFAULT_EXAM_DATE

        # Primary path: lowest-mastery LOS the user has actually touched.
        # Wired to question_attempts: LOS with recent (< 7 days) wrong answers
        # get an additive urgency boost so the NBA reacts to fresh mistakes.
        row = await db.execute(text("""
            SELECT
                lo.id            AS outcome_id,
                lo.code          AS los_code,
                lo.description   AS los_description,
                lo.bloom_level   AS bloom_level,
                lm.code          AS module_code,
                lm.title         AS module_title,
                t.code           AS topic_code,
                t.name           AS topic_name,
                COALESCE(t.weight_pct, 10.0)         AS weight_pct,
                COALESCE(lmast.mastery_level, 0)     AS mastery_level,
                COALESCE(lmast.attempts_total, 0)    AS attempts,
                COALESCE(re.cnt, 0)                  AS recent_errors_count,
                re.last_error_at                     AS last_error_at
            FROM los_mastery lmast
            JOIN learning_outcomes lo ON lo.id = lmast.outcome_id
            JOIN learning_modules  lm ON lm.id = lo.module_id
            JOIN topics            t  ON t.id  = lm.topic_id
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
            ) re ON re.outcome_id = lo.id
            WHERE lmast.user_id = :uid
            ORDER BY ((100 - lmast.mastery_level) * COALESCE(t.weight_pct, 10.0)
                     + COALESCE(re.cnt, 0) * 5) DESC,
                     lmast.attempts_total ASC
            LIMIT 1
        """), {"uid": user_id})
        r = row.mappings().first()

        # Cold-start fallback: pick the first LOS of the heaviest topic
        if not r:
            row = await db.execute(text("""
                SELECT
                    lo.id          AS outcome_id,
                    lo.code        AS los_code,
                    lo.description AS los_description,
                    lo.bloom_level AS bloom_level,
                    lm.code        AS module_code,
                    lm.title       AS module_title,
                    t.code         AS topic_code,
                    t.name         AS topic_name,
                    COALESCE(t.weight_pct, 10.0) AS weight_pct,
                    0::numeric AS mastery_level,
                    0 AS attempts,
                    0 AS recent_errors_count,
                    NULL::timestamptz AS last_error_at
                FROM learning_outcomes lo
                JOIN learning_modules lm ON lm.id = lo.module_id
                JOIN topics            t  ON t.id  = lm.topic_id
                ORDER BY t.weight_pct DESC NULLS LAST,
                         lm.sort_order ASC,
                         lo.sort_order ASC
                LIMIT 1
            """))
            r = row.mappings().first()

        if not r:
            # Truly empty DB — return a placeholder so the UI doesn't crash.
            return {
                "topic":            None,
                "lm":               None,
                "los":              None,
                "action_text":      "Aucune donnée disponible. Lance une première session pour activer le moteur.",
                "priority":         "LOW",
                "deadline":         target_date.isoformat(),
                "mastery_pct":      0.0,
                "exam_weight_pct":  0.0,
                "urgency_score":    0.0,
                "recent_errors_count": 0,
                "last_error_at":    None,
            }

        mastery = float(r["mastery_level"])
        weight = float(r["weight_pct"])
        recent_errors = int(r.get("recent_errors_count") or 0)
        base_urgency = (100.0 - mastery) * (weight / 10.0)
        # Each recent (<7 days) wrong answer adds +5 to urgency. 5 fresh
        # mistakes = +25, enough to bump a HIGH item up to CRITICAL.
        urgency = round(base_urgency + recent_errors * 5, 2)
        last_error_at = r.get("last_error_at") if isinstance(r, dict) or hasattr(r, "get") else None

        return {
            "topic":            r["topic_code"],
            "lm":               r["module_code"],
            "los":              r["los_code"],
            "action_text":      _format_action(r.get("bloom_level") or "", r["los_description"]),
            "priority":         _priority_from_score(urgency),
            "deadline":         target_date.isoformat(),
            "mastery_pct":      round(mastery, 2),
            "exam_weight_pct":  round(weight, 2),
            "urgency_score":    urgency,
            "base_urgency":     round(base_urgency, 2),
            "recent_errors_count": recent_errors,
            "last_error_at":    str(last_error_at) if last_error_at else None,
            # Extras for the UI / debugging
            "module_title":     r["module_title"],
            "topic_name":       r["topic_name"],
            "los_description":  r["los_description"],
            "attempts":         int(r["attempts"]),
            "days_until_exam":  max(0, (target_date - date.today()).days),
        }

    @staticmethod
    async def get_failure_metadata(
        db: AsyncSession,
        user_id: str,
        los: Union[int, str],
        limit: int = 5,
    ) -> list[dict]:
        """Last N failed attempts for a specific LOS, with full diagnostic metadata.

        `los` accepts either:
          - the integer outcome_id, or
          - the string los_code (e.g., "ETH-01-e").

        question_attempts has no JSON `metadata` column in this schema, so we
        synthesize it from the actual columns: question stem/choices, what the
        user picked vs the correct answer, time spent, confidence, when it
        happened, plus the parent module/topic.
        """
        # Resolve the outcome_id once so the inner query is simple.
        outcome_id: Optional[int] = None
        if isinstance(los, int):
            outcome_id = los
        else:
            row = await db.execute(
                text("SELECT id FROM learning_outcomes WHERE code = :code"),
                {"code": str(los)},
            )
            outcome_id = row.scalar()
        if outcome_id is None:
            return []

        rows = await db.execute(text("""
            SELECT
                qa.id              AS attempt_id,
                qa.session_id,
                qa.question_id,
                qa.selected_answer AS user_answer,
                qa.is_correct,
                qa.time_spent_sec,
                qa.confidence,
                qa.created_at,
                q.stem,
                q.choice_a,
                q.choice_b,
                q.choice_c,
                q.correct_answer,
                q.explanation,
                q.difficulty,
                lm.code  AS module_code,
                lm.title AS module_title,
                t.code   AS topic_code,
                t.name   AS topic_name,
                lo.code  AS los_code,
                lo.description AS los_description
            FROM question_attempts qa
            JOIN questions         q  ON q.id  = qa.question_id
            JOIN learning_outcomes lo ON lo.id = q.outcome_id
            JOIN learning_modules  lm ON lm.id = q.module_id
            JOIN topics            t  ON t.id  = lm.topic_id
            WHERE qa.user_id    = :uid
              AND q.outcome_id  = :oid
              AND qa.is_correct = false
            ORDER BY qa.created_at DESC
            LIMIT :lim
        """), {"uid": user_id, "oid": outcome_id, "lim": limit})

        out: list[dict] = []
        for r in rows.mappings().all():
            choice_picked = None
            ua = (r["user_answer"] or "").upper().strip()
            if ua in ("A", "B", "C"):
                choice_picked = r[f"choice_{ua.lower()}"]
            ca = (r["correct_answer"] or "").upper().strip()
            choice_correct = r[f"choice_{ca.lower()}"] if ca in ("A", "B", "C") else None

            out.append({
                "attempt_id":      r["attempt_id"],
                "session_id":      r["session_id"],
                "question_id":     r["question_id"],
                "created_at":      str(r["created_at"]) if r["created_at"] else None,
                "topic_code":      r["topic_code"],
                "topic_name":      r["topic_name"],
                "module_code":     r["module_code"],
                "module_title":    r["module_title"],
                "los_code":        r["los_code"],
                "los_description": r["los_description"],
                "stem":            r["stem"],
                "user_answer":     ua or None,
                "user_choice":     choice_picked,
                "correct_answer":  ca or None,
                "correct_choice":  choice_correct,
                "explanation":     r["explanation"],
                "difficulty":      int(r["difficulty"]) if r["difficulty"] is not None else None,
                "time_spent_sec":  int(r["time_spent_sec"]) if r["time_spent_sec"] is not None else None,
                "confidence":      int(r["confidence"]) if r["confidence"] is not None else None,
            })
        return out

    @staticmethod
    async def get_all_failures(
        db: AsyncSession,
        user_id: str,
        limit: int = 200,
        topic_code: Optional[str] = None,
        module_code: Optional[str] = None,
    ) -> list[dict]:
        """All failed attempts for a user (paginated by `limit`), most recent first.

        Same metadata shape as get_failure_metadata() but no LOS filter, so the
        Error Log page can render every wrong answer the user has ever made.
        Optional topic_code / module_code filters narrow down further.
        """
        clauses = ["qa.user_id = :uid", "qa.is_correct = false"]
        params: dict = {"uid": user_id, "lim": limit}
        if topic_code:
            clauses.append("t.code = :tcode")
            params["tcode"] = topic_code
        if module_code:
            clauses.append("lm.code = :mcode")
            params["mcode"] = module_code
        where_sql = " AND ".join(clauses)

        rows = await db.execute(text(f"""
            SELECT
                qa.id              AS attempt_id,
                qa.session_id,
                qa.question_id,
                qa.selected_answer AS user_answer,
                qa.is_correct,
                qa.time_spent_sec,
                qa.confidence,
                qa.created_at,
                q.stem,
                q.choice_a,
                q.choice_b,
                q.choice_c,
                q.correct_answer,
                q.explanation,
                q.difficulty,
                lm.code  AS module_code,
                lm.title AS module_title,
                t.code   AS topic_code,
                t.name   AS topic_name,
                lo.code  AS los_code,
                lo.description AS los_description
            FROM question_attempts qa
            JOIN questions         q  ON q.id  = qa.question_id
            LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
            JOIN learning_modules  lm ON lm.id = q.module_id
            JOIN topics            t  ON t.id  = lm.topic_id
            WHERE {where_sql}
            ORDER BY qa.created_at DESC
            LIMIT :lim
        """), params)

        out: list[dict] = []
        for r in rows.mappings().all():
            ua = (r["user_answer"] or "").upper().strip()
            choice_picked = r[f"choice_{ua.lower()}"] if ua in ("A", "B", "C") else None
            ca = (r["correct_answer"] or "").upper().strip()
            choice_correct = r[f"choice_{ca.lower()}"] if ca in ("A", "B", "C") else None
            out.append({
                "attempt_id":      r["attempt_id"],
                "session_id":      r["session_id"],
                "question_id":     r["question_id"],
                "created_at":      str(r["created_at"]) if r["created_at"] else None,
                "topic_code":      r["topic_code"],
                "topic_name":      r["topic_name"],
                "module_code":     r["module_code"],
                "module_title":    r["module_title"],
                "los_code":        r["los_code"],
                "los_description": r["los_description"],
                "stem":            r["stem"],
                "user_answer":     ua or None,
                "user_choice":     choice_picked,
                "correct_answer":  ca or None,
                "correct_choice":  choice_correct,
                "explanation":     r["explanation"],
                "difficulty":      int(r["difficulty"]) if r["difficulty"] is not None else None,
                "time_spent_sec":  int(r["time_spent_sec"]) if r["time_spent_sec"] is not None else None,
                "confidence":      int(r["confidence"]) if r["confidence"] is not None else None,
            })
        return out
