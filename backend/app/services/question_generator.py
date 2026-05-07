"""
Question generator v2 — enforces the 4 hard rules required by Wingman:

  1. IN SCOPE          — every question carries `los_anchor` (quote of the LOS
                         clause that the question tests). Empty/generic anchors
                         are rejected.
  2. IN TRUTH          — every question carries `standard_citation` (e.g.
                         "ASC 740-10-45-4", "IAS 1.56", "CFA L1 Curriculum
                         Reading 25 §3.2"). Missing/unrecognised citation
                         rejects the question.
  3. EXAMINATE USUAL   — system prompt is anchored on real CFA QBank patterns
                         and ships 2 exemplars as few-shot. The model is told
                         not to invent novel formats.
  4. KNOWN TRAPS       — every distractor must name the documented error it
                         tests (`trap_per_distractor.{A,B,C}`). The correct
                         answer's entry briefly states why it is correct.

Generation flow:
  fetch_module → fetch_los_for_module → call_generator_llm → validate_batch →
  optionally audit_each (uses question_audit service) → insert_questions

Anti-leak regex (chain-of-thought patterns) is shared with the audit service
so a question that escapes generation but still leaks gets caught downstream.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any, Optional

import anthropic
import asyncpg
from loguru import logger

from app.services.question_audit import detect_leak  # shared regex


# ── Constants ────────────────────────────────────────────────────────────
DEFAULT_MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 12000

# Standards we accept in `standard_citation`. The regex is intentionally
# loose — it catches the common forms but rejects free text like "the
# curriculum says…" with no anchor.
CITATION_PATTERNS = [
    r"\bASC\s?\d+(?:-\d+){1,3}(?:-\d+)?",        # ASC 740-10-45-4
    r"\bASU\s?20\d{2}-\d{1,2}",                  # ASU 2015-17
    r"\bIAS\s?\d+(?:\.\d+)?(?:\(\w+\))?",        # IAS 1.56  /  IAS 12.39(b)
    r"\bIFRS\s?\d+(?:\.\d+)?",                   # IFRS 9.4.1
    r"\bFASB\s?\w+",
    r"\bCFA\b[^.]{1,80}(?:Reading|§|Vol\.?\s?\d+)",  # CFA L1 Curriculum Reading 25 §3.2
]
_CITATION_RE = re.compile("|".join(CITATION_PATTERNS), re.IGNORECASE)


# ── System prompt (cacheable; constant across the whole run) ─────────────
SYSTEM_PROMPT = """You are a senior CFA Institute exam writer producing CFA Level I multiple-choice questions for the Wingman platform.

Your output is judged by a strict downstream auditor. Questions that fail any of the 4 hard rules below are REJECTED before insertion — there is no leniency.

────────────────────────────────────────
HARD RULE 1 — IN SCOPE
────────────────────────────────────────
Every question MUST test a concept literally present in the supplied LOS.
You MUST emit a `los_anchor` field: a short quote (or close paraphrase) of the LOS clause that the question tests. Generic anchors like "general application" or "core concept" are rejected.
Pick the los_code from the supplied LOS list. Do NOT invent codes.

────────────────────────────────────────
HARD RULE 2 — IN TRUTH
────────────────────────────────────────
Every question MUST be justified by a specific authoritative reference. You MUST emit a `standard_citation` field with one of:
  • US GAAP:  "ASC 740-10-45-4", "ASU 2015-17"
  • IFRS:     "IAS 1.56", "IFRS 9.4.1"
  • CFA:      "CFA L1 Curriculum Vol.3 Reading 25 §3.2"
Free text without a paragraph/section anchor is rejected.

The marked-correct answer must be the answer the standard mandates. If the standard has no clear answer, you MUST NOT generate that question.

The `explanation` field is the user-facing debrief. It MUST be decisive — no chain-of-thought hesitation. The following phrases are AUTO-REJECTED if present in the explanation:
  "re-reading", "let me reconsider", "on second thought", "however, more carefully", "actually, the", "wait,", "in this context it's reasonable", "I initially"
State the rule, apply it, conclude. No second-guessing in the output.

────────────────────────────────────────
HARD RULE 3 — EXAMINATE USUAL
────────────────────────────────────────
Mirror the format and tone of real CFA Institute QBank items:
  • Stem: 1–4 sentences, with realistic numbers when relevant. Avoid contrived edge cases.
  • Exactly 3 choices (A, B, C); one correct.
  • Distractors of similar length and plausibility to the correct answer.
  • Calculation questions: include the math in the explanation.
  • Conceptual questions: cite the standard inline in the explanation.

Do not invent novel question formats (no fill-in-the-blank, no multi-select, no "all of the above").

────────────────────────────────────────
HARD RULE 4 — KNOWN TRAPS
────────────────────────────────────────
Every distractor MUST test a documented typical CFA candidate mistake. You MUST emit a `trap_per_distractor` field with exactly the keys `A`, `B`, `C`:
  • For each WRONG choice: name the specific error a candidate would make to pick it (e.g. "confuses net income with comprehensive income", "applies pre-tax instead of after-tax cost of debt", "classifies DTA as current — wrong under ASC 740-10-45-4").
  • For the CORRECT choice: write a one-line statement of why it is correct (e.g. "applies IAS 1.56 correctly: DTAs are non-current").
Random plausible numbers are NOT acceptable distractors.

────────────────────────────────────────
HARD RULE 5 — ARITHMETIC INTEGRITY (calculation questions)
────────────────────────────────────────
We do NOT trust LLM arithmetic. For any question whose answer requires arithmetic, you MUST emit two extra fields and a deterministic Python evaluator will verify them:

  • `is_calculation`: true
  • `calculation.python_expr`: a single sandboxed Python expression that, when evaluated, yields the marked-correct numerical answer.
  • `calculation.expected_value`: the float you believe that expression yields.

Allowed in `python_expr`:
  - Operators:  + - * / // % ** (parens)
  - Functions:  exp, log, ln, log10, sqrt, pow, abs, min, max, round
  - Constants:  e, pi
  - Literals:   numbers only

NOT allowed: variables, names, imports, attribute access, strings.

Rules:
  1. The verifier evaluates `python_expr` server-side. The result MUST equal `expected_value` (within 0.5% relative tolerance).
  2. The result MUST also match a number present in the marked-correct choice's text (within 0.5% tolerance). Mismatch = question rejected.
  3. Choose scenario numbers that yield a CLEAN result. Avoid contrived precision and "closest option" hand-waving.
  4. Each distractor's value should result from a named candidate error (sign flip, wrong period, missed adjustment, formula confusion).
  5. The `explanation` MUST work through every step explicitly with intermediate values, ending with the same number.

For pure conceptual / qualitative questions, emit `is_calculation: false` and omit the `calculation` block. The verifier passes silently.

CRITICAL — LITERAL NUMBERS ONLY in python_expr. The expression must contain ONLY numbers, operators, parens, and the whitelisted functions (exp, log, sqrt, pow, abs, min, max, round). Do NOT use variable names like p, V, S, K, r — substitute them with their numeric values BEFORE writing the expression.

Example A — single-step (FCF):
  Stem: "Free cash flow = NI + D&A − CapEx − ΔNWC. NI=80, D&A=20, CapEx=30, ΔNWC=10. What is FCF?"
  is_calculation: true
  calculation: { python_expr: "80 + 20 - 30 - 10", expected_value: 60.0 }
  Choice "$60 million" → match → accepted.

Example B — multi-step (one-period binomial call):
  Stem: "S=100, u=1.10, d=0.90, r=5%, K=100. What is the no-arbitrage value of a European call?"
  Intermediate steps you compute MENTALLY, not in the expression:
    p = (1.05 - 0.90) / (1.10 - 0.90) = 0.75
    Vu = max(100·1.10 - 100, 0) = 10
    Vd = max(100·0.90 - 100, 0) = 0
    Value = (p·Vu + (1-p)·Vd) / 1.05
  ❌ WRONG python_expr: "(p * Vu + (1-p) * Vd) / (1+r)"  ← uses variable names; REJECTED
  ❌ WRONG python_expr: "(0.75 * Vu + 0.25 * Vd) / 1.05"  ← still has Vu, Vd; REJECTED
  ✅ RIGHT python_expr: "(0.75 * 10 + 0.25 * 0) / 1.05"  ← every symbol substituted to a literal
  expected_value: 7.1428571
  Choice "$7.14" → match → accepted.

Example C — multi-step with discount (binomial put with dividend):
  Substitute everything end-to-end. If the formula has nested factors, write the whole chain as numbers:
  ✅ "((1.05 - 0.85) / (1.20 - 0.85) * max(0, 50 - 60) + (1 - (1.05 - 0.85)/(1.20 - 0.85)) * max(0, 50 - 42.5)) / 1.05"
  This is verbose but parses fine. Verifier evaluates step-by-step internally.

If you cannot construct a clean literal python_expr for the answer, the question is NOT a good calculation question — convert it to a conceptual one (`is_calculation: false`) instead of submitting one with arithmetic drift.

────────────────────────────────────────
REFERENCE EXAMPLE
────────────────────────────────────────
Stem: "Under IFRS, an entity reports the following items at year-end: deferred tax asset of $400, accounts receivable of $1,200, inventory of $800, and a 5-year note receivable of $2,000. What is the total of current assets?"

Choices:
  A. $2,000   (wrong: only AR + inventory; missed nothing in error path)
  B. $2,400   (wrong: includes DTA — common error, DTA is always non-current under IFRS)
  C. $4,400   (wrong: includes the note receivable beyond 1 year)

Correct: A — under IAS 1.56 the DTA is non-current, the 5-year note is non-current.

los_anchor: "compare current and non-current assets and liabilities"
standard_citation: "IAS 1.56"
trap_per_distractor: {
  "A": "correct: applies IAS 1.56 — DTA non-current, 5-year note non-current",
  "B": "wrong: includes DTA — under IAS 1.56 deferred tax assets are always non-current",
  "C": "wrong: includes 5-year note — fails the 'within 12 months' test for notes receivable"
}
────────────────────────────────────────

Distribution constraints (per batch):
  • Cover ALL supplied LOS — at least 2 questions per LOS when count permits.
  • Difficulty mix: ~20% easy (1-2), ~50% medium (3), ~30% hard (4-5).
  • Mix conceptual + calculation + application + interpretation.
  • No two questions test the same LOS+concept pair twice.

Output: emit a single `emit_question_batch` tool call. No prose outside the tool."""


# ── Tool schema (Anthropic strict tool use) ──────────────────────────────
def build_tool_schema(min_questions: int) -> dict[str, Any]:
    return {
        "name": "emit_question_batch",
        "description": "Emit a batch of CFA Level I questions that pass the 4 hard rules.",
        "input_schema": {
            "type": "object",
            "properties": {
                "module_code": {"type": "string"},
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "stem":              {"type": "string", "minLength": 30},
                            "choice_a":          {"type": "string", "minLength": 1},
                            "choice_b":          {"type": "string", "minLength": 1},
                            "choice_c":          {"type": "string", "minLength": 1},
                            "correct_answer":    {"type": "string", "enum": ["A", "B", "C"]},
                            "explanation":       {"type": "string", "minLength": 40},
                            "difficulty":        {"type": "integer", "minimum": 1, "maximum": 5},
                            "los_code":          {"type": "string", "minLength": 3},
                            "los_anchor":        {"type": "string", "minLength": 10},
                            "standard_citation": {"type": "string", "minLength": 4},
                            "trap_per_distractor": {
                                "type": "object",
                                "properties": {
                                    "A": {"type": "string", "minLength": 5},
                                    "B": {"type": "string", "minLength": 5},
                                    "C": {"type": "string", "minLength": 5},
                                },
                                "required": ["A", "B", "C"],
                            },
                            "is_calculation": {
                                "type": "boolean",
                                "description": "True iff the marked-correct answer requires arithmetic. Forces calculation block below.",
                            },
                            "calculation": {
                                "type": "object",
                                "description": "REQUIRED when is_calculation=true. Sandboxed Python expression for the correct answer. Operators +-*/% (), exp/log/ln/log10/sqrt/pow/abs/min/max/round, constants e/pi.",
                                "properties": {
                                    "python_expr":     {"type": "string", "minLength": 1, "description": "e.g. '(120 - 30 - 22) * 0.95'"},
                                    "expected_value":  {"type": "number", "description": "Numeric value the expression yields. Verifier checks self-consistency."},
                                    "unit":            {"type": "string", "description": "Optional unit hint, e.g. 'USD millions', '%', 'years'."},
                                },
                                "required": ["python_expr", "expected_value"],
                            },
                        },
                        "required": [
                            "stem", "choice_a", "choice_b", "choice_c",
                            "correct_answer", "explanation", "difficulty",
                            "los_code", "los_anchor", "standard_citation",
                            "trap_per_distractor",
                        ],
                    },
                },
            },
            "required": ["module_code", "questions"],
        },
    }


# ── Validation ───────────────────────────────────────────────────────────
GENERIC_ANCHOR_BLOCKLIST = {
    "general application", "core concept", "fundamental principle",
    "standard application", "basic understanding", "key concept",
    "main idea", "the concept", "this concept", "the topic",
}

# Stop-words excluded from los_anchor ↔ los_description overlap check.
_STOP_WORDS = {
    "a", "an", "and", "or", "of", "the", "to", "in", "on", "for", "with",
    "is", "are", "be", "by", "as", "at", "from", "that", "this", "these",
    "those", "its", "their", "between", "vs", "versus", "into", "such",
    "etc", "e.g", "i.e", "the", "compare", "describe", "explain", "calculate",
    "discuss", "identify", "evaluate", "interpret", "apply",
}
_MIN_ANCHOR_OVERLAP = 0.30  # at least 30% of significant anchor words must appear in the LOS desc.


@dataclass
class ValidationResult:
    ok: bool
    code: Optional[str] = None       # machine-readable rejection class (for bucketing)
    reason: Optional[str] = None     # human-readable detail


def _significant_words(text: str) -> set[str]:
    return {
        w for w in re.findall(r"[a-zA-Z][a-zA-Z\-]{2,}", text.lower())
        if w not in _STOP_WORDS
    }


def _anchor_matches_los(anchor: str, los_description: str) -> bool:
    """Loose check: does the anchor reuse enough words from the actual LOS?"""
    a_words = _significant_words(anchor)
    if not a_words:
        return False
    los_words = _significant_words(los_description or "")
    if not los_words:
        return True   # we can't check — defer to other rules
    overlap = len(a_words & los_words) / len(a_words)
    return overlap >= _MIN_ANCHOR_OVERLAP


def validate_question(
    q: dict,
    allowed_los: dict[str, str],
) -> ValidationResult:
    """Return ok=True or ok=False with a code+reason. Strict rule enforcement.

    `allowed_los` maps los_code → los_description for the module being generated.
    """
    # Rule 1a: in scope — los_code present and in module list
    los = (q.get("los_code") or "").strip()
    if not los:
        return ValidationResult(False, "los_missing", "missing los_code (rule 1)")
    if allowed_los and los not in allowed_los:
        return ValidationResult(False, "los_unknown", f"los_code {los!r} not in module LOS list (rule 1)")

    # Rule 1b: los_anchor non-generic AND reuses words from the actual LOS
    anchor = (q.get("los_anchor") or "").strip()
    if len(anchor) < 10:
        return ValidationResult(False, "anchor_too_short", "los_anchor too short (rule 1)")
    if anchor.lower() in GENERIC_ANCHOR_BLOCKLIST:
        return ValidationResult(False, "anchor_generic", f"los_anchor {anchor!r} is generic (rule 1)")
    if not _anchor_matches_los(anchor, allowed_los.get(los, "")):
        return ValidationResult(
            False, "anchor_off_topic",
            f"los_anchor does not reuse enough words from LOS {los!r} (rule 1)",
        )

    # Rule 2a: standard_citation matches a known authoritative pattern
    cite = (q.get("standard_citation") or "").strip()
    if not cite or not _CITATION_RE.search(cite):
        return ValidationResult(
            False, "citation_invalid",
            f"standard_citation {cite!r} does not match any known standard pattern (rule 2)",
        )

    # Rule 2b: no chain-of-thought leakage in stem OR explanation
    if detect_leak(q.get("stem") or ""):
        return ValidationResult(False, "leak_in_stem", "stem contains chain-of-thought leakage (rule 2)")
    if detect_leak(q.get("explanation") or ""):
        return ValidationResult(False, "leak_in_explanation", "explanation contains chain-of-thought leakage (rule 2)")

    # Rule 3: format
    correct = q.get("correct_answer")
    if correct not in ("A", "B", "C"):
        return ValidationResult(False, "correct_answer_invalid", f"correct_answer {correct!r} invalid (rule 3)")
    choices_text = []
    for k in ("choice_a", "choice_b", "choice_c"):
        v = (q.get(k) or "").strip()
        if not v:
            return ValidationResult(False, "choice_empty", f"{k} empty (rule 3)")
        choices_text.append(v)
    if len(set(choices_text)) < 3:
        return ValidationResult(False, "distractor_dup", "choices A/B/C are not all unique (rule 3)")

    # Rule 4: traps
    traps = q.get("trap_per_distractor") or {}
    for key in ("A", "B", "C"):
        v = (traps.get(key) or "").strip()
        if len(v) < 5:
            return ValidationResult(False, "trap_too_short", f"trap_per_distractor.{key} missing or too short (rule 4)")

    # Rule 5: arithmetic integrity is now handled post-validation by the
    # corrector pipeline (`question_calc_corrector.correct_question`). Only
    # un-evaluable expressions (e.g. variables instead of literals) are
    # rejected here; mismatches between expr value and marked-correct choice
    # are auto-corrected by overwriting the choice text.
    if q.get("is_calculation"):
        calc = q.get("calculation") or {}
        expr = (calc.get("python_expr") or "").strip()
        if not expr:
            return ValidationResult(False, "calc_no_expr", "is_calculation=true but no python_expr (rule 5)")
        from app.services.question_calc_verifier import safe_eval, CalcError
        try:
            safe_eval(expr)
        except CalcError as e:
            return ValidationResult(False, "calc_uneval", f"python_expr does not evaluate: {e} (rule 5)")

    return ValidationResult(True)


@dataclass
class BatchDistributionWarnings:
    """Non-blocking observations about the batch as a whole."""
    los_uncovered: list[str]            # LOS codes that got 0 questions among kept
    difficulty_skew: Optional[str]      # e.g. "no_easy", "no_hard", "all_medium"
    los_overconcentrated: list[str]     # LOS codes that got > 50% of kept questions


def _check_distribution(kept: list[dict], allowed_los: dict[str, str]) -> BatchDistributionWarnings:
    if not kept:
        return BatchDistributionWarnings([], None, [])
    counts: dict[str, int] = {}
    diffs: dict[int, int] = {}
    for q in kept:
        counts[q["los_code"]] = counts.get(q["los_code"], 0) + 1
        diffs[int(q.get("difficulty") or 3)] = diffs.get(int(q.get("difficulty") or 3), 0) + 1
    n = len(kept)
    uncovered = sorted(set(allowed_los) - set(counts))
    over = sorted(c for c, v in counts.items() if v / n > 0.5 and len(allowed_los) > 1)
    has_easy = any(d <= 2 for d in diffs)
    has_hard = any(d >= 4 for d in diffs)
    has_medium = 3 in diffs
    if not has_easy and has_medium:
        skew = "no_easy"
    elif not has_hard and has_medium:
        skew = "no_hard"
    elif has_medium and not has_easy and not has_hard:
        skew = "all_medium"
    else:
        skew = None
    return BatchDistributionWarnings(uncovered, skew, over)


def validate_batch(
    batch: dict,
    allowed_los: dict[str, str],
) -> tuple[list[dict], list[dict], BatchDistributionWarnings]:
    """Split batch into (kept, rejected, warnings)."""
    kept: list[dict] = []
    rejected: list[dict] = []
    seen_keys: set[tuple[str, str]] = set()
    for q in batch.get("questions", []):
        if not isinstance(q, dict):
            rejected.append({"_raw": str(q)[:200], "_reject_code": "not_a_dict",
                             "_reject_reason": f"question entry was {type(q).__name__}, expected dict"})
            continue
        v = validate_question(q, allowed_los)
        if not v.ok:
            rejected.append({**q, "_reject_code": v.code, "_reject_reason": v.reason})
            continue
        key = (q["los_code"], (q["stem"] or "")[:80].strip().lower())
        if key in seen_keys:
            rejected.append({**q, "_reject_code": "duplicate", "_reject_reason": "duplicate (same LOS + stem prefix)"})
            continue
        seen_keys.add(key)
        kept.append(q)
    warnings = _check_distribution(kept, allowed_los)
    return kept, rejected, warnings


# ── Anthropic call ───────────────────────────────────────────────────────
def _api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        # Fallback to .env file alongside the backend (matches legacy generators).
        from pathlib import Path
        env_file = Path(__file__).resolve().parents[2] / ".env"
        if env_file.exists():
            from dotenv import dotenv_values
            key = dotenv_values(str(env_file)).get("ANTHROPIC_API_KEY", "") or ""
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return key


def build_user_message(
    module: dict,
    los_list: list[dict],
    count: int,
    difficulty_target: Optional[int] = None,
    existing_stems: Optional[list[str]] = None,
    require_calculation: bool = False,
) -> str:
    los_lines = "\n".join(
        f"  - {l['code']}: {l['description']}"
        for l in los_list
    ) or "  (no LOS rows in DB for this module — DO NOT generate without LOS context, return zero questions)"

    calc_block = ""
    if require_calculation:
        calc_block = f"""
CALCULATION-ONLY MODE: every question in this batch MUST be a calculation question.
  - Set `is_calculation: true` for every question.
  - Provide `calculation.python_expr` and `calculation.expected_value` for every question.
  - The python_expr MUST evaluate (server-side, deterministic) to a value matching a number in the marked-correct choice text. The verifier will REJECT any question where the expression does not match.
  - Do NOT emit conceptual / "best describes" / "which of the following" questions in this run.
"""

    diff_block = ""
    if difficulty_target is not None:
        diff_block = f"""
DIFFICULTY TARGET: All {count} questions MUST have difficulty {difficulty_target} or higher (1-5 CFA scale).
  - Difficulty 4 = applies a multi-step formula or analyzes a multi-data scenario
  - Difficulty 5 = evaluates conflicting information or constructs a recommendation under conflicting evidence
Each question MUST include at least 2 of: a 3+ line vignette, multi-step reasoning,
a deliberately distracting data point, or distractors named after specific candidate errors.
Easy / pure-recall questions are rejected by validation.
"""

    dup_block = ""
    if existing_stems:
        sample = existing_stems[:20]
        dup_lines = "\n".join(f"  - {s[:90]}..." for s in sample)
        dup_block = f"""
DO NOT duplicate any of these existing question stems (showing up to 20):
{dup_lines}
"""

    return f"""Generate at least {count} CFA Level I questions for this module.

Module code:  {module['code']}
Module title: {module['title']}
Topic:        {module.get('topic_code')} — {module.get('topic_name')}

Authoritative LOS list (use ONLY these los_code values, distribute evenly):
{los_lines}
{calc_block}{diff_block}{dup_block}
Reminder of hard rules:
  1. IN SCOPE          — los_anchor required (no generic anchors)
  2. IN TRUTH          — standard_citation required (ASC/IAS/IFRS/CFA reading)
  3. EXAMINATE USUAL   — CFA QBank format only
  4. KNOWN TRAPS       — trap_per_distractor required for A, B, C

Emit exactly one `emit_question_batch` tool call. No prose outside the tool."""


async def call_generator_llm(
    client: anthropic.AsyncAnthropic,
    module: dict,
    los_list: list[dict],
    count: int,
    model: str = DEFAULT_MODEL,
    difficulty_target: Optional[int] = None,
    existing_stems: Optional[list[str]] = None,
    require_calculation: bool = False,
) -> dict:
    response = await client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        temperature=0.3,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        tools=[build_tool_schema(min_questions=count)],
        tool_choice={"type": "tool", "name": "emit_question_batch"},
        messages=[{"role": "user", "content": build_user_message(
            module, los_list, count,
            difficulty_target=difficulty_target,
            existing_stems=existing_stems,
            require_calculation=require_calculation,
        )}],
    )
    for block in response.content:
        if block.type == "tool_use" and block.name == "emit_question_batch":
            return block.input
    raise RuntimeError(f"No tool call in response for {module['code']}")


# ── DB helpers ───────────────────────────────────────────────────────────
async def fetch_module(conn: asyncpg.Connection, code: str) -> Optional[dict]:
    row = await conn.fetchrow("""
        SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name
        FROM learning_modules lm JOIN topics t ON t.id = lm.topic_id
        WHERE lm.code = $1
    """, code)
    return dict(row) if row else None


async def fetch_modules(conn: asyncpg.Connection, only: Optional[list[str]]) -> list[dict]:
    rows = await conn.fetch("""
        SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name
        FROM learning_modules lm JOIN topics t ON t.id = lm.topic_id
        ORDER BY t.sort_order, lm.sort_order
    """)
    out = [dict(r) for r in rows]
    if only:
        want = {c.strip().upper() for c in only}
        out = [m for m in out if m["code"].upper() in want]
    return out


async def fetch_los_for_module(conn: asyncpg.Connection, module_id: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT id, code, description, bloom_level
        FROM learning_outcomes
        WHERE module_id = $1
        ORDER BY sort_order, id
    """, module_id)
    return [dict(r) for r in rows]


GENERATOR_VERSION = "v2.4"


async def insert_questions(conn: asyncpg.Connection, module: dict, questions: list[dict]) -> int:
    los_id_by_code = {
        r["code"]: r["id"]
        for r in await conn.fetch(
            "SELECT id, code FROM learning_outcomes WHERE module_id = $1", module["id"]
        )
    }
    inserted = 0
    for q in questions:
        outcome_id = los_id_by_code.get(q["los_code"])
        if outcome_id is None:
            # Defensive: validate_question should have caught this, but skip silently.
            logger.warning("Skip insert: los_code {} not found for module {}", q["los_code"], module["code"])
            continue
        # Build calc_metadata for retroactive audit
        calc_meta = None
        if q.get("is_calculation"):
            calc_in = q.get("calculation") or {}
            log_in = q.get("_calc_log") or {}
            calc_meta = {
                "is_calculation": True,
                "python_expr": calc_in.get("python_expr"),
                "expected_value": calc_in.get("expected_value"),
                "actual_value": log_in.get("actual"),
                "unit": calc_in.get("unit"),
                "corrected": q.get("_calc_corrected", False),
            }
        await conn.execute("""
            INSERT INTO questions (
                module_id, outcome_id,
                stem, choice_a, choice_b, choice_c,
                correct_answer, explanation, difficulty,
                los_anchor, standard_citation, trap_per_distractor,
                calc_metadata,
                generator_version, generated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14, now())
        """,
            module["id"], outcome_id,
            q["stem"], q["choice_a"], q["choice_b"], q["choice_c"],
            q["correct_answer"], q["explanation"], q["difficulty"],
            q["los_anchor"], q["standard_citation"], json.dumps(q.get("trap_per_distractor") or {}),
            json.dumps(calc_meta) if calc_meta else None,
            GENERATOR_VERSION,
        )
        inserted += 1
    return inserted


async def insert_rejected(
    conn: asyncpg.Connection,
    module: dict,
    rejected: list[dict],
    run_id: str,
) -> int:
    """Persist rejected questions to `rejected_questions` for post-mortem review."""
    inserted = 0
    for r in rejected:
        # Strip our internal markers from the persisted payload to keep it pure.
        payload = {k: v for k, v in r.items() if not k.startswith("_")}
        try:
            await conn.execute("""
                INSERT INTO rejected_questions (
                    module_id, los_code, generator_version, run_id,
                    reject_code, reject_reason, raw_payload
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
            """,
                module["id"],
                r.get("los_code"),
                GENERATOR_VERSION,
                run_id,
                r.get("_reject_code") or "unknown",
                (r.get("_reject_reason") or "")[:2000],
                json.dumps(payload, default=str),
            )
            inserted += 1
        except Exception as e:
            logger.warning("insert_rejected failed for module {}: {}", module["code"], str(e)[:200])
    return inserted


# ── End-to-end orchestration ─────────────────────────────────────────────
async def generate_module(
    conn: asyncpg.Connection,
    client: anthropic.AsyncAnthropic,
    module: dict,
    count: int,
    dry_run: bool,
    model: str = DEFAULT_MODEL,
    max_attempts: int = 4,
    difficulty_target: Optional[int] = None,
    only_los_codes: Optional[list[str]] = None,
    require_calculation: bool = False,
) -> dict[str, Any]:
    """Generate, validate, optionally insert. Returns a per-module summary.

    Loops up to `max_attempts` times until `count` valid questions accumulate,
    deduplicating across attempts. Stops early after 2 consecutive empty rounds.
    """
    import uuid
    run_id = f"gen-{uuid.uuid4().hex[:8]}"

    los_list = await fetch_los_for_module(conn, module["id"])
    if only_los_codes:
        los_list = [l for l in los_list if l["code"] in set(only_los_codes)]
    if not los_list:
        return {
            "module_code": module["code"],
            "skipped": "no_los_rows" if not only_los_codes else "no_matching_los",
            "generated": 0, "kept": 0, "rejected": 0, "inserted": 0,
        }

    # Existing question stems for dedup hint to the model
    existing_rows = await conn.fetch("""
        SELECT stem FROM questions WHERE module_id = $1 AND disabled_at IS NULL ORDER BY id DESC LIMIT 30
    """, module["id"])
    existing_stems = [r["stem"] for r in existing_rows]

    allowed = {l["code"]: l["description"] for l in los_list}
    kept_all: list[dict] = []
    rejected_all: list[dict] = []
    seen_keys: set[tuple[str, str]] = set()
    generated_total = 0
    attempts = 0
    consecutive_empty = 0
    last_warnings = BatchDistributionWarnings([], None, [])

    # Cap per-call request to fit MAX_TOKENS budget. Each question ~1400 output
    # tokens, MAX_TOKENS=12000 → ~8 questions max safe; we use 6 for headroom.
    PER_CALL_CAP = 6
    # Scale max_attempts with count so a 20-q request gets enough rounds.
    effective_max_attempts = max(max_attempts, (count + PER_CALL_CAP - 1) // PER_CALL_CAP + 2)
    while len(kept_all) < count and attempts < effective_max_attempts:
        attempts += 1
        remaining = min(PER_CALL_CAP, max(count - len(kept_all), 5))
        batch = await call_generator_llm(
            client, module, los_list, remaining, model=model,
            difficulty_target=difficulty_target,
            existing_stems=existing_stems,
            require_calculation=require_calculation,
        )
        generated_total += len(batch.get("questions", []))
        kept, rejected, warnings = validate_batch(batch, allowed)
        if difficulty_target is not None:
            soft_rejects = [q for q in kept if int(q.get("difficulty") or 3) < difficulty_target]
            kept = [q for q in kept if int(q.get("difficulty") or 3) >= difficulty_target]
            for q in soft_rejects:
                rejected.append({**q, "_reject_code": "difficulty_below_target",
                                 "_reject_reason": f"difficulty {q.get('difficulty')} < target {difficulty_target}"})
        if require_calculation:
            non_calc = [q for q in kept if not q.get("is_calculation")]
            kept = [q for q in kept if q.get("is_calculation")]
            for q in non_calc:
                rejected.append({**q, "_reject_code": "not_calculation",
                                 "_reject_reason": "require_calculation=True but is_calculation!=true"})

        # Calc-correct pipeline: rewrite marked-correct choice + explanation
        # to embed the canonical Python-evaluated value when LLM math drifts.
        from app.services.question_calc_corrector import correct_question
        corrected_kept = []
        for q in kept:
            q_out, log = correct_question(q)
            if log.get("reason") == "corrected":
                q_out["_calc_corrected"] = True
                q_out["_calc_log"] = log
            corrected_kept.append(q_out)
        kept = corrected_kept

        last_warnings = warnings
        rejected_all.extend(rejected)
        new_kept = 0
        for q in kept:
            key = (q["los_code"], (q["stem"] or "")[:80].strip().lower())
            if key in seen_keys:
                rejected_all.append({**q, "_reject_code": "duplicate_cross_attempt",
                                     "_reject_reason": "duplicate across attempts"})
                continue
            seen_keys.add(key)
            kept_all.append(q)
            new_kept += 1
        if new_kept == 0:
            consecutive_empty += 1
            if consecutive_empty >= 2:
                break
        else:
            consecutive_empty = 0

    # Belt-and-suspenders pre-insert audit: catch any leak / dup / calc drift
    # that slipped through validate_question + corrector. Adds [CONTESTED] to
    # the stem rather than blocking insert. In normal flow this is a no-op.
    from app.services.question_python_audit import audit_question_dict, stamp_contested_if_needed
    los_desc_map = {l["code"]: l["description"] for l in los_list}
    audited_kept = []
    for q in kept_all:
        q_for_audit = dict(q)
        q_for_audit["los_description"] = los_desc_map.get(q.get("los_code"), "")
        issues = audit_question_dict(q_for_audit)
        audited_kept.append(stamp_contested_if_needed(q, issues))
    kept_all = audited_kept

    inserted = 0
    if kept_all and not dry_run:
        inserted = await insert_questions(conn, module, kept_all)

    # Persist rejects so we can audit failure modes without re-paying Anthropic.
    rejected_persisted = 0
    if rejected_all and not dry_run:
        rejected_persisted = await insert_rejected(conn, module, rejected_all, run_id)

    return {
        "module_code": module["code"],
        "los_count": len(los_list),
        "attempts": attempts,
        "generated": generated_total,
        "kept": len(kept_all),
        "rejected": len(rejected_all),
        "inserted": inserted,
        "rejection_breakdown": _summarise_rejections(rejected_all),
        "warnings": {
            "los_uncovered": last_warnings.los_uncovered,
            "difficulty_skew": last_warnings.difficulty_skew,
            "los_overconcentrated": last_warnings.los_overconcentrated,
        },
        "kept_questions": kept_all if dry_run else None,
        "rejected_questions": rejected_all if dry_run else None,
    }


def _summarise_rejections(rejected: list[dict]) -> dict[str, int]:
    """Bucket by machine-readable code (set by validate_question)."""
    out: dict[str, int] = {}
    for r in rejected:
        bucket = r.get("_reject_code") or "unknown"
        out[bucket] = out.get(bucket, 0) + 1
    return out
