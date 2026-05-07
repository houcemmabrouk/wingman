"""
Global retention metrics for Wingman.
Place in: app/services/global_retention.py

Computes 3 metrics to display in user dashboard:
  1. global_retention  — primary "exam readiness" signal
  2. coverage_retention — "how well you retain what you've studied"
  3. exam_readiness_score — decomposed into coverage × retention
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.mastery import retention


async def compute_global_retention(db: AsyncSession, user_id: str) -> dict:
    """
    Compute global retention metrics for a user across the entire curriculum.

    Returns a dict with:
      - global_retention_pct       : weighted retention including non-seen LMs as 0
      - coverage_retention_pct     : weighted retention of SEEN LMs only
      - coverage_pct               : % of CFA weight covered so far
      - exam_readiness_pct         : coverage × retention_of_seen (decomposable)
      - by_topic                   : per-topic breakdown
      - total_lms                  : total number of LMs in curriculum
      - seen_lms                   : LMs with at least 1 attempt
    """
    # ── Fetch all LMs with user mastery + topic weight + SRS reps ──
    rows = await db.execute(text("""
        SELECT lm.id AS lm_id,
               lm.code AS lm_code,
               lm.topic_id,
               t.name AS topic_name,
               COALESCE(t.weight_pct, 10.0) AS weight_pct,
               COALESCE(m.mastery_level, 0) AS raw_mastery,
               COALESCE(m.review_count, 0) AS review_count,
               EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
               COALESCE(sq.repetitions, 0) AS srs_reps,
               CASE WHEN m.module_id IS NOT NULL THEN 1 ELSE 0 END AS seen
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN lm_mastery m ON m.module_id = lm.id AND m.user_id = :uid
        LEFT JOIN srs_queue sq ON sq.card_id = lm.id
                               AND sq.user_id = :uid
                               AND sq.card_type = 'question'
    """), {"uid": user_id})
    lm_rows = rows.mappings().all()

    if not lm_rows:
        return _empty_result()

    # ── Compute per-LM contributions ──
    # For the global retention, each LM contributes:
    #   retention_lm × weight_per_lm_in_topic
    # where weight_per_lm_in_topic = topic_weight / number_of_lms_in_topic
    #
    # This ensures topic weight is distributed evenly across its LMs.
    # (Alternative: give all LMs in a topic equal share, which we do here.)

    # Count LMs per topic for weight distribution
    lms_per_topic: dict[int, int] = {}
    for r in lm_rows:
        lms_per_topic[r["topic_id"]] = lms_per_topic.get(r["topic_id"], 0) + 1

    total_weight_all = 0.0
    total_weight_seen = 0.0
    weighted_retention_all = 0.0
    weighted_retention_seen = 0.0
    total_lms = len(lm_rows)
    seen_lms = 0

    # Per-topic aggregation
    topic_stats: dict[int, dict] = {}

    for r in lm_rows:
        tid = r["topic_id"]
        seen = bool(r["seen"])
        raw_m = float(r["raw_mastery"])
        reps = int(r["srs_reps"] or r["review_count"] or 0)
        days = r["days_since"]

        # Weight per LM = topic weight / number of LMs in topic
        lm_weight = float(r["weight_pct"]) / lms_per_topic[tid]

        # Retention for this LM (0 if never studied or mastery=0)
        if seen and raw_m > 0 and days is not None:
            lm_retention = retention(float(days), reps)
            effective_m = raw_m * lm_retention / 100.0  # 0-1 scale
        else:
            lm_retention = 0.0
            effective_m = 0.0

        # Contribution to global metrics
        total_weight_all += lm_weight
        weighted_retention_all += effective_m * lm_weight

        if seen:
            seen_lms += 1
            total_weight_seen += lm_weight
            weighted_retention_seen += effective_m * lm_weight

        # Topic-level aggregation
        if tid not in topic_stats:
            topic_stats[tid] = {
                "topic_id": tid,
                "topic_name": r["topic_name"],
                "topic_weight": float(r["weight_pct"]),
                "total_lms": 0,
                "seen_lms": 0,
                "weighted_retention_sum": 0.0,
                "weight_sum": 0.0,
                "weight_sum_seen": 0.0,
            }
        ts = topic_stats[tid]
        ts["total_lms"] += 1
        ts["weight_sum"] += lm_weight
        if seen:
            ts["seen_lms"] += 1
            ts["weight_sum_seen"] += lm_weight
        ts["weighted_retention_sum"] += effective_m * lm_weight

    # ── Final metrics ──
    global_retention_pct = (
        100.0 * weighted_retention_all / total_weight_all
        if total_weight_all > 0 else 0.0
    )

    coverage_retention_pct = (
        100.0 * weighted_retention_seen / total_weight_seen
        if total_weight_seen > 0 else 0.0
    )

    coverage_pct = (
        100.0 * total_weight_seen / total_weight_all
        if total_weight_all > 0 else 0.0
    )

    # Exam readiness = coverage × retention of what's seen (both 0-1)
    # Equivalent to global_retention_pct but decomposable
    exam_readiness_pct = coverage_pct * coverage_retention_pct / 100.0

    # ── Per-topic breakdown ──
    by_topic = []
    for ts in topic_stats.values():
        topic_cov = (
            100.0 * ts["weight_sum_seen"] / ts["weight_sum"]
            if ts["weight_sum"] > 0 else 0.0
        )
        topic_ret = (
            100.0 * ts["weighted_retention_sum"] / ts["weight_sum"]
            if ts["weight_sum"] > 0 else 0.0
        )
        topic_ret_seen = (
            100.0 * ts["weighted_retention_sum"] / ts["weight_sum_seen"]
            if ts["weight_sum_seen"] > 0 else 0.0
        )
        by_topic.append({
            "topic_id": ts["topic_id"],
            "topic_name": ts["topic_name"],
            "topic_weight_pct": ts["topic_weight"],
            "coverage_pct": round(topic_cov, 1),
            "global_retention_pct": round(topic_ret, 1),
            "coverage_retention_pct": round(topic_ret_seen, 1),
            "seen_lms": ts["seen_lms"],
            "total_lms": ts["total_lms"],
        })
    by_topic.sort(key=lambda x: x["topic_weight_pct"], reverse=True)

    return {
        "global_retention_pct": round(global_retention_pct, 2),
        "coverage_retention_pct": round(coverage_retention_pct, 2),
        "coverage_pct": round(coverage_pct, 2),
        "exam_readiness_pct": round(exam_readiness_pct, 2),
        "total_lms": total_lms,
        "seen_lms": seen_lms,
        "by_topic": by_topic,
    }


def _empty_result() -> dict:
    return {
        "global_retention_pct": 0.0,
        "coverage_retention_pct": 0.0,
        "coverage_pct": 0.0,
        "exam_readiness_pct": 0.0,
        "total_lms": 0,
        "seen_lms": 0,
        "by_topic": [],
    }


async def compute_half_life_summary(db: AsyncSession, user_id: str) -> dict:
    """
    Additional user-friendly metric: average memory half-life across seen LMs.

    Half-life = stability × ln(2) ≈ 0.693 × stability
    where stability = STABILITY_BASE_DAYS × (1 + 0.5 × reps)

    Returns:
      - avg_half_life_days  : weighted average half-life (by CFA weight)
      - lms_critical        : LMs whose effective mastery < 30% (need urgent review)
      - lms_solid           : LMs whose effective mastery > 70%
    """
    import math
    from app.services.mastery import STABILITY_BASE_DAYS

    rows = await db.execute(text("""
        SELECT lm.id AS lm_id,
               lm.code AS lm_code,
               lm.title,
               COALESCE(t.weight_pct, 10.0) AS weight_pct,
               COALESCE(m.mastery_level, 0) AS raw_mastery,
               EXTRACT(EPOCH FROM (now() - m.last_studied)) / 86400.0 AS days_since,
               COALESCE(sq.repetitions, 0) AS srs_reps,
               COALESCE(m.review_count, 0) AS review_count
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        INNER JOIN lm_mastery m ON m.module_id = lm.id AND m.user_id = :uid
        LEFT JOIN sr_queue sq ON sq.card_id = lm.id
                              AND sq.user_id = :uid
                              AND sq.card_type = 'question'
        WHERE m.mastery_level > 0
    """).replace("sr_queue", "srs_queue"), {"uid": user_id})

    seen = rows.mappings().all()
    if not seen:
        return {"avg_half_life_days": 0, "lms_critical": [], "lms_solid": []}

    ln2 = math.log(2)
    total_weight = 0.0
    weighted_halflife = 0.0
    critical, solid = [], []

    for r in seen:
        reps = int(r["srs_reps"] or r["review_count"] or 0)
        stability = STABILITY_BASE_DAYS * (1.0 + 0.5 * reps)
        half_life = stability * ln2

        days = float(r["days_since"] or 0)
        ret = retention(days, reps)
        eff_mastery = float(r["raw_mastery"]) * ret

        w = float(r["weight_pct"])
        total_weight += w
        weighted_halflife += half_life * w

        lm_info = {
            "lm_code": r["lm_code"],
            "title": r["title"],
            "effective_mastery_pct": round(eff_mastery, 1),
            "half_life_days": round(half_life, 1),
            "days_since_review": round(days, 1),
        }
        if eff_mastery < 30:
            critical.append(lm_info)
        elif eff_mastery > 70:
            solid.append(lm_info)

    return {
        "avg_half_life_days": round(weighted_halflife / total_weight, 1) if total_weight > 0 else 0,
        "lms_critical": sorted(critical, key=lambda x: x["effective_mastery_pct"])[:10],
        "lms_solid": sorted(solid, key=lambda x: -x["effective_mastery_pct"])[:10],
    }


# ═══════════════════════════════════════════════════════════════════════════
# EXAM READINESS ASSESSMENT
# ═══════════════════════════════════════════════════════════════════════════
#
# Thresholds calibrated on the estimated MPS (Minimum Passing Score) of
# ~65% for CFA L1, with a safety margin for noise and exam-day stress.
#
# Recommended user-facing target: 70% global retention.
# Plus per-topic floors to avoid critical topic weakness.
# ═══════════════════════════════════════════════════════════════════════════

READINESS_THRESHOLDS = {
    # Global retention target (after safety margin above ~65% MPS)
    "global_target_pct": 70.0,

    # Per-topic floors based on topic weight
    "major_topic_floor_pct": 55.0,   # topics with weight >= 10%
    "minor_topic_floor_pct": 45.0,   # topics with weight 6-10%
    "light_topic_floor_pct": 35.0,   # topics with weight < 6%

    # Weight thresholds that classify topics as major/minor/light
    "major_topic_weight": 10.0,
    "minor_topic_weight": 6.0,
}

READINESS_BANDS = [
    (0, 20, "critical", "Tu commences la prep ou tu as beaucoup de rattrapage."),
    (20, 40, "behind", "Tu n'es pas prêt. Coverage et/ou rétention insuffisantes."),
    (40, 55, "building", "Tu construis ta base. Continue sur la progression."),
    (55, 70, "approaching", "Tu approches de la cible. Focus sur les faiblesses."),
    (70, 85, "ready", "Niveau cohérent avec un passage CFA L1."),
    (85, 101, "excellent", "Au-delà de la cible. Envisage des mocks complets."),
]


def assess_readiness(metrics: dict) -> dict:
    """
    Assess exam readiness based on global retention metrics.
    
    Args:
        metrics: the dict returned by compute_global_retention()
    
    Returns:
        {
          "is_ready": bool,
          "global_status": str,         # "critical" | "behind" | ... | "excellent"
          "global_message": str,
          "blockers": list[dict],       # topics below floor
          "on_track": list[dict],       # topics meeting floor
          "recommended_focus": list,    # top 3 LMs/topics to prioritize
          "verdict_message": str,       # one-line summary
        }
    """
    global_pct = metrics.get("global_retention_pct", 0)
    by_topic = metrics.get("by_topic", [])

    # ── Classify global band ──
    global_status = "critical"
    global_message = ""
    for lo, hi, status, msg in READINESS_BANDS:
        if lo <= global_pct < hi:
            global_status = status
            global_message = msg
            break

    # ── Check per-topic floors ──
    blockers = []
    on_track = []

    for t in by_topic:
        weight = t["topic_weight_pct"]
        retention = t["coverage_retention_pct"] if t["seen_lms"] > 0 else 0

        # Determine applicable floor based on topic weight
        if weight >= READINESS_THRESHOLDS["major_topic_weight"]:
            floor = READINESS_THRESHOLDS["major_topic_floor_pct"]
            tier = "major"
        elif weight >= READINESS_THRESHOLDS["minor_topic_weight"]:
            floor = READINESS_THRESHOLDS["minor_topic_floor_pct"]
            tier = "minor"
        else:
            floor = READINESS_THRESHOLDS["light_topic_floor_pct"]
            tier = "light"

        item = {
            "topic_name": t["topic_name"],
            "topic_weight_pct": weight,
            "tier": tier,
            "retention_pct": retention,
            "floor_pct": floor,
            "gap_pct": max(0, floor - retention),
            "seen_lms": t["seen_lms"],
            "total_lms": t["total_lms"],
        }

        if retention < floor:
            blockers.append(item)
        else:
            on_track.append(item)

    # Sort blockers by severity (biggest gap × topic weight = priority)
    blockers.sort(key=lambda x: x["gap_pct"] * x["topic_weight_pct"], reverse=True)
    on_track.sort(key=lambda x: x["topic_weight_pct"], reverse=True)

    # ── Final verdict ──
    meets_global = global_pct >= READINESS_THRESHOLDS["global_target_pct"]
    no_blockers = len(blockers) == 0
    is_ready = meets_global and no_blockers

    if is_ready:
        verdict = "READY — global target met and no topic under minimum threshold."
    elif not meets_global and not no_blockers:
        verdict = (
            f"NOT READY — global retention {global_pct:.1f}% below 70% target "
            f"AND {len(blockers)} topic(s) under minimum threshold."
        )
    elif not meets_global:
        verdict = f"NOT READY — global retention {global_pct:.1f}% below 70% target."
    else:
        top_blocker = blockers[0]["topic_name"]
        verdict = f"NOT READY — blocker: {top_blocker} significantly below threshold."

    # ── Recommended focus (top 3 blockers, or top 3 weakest if no blockers) ──
    if blockers:
        focus_source = blockers[:3]
    else:
        # If all topics meet floor, recommend the 3 weakest among major/minor topics
        major_minor = [t for t in on_track if t["tier"] in ("major", "minor")]
        major_minor.sort(key=lambda x: x["retention_pct"])
        focus_source = major_minor[:3]

    recommended_focus = [
        {
            "topic_name": t["topic_name"],
            "current_pct": t["retention_pct"],
            "target_pct": t["floor_pct"] if t in blockers else 75.0,
            "weight_pct": t["topic_weight_pct"],
        }
        for t in focus_source
    ]

    return {
        "is_ready": is_ready,
        "global_status": global_status,
        "global_message": global_message,
        "global_pct": round(global_pct, 1),
        "global_target_pct": READINESS_THRESHOLDS["global_target_pct"],
        "blockers": blockers,
        "on_track": on_track,
        "recommended_focus": recommended_focus,
        "verdict_message": verdict,
    }


# ══════════════════════════════════════════════════════════════
# VELOCITY — weekly trend from daily readiness_snapshots
# ══════════════════════════════════════════════════════════════

from datetime import date
from sqlalchemy import text as _sql_text

EXAM_DATE = date(2026, 8, 18)
TARGET_READINESS = 70.0

_STATUS_LABELS = {
    "declining":         "Declining",
    "stagnant":          "Stagnant",
    "slow":              "Slow progress",
    "steady":            "Steady progress",
    "fast":              "Fast progress",
    "exceptional":       "Exceptional pace",
    "insufficient_data": "Not enough data yet",
}


def _velocity_status(weekly_pct):
    if weekly_pct <  -0.5: return "declining"
    if weekly_pct <   0.3: return "stagnant"
    if weekly_pct <   0.8: return "slow"
    if weekly_pct <   1.5: return "steady"
    if weekly_pct <   2.5: return "fast"
    return "exceptional"


def _linear_slope_per_day(points):
    n = len(points)
    if n < 2:
        return 0.0
    sx  = sum(x   for x, _ in points)
    sy  = sum(y   for _, y in points)
    sxx = sum(x*x for x, _ in points)
    sxy = sum(x*y for x, y in points)
    denom = n * sxx - sx * sx
    if denom == 0:
        return 0.0
    return (n * sxy - sx * sy) / denom


async def _upsert_today_snapshot(db, user_id, metrics):
    try:
        await db.execute(
            _sql_text(
                "INSERT INTO readiness_snapshots "
                "(user_id, snapshot_date, readiness_pct, retention_pct, coverage_pct, seen_lms, total_lms) "
                "VALUES (:uid, CURRENT_DATE, :r, :ret, :cov, :seen, :total) "
                "ON CONFLICT (user_id, snapshot_date) DO UPDATE SET "
                "readiness_pct = EXCLUDED.readiness_pct, "
                "retention_pct = EXCLUDED.retention_pct, "
                "coverage_pct  = EXCLUDED.coverage_pct, "
                "seen_lms      = EXCLUDED.seen_lms, "
                "total_lms     = EXCLUDED.total_lms"
            ),
            {
                "uid":   user_id,
                "r":     float(metrics.get("exam_readiness_pct") or 0),
                "ret":   float(metrics.get("coverage_retention_pct") or 0),
                "cov":   float(metrics.get("coverage_pct") or 0),
                "seen":  int(metrics.get("seen_lms") or 0),
                "total": int(metrics.get("total_lms") or 0),
            },
        )
        await db.commit()
    except Exception:
        pass


def _days_to_exam(today=None):
    return max(0, (EXAM_DATE - (today or date.today())).days)


async def compute_velocity(db, user_id, metrics=None):
    """Weekly progression from readiness_snapshots. Needs >=3 data points to
    emit a real reading; otherwise returns status=insufficient_data.
    """
    if metrics is not None:
        await _upsert_today_snapshot(db, user_id, metrics)

    rows = await db.execute(
        _sql_text(
            "SELECT snapshot_date, readiness_pct, retention_pct, coverage_pct "
            "FROM readiness_snapshots "
            "WHERE user_id = :uid AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days' "
            "ORDER BY snapshot_date ASC"
        ),
        {"uid": user_id},
    )
    history = rows.mappings().all()
    history_points = len(history)

    today = date.today()
    dte = _days_to_exam(today)
    current_readiness = float(metrics.get("exam_readiness_pct") if metrics else 0.0)

    trend = [
        {
            "date":      str(r["snapshot_date"]),
            "readiness": float(r["readiness_pct"]),
            "retention": float(r["retention_pct"]),
            "coverage":  float(r["coverage_pct"]),
        }
        for r in history
    ]

    if history_points < 3:
        return {
            "velocity_weekly_pct":         0.0,
            "velocity_status":             "insufficient_data",
            "velocity_label":              _STATUS_LABELS["insufficient_data"],
            "velocity_is_sufficient":      False,
            "velocity_floor_required":     0.0,
            "days_to_exam":                dte,
            "projected_readiness_at_exam": round(current_readiness, 2),
            "required_velocity_to_target": 0.0,
            "on_track_for_exam":           False,
            "trend":                       trend,
            "history_points":              history_points,
            "current_readiness":           round(current_readiness, 2),
            "baseline_date":               str(history[0]["snapshot_date"]) if history else str(today),
        }

    window = history[-14:]
    base_day = window[0]["snapshot_date"]
    points = [
        (int((r["snapshot_date"] - base_day).days), float(r["readiness_pct"]))
        for r in window
    ]
    slope_per_day = _linear_slope_per_day(points)
    weekly_pct = round(slope_per_day * 7, 2)

    status = _velocity_status(weekly_pct)
    projected = max(0.0, min(100.0, current_readiness + slope_per_day * dte))

    remaining = max(0.0, TARGET_READINESS - current_readiness)
    weeks_left = max(dte / 7.0, 1e-6)
    required_weekly = remaining / weeks_left

    is_sufficient = weekly_pct + 0.1 >= required_weekly
    on_track = projected >= TARGET_READINESS - 0.5

    return {
        "velocity_weekly_pct":         weekly_pct,
        "velocity_status":             status,
        "velocity_label":              _STATUS_LABELS[status],
        "velocity_is_sufficient":      is_sufficient,
        "velocity_floor_required":     round(required_weekly, 2),
        "days_to_exam":                dte,
        "projected_readiness_at_exam": round(projected, 2),
        "required_velocity_to_target": round(required_weekly, 2),
        "on_track_for_exam":           on_track,
        "trend":                       trend,
        "history_points":              history_points,
        "current_readiness":           round(current_readiness, 2),
        "baseline_date":               str(history[0]["snapshot_date"]),
    }


def assess_velocity_verdict(velocity):
    status = velocity["velocity_status"]
    w      = velocity["velocity_weekly_pct"]
    req    = velocity["velocity_floor_required"]
    dte    = velocity["days_to_exam"]
    proj   = velocity["projected_readiness_at_exam"]
    ok     = velocity["on_track_for_exam"]

    if status == "insufficient_data":
        return {
            "severity": "neutral",
            "headline": "Not enough data to measure velocity yet.",
            "detail":   "Keep studying - a velocity reading appears after about 3 days of activity.",
        }
    if status == "declining":
        return {
            "severity": "critical",
            "headline": "Regressing {w:+.1f}%/week. Recent sessions are costing retention.".format(w=w),
            "detail":   "Projected readiness at exam: {p:.1f}%. Aim for +{r:.1f}%/week to reach {t:.0f}%.".format(p=proj, r=req, t=TARGET_READINESS),
        }
    if status == "stagnant":
        return {
            "severity": "warning",
            "headline": "Flat this week ({w:+.1f}%/w). Readiness isn't moving.".format(w=w),
            "detail":   "{d} days to exam. Required pace to hit {t:.0f}%: +{r:.1f}%/week.".format(d=dte, r=req, t=TARGET_READINESS),
        }
    if not ok:
        return {
            "severity": "warning",
            "headline": "Progress is positive (+{w:.1f}%/w) but below the pace needed.".format(w=w),
            "detail":   "Projected at exam: {p:.1f}%. To clear {t:.0f}%, push to +{r:.1f}%/week.".format(p=proj, t=TARGET_READINESS, r=req),
        }
    if status == "exceptional":
        return {
            "severity": "success",
            "headline": "Exceptional pace (+{w:.1f}%/w).".format(w=w),
            "detail":   "Projected at exam: {p:.1f}% - well above target. Keep the cadence.".format(p=proj),
        }
    return {
        "severity": "success",
        "headline": "On track (+{w:.1f}%/w).".format(w=w),
        "detail":   "At this pace, projected readiness by exam day is {p:.1f}% (target {t:.0f}%).".format(p=proj, t=TARGET_READINESS),
    }
