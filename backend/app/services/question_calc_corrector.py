"""Calc-correct pipeline.

Instead of REJECTING calculation questions whose marked-correct choice doesn't
match the python_expr result, we CORRECT them: rewrite the marked-correct
choice to embed the canonical value computed by Python.

Distractors are kept as Claude wrote them (their named-trap labels still apply).
The explanation gets a "Canonical value:" appendix so users see the verified
arithmetic.

Returns the corrected question dict + a structured log entry.
"""
from __future__ import annotations

import re
from typing import Any

from app.services.question_calc_verifier import (
    CalcError, safe_eval, extract_numbers, matches,
)


# Format the canonical value for embedding in choice/explanation text.
def format_value(v: float) -> str:
    if abs(v) >= 1000:
        # Use thousand separators, two decimals if non-integer
        if abs(v - round(v)) < 0.005:
            return f"{v:,.0f}"
        return f"{v:,.2f}"
    if abs(v - round(v)) < 0.005:
        return f"{v:.0f}"
    if abs(v) < 1:
        return f"{v:.4f}"
    return f"{v:.2f}"


# Match: optional $ prefix + signed number (with thousand sep, decimals).
# We DON'T consume the trailing whitespace or %/x suffix — they get preserved
# by reslicing after the number.
_NUM_TOKEN_RE = re.compile(r"(\$?)(-?[\d,]+(?:\.\d+)?)")


def rewrite_choice_with_value(text: str, value: float) -> tuple[str, bool]:
    """Replace the most-likely answer-position number in `text` with `value`.

    Heuristic: replace the LAST numeric token in the string. Preserves any
    surrounding whitespace, currency prefix, and unit suffix (%, million, etc.).
    If the chosen number is followed by '%' AND the expr value is in decimal
    form (|v| < 1), scale by 100 so the displayed percent matches reality.
    If `text` has no numbers, append "(value: <formatted>)".
    Returns (new_text, replaced).
    """
    matches_iter = list(_NUM_TOKEN_RE.finditer(text))
    if not matches_iter:
        return f"{text.rstrip()} (value: {format_value(value)})", False

    last = matches_iter[-1]
    prefix = last.group(1)
    after = text[last.end():]
    # Detect '%' suffix (allowing whitespace) for unit scaling.
    is_percent = bool(re.match(r"\s*%", after))
    display_value = value * 100.0 if (is_percent and abs(value) < 1) else value
    formatted = format_value(display_value)
    rebuilt = f"{prefix}{formatted}"
    return text[:last.start()] + rebuilt + text[last.end():], True


def correct_question(q: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Run calc-correct logic on a question. Returns (q_out, log).

    log keys:
      - was_calc:  bool
      - reason:    short string ('not_calc' | 'no_expr' | 'eval_error' | 'already_correct' | 'corrected')
      - actual:    float | None — value computed from python_expr
      - llm_expected: float | None — value Claude claimed
      - choice_had: list[float] | None — numbers found in marked-correct choice
      - changes:   list[str] — human-readable list of patches applied
    """
    log: dict[str, Any] = {
        "was_calc": False, "reason": "not_calc",
        "actual": None, "llm_expected": None, "choice_had": None, "changes": [],
    }
    if not q.get("is_calculation"):
        return q, log

    log["was_calc"] = True
    calc = q.get("calculation") or {}
    expr = (calc.get("python_expr") or "").strip()
    if not expr:
        log["reason"] = "no_expr"
        return q, log
    try:
        actual = safe_eval(expr)
    except CalcError as e:
        log["reason"] = f"eval_error:{e}"
        return q, log

    log["actual"] = actual
    try:
        log["llm_expected"] = float(calc["expected_value"]) if calc.get("expected_value") is not None else None
    except (TypeError, ValueError):
        log["llm_expected"] = None

    correct_letter = (q.get("correct_answer") or "").strip().upper()
    correct_key = f"choice_{correct_letter.lower()}"
    correct_text = q.get(correct_key, "") or ""
    choice_nums = extract_numbers(correct_text)
    log["choice_had"] = choice_nums

    if any(matches(actual, n) for n in choice_nums):
        log["reason"] = "already_correct"
        return q, log

    # Rewrite the marked-correct choice to embed the canonical value.
    new_choice, replaced = rewrite_choice_with_value(correct_text, actual)
    q_new = dict(q)
    q_new[correct_key] = new_choice

    # Mark the stem as contested so the student sees the warning and can
    # dispute the answer at the end via the existing question_disputes flow.
    # We do NOT try to rewrite the explanation prose — Claude's intermediate
    # reasoning may have drifted, and a partial fix produces a worse-looking
    # debrief than a clear "contested" flag.
    stem = q.get("stem") or ""
    if "[CONTESTED]" not in stem:
        q_new["stem"] = stem.rstrip() + " [CONTESTED]"

    log["reason"] = "corrected"
    log["changes"] = [
        f"{correct_key}: number replaced -> {format_value(actual)} (was {choice_nums})"
        if replaced else
        f"{correct_key}: appended value -> {format_value(actual)}",
        "stem: appended [CONTESTED] marker",
    ]
    return q_new, log
