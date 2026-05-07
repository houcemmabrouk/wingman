from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# ── Forgetting curve (Ebbinghaus-style exponential decay) ───────────────────
# retention(t) = exp(-t / stability)
# stability grows with repetitions: stability = STABILITY_BASE * (1 + 0.5*reps)
# effective_mastery = raw_mastery * retention(t)
STABILITY_BASE_DAYS = 7.0


def retention(days_since_review: float, repetitions: int = 0) -> float:
    """Exponential forgetting curve. Returns value in [0,1].
    More repetitions -> slower decay (memory consolidation)."""
    if days_since_review <= 0:
        return 1.0
    stability = STABILITY_BASE_DAYS * (1.0 + 0.5 * max(0, repetitions))
    import math
    return math.exp(-days_since_review / stability)


def effective(mastery_pct: float, days_since_review: float, repetitions: int = 0) -> float:
    """Apply forgetting curve to a stored mastery value. Returns pct 0-100."""
    return float(mastery_pct) * retention(days_since_review, repetitions)


async def update_mastery(db: AsyncSession, user_id: str, lm_id: int) -> str:
    """Legacy: Calculate average of last 5 scores and update lm_mastery. Returns level label."""
    result = await db.execute(text("""
        SELECT score FROM performance_records
        WHERE module_id = :lm_id
          AND session_id IN (
              SELECT id FROM sessions WHERE user_id = :uid
          )
        ORDER BY created_at DESC
        LIMIT 5
    """), {"uid": user_id, "lm_id": lm_id})
    scores = [float(r[0]) for r in result if r[0] is not None]

    if not scores:
        return "weak"

    avg = sum(scores) / len(scores)

    # Upsert lm_mastery
    await db.execute(text("""
        INSERT INTO lm_mastery (user_id, module_id, mastery_level, last_studied, review_count)
        VALUES (:uid, :mid, :lvl, now(), 1)
        ON CONFLICT (user_id, module_id)
        DO UPDATE SET mastery_level = :lvl, last_studied = now(),
                      review_count = lm_mastery.review_count + 1,
                      updated_at = now()
    """), {"uid": user_id, "mid": lm_id, "lvl": avg})
    await db.commit()

    if avg >= 80:
        return "strong"
    elif avg >= 60:
        return "adequate"
    return "weak"


async def update_mastery_cascade(db: AsyncSession, user_id: str, module_id: int) -> str:
    """
    3-level mastery cascade: LOS → LM → (Topic computed on-the-fly).
    Called after quiz/mock submission.

    1. Compute mastery per LOS from question_attempts
    2. UPSERT into los_mastery
    3. Compute LM mastery = AVG(los_mastery for this module)
    4. UPSERT into lm_mastery
    """

    # ── Step 1: Compute per-LOS stats weighted by question difficulty ──
    # Difficulty weight: easy(1)=1x, medium(2)=1.5x, hard(3)=2x, expert(4)=2.5x, master(5)=3x
    los_stats = await db.execute(text("""
        SELECT q.outcome_id,
               COUNT(*)::int AS total,
               SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::int AS correct,
               SUM(CASE
                   WHEN q.difficulty = 1 THEN 1.0
                   WHEN q.difficulty = 2 THEN 1.5
                   WHEN q.difficulty = 3 THEN 2.0
                   WHEN q.difficulty = 4 THEN 2.5
                   WHEN q.difficulty = 5 THEN 3.0
                   ELSE 1.0
               END) AS total_weight,
               SUM(CASE WHEN qa.is_correct THEN
                   CASE
                       WHEN q.difficulty = 1 THEN 1.0
                       WHEN q.difficulty = 2 THEN 1.5
                       WHEN q.difficulty = 3 THEN 2.0
                       WHEN q.difficulty = 4 THEN 2.5
                       WHEN q.difficulty = 5 THEN 3.0
                       ELSE 1.0
                   END
                   ELSE 0 END
               ) AS correct_weight
        FROM question_attempts qa
        JOIN questions q ON qa.question_id = q.id
        WHERE qa.user_id = :uid
          AND q.module_id = :mid
          AND q.outcome_id IS NOT NULL
        GROUP BY q.outcome_id
    """), {"uid": user_id, "mid": module_id})

    los_rows = los_stats.mappings().all()

    if not los_rows:
        # No LOS-linked attempts → fall back to legacy update_mastery
        return await update_mastery(db, user_id, module_id)

    # ── Step 2: UPSERT each LOS mastery (difficulty-weighted) ──
    for row in los_rows:
        total_w = float(row["total_weight"] or 1)
        correct_w = float(row["correct_weight"] or 0)
        mastery = round((correct_w / total_w) * 100, 2) if total_w > 0 else 0
        await db.execute(text("""
            INSERT INTO los_mastery (user_id, outcome_id, mastery_level, attempts_total, attempts_correct, last_attempted)
            VALUES (:uid, :oid, :lvl, :total, :correct, now())
            ON CONFLICT (user_id, outcome_id)
            DO UPDATE SET mastery_level = :lvl,
                          attempts_total = :total,
                          attempts_correct = :correct,
                          last_attempted = now(),
                          updated_at = now()
        """), {
            "uid": user_id, "oid": row["outcome_id"],
            "lvl": mastery, "total": row["total"], "correct": row["correct"]
        })

    # ── Step 3: Compute LM mastery = weighted AVG of LOS masteries ──
    # Weight each LOS by its attempts_total (LOS practiced 30x counts more than 2x).
    # This removes the bias where a barely-tested LOS skews the LM score.
    lm_result = await db.execute(text("""
        SELECT COALESCE(
                 ROUND(
                   (SUM(lm.mastery_level * lm.attempts_total)::numeric /
                    NULLIF(SUM(lm.attempts_total), 0))::numeric,
                   2
                 ),
                 0
               ) AS avg_mastery
        FROM los_mastery lm
        JOIN learning_outcomes lo ON lm.outcome_id = lo.id
        WHERE lm.user_id = :uid AND lo.module_id = :mid
    """), {"uid": user_id, "mid": module_id})
    lm_avg = float(lm_result.scalar() or 0)

    # ── Step 4: UPSERT lm_mastery ──
    await db.execute(text("""
        INSERT INTO lm_mastery (user_id, module_id, mastery_level, last_studied, review_count)
        VALUES (:uid, :mid, :lvl, now(), 1)
        ON CONFLICT (user_id, module_id)
        DO UPDATE SET mastery_level = :lvl, last_studied = now(),
                      review_count = lm_mastery.review_count + 1,
                      updated_at = now()
    """), {"uid": user_id, "mid": module_id, "lvl": lm_avg})
    await db.commit()

    if lm_avg >= 80:
        return "strong"
    elif lm_avg >= 60:
        return "adequate"
    return "weak"


async def get_effective_lm_mastery(db: AsyncSession, user_id: str, lm_id: int) -> dict:
    """
    Return LM mastery adjusted for memory decay since last review.

    Output:
      {
        "lm_id": int,
        "raw_mastery": float (0-100),
        "effective_mastery": float (0-100),  # after forgetting curve
        "retention": float (0-1),
        "days_since_review": float,
        "repetitions": int,
      }
    """
    row = await db.execute(text("""
        SELECT m.mastery_level,
               m.review_count,
               EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
               COALESCE(sq.repetitions, 0) AS srs_reps
        FROM lm_mastery m
        LEFT JOIN srs_queue sq
               ON sq.user_id = m.user_id
              AND sq.card_id = m.module_id
              AND sq.card_type = 'question'
        WHERE m.user_id = :uid AND m.module_id = :mid
    """), {"uid": user_id, "mid": lm_id})
    r = row.mappings().first()
    if not r:
        return {
            "lm_id": lm_id, "raw_mastery": 0.0, "effective_mastery": 0.0,
            "retention": 0.0, "days_since_review": None, "repetitions": 0,
        }

    raw = float(r["mastery_level"] or 0)
    days = float(r["days_since"] or 0)
    reps = int(r["srs_reps"] or r["review_count"] or 0)
    ret = retention(days, reps)

    return {
        "lm_id": lm_id,
        "raw_mastery": round(raw, 2),
        "effective_mastery": round(raw * ret, 2),
        "retention": round(ret, 4),
        "days_since_review": round(days, 2),
        "repetitions": reps,
    }


async def get_effective_los_mastery(db: AsyncSession, user_id: str, lm_id: int) -> list[dict]:
    """Per-LOS effective mastery for a given LM. Useful for repair-session targeting."""
    rows = await db.execute(text("""
        SELECT lo.id AS outcome_id, lo.code AS los_code,
               los.mastery_level, los.attempts_total, los.attempts_correct,
               EXTRACT(EPOCH FROM (now() - los.last_attempted)) / 86400.0 AS days_since
        FROM learning_outcomes lo
        LEFT JOIN los_mastery los
               ON los.outcome_id = lo.id AND los.user_id = :uid
        WHERE lo.module_id = :mid
        ORDER BY lo.id
    """), {"uid": user_id, "mid": lm_id})

    out = []
    for r in rows.mappings():
        raw = float(r["mastery_level"] or 0)
        days = float(r["days_since"] or 0)
        attempts = int(r["attempts_total"] or 0)
        # Use attempts as proxy for consolidation if no SRS row exists for LOS
        reps = max(0, attempts // 3)
        ret = retention(days, reps) if attempts > 0 else 0.0
        out.append({
            "outcome_id": r["outcome_id"],
            "los_code": r["los_code"],
            "raw_mastery": round(raw, 2),
            "effective_mastery": round(raw * ret, 2),
            "retention": round(ret, 4),
            "attempts_total": attempts,
            "attempts_correct": int(r["attempts_correct"] or 0),
            "days_since_review": round(days, 2) if days else None,
        })
    return out


