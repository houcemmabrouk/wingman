"""Inbox aggregator — unified NBA Inbox stream.

Pulls 6 sources into a single `InboxItem` shape and applies user-level
read/dismissed state from the `inbox_state` table.

Sources:
    1. NBA actions  — top LOSes from los_mastery_rolling (excluding hero LOS)
    2. Alerts       — alerts table (unread)
    3. Disputes     — question_disputes (last 7 days)
    4. Coach        — placeholder (out of MVP scope; rules-based, no LLM)
    5. Plan         — plan_entries scheduled today, not yet completed
    6. SRS          — srs_queue cards due now, grouped by LM

Mutations:
    - mark_read(item_key)  — idempotent, sets read_at on inbox_state
    - dismiss(item_key)    — idempotent, sets dismissed_at on inbox_state

Sort: urgent → unread → chronological (most recent first).
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ── Helpers ────────────────────────────────────────────────────

def _human_time(when) -> str:
    """Human-readable relative time: '12 min', '2h', 'hier', '3j'."""
    if when is None:
        return ""
    if isinstance(when, datetime):
        ref = when
    elif isinstance(when, date):
        ref = datetime(when.year, when.month, when.day, tzinfo=timezone.utc)
    else:
        return ""
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=timezone.utc)
    secs = int((datetime.now(timezone.utc) - ref).total_seconds())
    if secs < 60:
        return "à l'instant"
    if secs < 3600:
        return f"{secs // 60} min"
    if secs < 86400:
        return f"{secs // 3600}h"
    days = secs // 86400
    return "hier" if days == 1 else f"{days}j"


def _ts(when) -> int:
    """ISO datetime → epoch seconds, defaulting to 0 if falsy."""
    if isinstance(when, datetime):
        ref = when if when.tzinfo else when.replace(tzinfo=timezone.utc)
        return int(ref.timestamp())
    if isinstance(when, date):
        ref = datetime(when.year, when.month, when.day, tzinfo=timezone.utc)
        return int(ref.timestamp())
    return 0


# ── Public API ────────────────────────────────────────────────

async def aggregate_inbox(
    db: AsyncSession,
    user_id: str,
    *,
    exclude_hero_los: Optional[str] = None,
) -> dict:
    """Build the unified inbox response for `GET /api/v1/inbox`."""
    items: list[dict] = []
    items.extend(await _actions_items(db, user_id, exclude_hero_los))
    items.extend(await _alerts_items(db, user_id))
    items.extend(await _disputes_items(db, user_id))
    # _plan_items() retiré: faisait doublon avec _coach_daily_check_in qui lit
    # la même cache planning_skill (donnée réelle de la Today Mission UI).
    items.extend(await _srs_items(db, user_id))
    items.extend(await _coach_items(db, user_id))

    # Apply per-user state from inbox_state (read / dismissed)
    state_rows = await db.execute(text("""
        SELECT item_key,
               read_at      IS NOT NULL AS is_read,
               dismissed_at IS NOT NULL AS is_dismissed
        FROM inbox_state WHERE user_id = :uid
    """), {"uid": user_id})
    state_map = {r["item_key"]: dict(r) for r in state_rows.mappings()}

    visible: list[dict] = []
    for it in items:
        st = state_map.get(it["item_key"])
        if st and st["is_dismissed"]:
            continue
        it["unread"] = not (st and st["is_read"])
        visible.append(it)

    # Sort: urgent first, then strict chronological DESC by entry date.
    # (User feedback 2026-05-06: the previous "unread tier" before chrono was
    # confusing — same-day reads dropped under week-old unreads.)
    visible.sort(key=lambda i: (
        not i.get("urgent", False),
        -i.get("_ts_secs", 0),
    ))

    unread_count = sum(1 for i in visible if i["unread"])

    # Promote internal _ts_secs to a public ISO timestamp the frontend can render.
    for i in visible:
        ts = i.pop("_ts_secs", 0)
        if ts:
            i["entry_at_iso"] = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            i["entry_at_iso"] = None

    return {
        "items": visible,
        "total": len(visible),
        "unread_count": unread_count,
    }


async def count_unread(db: AsyncSession, user_id: str) -> int:
    """Lightweight count for sidebar badge polling."""
    result = await aggregate_inbox(db, user_id)
    return result["unread_count"]


async def mark_read(db: AsyncSession, user_id: str, item_key: str) -> None:
    """Idempotent: sets read_at = now() if not already set."""
    await db.execute(text("""
        INSERT INTO inbox_state (user_id, item_key, read_at)
        VALUES (:uid, :key, now())
        ON CONFLICT (user_id, item_key)
        DO UPDATE SET read_at = COALESCE(inbox_state.read_at, EXCLUDED.read_at)
    """), {"uid": user_id, "key": item_key})
    await db.commit()


async def dismiss(db: AsyncSession, user_id: str, item_key: str) -> None:
    """Idempotent: sets dismissed_at = now() if not already set."""
    await db.execute(text("""
        INSERT INTO inbox_state (user_id, item_key, dismissed_at)
        VALUES (:uid, :key, now())
        ON CONFLICT (user_id, item_key)
        DO UPDATE SET dismissed_at = COALESCE(inbox_state.dismissed_at, EXCLUDED.dismissed_at)
    """), {"uid": user_id, "key": item_key})
    await db.commit()


# ── Sources ───────────────────────────────────────────────────

async def _actions_items(db, user_id, exclude_hero_los) -> list[dict]:
    """NBA actions = top urgent LOSes (slot B-F equivalent), excluding hero."""
    rows = await db.execute(text("""
        SELECT
            lmr.topic_code, lmr.module_code, lmr.module_title,
            lmr.los_code, lmr.los_description,
            lmr.effective_mastery_pct, lmr.weight_pct, lmr.urgency_score
        FROM los_mastery_rolling lmr
        WHERE lmr.user_id = :uid
        ORDER BY lmr.urgency_score DESC NULLS LAST
        LIMIT 8
    """), {"uid": user_id})
    out: list[dict] = []
    now_ts = int(datetime.now(timezone.utc).timestamp())
    for r in rows.mappings():
        if exclude_hero_los and r["los_code"] == exclude_hero_los:
            continue
        if len(out) >= 4:
            break
        urgency = float(r["urgency_score"] or 0)
        out.append({
            "item_key": f"action:{r['los_code']}",
            "category": "action",
            "icon":     "🎯",
            "from":     f"NBA · {r['module_code']}",
            "title":    (r["los_description"] or r["los_code"])[:140],
            "preview":  (
                f"Mastery {float(r['effective_mastery_pct'] or 0):.0f}% · "
                f"weight {float(r['weight_pct'] or 0):.0f}% · "
                f"urgency {urgency:.0f}"
            ),
            "meta":     [],
            "cta_url":  f"/sessions?mode=reinforce&module={r['module_code']}",
            "time":     "prêt",
            "unread":   True,
            "urgent":   urgency >= 100,
            "_ts_secs": now_ts,
        })
    return out


async def _alerts_items(db, user_id) -> list[dict]:
    rows = await db.execute(text("""
        SELECT id, alert_type, title, body, created_at
        FROM alerts
        WHERE user_id = :uid AND is_read = false
        ORDER BY created_at DESC LIMIT 10
    """), {"uid": user_id})
    out: list[dict] = []
    for r in rows.mappings():
        atype = (r["alert_type"] or "alert").lower()
        is_streak = atype.startswith("streak")
        out.append({
            "item_key": f"alert:{r['id']}",
            "category": "alert",
            "icon":     "🔔" if is_streak else "⚠️",
            "from":     atype.replace("_", " ").title(),
            "title":    r["title"] or "Alert",
            "preview":  (r["body"] or "")[:200],
            "meta":     [],
            "cta_url":  "/sessions?mode=audio",
            "time":     _human_time(r["created_at"]),
            "unread":   True,
            "urgent":   is_streak or "critical" in atype,
            "_ts_secs": _ts(r["created_at"]),
        })
    return out


async def _disputes_items(db, user_id) -> list[dict]:
    rows = await db.execute(text("""
        SELECT d.id, d.question_id, d.status, d.arbiter_verdict,
               d.mastery_bonus_pct, d.created_at,
               lm.code AS lm_code
        FROM question_disputes d
        JOIN questions        q  ON q.id  = d.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        WHERE d.user_id = :uid
          AND d.created_at >= NOW() - INTERVAL '7 days'
        ORDER BY d.created_at DESC LIMIT 5
    """), {"uid": user_id})
    out: list[dict] = []
    for r in rows.mappings():
        upheld = r["status"] == "upheld"
        bonus = float(r["mastery_bonus_pct"] or 0)
        out.append({
            "item_key": f"dispute:Q{r['question_id']}",
            "category": "dispute",
            "icon":     "⚖",
            "from":     "Dispute Arbiter",
            "title":    f"Q{r['question_id']} ({r['lm_code']}) — " + (
                "résolu en ta faveur" if upheld else f"status: {r['status']}"
            ),
            "preview":  (
                f"+{bonus:.0f}% mastery bonus" if upheld and bonus > 0
                else f"Verdict arbiter: {r['arbiter_verdict'] or r['status']}"
            ),
            "meta":     [],
            "cta_url":  f"/error-log?question={r['question_id']}",
            "time":     _human_time(r["created_at"]),
            "unread":   True,
            "urgent":   False,
            "_ts_secs": _ts(r["created_at"]),
        })
    return out


async def _plan_items(db, user_id) -> list[dict]:
    rows = await db.execute(text("""
        SELECT pe.id, pe.scheduled_date, pe.status,
               lm.code AS module_code, lm.title AS module_title
        FROM plan_entries pe
        JOIN study_plans     sp ON sp.id = pe.plan_id
        JOIN learning_modules lm ON lm.id = pe.module_id
        WHERE sp.user_id = :uid
          AND pe.scheduled_date = CURRENT_DATE
          AND pe.status IN ('pending', 'in_progress')
        ORDER BY lm.sort_order LIMIT 3
    """), {"uid": user_id})
    out: list[dict] = []
    for r in rows.mappings():
        out.append({
            "item_key": f"plan:{r['id']}",
            "category": "plan",
            "icon":     "📅",
            "from":     "Plan du jour",
            "title":    f"{r['module_code']} · {r['module_title']}",
            "preview":  f"Bloc planifié pour aujourd'hui · status {r['status']}",
            "meta":     [],
            "cta_url":  f"/sessions?mode=full_topic&module={r['module_code']}",
            "time":     "aujourd'hui",
            "unread":   True,
            "urgent":   False,
            "_ts_secs": _ts(r["scheduled_date"]),
        })
    return out


async def _coach_items(db, user_id) -> list[dict]:
    """Coach proactive messages — deterministic templates, NO LLM (sauf weekly digest).

    Spec: see `coach_communication.md` § 4-5. Templates respect the 6 voice
    principles. Slots implemented:
        1. Daily check-in   — fires once per day if a plan_entry exists today
        2. Streak guard     — fires if last session > 24h AND streak >= 3 (urgent)
        3. Weekly digest    — bilan hebdomadaire (spec claude_weekly_digest.md § 3.330)
        4. Mail replies     — réponses Claude aux mails envoyés via /api/coach/mail/send
    Slots reserved for next cuts:
        5. Win recognition  — needs mastery delta tracking
        6. Schedule drift   — weekly, needs velocity verdict
    """
    out: list[dict] = []
    today = date.today().isoformat()
    out.extend(await _coach_daily_check_in(db, user_id, today))
    out.extend(await _coach_streak_guard(db, user_id, today))
    out.extend(await _coach_weekly_digest(db, user_id))
    out.extend(await _coach_mail_replies(user_id))
    return out


async def _coach_mail_replies(user_id) -> list[dict]:
    """Surface les threads coach mail (Redis-backed, voir services/coach_mail.py).

    Chaque thread = 1 item inbox catégorie 'coach', icone 📬. CTA pointe sur
    /inbox?thread=<id> (la modal du thread peut s'ouvrir au clic — Phase 2).
    """
    from app.services.coach_mail import list_threads
    threads = await list_threads(user_id, limit=10)
    out: list[dict] = []
    for t in threads:
        created_at = t.get("created_at") or ""
        try:
            ref = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except Exception:
            ref = datetime.now(timezone.utc)
        if ref.tzinfo is None:
            ref = ref.replace(tzinfo=timezone.utc)
        # Snippet : 1ère phrase utile du coach (sans la salutation "Salut …,")
        reply = (t.get("coach_reply") or "").strip()
        snippet = reply
        if reply.lower().startswith("salut"):
            parts = reply.split("\n\n", 1)
            snippet = parts[1] if len(parts) > 1 else reply
        snippet = snippet.replace("\n", " ").strip()[:200]

        thread_id = t.get("thread_id") or "?"
        is_read = bool(t.get("read_at"))
        out.append({
            "item_key": f"coach:mail:{thread_id}",
            "category": "coach",
            "icon":     "📬",
            "from":     "Wingman Coach",
            "title":    t.get("subject") or "(sans objet)",
            "preview":  snippet,
            "meta":     [],
            "cta_url":  f"/inbox?thread={thread_id}",
            "time":     _human_time(ref),
            "unread":   not is_read,
            "urgent":   False,
            "_ts_secs": _ts(ref),
        })
    return out


async def _coach_weekly_digest(db, user_id) -> list[dict]:
    """Weekly digest — surfaced as Coach mail si déjà généré ET caché en Redis.

    Phase 1B (mail-mailbox semantics, 2026-05-06) : le digest n'est PAS regénéré
    à chaque vue. Il est généré une fois par (user, iso_week), caché en Redis,
    et seul le cache est consommé par l'inbox. Item disparaît si pas encore
    généré pour cette semaine — la génération est déclenchée par le user via
    `GET /api/v1/digest/current` (qui devient idempotent par semaine).

    Spec: claude_weekly_digest.md § 3.330.
    """
    from app.services.weekly_digest import current_iso_year_week, get_cached
    iso_week = current_iso_year_week()
    cached = await get_cached(user_id, iso_week)
    if not cached:
        return []  # Pas encore généré → pas d'item (mail pas encore reçu)

    # Snippet à partir du markdown : on extrait la ligne après "## Le verdict"
    md = cached.get("content_md") or ""
    snippet = ""
    for marker in ("## Le verdict", "## Verdict", "## "):
        idx = md.find(marker)
        if idx >= 0:
            after = md[idx + len(marker):].strip().split("\n\n", 1)[0].split("\n", 1)[0]
            snippet = after.strip().lstrip(":").strip()
            break
    if not snippet:
        # Fallback : 1ère ligne non-vide non-titre
        for line in md.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                snippet = line
                break
    snippet = snippet.replace("**", "").strip()[:200]

    generated_at = cached.get("generated_at") or ""
    try:
        ref = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
    except Exception:
        ref = datetime.now(timezone.utc)
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=timezone.utc)

    return [{
        "item_key": f"coach:digest:{iso_week}",
        "category": "coach",
        "icon":     "📬",
        "from":     "Wingman Coach",
        "title":    f"Ton bilan de la semaine {iso_week}",
        "preview":  snippet or "Verdict chiffré, wins, points d'attention et plan pour la semaine prochaine.",
        "meta":     [],
        "cta_url":  f"/digest?week={iso_week}",
        "time":     _human_time(ref),
        "unread":   True,
        "urgent":   False,
        "_ts_secs": _ts(ref),
    }]


async def _coach_daily_check_in(db, user_id, today_iso: str) -> list[dict]:
    """Today's smart session plan (planning_skill output), framed in coach voice.

    Source: Redis cache `planning:state:{MATRIX_VERSION}:{user_id}` (warmed by
    `/api/plan/state`, which the homepage hits on load). Read-only — we do NOT
    trigger generation from inside the /inbox poll loop (cost discipline).
    Falls back silently to no item if cache is cold; next user visit to / warms
    it and the slot activates on the next inbox fetch.
    """
    import json
    from app.services.planning_skill import _get_redis, _cache_key, _coach_key  # type: ignore[reportPrivateUsage]

    redis_client = await _get_redis()
    if not redis_client:
        return []
    raw = await redis_client.get(_coach_key(user_id)) or await redis_client.get(_cache_key(user_id))
    if not raw:
        return []

    try:
        dto = json.loads(raw)
    except Exception:
        return []
    blocks = dto.get("today_blocks") or []
    if not blocks:
        return []

    first = blocks[0]
    total_minutes = sum(int(b.get("minutes") or 0) for b in blocks)
    n_blocks      = len(blocks)
    first_lm      = first.get("lm_code") or "?"
    first_activity = first.get("activity") or "première étape"

    # Pull LM title from DB for a warmer preview
    lm_title_row = await db.execute(
        text("SELECT title FROM learning_modules WHERE code = :code"),
        {"code": first_lm},
    )
    first_lm_title = lm_title_row.scalar() or first_lm

    return [{
        "item_key": f"coach:daily:{today_iso}",
        "category": "coach",
        "icon":     "💬",
        "from":     "Wingman Coach",
        "title":    f"Plan du jour : {total_minutes} min, {n_blocks} blocs",
        "preview":  f"On commence par {first_lm} — {first_activity} ({first.get('minutes', '?')} min) sur {first_lm_title} ?",
        "meta":     [],
        "cta_url":  f"/sessions?mode=full_topic&module={first_lm}",
        "time":     "aujourd'hui",
        "unread":   True,
        "urgent":   False,
        "_ts_secs": int(datetime.now(timezone.utc).timestamp()),
    }]


async def _coach_streak_guard(db, user_id, today_iso: str) -> list[dict]:
    """Fires if last session > 24h AND live streak >= 3."""
    from app.services.user_metrics import compute_streak
    row = await db.execute(text("""
        SELECT
            up.streak_current,
            (SELECT MAX(s.started_at) FROM sessions s WHERE s.user_id = :uid) AS last_session_at
        FROM user_profiles up WHERE up.user_id = :uid
    """), {"uid": user_id})
    r = row.mappings().first()
    if not r or not r["last_session_at"]:
        return []
    streak = await compute_streak(db, user_id)
    if streak < 3:
        return []
    last = r["last_session_at"]
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    hours_since = int((datetime.now(timezone.utc) - last).total_seconds() // 3600)
    if hours_since < 24:
        return []
    return [{
        "item_key": f"coach:streak_guard:{today_iso}",
        "category": "coach",
        "icon":     "💬",
        "from":     "Wingman Coach",
        "title":    f"Ta série de {streak} jours est en jeu",
        "preview":  f"{hours_since}h sans session — 15 min suffisent à la sauver.",
        "meta":     [],
        "cta_url":  "/sessions?mode=audio",
        "time":     f"{hours_since}h",
        "unread":   True,
        "urgent":   True,
        "_ts_secs": int(datetime.now(timezone.utc).timestamp()),
    }]


async def _srs_items(db, user_id) -> list[dict]:
    rows = await db.execute(text("""
        SELECT lm.code AS lm_code, lm.title AS lm_title,
               COUNT(*) AS due_count, MAX(sq.next_review) AS latest
        FROM srs_queue sq
        JOIN learning_modules lm ON lm.id = sq.card_id
        WHERE sq.user_id = :uid
          AND sq.card_type = 'question'
          AND sq.next_review <= NOW()
        GROUP BY lm.code, lm.title
        ORDER BY MAX(sq.next_review) DESC LIMIT 3
    """), {"uid": user_id})
    out: list[dict] = []
    for r in rows.mappings():
        cnt = int(r["due_count"])
        out.append({
            "item_key": f"srs:{r['lm_code']}",
            "category": "srs",
            "icon":     "🧠",
            "from":     "SRS — Memory",
            "title":    f"{cnt} cartes {r['lm_code']} arrivent à échéance",
            "preview":  f"{r['lm_title']} : refresh ~{cnt * 30}s pour éviter le décrochage retention.",
            "meta":     [],
            "cta_url":  f"/memory?lm={r['lm_code']}",
            "time":     _human_time(r["latest"]),
            "unread":   True,
            "urgent":   False,
            "_ts_secs": _ts(r["latest"]),
        })
    return out
