"""
CLI driver for the v2 question generator (4 hard rules enforced).

Usage (inside the backend container):

    docker exec wingman-backend python -m scripts.generate_questions_v2 \
        --only FSA-03 --count 25

    docker exec wingman-backend python -m scripts.generate_questions_v2 \
        --only FSA-03 --count 25 --dry-run --json > batch.json

    docker exec wingman-backend python -m scripts.generate_questions_v2 \
        --count 25                                  # all modules

The generator refuses to write questions for any module with no LOS rows
(prevents the FI-15 orphan situation we saw in audit). To seed LOS first,
keep using the legacy `generate_lm_questions.py --seed-los`.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

import anthropic
import asyncpg

from app.services.question_generator import (
    DEFAULT_MODEL,
    fetch_modules,
    generate_module,
)


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Wingman QBank generator v2 — 4 hard rules")
    p.add_argument("--count",  type=int, default=20, help="Min questions per LM (default 20)")
    p.add_argument("--only",   type=str, default=None, help="Comma-separated LM codes (e.g. FSA-03,FSA-04)")
    p.add_argument("--model",  type=str, default=DEFAULT_MODEL, help="Anthropic model id")
    p.add_argument("--dry-run", action="store_true", help="Generate + validate but do NOT insert")
    p.add_argument("--json",    action="store_true", help="Emit raw JSON summary")
    return p.parse_args()


def _api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        from pathlib import Path
        env_file = Path(__file__).resolve().parents[1] / ".env"
        if env_file.exists():
            from dotenv import dotenv_values
            key = dotenv_values(str(env_file)).get("ANTHROPIC_API_KEY", "") or ""
    if not key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    return key


def _db_url() -> str:
    url = os.environ.get("DATABASE_URL", "postgresql://wingman:wingman_secret@db:5432/wingman")
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def _main() -> int:
    args = _parse_args()
    api_key = _api_key()
    only = [c.strip() for c in args.only.split(",")] if args.only else None

    conn = await asyncpg.connect(_db_url())
    modules = await fetch_modules(conn, only)
    if not modules:
        print("No matching modules.", file=sys.stderr)
        await conn.close()
        return 1

    client = anthropic.AsyncAnthropic(api_key=api_key)
    summaries = []

    if not args.json:
        print(f"Generating ≥{args.count} questions for {len(modules)} module(s) using {args.model}")
        print(f"dry-run: {'on' if args.dry_run else 'off'}")
        print("─" * 70)

    for i, module in enumerate(modules, 1):
        label = f"[{i}/{len(modules)}] {module['topic_code']}/{module['code']} — {module['title'][:50]}"
        if not args.json:
            print(label, flush=True)
        try:
            summary = await generate_module(
                conn, client, module, args.count,
                dry_run=args.dry_run, model=args.model,
            )
            summaries.append(summary)
            if not args.json:
                if summary.get("skipped"):
                    print(f"    ⊘ skipped: {summary['skipped']}")
                else:
                    print(
                        f"    → attempts={summary.get('attempts', 1)}  "
                        f"generated={summary['generated']}  "
                        f"kept={summary['kept']}  rejected={summary['rejected']}  "
                        f"inserted={summary['inserted']}"
                    )
                    if summary["rejection_breakdown"]:
                        for bucket, n in summary["rejection_breakdown"].items():
                            print(f"        ⚠ {bucket}: {n}")
        except Exception as exc:
            err = {"module_code": module["code"], "error": str(exc)[:300]}
            summaries.append(err)
            if not args.json:
                print(f"    ✗ failed: {exc}", file=sys.stderr)

    await conn.close()

    if args.json:
        # Strip kept_questions/rejected_questions unless dry-run for size.
        for s in summaries:
            if not args.dry_run:
                s.pop("kept_questions", None)
                s.pop("rejected_questions", None)
        print(json.dumps(summaries, indent=2, default=str))
    else:
        print("─" * 70)
        total_kept = sum(s.get("kept", 0) for s in summaries)
        total_inserted = sum(s.get("inserted", 0) for s in summaries)
        total_rejected = sum(s.get("rejected", 0) for s in summaries)
        print(f"Done. kept={total_kept}  inserted={total_inserted}  rejected={total_rejected}")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
