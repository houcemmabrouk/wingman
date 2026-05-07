import pytest

from tests.conftest import USER_ID


@pytest.mark.asyncio
async def test_record_session_updates_mastery(client):
    """POST /api/session/record creates session and updates mastery."""
    resp = await client.post("/api/session/record", json={
        "user_id": USER_ID,
        "lm_id": 1,
        "session_type": "study",
        "score_pct": 75.0,
        "questions_total": 10,
        "questions_correct": 7,
        "duration_sec": 600,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert data["mastery_level"] in ("weak", "adequate", "strong")


@pytest.mark.asyncio
async def test_export_csv_valid_format(client):
    """GET /api/performance/export returns CSV with correct headers."""
    # Record a session first
    await client.post("/api/session/record", json={
        "user_id": USER_ID, "lm_id": 1, "session_type": "study",
        "score_pct": 80.0, "questions_total": 10, "questions_correct": 8, "duration_sec": 500,
    })

    resp = await client.get(f"/api/performance/export?user_id={USER_ID}")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    lines = resp.text.strip().splitlines()
    assert lines[0].strip() == "date,lm_code,lm_title,score_pct,session_type,duration_sec"
    assert len(lines) >= 2


@pytest.mark.asyncio
async def test_performance_curve_returns_data(client):
    """GET /api/performance/curve returns date-grouped scores."""
    resp = await client.get(f"/api/performance/curve?user_id={USER_ID}&days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
