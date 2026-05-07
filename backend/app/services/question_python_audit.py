"""Cost-free Python audit on a question dict (no LLM).

Reusable from:
  * scripts/audit_python_only.py  — retroactive scan over the DB
  * question_generator.generate_module — pre-insert belt-and-suspenders

Returns a list of issue codes. HIGH_CONF_FLAGS are the codes that, when present,
warrant adding the [CONTESTED] marker to the stem.
"""
from __future__ import annotations

import json

from app.services.question_calc_verifier import safe_eval, CalcError, extract_numbers, matches
from app.services.question_audit import detect_leak


HIGH_CONF_FLAGS = {"calc_drift", "calc_uneval", "leak_stem", "leak_explanation", "distractor_dup"}
CONTESTED_MARKER = "[CONTESTED]"


def audit_question_dict(r: dict) -> list[str]:
    """Run all cost-free checks on a question dict. Returns list of issue codes.

    Expected dict keys:
      stem, choice_a, choice_b, choice_c, correct_answer, explanation,
      los_anchor, standard_citation, calc_metadata (optional dict or json str),
      los_description (optional, used for anchor-overlap check)
    """
    # Lazy import to avoid circular dep with question_generator
    from app.services.question_generator import _CITATION_RE, _anchor_matches_los

    issues: list[str] = []
    stem = r.get("stem") or ""
    expl = r.get("explanation") or ""

    if detect_leak(stem):
        issues.append("leak_stem")
    if detect_leak(expl):
        issues.append("leak_explanation")

    choices = [
        (r.get("choice_a") or "").strip(),
        (r.get("choice_b") or "").strip(),
        (r.get("choice_c") or "").strip(),
    ]
    if all(choices) and len(set(choices)) < 3:
        issues.append("distractor_dup")

    cite = (r.get("standard_citation") or "").strip()
    if not cite or not _CITATION_RE.search(cite):
        issues.append("citation_invalid")

    anchor = (r.get("los_anchor") or "").strip()
    los_desc = r.get("los_description") or ""
    if anchor and los_desc and not _anchor_matches_los(anchor, los_desc):
        issues.append("anchor_off_topic")

    if len(stem) < 30:
        issues.append("stem_too_short")
    if len(expl) < 40:
        issues.append("expl_too_short")

    meta = r.get("calc_metadata")
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except Exception:
            meta = None
    if isinstance(meta, dict) and meta.get("is_calculation"):
        expr = (meta.get("python_expr") or "").strip()
        if expr:
            try:
                actual = safe_eval(expr)
                correct = (r.get("correct_answer") or "").strip().lower()
                if correct in ("a", "b", "c"):
                    nums = extract_numbers(choices[ord(correct) - ord("a")])
                    if not any(matches(actual, n) for n in nums):
                        issues.append("calc_drift")
            except CalcError:
                issues.append("calc_uneval")

    return issues


def stamp_contested_if_needed(q: dict, issues: list[str]) -> dict:
    """Append CONTESTED_MARKER to stem if any high-conf issue is present and
    the marker is not already in the stem. Returns a new dict (does not mutate).
    """
    if not any(i in HIGH_CONF_FLAGS for i in issues):
        return q
    stem = q.get("stem") or ""
    if CONTESTED_MARKER in stem:
        return q
    q_new = dict(q)
    q_new["stem"] = stem.rstrip() + " " + CONTESTED_MARKER
    return q_new
