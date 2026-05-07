"""Generate N hard questions for a single module.

Pipeline:
  • Validation rules 1-5 (existing)
  • Corrector pipeline — rewrites correct choice if calc drift, marks [CONTESTED]
  • Belt audit — flags additional issues
  • Difficulty filter (>= target)

Usage:
  docker exec wingman-backend python /app/gen_module_calc.py <MODULE_CODE> <COUNT> [DIFFICULTY] [--mixed]

  --mixed allows conceptual questions (default: calc-only via require_calculation=True).

Examples:
  docker exec wingman-backend python /app/gen_module_calc.py DER-09 20 4           # calc-only
  docker exec wingman-backend python /app/gen_module_calc.py ALT-07 10 4 --mixed   # calc + conceptual
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timezone

import anthropic
import asyncpg

sys.path.insert(0, "/app")
from app.services.question_generator import generate_module, fetch_module  # noqa: E402


def to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


async def main(module_code: str, count: int, difficulty: int, mixed: bool = False):
    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ANTHROPIC_API_KEY missing", file=sys.stderr); sys.exit(1)

    conn = await asyncpg.connect(to_asyncpg_dsn(db_url))
    try:
        module = await fetch_module(conn, module_code)
        if not module:
            print(f"module {module_code!r} not found", file=sys.stderr); sys.exit(2)

        mode = "mixed (calc + conceptual)" if mixed else "calc-only"
        print(f"\n=== Generation: {module_code} — {count} questions, diff>={difficulty}, mode={mode} ===")
        client = anthropic.AsyncAnthropic(api_key=api_key)
        started = datetime.now(timezone.utc)

        res = await generate_module(
            conn=conn, client=client, module=module,
            count=count, dry_run=False,
            difficulty_target=difficulty,
            require_calculation=not mixed,
        )

        ended = datetime.now(timezone.utc)
        print(f"\nResult:")
        print(f"  generated   : {res.get('generated', 0)}")
        print(f"  kept        : {res.get('kept', 0)}")
        print(f"  rejected    : {res.get('rejected', 0)}")
        print(f"  inserted    : {res.get('inserted', 0)}")
        print(f"  attempts    : {res.get('attempts', '?')}")
        print(f"  rejection_breakdown: {res.get('rejection_breakdown', {})}")
        print(f"  elapsed     : {(ended - started).total_seconds():.1f}s")
    finally:
        await conn.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    if len(args) < 2:
        print(f"usage: {sys.argv[0]} <MODULE_CODE> <COUNT> [DIFFICULTY] [--mixed]", file=sys.stderr); sys.exit(2)
    code = args[0]
    n = int(args[1])
    diff = int(args[2]) if len(args) > 2 else 4
    mixed = "--mixed" in flags
    asyncio.run(main(code, n, diff, mixed))
