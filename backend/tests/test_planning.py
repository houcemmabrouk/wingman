import pytest
from datetime import date, timedelta

from tests.conftest import USER_ID


@pytest.mark.asyncio
async def test_generate_plan_creates_entries(client):
    """POST /api/plan/generate creates plan entries covering days until exam."""
    exam_date = (date.today() + timedelta(days=30)).isoformat()
    resp = await client.post("/api/plan/generate", json={
        "user_id": USER_ID,
        "exam_date": exam_date,
        "daily_hours": 2.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_id"] > 0
    assert data["total_entries"] > 0
    assert data["exam_date"] == exam_date
    assert len(data["entries"]) == data["total_entries"]


@pytest.mark.asyncio
async def test_recalibrate_reinjects_lm(client):
    """POST /api/plan/recalibrate with score=45 injects LM into upcoming days."""
    # First generate a plan
    exam_date = (date.today() + timedelta(days=30)).isoformat()
    await client.post("/api/plan/generate", json={
        "user_id": USER_ID,
        "exam_date": exam_date,
        "daily_hours": 2.0,
    })

    # Recalibrate with low score
    resp = await client.post("/api/plan/recalibrate", json={
        "user_id": USER_ID,
        "lm_id": 1,
        "score_pct": 45.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "recalibrated"
    assert "injected_date" in data


@pytest.mark.asyncio
async def test_plan_today_returns_tasks(client):
    """GET /api/plan/today returns today's plan entries."""
    resp = await client.get(f"/api/plan/today?user_id={USER_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
