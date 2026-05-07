"""Shared FastAPI dependencies.

`current_user_id` is the authoritative source of identity for any router that
operates on user-scoped data. It reads `request.state.user_id` (set by
`AuthMiddleware` from the Bearer token / session cookie) and refuses the
request when it's missing. Per AUDIT_PACKET.md C1: routers must never accept
`user_id` from the client.
"""
from fastapi import HTTPException, Request


async def current_user_id(request: Request) -> str:
    uid = getattr(request.state, "user_id", None)
    if not isinstance(uid, str) or not uid:
        raise HTTPException(status_code=401, detail="authentication required")
    return uid
