"""Audit the 29 pilot-A questions inserted on 2026-05-05.

Uses the existing question_audit pipeline (Sonnet 4.6).
"""
import asyncio
import os
import sys
import uuid

sys.path.insert(0, "/app")
from app.database import async_session  # noqa: E402
from app.services.question_audit import audit_one  # noqa: E402
from sqlalchemy import text  # noqa: E402


PILOT_ID_MIN = 3408
PILOT_ID_MAX = 3436


async def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ANTHROPIC_API_KEY missing", file=sys.stderr)
        sys.exit(1)

    async with async_session() as db:
        rows = await db.execute(text("""
            SELECT q.id FROM questions q
            WHERE q.id BETWEEN :lo AND :hi AND q.disabled_at IS NULL
            ORDER BY q.id
        """), {"lo": PILOT_ID_MIN, "hi": PILOT_ID_MAX})
        qids = [int(r[0]) for r in rows]
    if not qids:
        print(f"No questions to audit in [{PILOT_ID_MIN}..{PILOT_ID_MAX}]", file=sys.stderr)
        return
    print(f"Auditing {len(qids)} questions: {qids[0]}…{qids[-1]}", flush=True)

    run_id = f"pilot-a-{uuid.uuid4().hex[:8]}"
    summary = {"ok": 0, "fail": 0, "leak": 0, "quarantined": 0, "errors": 0}
    for qid in qids:
        async with async_session() as db:
            res = await audit_one(db, qid, run_id, model="claude-sonnet-4-6")
        verdict = res.get("verdict")
        leak = res.get("leak")
        quar = res.get("quarantined")
        err = res.get("error")
        if err:
            summary["errors"] += 1
            print(f"  Q{qid:5d}  ERROR  {err[:80]}", flush=True)
            continue
        if verdict == "correct" and not leak:
            summary["ok"] += 1
        else:
            summary["fail"] += 1
        if leak:
            summary["leak"] += 1
        if quar:
            summary["quarantined"] += 1
        print(f"  Q{qid:5d}  verdict={verdict:<15s} conf={res.get('confidence',0):.2f}  leak={leak}  quarantined={quar}", flush=True)

    print(f"\n═══ Audit summary ═══  run={run_id}")
    print(f"  ok          : {summary['ok']}")
    print(f"  fail        : {summary['fail']}")
    print(f"  leak        : {summary['leak']}")
    print(f"  quarantined : {summary['quarantined']}")
    print(f"  errors      : {summary['errors']}")


if __name__ == "__main__":
    asyncio.run(main())
