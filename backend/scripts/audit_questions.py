"""
CLI driver: re-validate QBank questions and report.

Usage (from inside the backend container):

    docker exec wingman-backend python -m scripts.audit_questions \
        --sample 20 --strategy random

    docker exec wingman-backend python -m scripts.audit_questions \
        --sample 50 --strategy untested --module FSA-03

Strategies: random | newest | untested
"""

import argparse
import asyncio
import json
import sys

from app.database import async_session
from app.services.question_audit import run_audit_batch


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="QBank audit runner")
    p.add_argument("--sample", type=int, default=20, help="Number of questions to audit")
    p.add_argument(
        "--strategy",
        choices=("random", "newest", "untested"),
        default="untested",
        help="How to pick the sample",
    )
    p.add_argument("--module", type=str, default=None, help="Restrict to one LM code (e.g. FSA-03)")
    p.add_argument("--model", type=str, default="claude-sonnet-4-6",
                   help="Anthropic model id (default: sonnet-4-6 — opus-4-7 is ~5x more expensive for marginal quality gain on this task)")
    p.add_argument("--json", action="store_true", help="Emit raw JSON summary")
    p.add_argument("--force", action="store_true",
                   help="Skip the cost confirmation gate (required when est. cost > $1)")
    return p.parse_args()


async def _main() -> int:
    args = _parse_args()

    # Cost guard — show estimate and require confirmation for large batches
    # or when the user explicitly picks the expensive opus-4-7 model.
    # Numbers are rough per-question costs based on observed token usage:
    #   sonnet-4-6 audit ≈ $0.013/q   opus-4-7 audit ≈ $0.05/q
    cost_per_q = 0.05 if "opus" in args.model.lower() else 0.013
    est_usd = cost_per_q * args.sample
    if est_usd > 1.0 and not args.force:
        print(f"⚠ Estimated cost: ~${est_usd:.2f} ({args.sample} × ~${cost_per_q:.3f} on {args.model})")
        print(f"  Re-run with --force to proceed, or lower --sample.")
        return 2

    async with async_session() as db:
        summary = await run_audit_batch(
            db,
            sample_size=args.sample,
            strategy=args.strategy,
            module_code=args.module,
            model=args.model,
        )

    if args.json:
        print(json.dumps(summary, indent=2, default=str))
        return 0

    # Human-readable digest
    print(f"Run id           : {summary['run_id']}")
    print(f"Model            : {summary['model']}")
    print(f"Strategy         : {summary['strategy']} (module={summary['module_code'] or 'all'})")
    print(f"Sampled          : {summary['sampled']}")
    print(f"Audited          : {summary['audited']}")
    print(f"Errors           : {summary['errors']}")
    print(f"Non-correct      : {summary['non_correct']}")
    print(f"Auto-quarantined : {summary['quarantined']}")
    print()

    bad = [r for r in summary["results"] if r.get("verdict") not in (None, "correct")]
    if bad:
        print(f"--- Non-correct ({len(bad)}) ---")
        for r in bad:
            mark = "🚫" if r.get("quarantined") else ("⚠️ " if r.get("leak") else "•")
            verdict = r.get("verdict") or "error"
            conf = r.get("confidence")
            conf_s = f"conf={conf:.2f}" if isinstance(conf, (int, float)) else "conf=?"
            print(f"  {mark} Q{r['question_id']:>5}  {verdict:<15} {conf_s}")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
