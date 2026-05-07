import pytest

from app.config import settings


@pytest.mark.asyncio
async def test_v1_daily_brief_requires_authenticated_user(no_auth_client, monkeypatch):
    monkeypatch.setattr(settings, "auth_disabled", False)

    resp = await no_auth_client.get("/api/v1/daily-brief")

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_ai_chat_requires_authenticated_user(no_auth_client, monkeypatch):
    monkeypatch.setattr(settings, "auth_disabled", False)

    resp = await no_auth_client.post("/api/ai/chat", json={"message": "hello", "history": []})

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_question_crud_requires_admin_key(client):
    resp = await client.get("/api/admin/questions")

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_error_log_listing_requires_admin_key(client):
    resp = await client.get("/api/errors?limit=10")

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_content_generation_requires_admin_key(client):
    resp = await client.post("/api/content/generate/pdf", json={"lm_id": 1, "language": "fr"})

    assert resp.status_code == 403
