import pytest

from app.config import settings
from tests.conftest import USER_ID


@pytest.mark.asyncio
async def test_pdf_generation_creates_asset(client):
    """POST /api/content/generate/pdf creates a content asset."""
    resp = await client.post(f"/api/content/generate/pdf?key={settings.admin_secret_key}", json={
        "lm_id": 1,
        "language": "fr",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "asset_id" in data
    assert data["asset_id"] > 0
    assert "storage_key" in data
    assert data["file_size_kb"] >= 0


@pytest.mark.asyncio
async def test_audio_pipeline_produces_file(client):
    """POST /api/content/generate/audio creates an audio asset."""
    resp = await client.post(f"/api/content/generate/audio?key={settings.admin_secret_key}", json={
        "lm_id": 1,
        "language": "fr",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "asset_id" in data
    assert data["asset_id"] > 0
    assert data["duration_sec"] > 0


@pytest.mark.asyncio
async def test_content_library_returns_grouped(client):
    """GET /api/content/library returns assets grouped by LM."""
    # Generate some content first
    await client.post(
        f"/api/content/generate/pdf?key={settings.admin_secret_key}",
        json={"lm_id": 1, "language": "fr"},
    )

    resp = await client.get("/api/content/library")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_content_search(client):
    """POST /api/content/search returns matching results."""
    resp = await client.post("/api/content/search", json={
        "query": "QM",
        "top_k": 3,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
