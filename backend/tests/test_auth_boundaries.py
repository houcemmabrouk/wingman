import pytest

from app.config import settings
from app.routers.auth import create_access_token


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


@pytest.mark.asyncio
async def test_plan_entry_complete_requires_authenticated_user(no_auth_client, monkeypatch):
    monkeypatch.setattr(settings, "auth_disabled", False)

    resp = await no_auth_client.post("/api/plan/entry/1/complete")

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_qcm_check_requires_authenticated_user(no_auth_client, monkeypatch):
    monkeypatch.setattr(settings, "auth_disabled", False)

    resp = await no_auth_client.post("/api/qcm/check", json={"question_id": 1, "answer": "A"})

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_disputes_admin_requires_admin_key(client):
    token = create_access_token("00000000-0000-0000-0000-000000000001")
    resp = await client.get(
        "/api/v1/admin/disputes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_content_manifest_requires_authenticated_user(no_auth_client, monkeypatch):
    monkeypatch.setattr(settings, "auth_disabled", False)

    resp = await no_auth_client.get("/api/content/generated")

    assert resp.status_code == 401
