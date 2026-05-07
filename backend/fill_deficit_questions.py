"""Pilote A driver — generate hard questions for deficient LOS.

Usage (inside backend container):
  docker exec wingman-backend python /app/fill_deficit_questions.py \
      --min-score 3 --los-count 5 --questions-per-los 3 --difficulty 4 --dry-run
  docker exec wingman-backend python /app/fill_deficit_questions.py \
      --min-score 3 --los-count 5 --questions-per-los 3 --difficulty 4

Selects N LOS from the top of los_deficit_v (varied topics), then for each
module groups its target LOS and calls generate_module() with
difficulty_target. Prints per-LOS summary and totals.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime, timezone

import anthropic
import asyncpg

# Make /app importable when running via docker exec
sys.path.insert(0, "/app")
from app.services.question_generator import generate_module, fetch_module  # noqa: E402


def to_asyncpg_dsn(url: str) -> str:
    # SQLAlchemy URL → asyncpg DSN
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


async def pick_los(conn: asyncpg.Connection, min_score: int, count: int, topic: str | None) -> list[dict]:
    """Pick LOS from top of deficit ranking, spread across topics."""
    rows = await conn.fetch("""
        SELECT los_id, los_code, module_id, module_code, topic_code,
               bloom_level, active_q, hard_q, deficit_score
        FROM los_deficit_v
        WHERE deficit_score >= $1
        AND ($2::text IS NULL OR topic_code = $2::text)
        ORDER BY deficit_score DESC, attempts_total DESC, los_code
    """, min_score, topic)
    if not rows:
        return []

    # Spread across topics: round-robin pick from per-topic queues
    by_topic: dict[str, list[asyncpg.Record]] = {}
    for r in rows:
        by_topic.setdefault(r["topic_code"], []).append(r)
    picked: list[dict] = []
    topics_cycle = list(by_topic.keys())
    while len(picked) < count and any(by_topic.values()):
        for tc in topics_cycle:
            if not by_topic[tc]:
                continue
            picked.append(dict(by_topic[tc].pop(0)))
            if len(picked) >= count:
                break
    return picked


async def main():
    p = argparse.ArgumentParser()
    p.add_argument("--min-score", type=int, default=3)
    p.add_argument("--los-count", type=int, default=5, help="how many LOS to target")
    p.add_argument("--questions-per-los", type=int, default=3)
    p.add_argument("--difficulty", type=int, default=4, help="target difficulty (1-5)")
    p.add_argument("--topic", default=None, help="restrict to one topic_code")
    p.add_argument("--dry-run", action="store_true", help="don't insert into DB")
    args = p.parse_args()

    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ANTHROPIC_API_KEY missing", file=sys.stderr)
        sys.exit(1)

    conn = await asyncpg.connect(to_asyncpg_dsn(db_url))
    try:
        los_picked = await pick_los(conn, args.min_score, args.los_count, args.topic)
        if not los_picked:
            print(f"No LOS found at min_score={args.min_score}", file=sys.stderr)
            return

        print(f"\n═══ Pilote A driver — {len(los_picked)} LOS, target diff {args.difficulty}, dry_run={args.dry_run} ═══\n")
        for lo in los_picked:
            print(f"  {lo['topic_code']:5s} {lo['los_code']:14s} bloom={lo['bloom_level']} score={lo['deficit_score']}  module={lo['module_code']}")
        print()

        # Group by module
        by_module: dict[str, list[dict]] = {}
        for lo in los_picked:
            by_module.setdefault(lo["module_code"], []).append(lo)

        client = anthropic.AsyncAnthropic(api_key=api_key)
        started_at = datetime.now(timezone.utc)
        all_results: list[dict] = []

        for mod_code, los_subset in by_module.items():
            module = await fetch_module(conn, mod_code)
            if not module:
                print(f"  [skip] module not found: {mod_code}")
                continue
            count = len(los_subset) * args.questions_per_los
            only_codes = [l["los_code"] for l in los_subset]
            print(f"  ▶ {mod_code} — {len(only_codes)} LOS × {args.questions_per_los}q = {count} target …", flush=True)
            res = await generate_module(
                conn=conn,
                client=client,
                module=module,
                count=count,
                dry_run=args.dry_run,
                difficulty_target=args.difficulty,
                only_los_codes=only_codes,
            )
            all_results.append(res)
            print(f"    generated={res.get('generated', 0)}  kept={res.get('kept', 0)}  "
                  f"rejected={res.get('rejected', 0)}  inserted={res.get('inserted', 0)}  "
                  f"attempts={res.get('attempts', '?')}")
            for q in (res.get("kept_questions") or []):
                print(f"      [kept diff={q.get('difficulty')}] {q.get('los_code')} — {q.get('stem','')[:80]}…")
            for r in (res.get("rejected_questions") or [])[:3]:
                print(f"      [rej {r.get('_reject_code')}] {r.get('los_code','?')} — {r.get('_reject_reason','')}")

        finished_at = datetime.now(timezone.utc)
        total_kept = sum(r.get("kept", 0) for r in all_results)
        total_inserted = sum(r.get("inserted", 0) for r in all_results)
        total_rejected = sum(r.get("rejected", 0) for r in all_results)
        elapsed = (finished_at - started_at).total_seconds()
        print(f"\n═══ TOTAL ═══  kept={total_kept}  rejected={total_rejected}  inserted={total_inserted}  "
              f"in {elapsed:.1f}s")
        print(f"Started:  {started_at.isoformat()}")
        print(f"Finished: {finished_at.isoformat()}")
        print(f"Use this timestamp window to pull the new questions for inspection.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
