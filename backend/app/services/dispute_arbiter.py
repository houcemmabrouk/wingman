"""
Dispute arbiter — resolves user-submitted "Challenge Wingman" disputes.

Flow:
  1. User submits a dispute on a question they answered (claimed_answer + reason).
  2. We call Claude with the question, the user's claim, and the standards rule.
  3. Claude returns a verdict: question_correct | question_wrong | debrief_wrong | ambiguous.
  4. If upheld (question_wrong / debrief_wrong / ambiguous with high confidence):
     - The wrong attempt is reversed (is_correct = TRUE) so it stops dragging mastery.
     - A small mastery bonus is credited on the LOS (durable, in los_mastery.bonus_pct).
     - The question is auto-quarantined.
  5. Otherwise, dispute is rejected (or routed to human review on low confidence).
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from datetime import datetime
from typing import Any, Optional

import anthropic
from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


# ── Tunables ─────────────────────────────────────────────────────────────
DEFAULT_BONUS_PP = 5.0
MAX_TOTAL_BONUS_PP = 50.0  # cumulative cap on los_mastery.bonus_pct
UPHOLD_VERDICTS = {"question_wrong", "debrief_wrong", "ambiguous"}
UPHOLD_MIN_CONFIDENCE = 0.70
HUMAN_REVIEW_BAND = 0.50  # below this we ask a human, don't reject silently
ARBITER_MODEL = "claude-sonnet-4-6"  # faster than opus, sufficient for arbitration


# ── Prompts ──────────────────────────────────────────────────────────────
ARBITER_SYSTEM_PROMPT = """You are a senior CFA Institute examiner adjudicating a user dispute on a multiple-choice question.

The user studied the topic, answered the question, and now claims the answer key (or the explanation) is wrong. Your job: decide if they're right.

You MUST cite the specific standard, paragraph, or curriculum reference that grounds your verdict (e.g. "ASC 740-10-45-4", "IAS 1.56", "CFA L1 Curriculum Reading 25 §3.2"). If you cannot cite a specific authority, your confidence MUST be at or below 0.5.

Verdict semantics:
- "question_correct": the marked answer is right; the user is mistaken.
- "question_wrong": the marked answer is factually wrong; the user is right (or partially right).
- "debrief_wrong": the marked answer is right BUT the explanation contains an error or misleading reasoning.
- "ambiguous": more than one choice is defensible under the standards.

Bias: when in doubt, prefer the official standard over the question. CFA candidates are taught to follow the standards literally.

Return STRICT JSON, no markdown, no prose around it:
{
  "verdict": "question_correct" | "question_wrong" | "debrief_wrong" | "ambiguous",
  "confidence": 0.0,
  "standard_citation": "string",
  "reason": "2-4 sentences explaining the verdict to the user"
}"""

ARBITER_USER_TEMPLATE = """LM: {lm_code} — {lm_title}
LOS: {los_code} — {los_desc}

Question:
{stem}

Choices:
A. {choice_a}
B. {choice_b}
C. {choice_c}

Marked-correct answer: {correct_answer}
User's selected answer:  {selected_answer}
User's claimed answer:   {claimed_answer}

User's reason:
{user_reason}

Existing debrief shown to user:
{explanation}

Adjudicate this dispute now. Return strict JSON only."""


# ── Anthropic plumbing ───────────────────────────────────────────────────
def _client() -> anthropic.Anthropic:
    api_key = settings.anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return anthropic.Anthropic(api_key=api_key)


def _parse_json(raw: str) -> dict[str, Any]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    obj = json.loads(cleaned)
    if not isinstance(obj, dict):
        raise ValueError("arbiter response is not a JSON object")
    return obj


def _call_arbiter_llm(payload: dict, model: str = ARBITER_MODEL) -> dict[str, Any]:
    client = _client()
    user_msg = ARBITER_USER_TEMPLATE.format(**payload)
    msg = client.messages.create(
        model=model,
        max_tokens=512,
        system=[
            {
                "type": "text",
                "text": ARBITER_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
    parsed = _parse_json(raw)
    parsed["_model"] = model
    parsed["_raw"] = raw
    return parsed


# ── Mastery bonus + attempt reversal ─────────────────────────────────────
async def _apply_upheld_consequences(
    db: AsyncSession,
    user_id: str,
    question_id: int,
    bonus_pp: float = DEFAULT_BONUS_PP,
) -> dict[str, Any]:
    """
    Apply all the side effects of an upheld dispute:
      1. Reverse any wrong attempt by this user on this question.
      2. Credit a durable bonus on the LOS mastery (bonus_pct).
      3. Quarantine the question (so other users stop hitting it).
    """
    q_row = await db.execute(text("""
        SELECT outcome_id, module_id FROM questions WHERE id = :qid
    """), {"qid": question_id})
    qr = q_row.mappings().first()
    if not qr:
        return {"applied": False, "reason": "question not found"}

    outcome_id = qr["outcome_id"]
    module_id = qr["module_id"]

    # 1. Reverse any wrong attempt
    reverse_res = await db.execute(text("""
        UPDATE question_attempts
        SET is_correct = TRUE
        WHERE user_id = :uid AND question_id = :qid AND is_correct = FALSE
        RETURNING id
    """), {"uid": user_id, "qid": question_id})
    reversed_ids = [int(r[0]) for r in reverse_res]

    # 2. Credit the durable LOS bonus (only if LOS is linked)
    bonus_credited = 0.0
    if outcome_id is not None:
        upsert = await db.execute(text("""
            INSERT INTO los_mastery (user_id, outcome_id, mastery_level, bonus_pct, last_attempted)
            VALUES (:uid, :oid, 0, LEAST(CAST(:cap AS numeric), CAST(:bonus AS numeric)), now())
            ON CONFLICT (user_id, outcome_id)
            DO UPDATE SET bonus_pct = LEAST(CAST(:cap AS numeric),
                                            los_mastery.bonus_pct + CAST(:bonus AS numeric)),
                          updated_at = now()
            RETURNING bonus_pct
        """), {"uid": user_id, "oid": outcome_id, "bonus": bonus_pp, "cap": MAX_TOTAL_BONUS_PP})
        bonus_credited = float(upsert.scalar() or 0)

    # 3. Quarantine the question (other users stop hitting it)
    await db.execute(text("""
        UPDATE questions
        SET disabled_at = COALESCE(disabled_at, now()),
            disabled_reason = COALESCE(disabled_reason,
                'DISPUTE upheld ' || :ts || ': user ' || :uid
                || ' challenged this question and arbitration agreed.')
        WHERE id = :qid
    """), {"qid": question_id, "uid": user_id, "ts": datetime.utcnow().isoformat(timespec="seconds")})

    await db.commit()

    return {
        "applied": True,
        "reversed_attempts": reversed_ids,
        "bonus_pp_now": bonus_credited,
        "outcome_id": outcome_id,
        "module_id": module_id,
    }


# ── Public API ───────────────────────────────────────────────────────────
async def submit_and_arbitrate(
    db: AsyncSession,
    user_id: str,
    question_id: int,
    selected_answer: Optional[str],
    claimed_answer: Optional[str],
    user_reason: Optional[str],
    attempt_id: Optional[int] = None,
) -> dict[str, Any]:
    """End-to-end: insert dispute row, call arbiter, apply consequences, return resolution."""

    # Sanitize inputs
    sa = (selected_answer or "").upper().strip() or None
    ca = (claimed_answer or "").upper().strip() or None
    if sa and sa not in ("A", "B", "C"):
        sa = None
    if ca and ca not in ("A", "B", "C"):
        ca = None
    user_reason = (user_reason or "").strip()[:2000] or None

    # Fetch question (allow disputing already-disabled questions, that's fine)
    q_row = await db.execute(text("""
        SELECT q.id, q.stem, q.choice_a, q.choice_b, q.choice_c,
               q.correct_answer, q.explanation,
               lm.code AS lm_code, lm.title AS lm_title,
               lo.code AS los_code, lo.description AS los_desc
        FROM questions q
        JOIN learning_modules lm    ON lm.id = q.module_id
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        WHERE q.id = :qid
    """), {"qid": question_id})
    q = q_row.mappings().first()
    if not q:
        return {"error": "question_not_found"}

    # 1. Insert the dispute row in pending state
    insert_res = await db.execute(text("""
        INSERT INTO question_disputes (
            question_id, user_id, attempt_id,
            selected_answer, claimed_answer, user_reason, status
        )
        VALUES (:qid, :uid, :att, :sa, :ca, :reason, 'auto_review')
        RETURNING id
    """), {
        "qid": question_id, "uid": user_id, "att": attempt_id,
        "sa": sa, "ca": ca, "reason": user_reason,
    })
    dispute_id = int(insert_res.scalar())
    await db.commit()

    # 2. Call arbiter
    payload = {
        "lm_code": q["lm_code"] or "?",
        "lm_title": q["lm_title"] or "?",
        "los_code": q["los_code"] or "(no LOS linked)",
        "los_desc": q["los_desc"] or "(no LOS linked)",
        "stem": q["stem"],
        "choice_a": q["choice_a"],
        "choice_b": q["choice_b"],
        "choice_c": q["choice_c"],
        "correct_answer": q["correct_answer"],
        "selected_answer": sa or "(unknown)",
        "claimed_answer": ca or "(not specified)",
        "user_reason": user_reason or "(none)",
        "explanation": q["explanation"] or "(no debrief)",
    }
    try:
        verdict = await asyncio.to_thread(_call_arbiter_llm, payload, ARBITER_MODEL)
    except Exception as exc:
        logger.exception("Arbiter call failed for dispute {}", dispute_id)
        await db.execute(text("""
            UPDATE question_disputes
            SET status = 'needs_human', arbiter_reason = :err, resolved_at = now()
            WHERE id = :did
        """), {"did": dispute_id, "err": f"arbiter error: {str(exc)[:200]}"})
        await db.commit()
        return {
            "dispute_id": dispute_id,
            "status": "needs_human",
            "verdict": None,
            "reason": "Arbitration unavailable, escalated to human review.",
            "applied": False,
        }

    v = verdict.get("verdict") or "ambiguous"
    if v not in {"question_correct", "question_wrong", "debrief_wrong", "ambiguous"}:
        v = "ambiguous"
    confidence = float(verdict.get("confidence") or 0)
    citation = (verdict.get("standard_citation") or "")[:500] or None
    reason = verdict.get("reason") or ""

    # 3. Decide outcome
    if v == "question_correct":
        status = "rejected"
        applied: dict[str, Any] = {"applied": False}
    elif v in UPHOLD_VERDICTS and confidence >= UPHOLD_MIN_CONFIDENCE:
        status = "upheld"
        applied = await _apply_upheld_consequences(db, user_id, question_id)
    elif confidence < HUMAN_REVIEW_BAND:
        status = "needs_human"
        applied = {"applied": False}
    else:
        status = "rejected"
        applied = {"applied": False}

    # 4. Persist verdict
    await db.execute(text("""
        UPDATE question_disputes
        SET status              = :status,
            arbiter_verdict     = :verdict,
            arbiter_confidence  = :conf,
            arbiter_reason      = :reason,
            arbiter_citation    = :cite,
            mastery_bonus_pct   = :bonus,
            resolved_at         = now()
        WHERE id = :did
    """), {
        "did": dispute_id, "status": status,
        "verdict": v, "conf": confidence,
        "reason": reason, "cite": citation,
        "bonus": DEFAULT_BONUS_PP if status == "upheld" else 0,
    })
    await db.commit()

    return {
        "dispute_id": dispute_id,
        "status": status,
        "verdict": v,
        "confidence": confidence,
        "standard_citation": citation,
        "reason": reason,
        "applied": applied,
        "mastery_bonus_pp": DEFAULT_BONUS_PP if status == "upheld" else 0,
    }
