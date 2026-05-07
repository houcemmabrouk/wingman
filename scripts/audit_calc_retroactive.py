"""Retroactive calc audit — re-evaluate stored calc_metadata against current
choices and report drift / auto-correct if requested.

Iterates over all questions where calc_metadata->>'is_calculation' = 'true',
re-evaluates the stored python_expr, and compares with the marked-correct
choice's numeric content. Reports:
  - matches    : choice number agrees with python value (clean)
  - drift      : python value differs from choice number (would benefit from correction)
  - uneval     : python_expr does not evaluate (variables, syntax, etc.)
  - no_meta    : question has no calc_metadata (legacy v2.0/v2.1/v2.2)

Usage (read-only):
  docker exec wingman-backend python /app/audit_calc_retroactive.py
  docker exec wingman-backend python /app/audit_calc_retroactive.py --apply  # rewrite choices

Optional filters:
  --module DER-10
  --since '2026-05-05 13:00'
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime, timezone

import asyncpg

sys.path.insert(0, "/app")
from app.services.question_calc_verifier import safe_eval, CalcError, extract_numbers, matches  # noqa: E402
from app.services.question_calc_corrector import rewrite_choice_with_value, format_value  # noqa: E402


def to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true", help="rewrite choices in-place")
    p.add_argument("--module", default=None)
    p.add_argument("--since", default=None, help="ISO timestamp")
    args = p.parse_args()

    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman")
    conn = await asyncpg.connect(to_asyncpg_dsn(db_url))
    try:
        sql = """
            SELECT q.id, lm.code AS module_code, q.correct_answer,
                   q.choice_a, q.choice_b, q.choice_c, q.calc_metadata
            FROM questions q
            JOIN learning_modules lm ON lm.id = q.module_id
            WHERE q.disabled_at IS NULL
              AND q.calc_metadata IS NOT NULL
              AND (q.calc_metadata->>'is_calculation')::boolean = true
        """
        params = []
        if args.module:
            sql += " AND lm.code = $1"
            params.append(args.module)
        if args.since:
            sql += f" AND q.generated_at >= ${len(params)+1}"
            params.append(datetime.fromisoformat(args.since))
        sql += " ORDER BY q.id"
        rows = await conn.fetch(sql, *params)

        stats = {"total": len(rows), "matches": 0, "drift": 0, "uneval": 0, "applied": 0, "errors": 0}
        drifts = []
        for r in rows:
            meta = r["calc_metadata"]
            if isinstance(meta, str):
                meta = json.loads(meta)
            expr = (meta.get("python_expr") or "").strip()
            if not expr:
                stats["errors"] += 1
                continue
            try:
                actual = safe_eval(expr)
            except CalcError as e:
                stats["uneval"] += 1
                continue

            correct = (r["correct_answer"] or "").strip().lower()
            choice_text = r[f"choice_{correct}"] or ""
            nums = extract_numbers(choice_text)

            if any(matches(actual, n) for n in nums):
                stats["matches"] += 1
                continue

            stats["drift"] += 1
            drifts.append({
                "id": r["id"], "module": r["module_code"], "actual": actual,
                "choice_had": nums, "choice_text": choice_text[:80],
            })

            if args.apply:
                new_text, replaced = rewrite_choice_with_value(choice_text, actual)
                await conn.execute(
                    f"UPDATE questions SET choice_{correct} = $1 WHERE id = $2",
                    new_text, r["id"],
                )
                stats["applied"] += 1

        print(f"\n=== Calc retro audit ({'APPLY' if args.apply else 'DRY-RUN'}) ===")
        for k, v in stats.items():
            print(f"  {k:<10s}: {v}")
        if drifts:
            print(f"\nDrift sample (first 10):")
            for d in drifts[:10]:
                print(f"  Q{d['id']:5d}  {d['module']}  actual={format_value(d['actual'])}  choice_had={d['choice_had']}")
                print(f"           '{d['choice_text']}'")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
