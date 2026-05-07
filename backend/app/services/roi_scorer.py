"""
ROI Scoring Engine — Wingman Learning OS
─────────────────────────────────────────
Decides WHICH learning module deserves the next study session by computing
a marginal ROI per LM. Consumed by SmartPlanner and by the "what should I
study now" endpoint.

ROI formula:
    ROI = topic_weight_factor
        * (1 - effective_mastery)           # upside left to gain
        * retention_urgency                 # how forgotten it is
        * phase_multiplier                  # Discovery / Consolidation / Simulation bias
        * prereq_gate                       # 0 if blocked by unfinished prereq, else 1
        * exploration_bonus                 # mild UCB-style boost for under-practiced LMs
        / time_cost_factor                  # expected minutes to run one meaningful session

Returns values roughly in [0, 5]. Higher = study this next.

Phase multipliers (applied per LM given the user's current phase):
    Discovery:     unseen LM=1.3, partial=1.0, mastered=0.3
    Consolidation: unseen=0.7, partial=1.3, mastered=0.6
    Simulation:    unseen=0.4, partial=0.9, mastered=1.1  (mock-style review)
"""
from __future__ import annotations

import math
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.mastery import retention, STABILITY_BASE_DAYS

Phase = Literal["discovery", "consolidation", "simulation"]

# ── Tuning constants ────────────────────────────────────────────────────────
DEFAULT_TIME_COST_MIN = 25.0            # baseline: one pomodoro per LM
UNSEEN_MASTERY_THRESHOLD = 5.0          # mastery below this => treated as unseen
PARTIAL_MASTERY_THRESHOLD = 75.0        # between unseen and this => partial
EXPLORATION_C = 0.15                    # UCB exploration coefficient
PREREQ_BLOCK_MASTERY = 50.0             # prereq must be >= this to unlock


PHASE_MULTIPLIERS: dict[Phase, tuple[float, float, float]] = {
    # (unseen, partial, mastered)
    "discovery":     (1.30, 1.00, 0.30),
    "consolidation": (0.70, 1.30, 0.60),
    "simulation":    (0.40, 0.90, 1.10),
}

# Topic-code based energy profile. Matches codes in lm-data.ts / seed.sql
# after the topic-code normalization (ETH/QM/ECO/FSA/CORP/EQU/FI/DER/ALT/PM).
CALC_HEAVY_CODES = {"QM", "FI", "DER", "CORP"}
ENCODING_HEAVY_CODES = {"ETH", "ECO", "PM", "ALT"}


def _mastery_bucket(mastery_pct: float) -> int:
    """0=unseen, 1=partial, 2=mastered."""
    if mastery_pct < UNSEEN_MASTERY_THRESHOLD:
        return 0
    if mastery_pct < PARTIAL_MASTERY_THRESHOLD:
        return 1
    return 2


def _phase_multiplier(phase: Phase, effective_mastery: float) -> float:
    table = PHASE_MULTIPLIERS.get(phase, PHASE_MULTIPLIERS["consolidation"])
    return table[_mastery_bucket(effective_mastery)]


def _retention_urgency(days_since_review: float | None, reps: int) -> float:
    """
    How urgently does this LM need a touch based on memory decay?
      - Never studied   -> 1.0 (neutral; topic_weight & phase drive it)
      - Just studied    -> 0.2 (don't churn)
      - Half-forgotten  -> 1.0
      - Very overdue    -> up to 1.8
    """
    if days_since_review is None or days_since_review <= 0:
        return 1.0
    ret = retention(days_since_review, reps)
    # ret in [0,1]: low ret = urgent. Map to [0.2, 1.8] non-linearly.
    urgency = 0.2 + 1.6 * (1.0 - ret)
    return max(0.2, min(1.8, urgency))


def _exploration_bonus(attempts_total: int, user_total_attempts: int) -> float:
    """
    UCB-lite: LMs with few attempts relative to user's total practice get a small
    bonus so the engine doesn't tunnel-vision on high-weight topics.
    bonus = C * sqrt(ln(N+1) / (n+1))
    """
    return EXPLORATION_C * math.sqrt(math.log(user_total_attempts + 1) / (attempts_total + 1))


async def _get_user_phase(db: AsyncSession, user_id: str) -> Phase:
    """Read current phase from study_plans (most recent active plan), default consolidation."""
    row = await db.execute(text("""
        SELECT COALESCE(current_phase, 'consolidation') AS phase
        FROM study_plans
        WHERE user_id = :uid AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
    """), {"uid": user_id})
    p = row.scalar()
    if p in PHASE_MULTIPLIERS:
        return p  # type: ignore[return-value]
    return "consolidation"


async def _get_user_total_attempts(db: AsyncSession, user_id: str) -> int:
    row = await db.execute(text(
        "SELECT COUNT(*) FROM question_attempts WHERE user_id = :uid"
    ), {"uid": user_id})
    return int(row.scalar() or 0)


async def _get_prereq_gate(db: AsyncSession, user_id: str, lm_id: int) -> float:
    """
    Returns 1.0 if all prereqs >= PREREQ_BLOCK_MASTERY, else 0.0.
    If no prereqs table row => unblocked.
    If prereqs table doesn't exist => unblocked (graceful fallback).
    """
    try:
        rows = await db.execute(text("""
            SELECT prereq_module_id FROM module_prereqs WHERE module_id = :mid
        """), {"mid": lm_id})
        prereqs = [int(r[0]) for r in rows]
    except Exception:
        return 1.0

    if not prereqs:
        return 1.0

    mastery_rows = await db.execute(text("""
        SELECT module_id, COALESCE(mastery_level, 0) AS m
        FROM lm_mastery
        WHERE user_id = :uid AND module_id = ANY(:ids)
    """), {"uid": user_id, "ids": prereqs})
    mastery_by_id = {int(r[0]): float(r[1]) for r in mastery_rows}

    for pid in prereqs:
        if mastery_by_id.get(pid, 0.0) < PREREQ_BLOCK_MASTERY:
            return 0.0
    return 1.0


async def score_lm(db: AsyncSession, user_id: str, lm_id: int,
                   phase: Phase | None = None,
                   user_total_attempts: int | None = None) -> dict:
    """
    Compute ROI for a single LM. Returns full breakdown for observability.
    """
    if phase is None:
        phase = await _get_user_phase(db, user_id)
    if user_total_attempts is None:
        user_total_attempts = await _get_user_total_attempts(db, user_id)

    # One-shot fetch: LM + topic weight + mastery + SRS state + LM attempts
    row = await db.execute(text("""
        SELECT lm.id, lm.code, lm.title, lm.topic_id, lm.estimated_minutes,
               t.code AS topic_code, t.name AS topic_name,
               COALESCE(t.weight_pct, 10.0) AS weight_pct,
               COALESCE(m.mastery_level, 0) AS mastery,
               COALESCE(m.review_count, 0) AS review_count,
               EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
               COALESCE(sq.repetitions, 0) AS srs_reps,
               COALESCE(sq.interval_days, 0) AS srs_interval,
               (SELECT COUNT(*) FROM question_attempts qa
                JOIN questions q ON q.id = qa.question_id
                WHERE qa.user_id = :uid AND q.module_id = lm.id) AS lm_attempts
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN lm_mastery m ON m.module_id = lm.id AND m.user_id = :uid
        LEFT JOIN srs_queue sq ON sq.card_id = lm.id AND sq.user_id = :uid
                               AND sq.card_type = 'question'
        WHERE lm.id = :mid
    """), {"uid": user_id, "mid": lm_id})
    r = row.mappings().first()
    if not r:
        return {"lm_id": lm_id, "roi": 0.0, "error": "LM not found"}

    raw_mastery = float(r["mastery"])
    days = r["days_since"]
    days = float(days) if days is not None else None
    reps = int(r["srs_reps"] or r["review_count"] or 0)
    attempts = int(r["lm_attempts"] or 0)

    ret = retention(days, reps) if days is not None else 1.0
    eff_mastery = raw_mastery * ret

    # Components
    weight_factor = float(r["weight_pct"]) / 10.0             # Ethics 15% -> 1.5x
    upside = max(0.0, 1.0 - eff_mastery / 100.0)              # 0..1
    urgency = _retention_urgency(days, reps)
    phase_mult = _phase_multiplier(phase, eff_mastery)
    prereq = await _get_prereq_gate(db, user_id, lm_id)
    explore = _exploration_bonus(attempts, user_total_attempts)

    time_cost_min = float(r["estimated_minutes"] or DEFAULT_TIME_COST_MIN)
    time_factor = time_cost_min / DEFAULT_TIME_COST_MIN       # longer LMs -> lower ROI

    # Prereq gates the whole score (including exploration) so blocked LMs
    # never surface, even to the UCB exploration channel.
    roi = prereq * (weight_factor * upside * urgency * phase_mult + explore) / max(time_factor, 0.3)

    return {
        "lm_id": r["id"],
        "code": r["code"],
        "title": r["title"],
        "topic_code": r["topic_code"],
        "topic_name": r["topic_name"],
        "phase": phase,
        "roi": round(roi, 4),
        "components": {
            "weight_factor": round(weight_factor, 3),
            "upside": round(upside, 3),
            "raw_mastery": round(raw_mastery, 2),
            "effective_mastery": round(eff_mastery, 2),
            "retention": round(ret, 4),
            "retention_urgency": round(urgency, 3),
            "phase_multiplier": round(phase_mult, 3),
            "prereq_gate": prereq,
            "exploration_bonus": round(explore, 4),
            "time_cost_min": time_cost_min,
            "time_factor": round(time_factor, 3),
            "days_since_review": round(days, 2) if days is not None else None,
            "repetitions": reps,
            "attempts": attempts,
        },
    }


async def rank_lms_by_roi(db: AsyncSession, user_id: str,
                          top_k: int = 10,
                          topic_id: int | None = None,
                          exclude_mastered: bool = False,
                          phase: Phase | None = None) -> list[dict]:
    """
    Rank all LMs for a user by ROI. Single-query prefetch then pure-Python scoring
    so we don't hammer the DB with N queries.
    """
    if phase is None:
        phase = await _get_user_phase(db, user_id)
    user_total = await _get_user_total_attempts(db, user_id)

    params: dict = {"uid": user_id}
    where = []
    if topic_id is not None:
        where.append("lm.topic_id = :tid")
        params["tid"] = topic_id
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    rows = await db.execute(text(f"""
        SELECT lm.id, lm.code, lm.title, lm.topic_id, lm.estimated_minutes,
               t.code AS topic_code, t.name AS topic_name,
               COALESCE(t.weight_pct, 10.0) AS weight_pct,
               COALESCE(m.mastery_level, 0) AS mastery,
               COALESCE(m.review_count, 0) AS review_count,
               EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
               COALESCE(sq.repetitions, 0) AS srs_reps,
               (SELECT COUNT(*) FROM question_attempts qa
                JOIN questions q ON q.id = qa.question_id
                WHERE qa.user_id = :uid AND q.module_id = lm.id) AS lm_attempts
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN lm_mastery m ON m.module_id = lm.id AND m.user_id = :uid
        LEFT JOIN srs_queue sq ON sq.card_id = lm.id AND sq.user_id = :uid
                               AND sq.card_type = 'question'
        {where_sql}
    """), params)

    # Prefetch all prereq edges once
    prereq_rows = await db.execute(text(
        "SELECT module_id, prereq_module_id FROM module_prereqs"
    )) if await _prereq_table_exists(db) else None
    prereqs_by_lm: dict[int, list[int]] = {}
    if prereq_rows is not None:
        for mid, pid in prereq_rows:
            prereqs_by_lm.setdefault(int(mid), []).append(int(pid))

    # Prefetch all mastery for gate check
    all_mastery_rows = await db.execute(text(
        "SELECT module_id, mastery_level FROM lm_mastery WHERE user_id = :uid"
    ), {"uid": user_id})
    mastery_map: dict[int, float] = {int(r[0]): float(r[1] or 0) for r in all_mastery_rows}

    scored = []
    for r in rows.mappings():
        raw_mastery = float(r["mastery"])
        days = r["days_since"]
        days = float(days) if days is not None else None
        reps = int(r["srs_reps"] or r["review_count"] or 0)
        attempts = int(r["lm_attempts"] or 0)

        ret = retention(days, reps) if days is not None else 1.0
        eff_mastery = raw_mastery * ret

        if exclude_mastered and eff_mastery >= PARTIAL_MASTERY_THRESHOLD:
            continue

        weight_factor = float(r["weight_pct"]) / 10.0
        upside = max(0.0, 1.0 - eff_mastery / 100.0)
        urgency = _retention_urgency(days, reps)
        phase_mult = _phase_multiplier(phase, eff_mastery)

        # Prereq gate (in-memory)
        prereq_gate = 1.0
        for pid in prereqs_by_lm.get(int(r["id"]), []):
            if mastery_map.get(pid, 0.0) < PREREQ_BLOCK_MASTERY:
                prereq_gate = 0.0
                break

        explore = _exploration_bonus(attempts, user_total)
        time_cost_min = float(r["estimated_minutes"] or DEFAULT_TIME_COST_MIN)
        time_factor = time_cost_min / DEFAULT_TIME_COST_MIN

        # Prereq gates the whole score, exploration included.
        roi = prereq_gate * (weight_factor * upside * urgency * phase_mult + explore) / max(time_factor, 0.3)

        scored.append({
            "lm_id": r["id"],
            "code": r["code"],
            "title": r["title"],
            "topic_code": r["topic_code"],
            "topic_name": r["topic_name"],
            "effective_mastery": round(eff_mastery, 2),
            "raw_mastery": round(raw_mastery, 2),
            "retention": round(ret, 4),
            "days_since_review": round(days, 2) if days is not None else None,
            "phase_multiplier": round(phase_mult, 3),
            "prereq_gate": prereq_gate,
            "roi": round(roi, 4),
        })

    scored.sort(key=lambda x: x["roi"], reverse=True)
    return scored[:top_k]


async def _prereq_table_exists(db: AsyncSession) -> bool:
    try:
        await db.execute(text("SELECT 1 FROM module_prereqs LIMIT 1"))
        return True
    except Exception:
        return False


async def recommend_next_session(db: AsyncSession, user_id: str,
                                 available_minutes: int = 25,
                                 energy_level: int = 3) -> dict:
    """
    High-level entry point used by the "Start studying" button.

    - energy_level 1-5 filters topic difficulty by topic code:
        1-2 (low) -> prefer encoding-heavy topics (ETH, ECO, PM, ALT)
        3 (med)   -> no filter
        4-5 (high) -> prefer calculator-heavy (QM, FI, DER, CORP)

    Returns the top ROI LM that fits the time budget.
    """
    ranked = await rank_lms_by_roi(db, user_id, top_k=50)
    if not ranked:
        return {"error": "No LMs available"}

    # Filter by time budget (use estimated_minutes when available)
    budget_rows = await db.execute(text("""
        SELECT id, estimated_minutes FROM learning_modules WHERE id = ANY(:ids)
    """), {"ids": [x["lm_id"] for x in ranked]})
    budget_map = {int(r[0]): int(r[1] or DEFAULT_TIME_COST_MIN) for r in budget_rows}

    def fits_budget(lm):
        return budget_map.get(lm["lm_id"], DEFAULT_TIME_COST_MIN) <= available_minutes * 1.1

    # Energy filter (soft: bonus, don't exclude) — keyed on topic_code
    def energy_bonus(lm):
        code = lm.get("topic_code") or ""
        if energy_level <= 2 and code in ENCODING_HEAVY_CODES:
            return 1.15
        if energy_level >= 4 and code in CALC_HEAVY_CODES:
            return 1.15
        if energy_level <= 2 and code in CALC_HEAVY_CODES:
            return 0.85
        if energy_level >= 4 and code in ENCODING_HEAVY_CODES:
            return 0.90
        return 1.0

    candidates = [lm for lm in ranked if fits_budget(lm)]
    if not candidates:
        candidates = ranked  # fall back if budget is too tight

    for lm in candidates:
        lm["energy_adjusted_roi"] = round(lm["roi"] * energy_bonus(lm), 4)

    candidates.sort(key=lambda x: x["energy_adjusted_roi"], reverse=True)
    top = candidates[0]

    return {
        "recommendation": top,
        "alternatives": candidates[1:4],
        "context": {
            "available_minutes": available_minutes,
            "energy_level": energy_level,
        },
    }
