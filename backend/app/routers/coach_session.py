"""Coach Session: multi-turn chat where Claude proposes a custom session
using the same 14 planning rules + live dashboard state (energy, time, progress,
weaknesses). Emits a `propose_session` tool call when ready to build."""
import json
import os
from typing import Any, Literal, Optional

import anthropic
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import current_user_id

router = APIRouter(prefix="/api/coach", tags=["coach"])

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2000


COACH_SESSION_RULES = """You are Wingman's CFA Level I Coach. Your ONE job is to help the candidate
design the next study session by chatting with them, then emit a `propose_session` tool call
when you have enough info.

## The 14 ranked planning rules (MUST apply — lower number wins on conflict)
1. **Module Onboarding**: first study of any LM = Reading Summary → LOS Sheet, no exception.
2. **No Error Debrief without exercise first**: never schedule Error Debrief after pure encoding.
3. Follow empirical strategies (Ethics 15-20%, FRA+FI ~30%, mocks > reading).
4. ROI prioritization (except for Rules 1-2).
5. Match asset intensity to phase (early=encoding, mid=practice, late=review).
6. Curriculum order within a topic (LM1 → LM2 → ...).
7. Session must include ≥1 QBank + Mock + Debrief (unless Rule 1 onboarding day).
8. SRS from week 2.
9. T-10 days → mocks only.
10. Behind schedule → push velocity (overcharge if accepted) ; **jamais de ton accusateur** — quantifie l'écart, propose la rattrapage.
11. Weakness feedback loop — inject unresolved weaknesses.
12. Rest day is optional, never mandatory.
13. Min 5 full mocks before T-10.
14. Ethics weekly revisit.

## Voix du coach (6 principes non-négociables — voir `coach_communication.md`)
1. **Concis** — 2 phrases max par réponse, sauf si l'utilisateur demande explicitement plus.
2. **Actionable** — chaque message se termine par un next step concret (CTA chiffré) ou une question ciblée si info manque.
3. **Follow the White Rabbit** — jamais de mauvaise nouvelle sans porte de sortie. "+6h/sem manquantes pour 70%" ✓ ; "tu n'es pas prêt" ✕.
4. **Solidaire, pas accusateur** — "voici comment rattraper", "on fait X". Bannis : "tu devrais", "il faut", "tu n'as pas".
5. **Quantifier l'écart, pas l'échec** — un nombre concret, jamais un verdict.
6. **Vocabulaire positif** — Daily Sharpener, Champion Lap, hero, Never Surrender. Bannis dans le corps : *destroy, kill, sniper, "not ready", "critical"* (le badge UI suffit pour signaler la criticité).

## How to interact
- Use the candidate's live context (energy, time budget, topic progress, active weaknesses).
- If critical info is missing, ASK ONE targeted question (principe 2).
- Once you have: (a) target topic(s), (b) duration, (c) a clear intent (energy, focus mode),
  CALL the `propose_session` tool with the full session proposal. Do NOT call the tool
  prematurely — if the user is vague ("aide moi à bosser"), ask back first.
- After the tool call, your follow-up text can briefly justify the picks (1 phrase max).

## Content matrix (intensity 0-5 per topic × asset)
Columns: Group | Reading Summary | Synthesis | Review | LOS Sheet | Concept by Concept | Learning Map | Exam Traps | Decision Tree | Formula Sheet | Weakness Pool | Targeted QBank | Audio

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
"""


PROPOSE_SESSION_TOOL = {
    "name": "propose_session",
    "description": "Emit a complete session proposal once you have enough info from the user. "
                   "Do not call this if still gathering intent.",
    "input_schema": {
        "type": "object",
        "properties": {
            "topics": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Topic codes: ETH, QM, ECO, FSA, CORP, EQU, FI, DER, ALT, PM.",
            },
            "lm_codes": {
                "type": "array",
                "items": {"type": "string"},
                "description": "LM codes in strict `{TOPIC}-{NN}` format (ETH-01, FI-12).",
            },
            "duration_min": {"type": "integer"},
            "session_mode": {
                "type": "string",
                "enum": ["discovery", "reinforce", "eval", "audio", "flashcards", "mixed"],
            },
            "blocks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "order": {"type": "integer"},
                        "activity": {
                            "type": "string",
                            "description": "One of: Reading Summary, Synthesis Sheet, Review Sheet, LOS Sheet, "
                                           "Concept by Concept, Learning Map, Exam Traps, Decision Tree, "
                                           "Formula Sheet, Weakness Pool, Targeted QBank, Audio, Mock 20q, "
                                           "SRS review, Error Debrief",
                        },
                        "topic_code": {"type": "string"},
                        "lm_code": {"type": "string"},
                        "minutes": {"type": "integer"},
                    },
                    "required": ["order", "activity", "topic_code", "minutes"],
                },
            },
            "rationale": {"type": "string", "description": "2-3 sentences justifying the picks."},
        },
        "required": ["topics", "duration_min", "session_mode", "blocks", "rationale"],
    },
}


# ── Schemas ───────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CoachContext(BaseModel):
    energy: Optional[Literal["high", "mid", "low"]] = None
    time_budget_min: Optional[int] = None
    topic_progress: dict[str, float] = Field(default_factory=dict)
    lm_progress: dict[str, float] = Field(default_factory=dict)
    language: Optional[Literal["fr", "en"]] = None  # frontend passes from localStorage; backend falls back to DB


class CoachSessionRequest(BaseModel):
    history: list[Message] = Field(default_factory=list)
    message: str
    context: CoachContext = Field(default_factory=CoachContext)


class SessionBlock(BaseModel):
    order: int
    activity: str
    topic_code: str
    lm_code: Optional[str] = None
    minutes: int


class SessionProposal(BaseModel):
    topics: list[str]
    lm_codes: list[str] = Field(default_factory=list)
    duration_min: int
    session_mode: str
    blocks: list[SessionBlock]
    rationale: str


class CoachSessionResponse(BaseModel):
    reply: str
    proposal: Optional[SessionProposal] = None


# ── Helpers ───────────────────────────────────────────────────

async def _gather_live_context(db: AsyncSession, user_id: str) -> dict:
    """Fetch weaknesses + completed-today + language from DB for richer coach reasoning."""
    context: dict[str, Any] = {}

    try:
        lang_row = await db.execute(
            text("SELECT COALESCE(language, 'fr') AS language FROM user_profiles WHERE user_id = :uid"),
            {"uid": user_id},
        )
        context["language"] = (lang_row.scalar() or "fr")
    except Exception:
        context["language"] = "fr"
    try:
        weak = await db.execute(
            text(
                """
                SELECT t.code AS topic, lm.code AS lm_code, lo.code AS los_code,
                       wl.severity,
                       EXTRACT(day FROM now() - wl.created_at)::int AS age_days
                FROM weakness_log wl
                JOIN learning_modules lm ON lm.id = wl.module_id
                JOIN topics t ON t.id = lm.topic_id
                LEFT JOIN learning_outcomes lo ON lo.id = wl.outcome_id
                WHERE wl.user_id = :uid AND wl.resolved = false
                ORDER BY wl.severity DESC, wl.created_at ASC
                LIMIT 10
                """
            ),
            {"uid": user_id},
        )
        context["active_weaknesses"] = [dict(r) for r in weak.mappings()]
    except Exception:
        context["active_weaknesses"] = []

    try:
        done = await db.execute(
            text(
                """
                SELECT blocks FROM session_checklists
                WHERE user_id = :uid AND session_date = CURRENT_DATE
                ORDER BY created_at DESC LIMIT 5
                """
            ),
            {"uid": user_id},
        )
        completed: list[dict] = []
        for row in done.mappings():
            raw = row["blocks"] or []
            if isinstance(raw, str):
                raw = json.loads(raw)
            for b in raw:
                if b.get("done"):
                    completed.append({"topic": b.get("topic_code"), "lm": b.get("lm_code"), "activity": b.get("activity")})
        context["completed_today"] = completed
    except Exception:
        context["completed_today"] = []

    return context


def _build_user_message(req: CoachSessionRequest, live_ctx: dict) -> str:
    lines = ["**Dashboard state right now:**"]
    if req.context.energy:
        lines.append(f"- Energy: {req.context.energy}")
    if req.context.time_budget_min:
        lines.append(f"- Time budget: {req.context.time_budget_min} min")
    if req.context.topic_progress:
        nonzero = {k: v for k, v in req.context.topic_progress.items() if v > 0}
        if nonzero:
            lines.append(f"- Topic mastery (non-zero): {json.dumps(nonzero)}")
    if req.context.lm_progress:
        nonzero_lm = {k: v for k, v in req.context.lm_progress.items() if v > 0}
        if nonzero_lm:
            lines.append(f"- LM mastery (non-zero): {json.dumps(nonzero_lm)}")
    if live_ctx.get("active_weaknesses"):
        lines.append(f"- Active weaknesses: {json.dumps(live_ctx['active_weaknesses'], default=str)}")
    if live_ctx.get("completed_today"):
        lines.append(f"- Tasks done today: {json.dumps(live_ctx['completed_today'])}")

    lines.append("")
    lines.append(f"**User message**: {req.message}")
    return "\n".join(lines)


# ── POST /api/coach/session ───────────────────────────────────

@router.post("/session", response_model=CoachSessionResponse)
async def coach_session(
    req: CoachSessionRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    api_key = os.environ.get("ANTHROPIC_API_KEY") or settings.anthropic_api_key
    if not api_key:
        return CoachSessionResponse(reply="ANTHROPIC_API_KEY not configured.", proposal=None)

    live_ctx = await _gather_live_context(db, user_id)
    # Frontend context wins over DB if provided (lets the user switch language mid-onboarding
    # before the profile PATCH has landed).
    lang = req.context.language or live_ctx.get("language", "fr")
    lang_name = {"fr": "French", "en": "English"}.get(lang, "French")
    user_msg = _build_user_message(req, live_ctx) + (
        f"\n\n**Reply strictly in {lang_name} (lang code: {lang}).** "
        "Activity names stay in English (Reading Summary, LOS Sheet, Targeted QBank, etc.) "
        "because they map to UI asset filenames."
    )

    # Build Claude messages from history + new user message
    messages: list[dict] = []
    for m in req.history[-10:]:  # cap at 10 last turns to control tokens
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": user_msg})

    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[{"type": "text", "text": COACH_SESSION_RULES, "cache_control": {"type": "ephemeral"}}],
            tools=[PROPOSE_SESSION_TOOL],
            messages=messages,
        )
    except anthropic.BadRequestError as e:
        # Common cause: credit balance too low. Return a graceful message so the UI
        # shows it in the chat bubble instead of a silent 500.
        return CoachSessionResponse(
            reply=f"⚠️ Coach unavailable — Anthropic API returned: {e.message if hasattr(e, 'message') else str(e)[:200]}",
            proposal=None,
        )
    except Exception as e:
        return CoachSessionResponse(
            reply=f"⚠️ Coach error: {type(e).__name__}",
            proposal=None,
        )

    reply_text = ""
    proposal: Optional[dict] = None
    for block in response.content:
        if block.type == "text":
            reply_text += block.text
        elif block.type == "tool_use" and block.name == "propose_session":
            proposal = block.input

    return CoachSessionResponse(
        reply=reply_text.strip() or "Let me know what you want to work on.",
        proposal=SessionProposal(**proposal) if proposal else None,
    )
