"""Option B generator — produce 5-7 LOS per module via Claude Sonnet 4.6.

Reads modules from DB, calls Claude in parallel, writes JSON to stdout.
Run: docker exec wingman-backend python /app/gen_los_b.py > /tmp/los_compare/B.json
"""
from __future__ import annotations

import asyncio
import json
import os
import sys

import anthropic
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

MODEL = os.environ.get("LOS_MODEL", "claude-sonnet-4-6")

TARGET_MODULES = [
    "FSA-11", "FSA-12",
    "CORP-06", "CORP-07",
    "EQU-07", "EQU-08",
    "FI-11", "FI-12", "FI-13", "FI-14", "FI-15", "FI-16", "FI-17", "FI-18", "FI-19",
    "DER-05", "DER-06", "DER-07", "DER-08", "DER-09", "DER-10",
    "ALT-04", "ALT-05", "ALT-06", "ALT-07",
    "PM-05", "PM-06",
]

PROMPT_TMPL = """You are an expert author of CFA Level I curriculum content.

Generate 5 to 7 Learning Outcome Statements (LOS) for the module below, matching
the density and depth of the official 2025 CFA L1 curriculum.

Module: {code} — "{title}"
Topic: {topic_name}

Hard rules:
1. Each LOS starts with a CFA Bloom command verb: Describe, Explain, Calculate,
   Compare, Distinguish, Identify, Interpret, Evaluate, Analyze, Apply,
   Determine, Demonstrate, Estimate, Define.
2. Each LOS is testable (a candidate could be examined on it directly).
3. LOS together cover the full breadth of the module — no obvious gap, no overlap.
4. Use a mix of Bloom levels (2=Understand, 3=Apply, 4=Analyze, 5=Evaluate).
   At least one LOS at level 3+ for any module that has computational content.
5. No vague phrasing ("understand the concepts of X" is forbidden).
6. Match the style of: "Calculate and interpret the no-arbitrage forward price
   given the spot price, risk-free rate, and carry costs or benefits."

Return ONLY a JSON object, no prose, no markdown:
{{
  "los": [
    {{"description": "<full LOS text>", "bloom_level": <2-6>}},
    ...
  ]
}}
"""


async def fetch_modules() -> list[dict]:
    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman@db:5432/wingman")
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        codes_csv = "','".join(TARGET_MODULES)
        result = await conn.execute(text(f"""
            SELECT lm.code, lm.title, t.code AS topic_code, t.name AS topic_name
            FROM learning_modules lm
            JOIN topics t ON t.id = lm.topic_id
            WHERE lm.code IN ('{codes_csv}')
            ORDER BY t.sort_order, lm.sort_order
        """))
        rows = [dict(r) for r in result.mappings().all()]
    await engine.dispose()
    return rows


async def gen_one(client: anthropic.AsyncAnthropic, sem: asyncio.Semaphore, mod: dict) -> dict:
    async with sem:
        prompt = PROMPT_TMPL.format(
            code=mod["code"],
            title=mod["title"],
            topic_name=mod["topic_name"],
        )
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=1500,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )
        text_out = msg.content[0].text.strip()
        # strip code fences if present
        if text_out.startswith("```"):
            text_out = text_out.split("```", 2)[1]
            if text_out.startswith("json"):
                text_out = text_out[4:]
            text_out = text_out.rsplit("```", 1)[0]
        try:
            data = json.loads(text_out.strip())
        except json.JSONDecodeError as e:
            data = {"error": str(e), "raw": text_out}
        return {
            "module_code": mod["code"],
            "module_title": mod["title"],
            "topic_code": mod["topic_code"],
            "input_tokens": msg.usage.input_tokens,
            "output_tokens": msg.usage.output_tokens,
            "model": msg.model,
            **data,
        }


async def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ANTHROPIC_API_KEY missing", file=sys.stderr)
        sys.exit(1)

    modules = await fetch_modules()
    print(f"Fetched {len(modules)} modules", file=sys.stderr)
    if len(modules) != 27:
        print(f"WARN: expected 27, got {len(modules)}", file=sys.stderr)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    sem = asyncio.Semaphore(5)
    results = await asyncio.gather(*[gen_one(client, sem, m) for m in modules])

    total_in = sum(r.get("input_tokens", 0) for r in results)
    total_out = sum(r.get("output_tokens", 0) for r in results)
    print(f"Total tokens: in={total_in} out={total_out}", file=sys.stderr)

    json.dump({"model": MODEL, "results": results}, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    asyncio.run(main())
