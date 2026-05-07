"""Exam Readiness dashboard endpoint.

Aggregates the Ebbinghaus-based retention + coverage metrics computed in
app.services.global_retention and the derived readiness verdict.
"""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import current_user_id
from app.services.global_retention import (
    compute_global_retention,
    assess_readiness,
    compute_half_life_summary,
    compute_velocity,
    assess_velocity_verdict,
    _STATUS_LABELS,
    TARGET_READINESS,
    EXAM_DATE,
)

router = APIRouter(prefix="/api/readiness", tags=["readiness"])

# Allowed values for the ?debug_velocity= QA knob.
DEBUG_VELOCITY_STATES = {"declining", "stagnant", "slow", "steady", "fast", "exceptional", "insufficient_data"}


def _debug_allowed() -> bool:
    """Debug overrides are honored only when explicitly enabled or when auth
    is disabled (dev mode). In prod both flags are False → override ignored."""
    return bool(settings.debug_overrides_enabled or settings.auth_disabled)


def _apply_debug_override(metrics: dict, debug_pct: float) -> dict:
    """Force the main gauge values to `debug_pct` so QA can visit every
    status band (critical / behind / building / approaching / ready /
    excellent) without mutating the DB."""
    pct = max(0.0, min(100.0, float(debug_pct)))
    forced = dict(metrics)
    forced["global_retention_pct"]   = pct
    forced["exam_readiness_pct"]     = pct
    forced["coverage_retention_pct"] = pct
    forced["_debug_override"]        = True
    return forced


# Canonical weekly-pct per debug state — picked so each maps to the right
# status band in `_velocity_status()` and exercises the frontend mapping.
_DEBUG_VELOCITY_PROFILES = {
    "declining":   -1.2,
    "stagnant":     0.1,
    "slow":         0.5,
    "steady":       1.1,
    "fast":         1.9,
    "exceptional": 3.2,
}


def _fabricate_velocity(state: str, current_readiness: float) -> dict:
    """Build a plausible velocity payload for visual QA without touching the DB.

    Produces a 14-point trend whose slope matches `weekly_pct/7`, anchored so
    the last point equals `current_readiness`.
    """
    today = date.today()
    dte = max(0, (EXAM_DATE - today).days)

    if state == "insufficient_data":
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
            "trend":                       [],
            "history_points":              0,
            "current_readiness":           round(current_readiness, 2),
            "baseline_date":               str(today),
            "_debug_override":             True,
        }

    weekly = _DEBUG_VELOCITY_PROFILES[state]
    slope_per_day = weekly / 7.0

    # Build a 14-point trend ending at current_readiness.
    trend = []
    base = today - timedelta(days=13)
    for i in range(14):
        # Value at day i such that day 13 == current_readiness.
        v = current_readiness - slope_per_day * (13 - i)
        v = max(0.0, min(100.0, v))
        trend.append({
            "date":      str(base + timedelta(days=i)),
            "readiness": round(v, 2),
            "retention": round(max(0.0, min(100.0, v + 5)), 2),
            "coverage":  round(max(0.0, min(100.0, 40 + i * 1.5)), 2),
        })

    projected = max(0.0, min(100.0, current_readiness + slope_per_day * dte))
    remaining = max(0.0, TARGET_READINESS - current_readiness)
    weeks_left = max(dte / 7.0, 1e-6)
    required_weekly = remaining / weeks_left
    is_sufficient = weekly + 0.1 >= required_weekly
    on_track = projected >= TARGET_READINESS - 0.5

    return {
        "velocity_weekly_pct":         weekly,
        "velocity_status":             state,
        "velocity_label":              _STATUS_LABELS[state],
        "velocity_is_sufficient":      is_sufficient,
        "velocity_floor_required":     round(required_weekly, 2),
        "days_to_exam":                dte,
        "projected_readiness_at_exam": round(projected, 2),
        "required_velocity_to_target": round(required_weekly, 2),
        "on_track_for_exam":           on_track,
        "trend":                       trend,
        "history_points":              14,
        "current_readiness":           round(current_readiness, 2),
        "baseline_date":               trend[0]["date"],
        "_debug_override":             True,
    }


@router.get("/")
async def get_readiness(
    user_id: str = Depends(current_user_id),
    include_half_life: bool = False,
    debug_pct: Optional[float] = Query(
        None, ge=0, le=100,
        description="Visual-QA only — forces the gauges to this %. Leave unset in production.",
    ),
    debug_velocity: Optional[str] = Query(
        None,
        description="Visual-QA only — forces the velocity badge into a specific state. "
                    "Allowed: declining, stagnant, slow, steady, fast, exceptional, insufficient_data.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Single-call dashboard payload.

    Response shape:
      {
        metrics:          {...},
        readiness:        {...},
        velocity:         {...},
        velocity_verdict: {...},
        half_life?:       {...}  # only when include_half_life=true
      }
    """
    metrics = await compute_global_retention(db, user_id)
    if debug_pct is not None and _debug_allowed():
        metrics = _apply_debug_override(metrics, debug_pct)
    readiness = assess_readiness(metrics)

    # Velocity: debug override (in dev only) beats the real computation.
    if debug_velocity is not None and _debug_allowed() and debug_velocity in DEBUG_VELOCITY_STATES:
        velocity = _fabricate_velocity(debug_velocity, float(metrics.get("exam_readiness_pct") or 0))
    else:
        velocity = await compute_velocity(db, user_id, metrics)

    velocity_verdict = assess_velocity_verdict(velocity)

    out: dict = {
        "metrics":          metrics,
        "readiness":        readiness,
        "velocity":         velocity,
        "velocity_verdict": velocity_verdict,
    }
    if include_half_life:
        out["half_life"] = await compute_half_life_summary(db, user_id)
    return out
