import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.deps import current_user_id


USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    # Override the auth dep so the test client doesn't have to mint JWTs.
    # The middleware-level check is bypassed because we hand routers the
    # demo user_id directly via FastAPI's dependency_overrides.
    async def _fake_user_id() -> str:
        return USER_ID
    app.dependency_overrides[current_user_id] = _fake_user_id
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(current_user_id, None)


@pytest_asyncio.fixture
async def no_auth_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
