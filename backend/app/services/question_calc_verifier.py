"""Arithmetic verifier for calculation questions.

Claude is unreliable at multi-step arithmetic. This module evaluates a
deterministic Python expression emitted by the generator alongside the
question and verifies that the computed value matches the marked answer.

If `is_calculation` is True, the question MUST include:
  - calculation.python_expr      : the canonical expression for the right answer
  - calculation.expected_value   : the value Claude believes that expression yields
  - distractor_calcs (optional)  : per-letter Python exprs for each distractor

Verification fails (and the question is rejected) when:
  • the python_expr cannot be evaluated safely
  • the computed value disagrees with expected_value (Claude's own arithmetic drifted)
  • no number in the marked correct choice text matches the computed value

The evaluator is sandboxed: no builtins, no imports, only arithmetic operators
and a small whitelist of math functions (exp, log, sqrt, pow, abs, min, max,
round) plus the constants e and pi.
"""
from __future__ import annotations

import ast
import math
import re
from typing import Any


class CalcError(Exception):
    pass


_BIN_OPS = {
    ast.Add: lambda a, b: a + b,
    ast.Sub: lambda a, b: a - b,
    ast.Mult: lambda a, b: a * b,
    ast.Div: lambda a, b: a / b,
    ast.Pow: lambda a, b: a ** b,
    ast.Mod: lambda a, b: a % b,
    ast.FloorDiv: lambda a, b: a // b,
}
_UNARY_OPS = {ast.UAdd: lambda x: +x, ast.USub: lambda x: -x}

_ALLOWED_NAMES: dict[str, Any] = {
    "exp": math.exp, "log": math.log, "ln": math.log, "log10": math.log10,
    "sqrt": math.sqrt, "pow": pow, "abs": abs, "min": min, "max": max,
    "round": round, "e": math.e, "pi": math.pi,
}

# Char whitelist for the source expression (defensive layer).
_ALLOWED_CHARS = re.compile(r"^[\s\d.+\-*/()e\w,_]+$")


def safe_eval(expr: str) -> float:
    expr = (expr or "").strip()
    if not expr:
        raise CalcError("empty expression")
    if not _ALLOWED_CHARS.match(expr):
        raise CalcError(f"disallowed characters in expression")
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise CalcError(f"syntax error: {e.msg}")
    try:
        return _eval_node(tree.body)
    except (TypeError, ValueError, ZeroDivisionError, OverflowError) as e:
        raise CalcError(f"runtime error: {type(e).__name__}: {e}")


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant):
        if not isinstance(node.value, (int, float)):
            raise CalcError(f"non-numeric literal: {node.value!r}")
        return node.value  # preserve int-vs-float for functions like round(x, ndigits)
    if isinstance(node, ast.BinOp):
        op = _BIN_OPS.get(type(node.op))
        if op is None:
            raise CalcError(f"unsupported operator: {type(node.op).__name__}")
        return op(_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp):
        op = _UNARY_OPS.get(type(node.op))
        if op is None:
            raise CalcError(f"unsupported unary op: {type(node.op).__name__}")
        return op(_eval_node(node.operand))
    if isinstance(node, ast.Name):
        v = _ALLOWED_NAMES.get(node.id)
        if v is None:
            raise CalcError(f"unknown name: {node.id}")
        return v
    if isinstance(node, ast.Call):
        f = _eval_node(node.func) if isinstance(node.func, ast.Name) else None
        if not callable(f):
            raise CalcError(f"call target not callable")
        args = [_eval_node(a) for a in node.args]
        return f(*args)
    raise CalcError(f"unsupported AST node: {type(node).__name__}")


# ── number extraction from free-text answer choices ─────────────────────
_NUM_PATTERNS = [
    re.compile(r"-?\$?\s?[\d,]+\.\d+"),       # 1,234.56 / $1,234.56
    re.compile(r"-?\$?\s?\d+(?:,\d{3})+"),    # 1,234,567
    re.compile(r"-?\$?\s?\d+\.\d+"),           # 12.34
    re.compile(r"-?\d+\s*%"),                  # 12% / -3 %
    re.compile(r"-?\d+"),                       # plain integer (last resort)
]


def extract_numbers(text: str) -> list[float]:
    """Find numeric values mentioned in answer-choice prose."""
    if not text:
        return []
    found: list[float] = []
    seen = set()
    for pat in _NUM_PATTERNS:
        for m in pat.finditer(text):
            raw = m.group(0)
            cleaned = raw.replace("$", "").replace(",", "").replace(" ", "").rstrip("%")
            try:
                val = float(cleaned)
            except ValueError:
                continue
            # If the original had a percent sign, keep both 12 and 0.12 versions.
            keys = [val]
            if raw.strip().endswith("%"):
                keys.append(val / 100.0)
            for k in keys:
                if k not in seen:
                    seen.add(k)
                    found.append(k)
    return found


def matches(expected: float, candidate: float, tol_rel: float = 0.005, tol_abs: float = 0.01) -> bool:
    return abs(expected - candidate) <= max(tol_abs, abs(expected) * tol_rel)


def verify_calculation(question: dict) -> tuple[bool, str]:
    """Return (ok, reason). For non-calculation questions returns (True, '')."""
    if not question.get("is_calculation"):
        return True, ""

    calc = question.get("calculation") or {}
    expr = (calc.get("python_expr") or "").strip()
    if not expr:
        return False, "calc_missing_expr"

    try:
        computed = safe_eval(expr)
    except CalcError as e:
        return False, f"calc_eval_error:{e}"

    expected = calc.get("expected_value")
    if expected is not None:
        try:
            expected_f = float(expected)
        except (TypeError, ValueError):
            return False, f"calc_expected_not_numeric:{expected!r}"
        if not matches(expected_f, computed):
            return False, f"calc_mismatch_self:expected={expected_f} computed={computed:.6f}"

    correct = (question.get("correct_answer") or "").strip().upper()
    correct_text = question.get(f"choice_{correct.lower()}", "") or ""
    nums = extract_numbers(correct_text)
    if not nums:
        return False, "calc_no_numbers_in_correct_choice"
    if not any(matches(computed, n) for n in nums):
        return False, f"calc_mismatch_choice:computed={computed:.4f} choice_nums={nums}"

    return True, ""
