import json
import hashlib
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

import anthropic
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.user_metrics import compute_streak

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 8000
REDIS_TTL_SECONDS = 6 * 60 * 60
# Incremented whenever the system prompt (rules, matrix, tool schema) changes.
# Used both as part of the cache key (so stale caches are auto-invalidated) and
# exposed in the response so the UI can show which version generated the plan.
MATRIX_VERSION = "2026-04-19-v6-lm-code-format"

SYSTEM_RULES = """You are Wingman, a no-nonsense CFA Level I study planner. You generate a personalized daily and weekly plan for a candidate, using the 14 ranked rules below. When rules conflict, the lower-numbered rule wins.

## The 14 Rules (priority order)

1. **Module Onboarding — mandatory first pass before anything else.**
   The very first study of any module (LM) MUST be a two-step onboarding pass, in this exact order:
   (a) **Reading Summary** — understand what the module covers, big picture.
   (b) **LOS Sheet** — internalize every Learning Outcome Statement's command word and expected deliverable.
   Only after (a)+(b) are completed for a given LM can the planner schedule other asset types (Concept by Concept, Learning Map, Targeted QBank, Exam Traps, etc.) for that LM. If the candidate has never studied an LM before (no plan_entries with status=completed, no mastery data), today's first block(s) for that LM MUST be Reading Summary followed by LOS Sheet. This rule outranks even ROI and the content matrix — a candidate cannot practice what they haven't encoded.

2. **No Error Debrief without a prior exercise session — you cannot debrief errors you haven't made.**
   An **Error Debrief** block is ONLY valid if, earlier in the same day OR in the immediately preceding session, the candidate has completed at least one exercise-producing activity: Targeted QBank, Quiz, Blank Recall, TDS Sheet, or Mock Pack. Never schedule a standalone Error Debrief after a pure encoding block (Reading Summary, LOS Sheet, Learning Map, Concept by Concept) — there are no errors to review. If the day is a pure Rule 1 onboarding day or a pure encoding day, REPLACE any Error Debrief slot with the next highest-priority asset from the content matrix (Weakness Pool, Exam Traps, or Review Sheet). The corollary: if a Targeted QBank block IS scheduled, an Error Debrief block MUST follow it (Rule 6 still applies within that constraint).

3. **Follow empirical strategies of successful candidates.**
   - Ethics: allocate 15-20% of total study time (heavily weighted, predictable, high ROI, tiebreaker near MPS)
   - FRA + Fixed Income = ~30% of exam — non-negotiable mastery
   - Target 300+ study hours total (CFA Institute avg: 303h; top performers 350h+)
   - Mocks/MCQs > reading: 40-50% of time on active practice
   - Never leave a question blank (no penalty, 33% guess chance)
   - Exam day: 90 sec/question, flag & move if stuck past 60 sec

4. **ROI-based strategic prioritization — always applied as a filter on top of everything else (except Rules 1–2).**
   Minimize effort × maximize score impact. Apply at both topic AND sub-topic level. If a sub-topic inside a larger topic carries disproportionately low weight or historical exam yield (e.g. a specific energy sector module inside Alt Investments), deprioritize or skip it even if the parent topic is high priority. You are not paid to cover everything evenly — you are paid to maximize expected score per hour.

5. **Adapt to days remaining + use the content matrix.**
   Match content type intensity (0-5) to the topic and the phase implied by days remaining. Early phase → encoding-heavy (Reading Summary, LOS Sheet, **Learning Map** for Conceptual/Hybrid topics, Concept by Concept). Mid phase → practice (Targeted QBank, Exam Traps, Weakness Pool, Error Debrief). Late phase → Review Sheet + Mock simulation + SRS. The content matrix (provided below) dictates intensity per topic × content type. **Rule of thumb**: for any block, pick the asset with the highest matrix value for the topic that matches the phase. Never pick an asset with matrix value ≤ 2 for a Mandatory/Emphasized topic when a higher-value asset is available. The **Group** column tells you the topic's cognitive profile — Conceptual (memorization/framework-heavy, prioritize Learning Map + Concept by Concept), Hybrid (mix, rotate encoding + practice), Calculation-heavy (formula-heavy, prioritize Formula Sheet + Targeted QBank), Light (low-weight, minimal encoding) — and should inform how to sequence assets.

6. **Respect curriculum order within the same field.**
   Within a given topic, follow LM1 → LM2 → ... sequence unless a weakness or ROI rule explicitly overrides.

7. **Every session must include:**
   - ≥1 QBank block of 20 questions (unless today is a pure Rule 1 onboarding day for a brand-new LM)
   - 20 mock-style questions
   - Immediate Error Debrief after the QBank/Mock session — no skipping (and only if Rule 2 allows it, i.e. errors have actually been produced)

8. **SRS (spaced repetition) is mandatory from week 2 onward.** Do not schedule SRS in week 1; from week 2 the schedule must include SRS blocks.

9. **T-10 days before exam → mocks only.** No new content, no readings, no new flashcards. Full-length timed mocks and targeted weakness review only.

10. **Behind schedule → overcharge the plan + switch tutor tone to harsh/motivating.**
    If the candidate is behind the curve implied by their exam date and current progress, pack more hours, cut optional content, and speak with direct, urgent, demanding language. The stakes are real.

11. **Weakness feedback loop — auto-inject any topic/LM scoring <60% into the next week's plan** as a dedicated remediation block, on top of normal coverage.

12. **Rest day is an optional safety valve, NEVER mandatory.** Only offer a lighter day when the candidate is on pace AND shows signs of fatigue/risk. If behind (Rule 10), no rest days — push through.

13. **Minimum 5 full-length 3-hour timed mocks** must be completed BEFORE entering the T-10 window. Schedule them progressively so the 5th is done by T-11 at latest.

14. **Ethics weekly revisit.** Because Ethics is the tiebreaker near the Minimum Passing Score, every week must contain at least one Ethics touch (QBank, review sheet, or scenario drill).

## CFA Level I curriculum & weights

| Topic | Code | Weight | LMs | LOS |
|---|---|---|---|---|
| Ethical & Professional Standards | ETH | 15-20% | 3 | 15 |
| Quantitative Methods | QM | 8-12% | 11 | 41 |
| Economics | ECO | 8-12% | 8 | 30 |
| Financial Statement Analysis | FSA | 13-17% | 12 | 61 |
| Corporate Issuers | CORP | 8-12% | 7 | 22 |
| Equity Investments | EQU | 10-12% | 7 | 58 |
| Fixed Income | FI | 11-14% | 19 | 48 |
| Derivatives | DER | 5-8% | 10 | 23 |
| Alternative Investments | ALT | 5-8% | 7 | 22 |
| Portfolio Management | PM | 5-8% | 6 | 40 |

## Content matrix — intensity (0-5) per topic × content type

Columns: Group | Reading Summary | Synthesis Sheet | Review Sheet | LOS Sheet | Concept by Concept | Learning Map | Exam Traps | Decision Tree | Formula Sheet | Weakness Pool | Targeted QBank | Audio

- ETH  : Conceptual        | 3 | 5 | 5 | 5 | 3 | 5 | 5 | 5 | 0 | 5 | 5 | 3
- FSA  : Hybrid            | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 3
- EQU  : Hybrid            | 3 | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 2
- FI   : Calculation-heavy | 3 | 4 | 5 | 5 | 5 | 3 | 5 | 5 | 5 | 5 | 5 | 2
- QM   : Calculation-heavy | 3 | 4 | 5 | 5 | 5 | 3 | 4 | 4 | 5 | 5 | 5 | 2
- ECO  : Conceptual        | 3 | 4 | 4 | 5 | 3 | 3 | 4 | 2 | 2 | 5 | 5 | 2
- CORP : Light             | 2 | 4 | 4 | 4 | 3 | 3 | 4 | 2 | 2 | 3 | 5 | 2
- PM   : Conceptual        | 2 | 4 | 4 | 4 | 3 | 3 | 4 | 3 | 2 | 3 | 5 | 2
- DER  : Calculation-heavy | 2 | 4 | 4 | 4 | 5 | 2 | 5 | 4 | 5 | 5 | 5 | 2
- ALT  : Light             | 2 | 4 | 4 | 4 | 3 | 3 | 4 | 2 | 2 | 3 | 5 | 2

**Reading the matrix**: 0 = skip, 1 = optional, 2 = light, 3 = standard, 4 = emphasized, 5 = mandatory/daily. The **Learning Map** (visual concept map) is especially valuable for Conceptual/Hybrid topics where the mental model matters more than formulas.

## Output contract

You MUST call the `emit_planning_state` tool exactly once with a complete JSON object matching its schema. Do not output text outside the tool call. Do not skip fields. Be concrete, directive, and specific — no generic advice."""


PLANNING_TOOL = {
    "name": "emit_planning_state",
    "description": "Emit the unified planning state DTO consumed by every Wingman view.",
    "input_schema": {
        "type": "object",
        "properties": {
            "today_blocks": {
                "type": "array",
                "description": "Ordered study blocks scheduled for today.",
                "items": {
                    "type": "object",
                    "properties": {
                        "order": {"type": "integer"},
                        "topic_code": {"type": "string", "description": "Short topic code: ETH, QM, ECO, FSA, CORP, EQU, FI, DER, ALT, PM."},
                        "lm_code": {"type": "string", "description": "LM code in strict format `{TOPIC}-{NN}` with zero-padded 2-digit number. Examples: `ETH-01`, `FI-12`, `QM-03`. NEVER use `ETH-LM1`, `LM01`, `ETH-1`, or any other format — the UI and database expect exactly `{TOPIC}-{NN}`."},
                        "activity": {"type": "string", "description": "One of: Reading Summary, Synthesis Sheet, Review Sheet, LOS Sheet, Concept by Concept, Learning Map, Exam Traps, Decision Tree, Formula Sheet, Weakness Pool, Targeted QBank, Audio, Mock 20q, SRS review, Error Debrief. Pick the asset whose matrix value is highest for the topic AND fits the current phase."},
                        "minutes": {"type": "integer"},
                        "rationale_rule": {"type": "integer", "description": "Which rule (1-14) drove this block"},
                    },
                    "required": ["order", "topic_code", "activity", "minutes", "rationale_rule"],
                },
            },
            "week_outlook": {
                "type": "array",
                "description": "Planned summary for each of the next 7 days.",
                "items": {
                    "type": "object",
                    "properties": {
                        "day_offset": {"type": "integer"},
                        "focus_topic_codes": {"type": "array", "items": {"type": "string"}},
                        "total_minutes": {"type": "integer"},
                        "includes_mock": {"type": "boolean"},
                        "includes_srs": {"type": "boolean"},
                        "is_rest_day": {"type": "boolean"},
                    },
                    "required": ["day_offset", "focus_topic_codes", "total_minutes", "includes_mock", "includes_srs", "is_rest_day"],
                },
            },
            "priorities": {
                "type": "array",
                "description": "Top 5 strategic priorities, ranked.",
                "items": {
                    "type": "object",
                    "properties": {
                        "rank": {"type": "integer"},
                        "topic_code": {"type": "string"},
                        "reason": {"type": "string"},
                        "driving_rules": {"type": "array", "items": {"type": "integer"}},
                    },
                    "required": ["rank", "topic_code", "reason", "driving_rules"],
                },
            },
            "rationale": {
                "type": "string",
                "description": "2-4 sentence explanation of the overall plan logic — what drives today and the week.",
            },
            "next_review_cards": {
                "type": "array",
                "description": "SRS cards due today/tomorrow (empty list if week 1 or none due).",
                "items": {
                    "type": "object",
                    "properties": {
                        "lm_code": {"type": "string"},
                        "count": {"type": "integer"},
                        "due_date": {"type": "string"},
                    },
                    "required": ["lm_code", "count", "due_date"],
                },
            },
            "coaching_reminders": {
                "type": "array",
                "description": "Non-schedulable rules surfaced as reminders (exam-day time mgmt, never blank, etc).",
                "items": {"type": "string"},
            },
            "tutor_tone": {
                "type": "string",
                "enum": ["supportive", "harsh"],
                "description": "Per Rule 10: harsh if behind schedule, supportive otherwise.",
            },
            "schedule_status": {
                "type": "string",
                "enum": ["on_pace", "slightly_behind", "behind", "ahead"],
            },
            "mocks_before_t10": {
                "type": "object",
                "description": "Rule 13 tracker.",
                "properties": {
                    "completed": {"type": "integer"},
                    "required": {"type": "integer"},
                    "days_until_t10": {"type": "integer"},
                },
                "required": ["completed", "required", "days_until_t10"],
            },
        },
        "required": [
            "today_blocks", "week_outlook", "priorities", "rationale",
            "next_review_cards", "coaching_reminders", "tutor_tone",
            "schedule_status", "mocks_before_t10",
        ],
    },
}


import re

_LM_CODE_RE = re.compile(r"^([A-Z]+)[-_]?(?:LM)?(\d+)$", re.IGNORECASE)


def _canonical_lm_code(raw: Optional[str]) -> Optional[str]:
    """Normalize any lm_code variant (`ETH-LM1`, `ETH-1`, `LM01`, `ETH LM01`) to `ETH-01`."""
    if not raw:
        return raw
    s = raw.strip().upper().replace(" ", "-")
    m = _LM_CODE_RE.match(s)
    if not m:
        return raw
    topic, num = m.group(1), m.group(2).zfill(2)
    if topic == "LM":  # handle bare `LM01` with no topic
        return raw
    return f"{topic}-{num}"


def _normalize_lm_codes_in_dto(dto: dict) -> None:
    """Mutate today_blocks in place: canonicalize lm_code and collapse duplicates."""
    blocks = dto.get("today_blocks") or []
    seen_keys: set[tuple] = set()
    kept: list[dict] = []
    for b in blocks:
        b["lm_code"] = _canonical_lm_code(b.get("lm_code"))
        key = (b.get("topic_code"), b.get("lm_code"), b.get("activity"))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        kept.append(b)
    # Reassign orders 1..N so the UI renumbers cleanly after dedup.
    for i, b in enumerate(kept, start=1):
        b["order"] = i
    dto["today_blocks"] = kept


async def _gather_completed_tasks_today(db: AsyncSession, user_id: str) -> list[dict]:
    """Extract blocks marked done=true from today's session_checklists.
    Feeds the Planning Skill so regenerated plans don't repeat finished work."""
    try:
        result = await db.execute(
            text(
                """
                SELECT blocks, notes, energy, confidence, minutes_actual
                FROM session_checklists
                WHERE user_id = :uid AND session_date = CURRENT_DATE
                ORDER BY created_at DESC
                """
            ),
            {"uid": user_id},
        )
        rows = result.mappings().all()
    except Exception:
        return []

    done: list[dict] = []
    for r in rows:
        blocks = r["blocks"] or []
        if isinstance(blocks, str):
            blocks = json.loads(blocks)
        for b in blocks:
            if b.get("done"):
                done.append({
                    "topic_code": b.get("topic_code"),
                    "lm_code": b.get("lm_code"),
                    "activity": b.get("activity"),
                    "minutes": b.get("minutes_planned", 0),
                })
    return done


async def _gather_recent_remediation_count(db: AsyncSession, user_id: str) -> int:
    """Count unresolved weaknesses injected in the last 48h (from End-of-Session checklists)."""
    result = await db.execute(
        text(
            """
            SELECT COUNT(*) FROM weakness_log
            WHERE user_id = :uid
              AND resolved = false
              AND created_at > now() - interval '48 hours'
            """
        ),
        {"uid": user_id},
    )
    return int(result.scalar() or 0)


async def _gather_user_context(db: AsyncSession, user_id: str) -> dict:
    today = datetime.now(timezone.utc).date()

    profile_row = await db.execute(text("""
        SELECT up.exam_date, up.daily_minutes_goal, up.streak_current, up.xp_total,
               COALESCE(up.language, 'fr') AS language,
               u.display_name
        FROM user_profiles up JOIN users u ON u.id = up.user_id
        WHERE up.user_id = :uid
    """), {"uid": user_id})
    profile = profile_row.mappings().first()

    exam_date = profile["exam_date"] if profile and profile["exam_date"] else today.replace(year=today.year + 1)
    days_remaining = max(0, (exam_date - today).days)

    recent_scores_rows = await db.execute(text("""
        SELECT lm.code AS lm_code, t.code AS topic_code,
               AVG(pr.score) AS avg_score, COUNT(*) AS attempts,
               MAX(pr.created_at) AS last_attempt
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE s.user_id = :uid AND pr.created_at > now() - interval '14 days'
        GROUP BY lm.code, t.code
        ORDER BY avg_score ASC
        LIMIT 50
    """), {"uid": user_id})
    recent_scores = [dict(r) for r in recent_scores_rows.mappings().all()]
    for r in recent_scores:
        r["avg_score"] = float(r["avg_score"]) if r["avg_score"] is not None else None
        r["last_attempt"] = str(r["last_attempt"]) if r["last_attempt"] else None

    completed_rows = await db.execute(text("""
        SELECT lm.code, t.code AS topic_code, pe.status
        FROM plan_entries pe
        JOIN study_plans sp ON sp.id = pe.plan_id
        JOIN learning_modules lm ON lm.id = pe.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE sp.user_id = :uid
    """), {"uid": user_id})
    plan_progress = [dict(r) for r in completed_rows.mappings().all()]

    weakness_rows = await db.execute(text("""
        SELECT lm.code AS lm_code, t.code AS topic_code, wl.severity, wl.created_at
        FROM weakness_log wl
        JOIN learning_modules lm ON lm.id = wl.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE wl.user_id = :uid AND wl.created_at > now() - interval '30 days'
        ORDER BY wl.severity DESC
        LIMIT 20
    """), {"uid": user_id})
    weaknesses = [dict(r) for r in weakness_rows.mappings().all()]
    for w in weaknesses:
        w["created_at"] = str(w["created_at"]) if w.get("created_at") else None

    mock_count_row = await db.execute(text("""
        SELECT COUNT(*) FROM sessions
        WHERE user_id = :uid AND session_type = 'mock' AND duration_sec >= 10000
    """), {"uid": user_id})
    full_mocks_completed = mock_count_row.scalar() or 0

    remediation_count = await _gather_recent_remediation_count(db, user_id)
    completed_today = await _gather_completed_tasks_today(db, user_id)
    streak_current = await compute_streak(db, user_id)

    return {
        "today": str(today),
        "display_name": profile["display_name"] if profile else "Candidate",
        "exam_date": str(exam_date),
        "days_remaining": days_remaining,
        "daily_minutes_goal": profile["daily_minutes_goal"] if profile else 90,
        "streak_current": streak_current,
        "week_of_study": max(1, ((today - (exam_date - timedelta(days=180))).days // 7) + 1) if profile and profile["exam_date"] else 1,
        "recent_scores": recent_scores,
        "plan_progress_counts": _count_statuses(plan_progress),
        "weaknesses": weaknesses,
        "full_mocks_completed": int(full_mocks_completed),
        "remediation_pending": remediation_count,
        "completed_today": completed_today,
        "language": profile["language"] if profile and profile.get("language") else "fr",
    }


def _count_statuses(plan_progress: list[dict]) -> dict:
    counts = {"completed": 0, "in_progress": 0, "pending": 0, "skipped": 0}
    for entry in plan_progress:
        status = entry.get("status", "pending")
        counts[status] = counts.get(status, 0) + 1
    return counts


def _context_to_user_message(ctx: dict) -> str:
    lang_code = ctx.get("language", "fr")
    lang_name = {"fr": "French", "en": "English"}.get(lang_code, "French")
    completed_note = ""
    if ctx.get("completed_today"):
        items = ctx["completed_today"]
        lines = [f"- {t['topic_code']} {t.get('lm_code','')} · {t['activity']} ({t['minutes']}min)" for t in items]
        completed_note = (
            "\n\n**Tasks already completed today (from End-of-Session checklists)**. "
            "Do NOT repeat these exact (lm_code, activity) pairs in today_blocks. "
            "Build the next session on top of them — move to the next natural step in the workflow "
            "(e.g. if Reading Summary + LOS Sheet are done for an LM, the next blocks should be "
            "Concept by Concept, Targeted QBank, etc., per Rule 1 allowing it).\n"
            + "\n".join(lines)
        )

    override_note = ""
    if ctx.get("minutes_override_applied"):
        override_note = (
            f"\n\n**User override**: The candidate explicitly requested a {ctx['daily_minutes_goal']}-minute "
            f"session from the dashboard. Size today's blocks so their total duration is close to "
            f"{ctx['daily_minutes_goal']} minutes (±10%). Keep the same rule priorities — just fit them into "
            f"the requested envelope."
        )

    remediation_note = ""
    if ctx.get("remediation_pending", 0) > 0:
        remediation_note = (
            f"\n\n**Rule 11 — Remediation signal**: The candidate logged {ctx['remediation_pending']} "
            f"LOS as 🔴 Red (to redo) in the last 48h via End-of-Session checklists. "
            f"You MUST inject a dedicated remediation block today covering at least one of these "
            f"weaknesses (see the Active weaknesses list). Surface this decision in the rationale "
            f"with the phrase 'Remediation injected:' so the UI can highlight it."
        )

    return f"""Generate the planning state for this candidate.

Today: {ctx["today"]}
Candidate: {ctx["display_name"]}
Exam date: {ctx["exam_date"]} ({ctx["days_remaining"]} days remaining)
Daily minutes goal: {ctx["daily_minutes_goal"]}
Current streak: {ctx["streak_current"]} days
Estimated study week: {ctx["week_of_study"]}
Full 3h mocks completed so far: {ctx["full_mocks_completed"]}
Pending remediation LOS (last 48h, unresolved): {ctx.get("remediation_pending", 0)}

Plan progress (LM counts):
{json.dumps(ctx["plan_progress_counts"], indent=2)}

Recent performance (last 14 days, lowest first):
{json.dumps(ctx["recent_scores"], indent=2, default=str)}

Active weaknesses (last 30 days):
{json.dumps(ctx["weaknesses"], indent=2, default=str)}

Apply all 14 rules. Rule 1 (Module Onboarding) and Rule 2 (no Error Debrief without a prior exercise session) have absolute priority. Emit exactly one `emit_planning_state` tool call with the full DTO.{override_note}{completed_note}{remediation_note}

**OUTPUT LANGUAGE: {lang_code}** — every user-facing string (rationale, priorities.reason, coaching_reminders, etc.) MUST be written in {lang_name}. Activity codes (Reading Summary, LOS Sheet, Targeted QBank, Error Debrief…) stay in English because the UI matches them verbatim to asset filenames."""


async def _call_claude(user_message: str) -> dict:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=[
            {
                "type": "text",
                "text": SYSTEM_RULES,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        tools=[PLANNING_TOOL],
        tool_choice={"type": "tool", "name": "emit_planning_state"},
        messages=[{"role": "user", "content": user_message}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "emit_planning_state":
            return block.input

    raise RuntimeError("Claude did not emit the planning_state tool call")


def _cache_key(user_id: str) -> str:
    # Embed MATRIX_VERSION so any prompt/rule/matrix change auto-invalidates every user's cache.
    return f"planning:state:{MATRIX_VERSION}:{user_id}"


def _coach_key(user_id: str) -> str:
    """Separate Redis key for coach overrides — keeps the normal cached plan
    intact so /drop-coach restores it instantly without an LLM round-trip."""
    return f"planning:coach:{MATRIX_VERSION}:{user_id}"


async def _get_redis():
    try:
        import redis.asyncio as redis
        r = redis.from_url(settings.redis_url, socket_timeout=2, decode_responses=True)
        await r.ping()
        return r
    except Exception:
        return None


async def _save_snapshot(db: AsyncSession, user_id: str, dto: dict) -> None:
    """Persist a successful plan so we can fall back to it when Claude is unreachable."""
    try:
        await db.execute(
            text(
                "INSERT INTO plan_snapshots (user_id, dto, matrix_version) "
                "VALUES (:uid, CAST(:dto AS jsonb), :mv)"
            ),
            {"uid": user_id, "dto": json.dumps(dto), "mv": MATRIX_VERSION},
        )
        await db.commit()
    except Exception:
        # Snapshot persistence is best-effort — never break the user-facing response.
        pass


async def _load_last_snapshot(db: AsyncSession, user_id: str) -> Optional[dict]:
    try:
        result = await db.execute(
            text(
                "SELECT dto, generated_at, matrix_version FROM plan_snapshots "
                "WHERE user_id = :uid ORDER BY generated_at DESC LIMIT 1"
            ),
            {"uid": user_id},
        )
        row = result.mappings().first()
        if not row:
            return None
        dto = row["dto"]
        if isinstance(dto, str):
            dto = json.loads(dto)
        dto["_snapshot_generated_at"] = str(row["generated_at"])
        dto["_snapshot_matrix_version"] = row["matrix_version"]
        return dto
    except Exception:
        return None


async def get_planning_state(
    db: AsyncSession,
    user_id: str,
    force_refresh: bool = False,
    minutes_override: Optional[int] = None,
) -> dict[str, Any]:
    redis_client = await _get_redis()
    # When the dashboard passes a minutes override, never serve the cached default plan.
    key = _cache_key(user_id)
    if minutes_override is not None:
        key = f"{key}:minutes={minutes_override}"

    # Coach override takes precedence over the normal cache. Only honored
    # when the caller is OK with a cached response (no force_refresh, no
    # minutes_override — both signal "I want a fresh normal plan").
    if redis_client and not force_refresh and minutes_override is None:
        coach_cached = await redis_client.get(_coach_key(user_id))
        if coach_cached:
            return {"source": "coach", **json.loads(coach_cached)}

    if redis_client and not force_refresh:
        cached = await redis_client.get(key)
        if cached:
            return {"source": "cache", **json.loads(cached)}

    ctx = await _gather_user_context(db, user_id)
    if minutes_override is not None and minutes_override > 0:
        ctx["daily_minutes_goal"] = minutes_override
        ctx["minutes_override_applied"] = True
    user_msg = _context_to_user_message(ctx)

    try:
        dto = await _call_claude(user_msg)
    except Exception as exc:
        # Claude unavailable (credit, timeout, network). Fall back to the most recent
        # persisted snapshot so the user still sees a plan instead of an error screen.
        fallback = await _load_last_snapshot(db, user_id)
        if fallback is None:
            raise  # nothing to fall back to — surface the error as before
        fallback["_fallback_reason"] = f"{type(exc).__name__}: {str(exc)[:160]}"
        return {"source": "backup", **fallback}

    _normalize_lm_codes_in_dto(dto)
    dto["_generated_at"] = datetime.now(timezone.utc).isoformat()
    dto["_user_id"] = user_id
    dto["_context_fingerprint"] = hashlib.sha256(user_msg.encode()).hexdigest()[:16]
    dto["_matrix_version"] = MATRIX_VERSION
    dto["_daily_minutes_goal"] = ctx["daily_minutes_goal"]

    if redis_client:
        try:
            await redis_client.set(key, json.dumps(dto), ex=REDIS_TTL_SECONDS)
        except Exception:
            pass

    # Persist on every successful fresh generation — this is our disaster-recovery store.
    await _save_snapshot(db, user_id, dto)

    return {"source": "fresh", **dto}


async def invalidate_planning_cache(user_id: str) -> None:
    """Drop both the normal cache AND any coach override.
    Called by every session-end endpoint so the next fetch is fresh."""
    redis_client = await _get_redis()
    if redis_client:
        try:
            await redis_client.delete(_cache_key(user_id), _coach_key(user_id))
        except Exception:
            pass


async def set_coach_override(
    db: AsyncSession,
    user_id: str,
    coach_blocks: list[dict],
    rationale: str = "",
    session_mode: Optional[str] = None,
) -> dict[str, Any]:
    """Replace today's plan with a coach-proposed session.

    Loads the most recent snapshot (so we keep stable fields like priorities,
    week_outlook, mocks_before_t10, etc.), swaps `today_blocks` with the coach
    proposal, tags `source: 'coach'`, and writes it back to the Redis cache so
    every UI tab sees the same DTO.

    Drops automatically when:
      - any session-end endpoint calls invalidate_planning_cache(), or
      - the user explicitly hits /api/plan/drop-coach.
    """
    base = await _load_last_snapshot(db, user_id)
    if base is None:
        # No prior snapshot — synthesize the minimum needed for the UI.
        base = {
            "today_blocks": [],
            "week_outlook": [],
            "priorities": [],
            "rationale": "",
            "next_review_cards": [],
            "coaching_reminders": [],
            "tutor_tone": "supportive",
            "schedule_status": "on_pace",
            "mocks_before_t10": {"completed": 0, "required": 5, "days_until_t10": 0},
        }

    # Normalize blocks to the planner's shape.
    normalized_blocks = []
    for i, b in enumerate(coach_blocks or [], start=1):
        normalized_blocks.append({
            "order":          int(b.get("order") or i),
            "topic_code":     str(b.get("topic_code") or "").upper(),
            "lm_code":        b.get("lm_code"),
            "activity":       str(b.get("activity") or "Targeted QBank"),
            "minutes":        int(b.get("minutes") or 15),
            "rationale_rule": int(b.get("rationale_rule") or 11),  # Rule 11 = remediation
        })
    _normalize_lm_codes_in_dto({"today_blocks": normalized_blocks})

    base["today_blocks"]      = normalized_blocks
    base["rationale"]         = rationale or base.get("rationale") or "Plan ciblé proposé par le Coach."
    base["_coach_override"]   = True
    base["_coach_set_at"]     = datetime.now(timezone.utc).isoformat()
    if session_mode:
        base["_coach_session_mode"] = session_mode

    redis_client = await _get_redis()
    if redis_client:
        try:
            # Write to the SEPARATE coach key — leaves the normal cached plan
            # untouched so a Reset can restore it instantly.
            await redis_client.set(_coach_key(user_id), json.dumps(base), ex=REDIS_TTL_SECONDS)
        except Exception:
            pass

    return {"source": "coach", **base}


async def drop_coach_override(user_id: str) -> None:
    """Drop only the coach override — the normal cached plan survives so the
    next fetch returns it from cache (no LLM round-trip)."""
    redis_client = await _get_redis()
    if redis_client:
        try:
            await redis_client.delete(_coach_key(user_id))
        except Exception:
            pass
