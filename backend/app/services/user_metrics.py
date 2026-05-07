"""Canonical user-state metrics — single source of truth.

This module exists because the same metrics (streak, avg_score, coverage,
etc.) were being computed in multiple routers/services with subtle
divergence (different rounding, different scope, sometimes a stale stored
column). The audit identified ≥7 metrics with that pattern.

Convention: each metric gets ONE function here. Callers must use it instead
of writing ad-hoc SQL. Add new metrics conservatively — if it doesn't
already exist in 2+ places, it probably doesn't belong here yet.

Phase 1 (current): only `compute_streak`. More metrics will be added one PR
at a time as the migration progresses.
"""
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def compute_streak(db: AsyncSession, user_id: str) -> int:
    """Live consecutive-day streak ending today (or yesterday if today blank).

    Mirrors the logic served by `/api/kpis/streak` (the Topbar source) so the
    rationale text, the diagnostic dashboard and the header always agree.

    Returns 0 if the user has no sessions.
    """
    r = await db.execute(
        text(
            """
            SELECT DISTINCT DATE(started_at) AS d
            FROM sessions
            WHERE user_id = :uid
            ORDER BY d DESC
            """
        ),
        {"uid": user_id},
    )
    dates = [row.d for row in r]
    if not dates:
        return 0

    streak = 0
    today = date.today()
    check = today
    for d in dates:
        if d == check or d == check - timedelta(days=1):
            streak += 1
            check = d - timedelta(days=1)
        else:
            break
    return streak
