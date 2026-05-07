"""Audit a question ID range using the existing audit pipeline.

Usage:
  docker exec wingman-backend python /app/audit_range.py <id_min> <id_max>
"""
import asyncio
import os
import sys
import uuid

sys.path.insert(0, "/app")
from app.database import async_session  # noqa: E402
from app.services.question_audit import audit_one  # noqa: E402
from sqlalchemy import text  # noqa: E402


async def main(id_min: int, id_max: int):
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ANTHROPIC_API_KEY missing", file=sys.stderr); sys.exit(1)

    async with async_session() as db:
        rows = await db.execute(text("""
            SELECT q.id FROM questions q
            WHERE q.id BETWEEN :lo AND :hi AND q.disabled_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM question_audits qa WHERE qa.question_id = q.id)
            ORDER BY q.id
        """), {"lo": id_min, "hi": id_max})
        qids = [int(r[0]) for r in rows]
    if not qids:
        print(f"No active questions in [{id_min}..{id_max}]"); return

    print(f"Auditing {len(qids)} questions: {qids[0]}..{qids[-1]}", flush=True)
    run_id = f"range-{uuid.uuid4().hex[:8]}"
    s = {"ok": 0, "fail": 0, "leak": 0, "quarantined": 0, "errors": 0}
    by_verdict = {}
    for qid in qids:
        async with async_session() as db:
            res = await audit_one(db, qid, run_id, model="claude-sonnet-4-6")
        v = res.get("verdict")
        leak = res.get("leak"); quar = res.get("quarantined"); err = res.get("error")
        by_verdict[v] = by_verdict.get(v, 0) + 1
        if err:
            s["errors"] += 1
        elif v == "correct" and not leak:
            s["ok"] += 1
        else:
            s["fail"] += 1
        if leak: s["leak"] += 1
        if quar: s["quarantined"] += 1
        print(f"  Q{qid:5d}  v={v}  conf={res.get('confidence',0):.2f}  leak={leak}  quar={quar}", flush=True)

    print(f"\n=== summary run={run_id} ===")
    for k, v in s.items():
        print(f"  {k:<12s}: {v}")
    print(f"  by_verdict  : {by_verdict}")
    pass_rate = s["ok"] / len(qids) * 100
    print(f"  pass_rate   : {pass_rate:.0f}%  ({s['ok']}/{len(qids)})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: audit_range.py <id_min> <id_max>", file=sys.stderr); sys.exit(2)
    asyncio.run(main(int(sys.argv[1]), int(sys.argv[2])))
