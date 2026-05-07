"""Lightweight Redis-backed job tracker for long-running content jobs.

Stores a JSON blob at `wingman:job:<id>` with a 1-hour TTL.
Used by /generate-all to expose progress to the frontend via polling.
"""
from __future__ import annotations

import json
import time
import uuid
from typing import Any, Optional

from app.config import settings

JOB_TTL_SEC = 3600  # 1h — long enough for the user to come back after a restart
KEY_PREFIX = "wingman:job:"

# Module-level cached client. Each `update()` was previously opening + closing a
# fresh connection; a single content-generation job calls update() hundreds of
# times (17 assets + per-chunk streaming) and one slow TCP handshake to Redis
# was enough to kill the whole job with `TimeoutError: Timeout connecting to
# server`. We now reuse one client (which pools connections internally) and
# give the timeouts more headroom.
_redis_client = None


async def _client():
    global _redis_client
    if _redis_client is None:
        import redis.asyncio as redis
        _redis_client = redis.from_url(
            settings.redis_url,
            socket_timeout=10,
            socket_connect_timeout=10,
            decode_responses=True,
        )
    return _redis_client


def new_job_id() -> str:
    return uuid.uuid4().hex[:16]


async def create(job_id: str, total_steps: int, label: str = "") -> dict:
    state = {
        "job_id": job_id,
        "status": "running",
        "phase": "starting",
        "step": 0,
        "total_steps": total_steps,
        "label": label,
        "sub_message": "",
        "sub_pct": 0,
        "started_at": int(time.time()),
        "updated_at": int(time.time()),
    }
    r = await _client()
    await r.set(KEY_PREFIX + job_id, json.dumps(state), ex=JOB_TTL_SEC)
    return state


async def get(job_id: str) -> Optional[dict]:
    r = await _client()
    raw = await r.get(KEY_PREFIX + job_id)
    return json.loads(raw) if raw else None


async def update(job_id: str, **fields: Any) -> Optional[dict]:
    r = await _client()
    raw = await r.get(KEY_PREFIX + job_id)
    if not raw:
        return None
    state = json.loads(raw)
    state.update(fields)
    state["updated_at"] = int(time.time())
    await r.set(KEY_PREFIX + job_id, json.dumps(state), ex=JOB_TTL_SEC)
    return state
