"""
Velocity metrics for Wingman.
Place in: app/services/velocity.py

Computes progression velocity (Δreadiness / Δtime) with:
  - 7-day EMA smoothing to remove noise
  - Projection to exam day ("at this pace, you'll be at X% on exam day")
  - Status assessment relative to current readiness
  - Required velocity to hit target given days remaining

Depends on `progress_snapshots` table having the new columns:
  - global_retention_pct numeric
  - coverage_pct numeric
  - exam_readiness_pct numeric

Migration SQL is at the bottom of this file as a string constant.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════

# EMA smoothing window
EMA_WINDOW_DAYS = 7

# Minimum snapshots needed before velocity is meaningful
MIN_SNAPSHOTS_FOR_VELOCITY = 3

# Required weekly velocity depending on current readiness band
# (key = readiness upper bound, value = weekly velocity floor in pct points)
VELOCITY_FLOOR_BY_READINESS = [
    (20, 2.5),   # critical: must gain 2.5%/week minimum
    (40, 2.0),   # behind
    (55, 1.5),   # building
    (70, 1.0),   # approaching
    (85, 0.3),   # ready (maintain)
    (101, 0.1),  # excellent (just don't lose ground)
]

# Velocity status bands (independent of readiness, then contextualized)
VELOCITY_STATUS_BANDS = [
    # (min_pct_per_week, max_pct_per_week, status, label_fr)
    (-float("inf"), -0.5, "declining",    "En régression"),
    (-0.5, 0.2,           "stagnant",     "Stagnation"),
    (0.2, 1.0,            "slow",         "Progression lente"),
    (1.0, 2.0,            "steady",       "Progression régulière"),
    (2.0, 3.5,            "fast",         "Progression rapide"),
    (3.5, float("inf"),   "exceptional",  "Progression exceptionnelle"),
]


# ═══════════════════════════════════════════════════════════════════════════
# VELOCITY COMPUTATION
# ═══════════════════════════════════════════════════════════════════════════

async def compute_velocity(db: AsyncSession, user_id: str,
                           exam_date: date | None = None) -> dict:
    """
    Compute user's progression velocity based on progress_snapshots.

    Velocity = Δexam_readiness_pct per week, smoothed over 7 days.

    Args:
        db: async session
        user_id: user uuid
        exam_date: date of CFA exam (used for projection). If None, tries to
                   read from user_profiles.exam_date, else defaults 180 days.

    Returns:
        {
          "velocity_weekly_pct": float,         # current 7-day EMA velocity
          "velocity_status": str,               # declining/stagnant/slow/...
          "velocity_label": str,                # French label
          "velocity_is_sufficient": bool,       # meets floor for current readiness
          "velocity_floor_required": float,     # min weekly velocity needed
          "days_to_exam": int,                  # days remaining
          "projected_readiness_at_exam": float, # extrapolation at current pace
          "required_velocity_to_target": float, # velocity needed to hit 70%
          "on_track_for_exam": bool,            # projection >= 70%?
          "trend": list[dict],                  # last N snapshots for sparkline
          "history_points": int,                # number of snapshots used
        }
    """
    # ── Fetch exam date if not provided ──
    if exam_date is None:
        row = await db.execute(text(
            "SELECT exam_date FROM user_profiles WHERE user_id = :uid"
        ), {"uid": user_id})
        fetched = row.scalar()
        if fetched:
            exam_date = fetched if isinstance(fetched, date) else fetched.date()
        else:
            exam_date = date.today() + timedelta(days=180)

    # ── Fetch last 30 snapshots ──
    rows = await db.execute(text("""
        SELECT snapshot_date,
               COALESCE(exam_readiness_pct, 0) AS readiness,
               COALESCE(global_retention_pct, 0) AS retention,
               COALESCE(coverage_pct, 0) AS coverage,
               study_minutes,
               modules_done
        FROM progress_snapshots
        WHERE user_id = :uid
          AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY snapshot_date ASC
    """), {"uid": user_id})
    snaps = rows.mappings().all()

    days_to_exam = max(0, (exam_date - date.today()).days)

    # ── Not enough history: return neutral result ──
    if len(snaps) < MIN_SNAPSHOTS_FOR_VELOCITY:
        return {
            "velocity_weekly_pct": 0.0,
            "velocity_status": "insufficient_data",
            "velocity_label": "Historique insuffisant",
            "velocity_is_sufficient": False,
            "velocity_floor_required": _floor_for_readiness(
                snaps[-1]["readiness"] if snaps else 0
            ),
            "days_to_exam": days_to_exam,
            "projected_readiness_at_exam": (
                float(snaps[-1]["readiness"]) if snaps else 0.0
            ),
            "required_velocity_to_target": 0.0,
            "on_track_for_exam": False,
            "trend": _snaps_to_trend(snaps),
            "history_points": len(snaps),
        }

    current_readiness = float(snaps[-1]["readiness"])

    # ── Compute 7-day delta (today vs 7 days ago, or closest) ──
    target_date = date.today() - timedelta(days=EMA_WINDOW_DAYS)
    # Find snapshot closest to target_date (before or on)
    baseline_snap = None
    for s in snaps:
        snap_date = s["snapshot_date"]
        snap_date = snap_date if isinstance(snap_date, date) else snap_date.date()
        if snap_date <= target_date:
            baseline_snap = s
        else:
            break

    if baseline_snap is None:
        # Not enough history for 7-day window, use oldest snapshot
        baseline_snap = snaps[0]

    baseline_date = baseline_snap["snapshot_date"]
    baseline_date = baseline_date if isinstance(baseline_date, date) else baseline_date.date()
    today_date = snaps[-1]["snapshot_date"]
    today_date = today_date if isinstance(today_date, date) else today_date.date()

    days_delta = max(1, (today_date - baseline_date).days)
    readiness_delta = current_readiness - float(baseline_snap["readiness"])

    # Weekly velocity (pct points per 7 days)
    velocity_weekly = readiness_delta * 7.0 / days_delta

    # ── Classify velocity status ──
    v_status, v_label = "stagnant", "Stagnation"
    for lo, hi, status, label in VELOCITY_STATUS_BANDS:
        if lo <= velocity_weekly < hi:
            v_status, v_label = status, label
            break

    # ── Check if velocity meets the floor for current readiness ──
    floor_required = _floor_for_readiness(current_readiness)
    velocity_sufficient = velocity_weekly >= floor_required

    # ── Projection to exam day ──
    # project = current_readiness + (velocity_weekly / 7) × days_to_exam
    projected = current_readiness + (velocity_weekly / 7.0) * days_to_exam
    projected = max(0.0, min(100.0, projected))
    on_track = projected >= 70.0

    # ── Required velocity to hit 70% by exam day ──
    if days_to_exam > 0:
        gap_to_target = max(0.0, 70.0 - current_readiness)
        required_velocity = (gap_to_target / days_to_exam) * 7.0
    else:
        required_velocity = 0.0

    return {
        "velocity_weekly_pct": round(velocity_weekly, 2),
        "velocity_status": v_status,
        "velocity_label": v_label,
        "velocity_is_sufficient": velocity_sufficient,
        "velocity_floor_required": round(floor_required, 2),
        "days_to_exam": days_to_exam,
        "projected_readiness_at_exam": round(projected, 1),
        "required_velocity_to_target": round(required_velocity, 2),
        "on_track_for_exam": on_track,
        "trend": _snaps_to_trend(snaps),
        "history_points": len(snaps),
        "baseline_date": baseline_date.isoformat(),
        "current_readiness": round(current_readiness, 1),
    }


def _floor_for_readiness(current_readiness: float) -> float:
    """Return required weekly velocity floor given current readiness band."""
    for upper_bound, floor in VELOCITY_FLOOR_BY_READINESS:
        if current_readiness < upper_bound:
            return floor
    return 0.1


def _snaps_to_trend(snaps) -> list[dict]:
    """Convert snapshot rows to lightweight trend points for sparkline."""
    out = []
    for s in snaps:
        snap_date = s["snapshot_date"]
        snap_date = snap_date if isinstance(snap_date, date) else snap_date.date()
        out.append({
            "date": snap_date.isoformat(),
            "readiness": round(float(s["readiness"]), 1),
            "retention": round(float(s["retention"]), 1),
            "coverage": round(float(s["coverage"]), 1),
        })
    return out


# ═══════════════════════════════════════════════════════════════════════════
# CONTEXTUAL VERDICT (combines velocity + readiness + days to exam)
# ═══════════════════════════════════════════════════════════════════════════

def velocity_verdict(velocity_result: dict, readiness_pct: float) -> dict:
    """
    Return a user-facing verdict string + severity, based on:
      - current velocity
      - current readiness
      - projection at exam day

    This is the message your dashboard displays under the velocity widget.
    """
    velocity = velocity_result["velocity_weekly_pct"]
    projected = velocity_result["projected_readiness_at_exam"]
    days = velocity_result["days_to_exam"]
    required = velocity_result["required_velocity_to_target"]
    floor = velocity_result["velocity_floor_required"]
    on_track = velocity_result["on_track_for_exam"]
    status = velocity_result["velocity_status"]

    # ── Exam day in < 14 days: tone shifts to urgent ──
    if days < 14:
        if readiness_pct >= 70:
            return {
                "severity": "success",
                "headline": "Phase finale — consolidation",
                "detail": f"Examen dans {days} jours. Readiness à {readiness_pct:.0f}%. "
                          f"Maintiens ton rythme, évite les nouveaux LMs lourds.",
            }
        elif readiness_pct >= 60:
            return {
                "severity": "warning",
                "headline": "Sprint final nécessaire",
                "detail": f"Examen dans {days} jours. Tu es à {readiness_pct:.0f}%. "
                          f"Focus uniquement sur les blockers. Pas de nouveaux topics.",
            }
        else:
            return {
                "severity": "critical",
                "headline": "Niveau insuffisant à J-{} — reconsidère le timing".format(days),
                "detail": f"Readiness {readiness_pct:.0f}% à {days} jours de l'examen. "
                          f"Le rattrapage complet n'est pas réaliste. Considère un report.",
            }

    # ── Insufficient data ──
    if status == "insufficient_data":
        return {
            "severity": "neutral",
            "headline": "Pas assez d'historique",
            "detail": "La vélocité sera calculée après 3 jours d'utilisation.",
        }

    # ── Declining velocity ──
    if status == "declining":
        return {
            "severity": "critical",
            "headline": f"Régression : {velocity:+.1f}%/semaine",
            "detail": "Ta readiness baisse. L'oubli dépasse l'apprentissage. "
                      "Augmente les sessions de révision sur les LMs vus.",
        }

    # ── Stagnant ──
    if status == "stagnant":
        return {
            "severity": "warning",
            "headline": f"Stagnation : {velocity:+.1f}%/semaine",
            "detail": f"Tu ne progresses quasi pas. Tu devrais être à {floor:.1f}%/semaine "
                      f"pour être prêt à l'examen.",
        }

    # ── Projected not on track ──
    if not on_track and days > 14:
        return {
            "severity": "warning",
            "headline": f"Au rythme actuel : {projected:.0f}% le jour J",
            "detail": f"Il te faut {required:.1f}%/semaine pour atteindre 70% "
                      f"en {days} jours (actuel : {velocity:+.1f}%/semaine).",
        }

    # ── On track, fast pace ──
    if status in ("fast", "exceptional") and on_track:
        return {
            "severity": "success",
            "headline": f"Sur la bonne trajectoire : {velocity:+.1f}%/semaine",
            "detail": f"Projection {projected:.0f}% le jour J. Tu peux maintenir ce rythme.",
        }

    # ── On track, steady ──
    if status == "steady" and on_track:
        return {
            "severity": "success",
            "headline": f"Rythme régulier : {velocity:+.1f}%/semaine",
            "detail": f"Projection {projected:.0f}% le jour J. Continue comme ça.",
        }

    # ── Slow but on track ──
    if status == "slow" and on_track:
        return {
            "severity": "info",
            "headline": f"Rythme lent mais OK : {velocity:+.1f}%/semaine",
            "detail": f"Projection {projected:.0f}% le jour J. Tu passes de justesse. "
                      f"Accélère si possible.",
        }

    # ── Default fallback ──
    return {
        "severity": "neutral",
        "headline": f"Vélocité : {velocity:+.1f}%/semaine",
        "detail": f"Projection {projected:.0f}% le jour J (cible 70%).",
    }


# ═══════════════════════════════════════════════════════════════════════════
# MIGRATION SQL — Add columns needed for velocity computation
# ═══════════════════════════════════════════════════════════════════════════

MIGRATION_SQL = """
-- Run once before enabling velocity metrics.

BEGIN;

ALTER TABLE progress_snapshots
    ADD COLUMN IF NOT EXISTS global_retention_pct NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coverage_pct         NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS exam_readiness_pct   NUMERIC(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_date
    ON progress_snapshots(user_id, snapshot_date DESC);

-- Optional: if user_profiles doesn't already have exam_date:
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS exam_date DATE;

COMMIT;
"""
