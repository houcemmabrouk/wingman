"""
Question audit service.

Re-validates QBank questions against authoritative standards (ASC, IAS,
CFA curriculum) using Claude as a strict examiner. Detects:

  * Wrong correct-answer keys (e.g. classifying DTAs as current).
  * Out-of-scope questions (concept absent from the LOS).
  * Chain-of-thought leakage in debriefs ("re-reading more carefully…").

Results are stored in question_audits. High-confidence failures
auto-quarantine the question (questions.disabled_at).
"""

from __future__ import annotations

import json
import os
import re
import uuid
from typing import Any, Optional

import anthropic
from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


# ── Anti-leak detector (regex pre-pass before LLM audit) ─────────────────
# Phrases below indicate the generator "thought out loud" — the debrief is
# unstable and not exam-grade, regardless of whether the answer is right.
LEAK_PATTERNS = [
    r"\bre-read(?:ing)?\b",
    r"\blet me reconsider\b",
    r"\bon second (?:thought|reading)\b",
    r"\bI initially\b",
    r"\bwait,?\s+(?:that|let|the)\b",
    r"\bin this context it'?s reasonable\b",
    r"\bhowever,?\s+(?:re-?read|let me|on second|more carefully)",
    r"\bactually,?\s+(?:the|let me|I)\b",
    r"\bmore carefully:\s",
]
_LEAK_RE = re.compile("|".join(LEAK_PATTERNS), re.IGNORECASE)


def detect_leak(explanation: str) -> bool:
    if not explanation:
        return False
    return bool(_LEAK_RE.search(explanation))


# ── Prompts ──────────────────────────────────────────────────────────────
# System prompt is constant → cacheable across the whole audit run.
AUDIT_SYSTEM_PROMPT = """You are a senior CFA Institute examiner reviewing the quality of a single multiple-choice question intended for CFA Level I candidates.

You must decide three things:

1. correctness: Is the answer marked correct actually correct under the official standards (US GAAP / ASC, IFRS / IAS, CFA curriculum)?
2. scope: Does the concept tested fall within the stated Learning Outcome Statement (LOS)? Be strict — a question that tests a concept adjacent-to but NOT explicitly required by the LOS is out_of_scope. If the LOS field shows "(no LOS linked)", you must check whether the concept tested is at least within the broader Learning Module (LM) listed; if not, return out_of_scope.
3. debrief quality: Is the explanation clean, decisive, and free of chain-of-thought hesitation ("re-reading more carefully", "however, on second thought", "let me reconsider", "actually", etc.)?

You MUST cite the specific standard, paragraph, or curriculum reference that grounds your verdict (e.g. "ASC 740-10-45-4", "IAS 1.56", "CFA L1 Curriculum Vol.3 Reading 25 §3.2"). If you cannot cite, your confidence MUST be at or below 0.5.

Verdict semantics:
- "correct": question and debrief are exam-grade.
- "question_wrong": the answer key is factually wrong.
- "debrief_wrong": answer key is fine but the explanation is incorrect or misleading.
- "out_of_scope": the concept tested is not in the stated LOS.
- "ambiguous": more than one choice is defensible under standards.

Return STRICT JSON with EXACTLY this shape, no markdown, no prose around it:
{
  "verdict": "correct" | "question_wrong" | "debrief_wrong" | "out_of_scope" | "ambiguous",
  "confidence": 0.0,
  "correctness_score": 0.0,
  "debrief_quality": 0.0,
  "standard_citation": "string",
  "leak_detected": false,
  "reason": "2-4 sentences explaining the verdict"
}"""

AUDIT_USER_TEMPLATE = """LM: {lm_code} — {lm_title}
LOS: {los_code} — {los_desc}

Question:
{stem}

Choices:
A. {choice_a}
B. {choice_b}
C. {choice_c}

Marked-correct answer: {correct_answer}

Debrief shown to user:
{explanation}

Audit this question now. Return strict JSON only."""


# ── Quarantine policy ────────────────────────────────────────────────────
# A question is auto-disabled when:
#   verdict in {question_wrong, out_of_scope} AND confidence >= 0.80
# debrief_wrong / leak_detected leave the question active but flag the run
# for review (the answer key may still be teaching the right thing).
AUTO_QUARANTINE_VERDICTS = {"question_wrong", "out_of_scope"}
AUTO_QUARANTINE_MIN_CONFIDENCE = 0.80


# ── Anthropic client ─────────────────────────────────────────────────────
def _client() -> anthropic.Anthropic:
    api_key = settings.anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return anthropic.Anthropic(api_key=api_key)


def _parse_audit_json(raw: str) -> dict[str, Any]:
    """Strip any accidental code fence and parse. Raise if not a dict."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    obj = json.loads(cleaned)
    if not isinstance(obj, dict):
        raise ValueError("audit response is not a JSON object")
    return obj


# ── Core ─────────────────────────────────────────────────────────────────
async def fetch_question_for_audit(db: AsyncSession, question_id: int) -> Optional[dict]:
    row = await db.execute(text("""
        SELECT q.id, q.stem, q.choice_a, q.choice_b, q.choice_c,
               q.correct_answer, q.explanation, q.disabled_at,
               lm.code AS lm_code, lm.title AS lm_title,
               lo.code AS los_code, lo.description AS los_desc
        FROM questions q
        JOIN learning_modules lm    ON lm.id = q.module_id
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        WHERE q.id = :qid
    """), {"qid": question_id})
    r = row.mappings().first()
    return dict(r) if r else None


def call_audit_llm(question: dict, model: str = "claude-opus-4-7") -> dict[str, Any]:
    """Synchronous Anthropic call wrapped to be invoked via asyncio.to_thread."""
    client = _client()
    user_msg = AUDIT_USER_TEMPLATE.format(
        lm_code=question.get("lm_code") or "?",
        lm_title=question.get("lm_title") or "?",
        los_code=question.get("los_code") or "(no LOS linked)",
        los_desc=question.get("los_desc") or "(no LOS linked)",
        stem=question["stem"],
        choice_a=question["choice_a"],
        choice_b=question["choice_b"],
        choice_c=question["choice_c"],
        correct_answer=question["correct_answer"],
        explanation=question.get("explanation") or "(no debrief)",
    )
    msg = client.messages.create(
        model=model,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": AUDIT_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
    parsed = _parse_audit_json(raw)
    parsed["_model"] = model
    parsed["_raw"] = raw
    return parsed


async def store_audit_result(
    db: AsyncSession,
    question_id: int,
    run_id: str,
    audit: dict[str, Any],
    leak_from_regex: bool,
) -> int:
    """Insert a row into question_audits and return its id."""
    verdict = audit.get("verdict", "ambiguous")
    if verdict not in {"correct", "question_wrong", "debrief_wrong", "out_of_scope", "ambiguous"}:
        verdict = "ambiguous"
    if leak_from_regex and verdict == "correct":
        verdict = "leak_detected"

    row = await db.execute(text("""
        INSERT INTO question_audits (
            question_id, run_id, model_used, verdict, confidence,
            correctness_score, debrief_quality, standard_citation, reason,
            raw_response
        ) VALUES (
            :qid, :run, :model, :verdict, :conf,
            :corr, :dq, :cite, :reason, CAST(:raw AS JSONB)
        )
        RETURNING id
    """), {
        "qid": question_id,
        "run": run_id,
        "model": audit.get("_model") or "unknown",
        "verdict": verdict,
        "conf": float(audit.get("confidence") or 0),
        "corr": float(audit.get("correctness_score") or 0),
        "dq": float(audit.get("debrief_quality") or 0),
        "cite": (audit.get("standard_citation") or "")[:500] or None,
        "reason": audit.get("reason") or "",
        "raw": json.dumps({k: v for k, v in audit.items() if not k.startswith("_")} | {"leak_from_regex": leak_from_regex}),
    })
    audit_id = row.scalar()
    await db.commit()
    return int(audit_id)


async def maybe_auto_quarantine(db: AsyncSession, question_id: int, audit: dict[str, Any]) -> bool:
    verdict = audit.get("verdict")
    confidence = float(audit.get("confidence") or 0)
    if verdict not in AUTO_QUARANTINE_VERDICTS or confidence < AUTO_QUARANTINE_MIN_CONFIDENCE:
        return False
    citation = audit.get("standard_citation") or "no-citation"
    reason = audit.get("reason") or "auto-quarantined by audit pipeline"
    msg = f"AUDIT auto-quarantine ({verdict}, conf={confidence:.2f}): {citation} — {reason}"
    await db.execute(text("""
        UPDATE questions
        SET disabled_at = COALESCE(disabled_at, now()),
            disabled_reason = COALESCE(disabled_reason, :msg)
        WHERE id = :qid
    """), {"qid": question_id, "msg": msg[:1000]})
    await db.commit()
    logger.warning("Auto-quarantined Q{} ({}, conf={:.2f})", question_id, verdict, confidence)
    return True


async def audit_one(
    db: AsyncSession,
    question_id: int,
    run_id: str,
    model: str = "claude-sonnet-4-6",
) -> dict[str, Any]:
    """Audit a single question end-to-end. Returns a summary dict."""
    import asyncio

    q = await fetch_question_for_audit(db, question_id)
    if not q:
        return {"question_id": question_id, "skipped": "not_found"}

    leak = detect_leak(q.get("explanation") or "")

    try:
        audit = await asyncio.to_thread(call_audit_llm, q, model)
    except Exception as exc:
        logger.exception("Audit call failed for Q{}", question_id)
        return {"question_id": question_id, "error": str(exc)[:200]}

    audit_id = await store_audit_result(db, question_id, run_id, audit, leak_from_regex=leak)
    quarantined = await maybe_auto_quarantine(db, question_id, audit)

    return {
        "question_id": question_id,
        "audit_id": audit_id,
        "verdict": audit.get("verdict"),
        "confidence": audit.get("confidence"),
        "leak": leak,
        "quarantined": quarantined,
    }


async def run_audit_batch(
    db: AsyncSession,
    sample_size: int = 20,
    strategy: str = "random",
    module_code: Optional[str] = None,
    model: str = "claude-sonnet-4-6",
) -> dict[str, Any]:
    """
    Pull `sample_size` questions and audit them.

    strategy:
      - 'random'   : random sample
      - 'newest'   : most recently created
      - 'untested' : questions never audited before
    module_code: optionally restrict to one LM (e.g. 'FSA-03').
    """
    where_extra = ""
    params: dict[str, Any] = {"n": sample_size}
    if module_code:
        where_extra += " AND lm.code = :code"
        params["code"] = module_code

    if strategy == "newest":
        order_by = "q.created_at DESC"
    elif strategy == "untested":
        where_extra += " AND NOT EXISTS (SELECT 1 FROM question_audits qa WHERE qa.question_id = q.id)"
        order_by = "q.id"
    else:
        order_by = "RANDOM()"

    rows = await db.execute(text(f"""
        SELECT q.id
        FROM questions q
        JOIN learning_modules lm ON lm.id = q.module_id
        WHERE q.disabled_at IS NULL
        {where_extra}
        ORDER BY {order_by}
        LIMIT :n
    """), params)
    qids = [int(r[0]) for r in rows]

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    results: list[dict] = []
    for qid in qids:
        results.append(await audit_one(db, qid, run_id, model=model))

    quarantined = [r for r in results if r.get("quarantined")]
    failures = [r for r in results if r.get("verdict") not in (None, "correct")]

    return {
        "run_id": run_id,
        "model": model,
        "strategy": strategy,
        "module_code": module_code,
        "sampled": len(qids),
        "audited": len([r for r in results if "audit_id" in r]),
        "errors": len([r for r in results if "error" in r]),
        "quarantined": len(quarantined),
        "non_correct": len(failures),
        "results": results,
    }
