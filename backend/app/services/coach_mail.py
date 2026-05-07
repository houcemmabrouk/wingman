"""Coach mail — async mail-style exchange between user and Coach.

Phase 1A: pas de table Postgres, stockage Redis (TTL 30 jours). Migration vers
table dédiée en Phase 2 quand le UX est validé.

Format Redis :
  Key   : `coach_mail:{user_id}`         (list, push left)
  Value : JSON `{thread_id, subject, user_body, coach_reply, created_at, read_at}`

Endpoints (router app/routers/coach_mail.py) :
  POST /api/coach/mail/send   — envoie + génère la réponse, retourne le thread
  GET  /api/coach/mail/list   — liste les N derniers threads
  GET  /api/coach/mail/{tid}  — un thread précis
  POST /api/coach/mail/{tid}/read  — marque lu (idempotent)
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import anthropic

from app.config import settings

MODEL       = "claude-sonnet-4-6"
MAX_TOKENS  = 700
REDIS_TTL   = 30 * 24 * 60 * 60   # 30 jours
LIST_LIMIT  = 30                  # nombre max de mails archivés par user


def _redis_key(user_id: str) -> str:
    return f"coach_mail:{user_id}"


async def _get_redis():
    try:
        import redis.asyncio as redis
        r = redis.from_url(settings.redis_url, socket_timeout=2, decode_responses=True)
        await r.ping()
        return r
    except Exception:
        return None


# ── System prompt — réponse format mail ──────────────────────────────

SYSTEM_PROMPT = """\
Tu es Wingman Coach, l'IA d'accompagnement d'un candidat CFA L1.
On te transmet un message du candidat envoyé en format mail. Réponds en
**format mail court** (3-6 phrases, signé "— Coach"), pas en chat.

Voix — les 6 principes Wingman :
1. Concis, structuré.
2. Actionnable : si une question demande un next step, donne-le chiffré.
3. Follow the White Rabbit : aucun gap sans porte de sortie.
4. Solidaire jamais accusateur : "voici comment", jamais "tu devrais".
5. Quantifie l'écart, pas l'échec.
6. Vocabulaire positif. Bannis : *destroy, kill, sniper, "not ready", "critical"*.

Format de la sortie (markdown léger autorisé) :

  Salut [prénom si fourni, sinon rien],

  <corps du mail — 2-4 paragraphes courts>

  — Coach

Pas de liste à puces inutile, pas de "Subject:", pas de blabla introductif.
Réponds en français sauf si le message est en anglais."""


# ── Anthropic call ────────────────────────────────────────────────────

async def _claude_reply(user_body: str, display_name: str | None) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY") or settings.anthropic_api_key
    if not api_key:
        return "_Coach indisponible — clé Anthropic absente côté serveur._\n\n— Coach"

    user_msg_parts: list[str] = []
    if display_name:
        user_msg_parts.append(f"Le candidat s'appelle {display_name}.")
    user_msg_parts.append("Mail du candidat :")
    user_msg_parts.append(user_body.strip())
    full_msg = "\n\n".join(user_msg_parts)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": full_msg}],
        )
    except anthropic.BadRequestError as e:
        msg = getattr(e, "message", str(e))[:200]
        return f"_Coach indisponible — Anthropic API : {msg}_\n\n— Coach"
    except Exception as e:
        return f"_Coach indisponible — {type(e).__name__}_\n\n— Coach"

    return "".join(
        b.text for b in response.content if getattr(b, "type", None) == "text"
    ).strip() or "_(réponse vide)_\n\n— Coach"


# ── Public API ────────────────────────────────────────────────────────

async def send_mail(
    user_id: str,
    subject: str,
    body: str,
    display_name: str | None = None,
) -> dict[str, Any]:
    """Stocke le mail user, génère la réponse coach, archive le thread, retourne le tout."""
    coach_reply = await _claude_reply(body, display_name)

    thread = {
        "thread_id":   uuid.uuid4().hex[:12],
        "subject":     (subject or "").strip()[:140] or "(sans objet)",
        "user_body":   body.strip(),
        "coach_reply": coach_reply,
        "created_at":  datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "read_at":     None,
    }

    redis_client = await _get_redis()
    if redis_client:
        try:
            key = _redis_key(user_id)
            await redis_client.lpush(key, json.dumps(thread, ensure_ascii=False))
            await redis_client.ltrim(key, 0, LIST_LIMIT - 1)
            await redis_client.expire(key, REDIS_TTL)
        except Exception:
            # Redis down → on retourne quand même la réponse, pas de persistance
            pass

    return thread


async def list_threads(user_id: str, limit: int = 20) -> list[dict[str, Any]]:
    redis_client = await _get_redis()
    if not redis_client:
        return []
    try:
        raw = await redis_client.lrange(_redis_key(user_id), 0, max(0, limit - 1))
    except Exception:
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        try:
            out.append(json.loads(item))
        except Exception:
            continue
    return out


async def get_thread(user_id: str, thread_id: str) -> dict[str, Any] | None:
    threads = await list_threads(user_id, limit=LIST_LIMIT)
    for t in threads:
        if t.get("thread_id") == thread_id:
            return t
    return None


async def mark_read(user_id: str, thread_id: str) -> bool:
    """Idempotent : pose `read_at` sur le thread. Réécrit la liste Redis."""
    redis_client = await _get_redis()
    if not redis_client:
        return False
    key = _redis_key(user_id)
    try:
        raw = await redis_client.lrange(key, 0, LIST_LIMIT - 1)
    except Exception:
        return False
    new_items: list[str] = []
    found = False
    for item in raw:
        try:
            t = json.loads(item)
        except Exception:
            new_items.append(item)
            continue
        if t.get("thread_id") == thread_id and not t.get("read_at"):
            t["read_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            found = True
        new_items.append(json.dumps(t, ensure_ascii=False))
    if not found:
        return False
    try:
        # Atomic replace : delete + rpush (lpush would invert order)
        async with redis_client.pipeline(transaction=True) as p:
            p.delete(key)
            for item in new_items:
                p.rpush(key, item)
            p.expire(key, REDIS_TTL)
            await p.execute()
        return True
    except Exception:
        return False


async def count_unread(user_id: str) -> int:
    threads = await list_threads(user_id, limit=LIST_LIMIT)
    return sum(1 for t in threads if not t.get("read_at"))
