"""Tests for app.services.user_metrics.

The point of `user_metrics` is to be the single source of truth for state
that was previously computed inconsistently across routers. So the test
strategy is consistency-focused: the helper must agree with the existing
user-visible endpoint (the Topbar source) for the same user.
"""
import pytest

from tests.conftest import USER_ID


@pytest.mark.asyncio
async def test_compute_streak_matches_kpis_endpoint(client):
    """compute_streak() must equal the value served by /api/kpis/streak.

    If they ever diverge again, this test catches it before the rationale
    text and the Topbar disagree on screen.
    """
    from app.database import async_session
    from app.services.user_metrics import compute_streak

    resp = await client.get("/api/kpis/streak")
    assert resp.status_code == 200
    endpoint_streak = resp.json()["streak"]

    async with async_session() as db:
        helper_streak = await compute_streak(db, USER_ID)

    assert helper_streak == endpoint_streak


@pytest.mark.asyncio
async def test_compute_streak_returns_zero_for_unknown_user():
    from app.database import async_session
    from app.services.user_metrics import compute_streak

    async with async_session() as db:
        s = await compute_streak(db, "00000000-0000-0000-0000-99999999dead")
    assert s == 0
