"""Weekly Digest — Phase 1B (Redis-cached, mail-mailbox semantics).

Spec: claude_weekly_digest.md (repo root). Phase 1B scope:
  - Build a real payload for the current ISO week (current vs previous)
  - Call claude-sonnet-4-6 ONCE per (user, iso_week) — cached in Redis
  - Subsequent reads return the cached digest as-is, like a real mailbox

Phase 2 (later): Postgres table `weekly_digests` + login trigger + banner + badge.
"""
from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any

import anthropic
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.velocity import compute_velocity
from app.services.nba_service import NBAService

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2200  # ~600-900 mots cible (1 mot ≈ 1.3 tokens FR)
REDIS_TTL  = 90 * 24 * 60 * 60   # 90 jours — assez large pour relire des digests passés


def _digest_key(user_id: str, iso_week: str) -> str:
    return f"weekly_digest:{user_id}:{iso_week}"


async def _get_redis():
    try:
        import redis.asyncio as redis
        r = redis.from_url(settings.redis_url, socket_timeout=2, decode_responses=True)
        await r.ping()
        return r
    except Exception:
        return None


# ── ISO week helpers ────────────────────────────────────────────────

def current_iso_year_week(today: date | None = None) -> str:
    today = today or date.today()
    iso = today.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def previous_iso_year_week(today: date | None = None) -> str:
    today = today or date.today()
    last_week = today - timedelta(days=7)
    iso = last_week.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _week_bounds(week_offset_days: int = 0) -> tuple[date, date]:
    """Returns (start_monday, end_sunday) for the ISO week containing today - offset."""
    ref = date.today() - timedelta(days=week_offset_days)
    monday = ref - timedelta(days=ref.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


# ── Payload builder ─────────────────────────────────────────────────

async def _engagement_window(db: AsyncSession, user_id: str, start: date, end: date) -> dict:
    r = await db.execute(text("""
        SELECT
          COUNT(*)                                                       AS sessions,
          COALESCE(SUM(duration_sec), 0) / 60                            AS study_minutes,
          COUNT(DISTINCT DATE(started_at))                               AS active_days
        FROM sessions
        WHERE user_id = :uid
          AND started_at >= :start
          AND started_at <  :end_excl
    """), {"uid": user_id, "start": start, "end_excl": end + timedelta(days=1)})
    row = r.first()
    return {
        "sessions":       int(row.sessions or 0) if row else 0,
        "study_minutes":  int(row.study_minutes or 0) if row else 0,
        "active_days":    int(row.active_days or 0) if row else 0,
    }


async def _performance_window(db: AsyncSession, user_id: str, start: date, end: date) -> dict:
    r = await db.execute(text("""
        SELECT
          COUNT(*)                                                AS attempts,
          SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)             AS correct,
          AVG(CASE WHEN confidence IS NOT NULL THEN confidence END)::float AS avg_conf,
          AVG(CASE WHEN time_spent_sec IS NOT NULL AND time_spent_sec BETWEEN 1 AND 600
                   THEN time_spent_sec END)::float                AS avg_time
        FROM question_attempts
        WHERE user_id = :uid
          AND created_at >= :start
          AND created_at <  :end_excl
    """), {"uid": user_id, "start": start, "end_excl": end + timedelta(days=1)})
    row = r.first()
    attempts = int(row.attempts or 0) if row else 0
    correct = int(row.correct or 0) if row else 0
    return {
        "attempts":       attempts,
        "correct":        correct,
        "score_pct":      round(100.0 * correct / attempts, 1) if attempts else 0.0,
        "avg_confidence": round(float(row.avg_conf or 0), 2) if row else 0.0,
        "avg_time_sec":   int(row.avg_time or 0) if row else 0,
    }


async def _user_block(db: AsyncSession, user_id: str) -> dict:
    r = await db.execute(text("""
        SELECT
          COALESCE(u.display_name, '')        AS display_name,
          COALESCE(p.language, 'fr')          AS language,
          p.exam_date                         AS exam_date,
          COALESCE(p.daily_minutes_goal, 90)  AS daily_goal
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = :uid
    """), {"uid": user_id})
    row = r.first()
    if not row:
        return {
            "user_id": user_id, "display_name": "", "language": "fr",
            "exam_date": None, "days_until_exam": None, "daily_minutes_goal": 90,
            "iso_year_week": current_iso_year_week(),
        }
    days_until = (row.exam_date - date.today()).days if row.exam_date else None
    return {
        "user_id": user_id,
        "display_name": row.display_name or "",
        "language": row.language,
        "exam_date": row.exam_date.isoformat() if row.exam_date else None,
        "days_until_exam": days_until,
        "daily_minutes_goal": int(row.daily_goal),
        "iso_year_week": current_iso_year_week(),
    }


async def _topics_block(db: AsyncSession, user_id: str) -> list[dict]:
    """Top 10 topics with mastery delta current vs previous week.

    Pragmatic version: pulls aggregated per-topic mastery. No per-LM list to keep
    payload small. If topic_progress table doesn't exist, returns empty list.
    """
    try:
        r = await db.execute(text("""
            SELECT
              topic_code,
              topic_name,
              weight_pct,
              mastery_pct
            FROM topic_progress_view
            WHERE user_id = :uid
            ORDER BY weight_pct DESC NULLS LAST
            LIMIT 10
        """), {"uid": user_id})
        return [
            {
                "topic_code": r0.topic_code,
                "topic_name": r0.topic_name,
                "weight_pct": float(r0.weight_pct or 0),
                "mastery_pct": {"current": float(r0.mastery_pct or 0), "previous": None, "delta": None},
            }
            for r0 in r.all()
        ]
    except Exception:
        return []


async def _streak(db: AsyncSession, user_id: str) -> dict:
    """Current consecutive-day streak ending today (best-effort, returns 0 on schema mismatch)."""
    try:
        r = await db.execute(text("""
            WITH days AS (
              SELECT DISTINCT DATE(started_at) AS d
              FROM sessions
              WHERE user_id = :uid AND started_at >= NOW() - INTERVAL '60 days'
              ORDER BY d DESC
            )
            SELECT array_agg(d ORDER BY d DESC) AS days FROM days
        """), {"uid": user_id})
        row = r.first()
        days = row.days if row and row.days else []
        streak = 0
        cursor = date.today()
        for d in days:
            if d == cursor:
                streak += 1
                cursor -= timedelta(days=1)
            elif d == cursor - timedelta(days=1) and streak == 0:
                # Yesterday counts if today not yet active (preserves momentum)
                streak += 1
                cursor = d - timedelta(days=1)
            else:
                break
        return {"streak_current": streak, "streak_max": streak}
    except Exception:
        return {"streak_current": 0, "streak_max": 0}


async def build_payload(db: AsyncSession, user_id: str) -> dict[str, Any]:
    """Builds the JSON payload sent to Claude. Aligned with claude_weekly_digest.md § 1."""
    cur_start, cur_end   = _week_bounds(0)
    prev_start, prev_end = _week_bounds(7)

    user_block = await _user_block(db, user_id)

    eng_cur  = await _engagement_window(db, user_id, cur_start, cur_end)
    eng_prev = await _engagement_window(db, user_id, prev_start, prev_end)
    streak   = await _streak(db, user_id)

    perf_cur  = await _performance_window(db, user_id, cur_start, cur_end)
    perf_prev = await _performance_window(db, user_id, prev_start, prev_end)

    # Velocity (existing service, returns trend + projection)
    try:
        vel = await compute_velocity(db, user_id)
    except Exception:
        vel = {}

    # NBA top action (Phase 1: just top-1 to keep payload small)
    try:
        nba = await NBAService.get_emergency_action(db, user_id)
        nba_top = [{
            "lm": nba.get("lm"),
            "los": nba.get("los"),
            "priority": nba.get("priority"),
            "urgency_score": nba.get("urgency_score"),
            "action_text": nba.get("action_text"),
            "module_title": nba.get("module_title"),
        }] if nba and nba.get("lm") else []
    except Exception:
        nba_top = []

    topics = await _topics_block(db, user_id)

    return {
        "user": user_block,
        "engagement": {
            "current_week":  eng_cur,
            "previous_week": eng_prev,
            **streak,
        },
        "performance": {
            "current_week":  perf_cur,
            "previous_week": perf_prev,
        },
        "velocity": {
            "weekly_pct":              vel.get("velocity_weekly_pct"),
            "status":                  vel.get("velocity_status"),
            "label":                   vel.get("velocity_label"),
            "is_sufficient":           vel.get("velocity_is_sufficient"),
            "floor_required":          vel.get("velocity_floor_required"),
            "projected_at_exam":       vel.get("projected_readiness_at_exam"),
            "required_to_target":      vel.get("required_velocity_to_target"),
            "on_track_for_exam":       vel.get("on_track_for_exam"),
        },
        "readiness": {
            "current": vel.get("current_readiness"),
        },
        "topics": topics,
        "nba_top": nba_top,
        # Reserved for Phase 2 (kept here so Claude's prompt schema stays aligned):
        "weaknesses":   None,
        "plan":         None,
        "memory_srs":   None,
        "disputes":     None,
        "study_pattern": None,
        "alerts":       None,
        "external_resources": None,
    }


# ── System prompt ───────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Tu rédiges le digest hebdomadaire de Wingman pour ce candidat CFA L1.

Format : email FR (sauf si user.language='en'), 600-900 mots, 9 sections dans \
l'ordre fixé : Subject · Greeting · Verdict · Wins · Attention · Commentaire \
& avis · Plan stratégique semaine · Top3 actions · Projection & cadence. \
Markdown léger autorisé (## titres, **gras**, listes à puces, > citations).

Structure stricte de la sortie :
  ## Subject : <ligne courte ≤ 60 chars>

  <salutation 1 phrase>

  ## Le verdict
  <1-2 phrases avec la métrique principale chiffrée>

  ## Ce qui m'a plu cette semaine
  - …

  ## Ce sur quoi je veux qu'on parle
  - …

  ## Mon avis sur la semaine
  <1 paragraphe ≤ 100 mots, 1 conseil méta>

  ## Comment je vois la semaine prochaine
  <1 paragraphe d'angle + 3-5 bullets>

  ## Trois choses concrètes à viser cette semaine
  1. …
  2. …
  3. …

  <closing 2-3 phrases — projection & cadence>

Section finale "Projection & cadence" — tu es explicitement invité à \
anticiper et spéculer au-delà des données. Deux modes : \
(A) momentum positif (velocity.is_sufficient=true ET on_track_for_exam=true) \
→ extrapolation inspirante. (B) alerte cadence sinon → prévention chiffrée. \
Reste solidaire et chiffré dans les deux cas.

Voix (les 6 principes Wingman) :
1. Concis dans chaque section.
2. Actionable : chaque attention finit par un next step concret chiffré.
3. Follow the White Rabbit : aucun gap sans porte de sortie.
4. Solidaire jamais accusateur : "voici comment", jamais "tu devrais".
5. Quantifie l'écart, pas l'échec : un nombre, pas un verdict.
6. Vocabulaire positif. Bannis dans le corps : *destroy, kill, sniper, "not ready", "critical"*.

Ton — humain plutôt que technique :
- Coach qui connaît la personne, pas un dashboard.
- Ancre les chiffres dans du ressenti et du contexte.
- Évite le jargon : "Fixed Income" plutôt que "FI", "tu as gagné 4 points" plutôt que "+4.5% delta".
- Permet-toi des respirations conversationnelles avec parcimonie.

Hiérarchie de priorité : gap chiffré × actionnable d'abord ; topic à \
fort weight × faible mastery prioritaire ; si velocity.is_sufficient=false, \
le verdict doit le dire avec required_to_target.

Interdits : phrases de remplissage, stats orphelines sans interprétation, \
plus de 6 wins ou 6 attention points, smileys autres que 🎯 🐇 🔥 ✓ (parcimonie).

Si une section du payload est null/vide, n'invente pas — élide la mention ou \
note brièvement "manque de données pour [topic] cette semaine" si pertinent.\
"""


# ── Anthropic call ──────────────────────────────────────────────────

async def claude_generate_digest(payload: dict[str, Any]) -> dict[str, Any]:
    """Returns {content_md, model_used, tokens_in, tokens_out, cost_usd}."""
    api_key = os.environ.get("ANTHROPIC_API_KEY") or settings.anthropic_api_key
    if not api_key:
        return {
            "content_md": "## Subject : Digest indisponible\n\n_La clé Anthropic n'est pas configurée côté serveur. Le digest ne peut pas être généré pour l'instant._",
            "model_used": MODEL,
            "tokens_in":  0,
            "tokens_out": 0,
            "cost_usd":   0.0,
            "error":      "missing_api_key",
        }

    payload_json = json.dumps(payload, ensure_ascii=False, default=str)
    user_msg = (
        "Voici le payload pour le digest hebdomadaire. "
        "Génère le digest en suivant strictement le format demandé.\n\n"
        f"```json\n{payload_json}\n```"
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": user_msg}],
        )
    except anthropic.BadRequestError as e:
        msg = getattr(e, "message", str(e))[:200]
        return {
            "content_md": f"## Subject : Digest indisponible\n\n_Anthropic API a renvoyé : {msg}_",
            "model_used": MODEL, "tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0,
            "error": "anthropic_bad_request",
        }
    except Exception as e:
        return {
            "content_md": f"## Subject : Digest indisponible\n\n_Erreur côté serveur : {type(e).__name__}_",
            "model_used": MODEL, "tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0,
            "error": "anthropic_exception",
        }

    content_md = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()

    tokens_in  = getattr(response.usage, "input_tokens", 0) or 0
    tokens_out = getattr(response.usage, "output_tokens", 0) or 0
    # Sonnet 4.6 indicative pricing (per million tokens): $3 in / $15 out.
    cost_usd = round((tokens_in / 1e6) * 3.0 + (tokens_out / 1e6) * 15.0, 4)

    return {
        "content_md": content_md,
        "model_used": MODEL,
        "tokens_in":  tokens_in,
        "tokens_out": tokens_out,
        "cost_usd":   cost_usd,
    }


# ── Cache + public entries ──────────────────────────────────────────

async def get_cached(user_id: str, iso_week: str) -> dict[str, Any] | None:
    """Return the cached digest for (user, iso_week) if present, else None."""
    redis_client = await _get_redis()
    if not redis_client:
        return None
    try:
        raw = await redis_client.get(_digest_key(user_id, iso_week))
    except Exception:
        return None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


async def _cache_set(user_id: str, iso_week: str, digest: dict[str, Any]) -> None:
    redis_client = await _get_redis()
    if not redis_client:
        return
    try:
        await redis_client.set(_digest_key(user_id, iso_week), json.dumps(digest, ensure_ascii=False), ex=REDIS_TTL)
    except Exception:
        pass


async def get_or_generate(db: AsyncSession, user_id: str, *, iso_week: str | None = None) -> dict[str, Any]:
    """Mail-mailbox semantics: generate once per (user, iso_week), cache, return.

    Subsequent calls for the same week return the cached digest verbatim — never
    regenerated. This matches the "real inbox" behavior (a delivered mail is
    immutable).
    """
    target_week = iso_week or current_iso_year_week()
    cached = await get_cached(user_id, target_week)
    if cached:
        cached["from_cache"] = True
        return cached

    payload = await build_payload(db, user_id)
    result = await claude_generate_digest(payload)
    digest = {
        "iso_year_week": target_week,
        "generated_at":  datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "from_cache":    False,
        **result,
    }
    # Don't cache failure responses — they should be retryable.
    if not digest.get("error"):
        await _cache_set(user_id, target_week, digest)
    return digest


# Backwards-compat alias for the existing router.
async def generate_for_user(db: AsyncSession, user_id: str) -> dict[str, Any]:
    return await get_or_generate(db, user_id)
