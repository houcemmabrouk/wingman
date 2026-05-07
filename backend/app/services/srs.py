from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# SM-2 constants (Piotr Wozniak, SuperMemo 2)
EASE_MIN = 1.3
EASE_INITIAL = 2.5
INTERVAL_R1 = 1   # days after first successful review
INTERVAL_R2 = 6   # days after second successful review


def score_to_grade(score_pct: float, response_time_sec: float | None = None,
                   expected_time_sec: float | None = None) -> int:
    """
    Convert CFA-style score % (+ optional response time) into SM-2 quality grade 0-5.

    SM-2 grades:
      5 — perfect response
      4 — correct response after hesitation
      3 — correct response with serious difficulty
      2 — incorrect; the correct one seemed easy once shown
      1 — incorrect; correct one remembered
      0 — complete blackout

    CFA mapping (score_pct is the weighted correctness for this LM/session):
      >= 90       -> 5
      >= 80       -> 4
      >= 65       -> 3  (pass threshold, minor hesitation)
      >= 50       -> 2
      >= 30       -> 1
      <  30       -> 0

    If response_time is provided and > 1.5x expected, demote by 1 (min 0).
    If response_time < 0.7x expected and score >= 80, promote by 1 (max 5).
    """
    if score_pct >= 90:
        grade = 5
    elif score_pct >= 80:
        grade = 4
    elif score_pct >= 65:
        grade = 3
    elif score_pct >= 50:
        grade = 2
    elif score_pct >= 30:
        grade = 1
    else:
        grade = 0

    if response_time_sec is not None and expected_time_sec and expected_time_sec > 0:
        ratio = response_time_sec / expected_time_sec
        if ratio > 1.5 and grade > 0:
            grade -= 1
        elif ratio < 0.7 and score_pct >= 80 and grade < 5:
            grade += 1

    return grade


def sm2_next(ease: float, interval: int, repetitions: int, grade: int) -> tuple[float, int, int]:
    """
    Pure SM-2 step. Returns (new_ease, new_interval_days, new_repetitions).

    Canonical SM-2:
      if grade < 3: repetitions = 0, interval = 1 (relearn)
      else:
        repetitions += 1
        if repetitions == 1: interval = 1
        elif repetitions == 2: interval = 6
        else: interval = round(prev_interval * ease)
      ease' = ease + (0.1 - (5-grade) * (0.08 + (5-grade) * 0.02))
      ease' clamped at EASE_MIN (no upper bound)
    """
    # Ease update applies on every review, even failures
    delta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
    new_ease = max(EASE_MIN, ease + delta)

    if grade < 3:
        # Relearn path — keep ease updated, reset progression
        return new_ease, 1, 0

    new_reps = repetitions + 1
    if new_reps == 1:
        new_interval = INTERVAL_R1
    elif new_reps == 2:
        new_interval = INTERVAL_R2
    else:
        new_interval = max(1, round(interval * new_ease))

    return new_ease, new_interval, new_reps


async def update_srs(db: AsyncSession, user_id: str, lm_id: int, score_pct: float,
                     response_time_sec: float | None = None,
                     expected_time_sec: float | None = None):
    """
    Update SRS queue using correct SM-2 algorithm with quality grade 0-5.

    score_pct stays the public API for backward compat; it is converted to
    an SM-2 grade internally. Optional timing args refine the grade.
    """
    grade = score_to_grade(score_pct, response_time_sec, expected_time_sec)

    row = await db.execute(text("""
        SELECT id, ease_factor, interval_days, repetitions
        FROM srs_queue
        WHERE user_id = :uid AND card_type = 'question' AND card_id = :lm_id
    """), {"uid": user_id, "lm_id": lm_id})
    existing = row.mappings().first()

    if existing:
        ease = float(existing["ease_factor"])
        interval = int(existing["interval_days"])
        reps = int(existing["repetitions"])
        new_ease, new_interval, new_reps = sm2_next(ease, interval, reps, grade)
        await db.execute(text("""
            UPDATE srs_queue
            SET ease_factor = :ease, interval_days = :intv, repetitions = :reps,
                next_review = now() + make_interval(days => :intv),
                last_review = now(),
                last_grade = :grade
            WHERE id = :id
        """), {
            "ease": new_ease, "intv": new_interval, "reps": new_reps,
            "grade": grade, "id": existing["id"],
        })
    else:
        # First encounter — seed and apply same SM-2 step from (EASE_INITIAL, 0, 0)
        new_ease, new_interval, new_reps = sm2_next(EASE_INITIAL, 0, 0, grade)
        await db.execute(text("""
            INSERT INTO srs_queue
                (user_id, card_type, card_id, ease_factor, interval_days, repetitions,
                 next_review, last_review, last_grade)
            VALUES (:uid, 'question', :lm_id, :ease, :intv, :reps,
                    now() + make_interval(days => :intv), now(), :grade)
        """), {
            "uid": user_id, "lm_id": lm_id,
            "ease": new_ease, "intv": new_interval, "reps": new_reps,
            "grade": grade,
        })

    await db.commit()
    return {"grade": grade, "new_ease": new_ease, "new_interval": new_interval,
            "new_repetitions": new_reps}


async def get_srs_due(db: AsyncSession, user_id: str, include_upcoming_hours: int = 0):
    """
    Return learning modules due for review, ranked by urgency score.

    urgency = overdue_ratio * topic_weight_factor * (1 / ease_factor)
      - overdue_ratio = overdue_days / max(interval_days, 1)  (higher = more forgotten)
      - topic_weight_factor = topic.weight_pct / 10          (Ethics ~15% -> 1.5x boost)
      - 1/ease                                               (hard cards ranked higher)

    include_upcoming_hours: if >0, also surface cards due within this window
                            (useful for "what should I prep today for tomorrow").
    """
    result = await db.execute(text("""
        SELECT sq.card_id AS lm_id, lm.code, lm.title,
               t.id AS topic_id, t.name AS topic_name, t.weight_pct,
               sq.ease_factor, sq.interval_days, sq.repetitions,
               sq.next_review, sq.last_review,
               EXTRACT(EPOCH FROM (now() - sq.next_review)) / 86400.0 AS overdue_days
        FROM srs_queue sq
        JOIN learning_modules lm ON lm.id = sq.card_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE sq.user_id = :uid
          AND sq.card_type = 'question'
          AND sq.next_review <= now() + make_interval(hours => :upcoming)
        ORDER BY sq.next_review
    """), {"uid": user_id, "upcoming": include_upcoming_hours})
    rows = result.mappings().all()

    out = []
    for r in rows:
        d = dict(r)
        overdue = max(0.0, float(d.get("overdue_days") or 0))
        interval = max(1, int(d["interval_days"]))
        ease = max(EASE_MIN, float(d["ease_factor"]))
        weight = float(d.get("weight_pct") or 10.0)

        overdue_ratio = overdue / interval  # 0 = just due, 1 = forgot a full interval
        weight_factor = weight / 10.0
        ease_factor = 1.0 / ease

        urgency = (0.5 + overdue_ratio) * weight_factor * ease_factor

        d["overdue_days"] = round(overdue, 2)
        d["urgency_score"] = round(urgency, 4)
        d["next_review"] = str(d["next_review"])
        d["last_review"] = str(d["last_review"]) if d["last_review"] else None
        out.append(d)

    out.sort(key=lambda x: x["urgency_score"], reverse=True)
    return out
