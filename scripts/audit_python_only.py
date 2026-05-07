"""Cost-free Python-only audit on every active question.

Checks:
  HIGH-CONFIDENCE (would mark stem with [CONTESTED]):
    - calc_drift     : python_expr value disagrees with marked-correct choice (calc_metadata only)
    - calc_uneval    : python_expr fails to evaluate (variables, syntax)
    - leak_stem      : chain-of-thought leak in stem
    - leak_explanation : leak in explanation
    - distractor_dup : choice_a / b / c not all unique

  INFORMATIVE (counted only, no flag):
    - citation_invalid : standard_citation does not match a known standard regex
    - anchor_off_topic : los_anchor shares too few words with LOS description
    - stem_too_short / expl_too_short

Usage:
  docker exec wingman-backend python /app/audit_python_only.py
  docker exec wingman-backend python /app/audit_python_only.py --apply

Optional filters:
  --since 2026-05-05    only audit questions generated on/after that date
  --version v2.4        only that generator_version
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from collections import defaultdict
from datetime import datetime

import asyncpg

sys.path.insert(0, "/app")
from app.services.question_python_audit import (  # noqa: E402
    audit_question_dict, HIGH_CONF_FLAGS, CONTESTED_MARKER as MARKER,
)


def to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true", help="append [CONTESTED] to stems with high-confidence issues")
    p.add_argument("--since", default=None, help="ISO date, e.g. 2026-05-05")
    p.add_argument("--version", default=None, help="generator_version filter")
    args = p.parse_args()

    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman")
    conn = await asyncpg.connect(to_asyncpg_dsn(db_url))
    try:
        sql = """
            SELECT q.id, q.stem, q.choice_a, q.choice_b, q.choice_c,
                   q.correct_answer, q.explanation, q.los_anchor,
                   q.standard_citation, q.calc_metadata, q.generator_version,
                   lo.description AS los_description
            FROM questions q
            LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
            WHERE q.disabled_at IS NULL
        """
        params: list = []
        if args.since:
            params.append(datetime.fromisoformat(args.since))
            sql += f" AND q.generated_at >= ${len(params)}"
        if args.version:
            params.append(args.version)
            sql += f" AND q.generator_version = ${len(params)}"
        sql += " ORDER BY q.id"
        rows = await conn.fetch(sql, *params)

        # Audit
        counts: dict[str, int] = defaultdict(int)
        per_q: dict[int, list[str]] = {}
        marker_eligible: set[int] = set()
        for r in rows:
            issues = audit_question_dict(dict(r))
            if not issues:
                continue
            per_q[r["id"]] = issues
            for i in issues:
                counts[i] += 1
            if any(i in HIGH_CONF_FLAGS for i in issues):
                if MARKER not in (r["stem"] or ""):
                    marker_eligible.add(r["id"])

        # Report
        print(f"\n=== Python-only audit {'(APPLY)' if args.apply else '(DRY-RUN)'} ===")
        print(f"  audited       : {len(rows)}")
        print(f"  with_issues   : {len(per_q)}")
        print(f"  marker_target : {len(marker_eligible)}  (high-confidence + no marker yet)")
        print(f"\n  by_issue:")
        for code, n in sorted(counts.items(), key=lambda kv: -kv[1]):
            tag = "🚩" if code in HIGH_CONF_FLAGS else "  "
            print(f"    {tag} {code:<22s} {n}")

        # Apply
        if args.apply and marker_eligible:
            applied = 0
            stems_by_id = {r["id"]: r["stem"] or "" for r in rows}
            for qid in marker_eligible:
                stem = stems_by_id[qid]
                if MARKER in stem:
                    continue
                new_stem = stem.rstrip() + " " + MARKER
                await conn.execute("UPDATE questions SET stem = $1 WHERE id = $2", new_stem, qid)
                applied += 1
            print(f"\n  applied: {applied} stems updated with {MARKER}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
