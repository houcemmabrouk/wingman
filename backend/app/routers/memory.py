"""Memory Retention — per-LM + global snapshot of the Ebbinghaus curve.

Uses the `retention()` helper from app.services.mastery so the page and any
planner rule see the same numbers.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.mastery import retention

router = APIRouter(prefix="/api/v1/memory", tags=["memory"])


def _bucket(ret: float) -> str:
    if ret >= 0.80: return "strong"
    if ret >= 0.50: return "fading"
    if ret >  0.0:  return "at_risk"
    return "unseen"


@router.get("/retention")
async def memory_retention(
    include_unseen: bool = Query(True, description="Include LMs the user never studied yet"),
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return per-LM retention + global aggregates.

    Shape:
      {
        global: { avg_retention, avg_effective, total_lms, studied_lms,
                  strong, fading, at_risk, unseen, median_days_since },
        modules: [ { lm_id, lm_code, lm_title, topic_code, topic_name,
                     raw_mastery, effective_mastery, retention,
                     days_since_review, repetitions, bucket } ]
      }
    """
    # One JOIN across learning_modules + (optional) lm_mastery + (optional) srs_queue.
    rows = await db.execute(text("""
        SELECT
            lm.id          AS lm_id,
            lm.code        AS lm_code,
            lm.title       AS lm_title,
            t.code         AS topic_code,
            t.name         AS topic_name,
            t.sort_order   AS topic_order,
            lm.sort_order  AS lm_order,
            COALESCE(m.mastery_level, 0)::float AS raw_mastery,
            m.last_studied AS last_studied,
            EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
            COALESCE(m.review_count, 0) AS review_count,
            COALESCE(sq.repetitions, 0) AS srs_reps
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN lm_mastery m
               ON m.module_id = lm.id AND m.user_id = :uid
        LEFT JOIN srs_queue sq
               ON sq.card_id = lm.id
              AND sq.card_type = 'question'
              AND sq.user_id = :uid
        ORDER BY t.sort_order, lm.sort_order
    """), {"uid": user_id})

    modules = []
    retentions = []
    effective_masteries = []
    days_since_list = []

    for r in rows.mappings().all():
        days = r["days_since"]
        raw = float(r["raw_mastery"] or 0)
        studied = r["last_studied"] is not None
        reps = int(r["srs_reps"] or r["review_count"] or 0)
        ret = retention(float(days), reps) if studied and days is not None else 0.0
        eff = raw * ret

        if not studied and not include_unseen:
            continue

        if studied:
            retentions.append(ret)
            effective_masteries.append(eff)
            if days is not None:
                days_since_list.append(float(days))

        modules.append({
            "lm_id":             r["lm_id"],
            "lm_code":           r["lm_code"],
            "lm_title":          r["lm_title"],
            "topic_code":        r["topic_code"],
            "topic_name":        r["topic_name"],
            "raw_mastery":       round(raw, 2),
            "effective_mastery": round(eff, 2),
            "retention":         round(ret, 4),
            "days_since_review": round(float(days), 2) if (studied and days is not None) else None,
            "repetitions":       reps,
            "studied":           studied,
            "bucket":            _bucket(ret) if studied else "unseen",
        })

    # Aggregates — only over studied LMs so unseen noise doesn't tank the number.
    def avg(xs):
        return round(sum(xs) / len(xs), 4) if xs else 0.0

    def median(xs):
        if not xs:
            return None
        s = sorted(xs)
        mid = len(s) // 2
        return round((s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2), 2)

    strong  = sum(1 for m in modules if m["bucket"] == "strong")
    fading  = sum(1 for m in modules if m["bucket"] == "fading")
    at_risk = sum(1 for m in modules if m["bucket"] == "at_risk")
    unseen  = sum(1 for m in modules if m["bucket"] == "unseen")
    studied_lms = strong + fading + at_risk

    return {
        "global": {
            "avg_retention":        avg(retentions),
            "avg_effective_mastery": round(avg(effective_masteries), 2) if effective_masteries else 0.0,
            "total_lms":            len(modules),
            "studied_lms":          studied_lms,
            "strong":               strong,
            "fading":               fading,
            "at_risk":              at_risk,
            "unseen":               unseen,
            "median_days_since":    median(days_since_list),
        },
        "modules": modules,
    }
