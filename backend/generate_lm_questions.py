#!/usr/bin/env python3
"""
Generate ≥20 CFA Level I questions per Learning Module using Claude (Sonnet 4.6).

- No back office. Run directly: `python generate_lm_questions.py [--only QM-01,FSA-03]`
- One API call per LM. Prompt caching keeps the system prompt + rules stable.
- Each question is tagged with a LOS code (Claude infers LOS for the module).
- Optional: --seed-los also inserts inferred LOS rows into learning_outcomes.

Usage examples:
  python generate_lm_questions.py                         # all LMs, ≥20 questions each
  python generate_lm_questions.py --count 30              # ≥30 per LM
  python generate_lm_questions.py --only QM-01,QM-02      # selected LMs only
  python generate_lm_questions.py --only QM-01 --seed-los # also seed LOS rows
  python generate_lm_questions.py --dry-run               # print, don't insert
"""
import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

import anthropic
import asyncpg
from dotenv import dotenv_values

# ── Config ──────────────────────────────────────────────────
MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 12000
MIN_QUESTIONS_PER_LM = 20

_ENV_FILE = Path(__file__).parent / ".env"
_env = dotenv_values(str(_ENV_FILE)) if _ENV_FILE.exists() else {}
API_KEY = os.environ.get("ANTHROPIC_API_KEY") or _env.get("ANTHROPIC_API_KEY", "")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://wingman:wingman_secret@localhost:5432/wingman")
DB_URL = DB_URL.replace("postgresql+asyncpg://", "postgresql://")


SYSTEM_PROMPT = """You are an expert CFA Level I exam writer. You generate multiple-choice questions that mirror the style, difficulty distribution, and content depth of real CFA Institute exams.

Hard rules (enforced):
1. Exactly 3 choices per question: A, B, C — exactly one correct.
2. Each question must test a real CFA L1 Learning Outcome Statement (LOS) for the specified module. Tag every question with the LOS code and a short LOS description.
3. Distribute questions across ALL LOS of the module — do not over-concentrate on one LOS.
4. Difficulty spread per batch: ~20% easy (1-2), ~50% medium (3), ~30% hard (4-5).
5. Mix question types: conceptual, calculation, application, interpretation. For calculations, include real numbers and show the math in the explanation.
6. Distractors must be plausible, based on common candidate mistakes (sign errors, wrong formula, confused concepts).
7. Explanations must be clear, educational, and reference the core CFA concept.
8. No duplicates within a batch; do not paraphrase the same scenario twice.
9. Language: English.

You will emit questions only via the `emit_question_batch` tool. Do not produce text outside the tool call."""


QUESTION_TOOL = {
    "name": "emit_question_batch",
    "description": "Emit a batch of CFA Level I questions for the requested Learning Module.",
    "input_schema": {
        "type": "object",
        "properties": {
            "module_code": {"type": "string"},
            "inferred_los": {
                "type": "array",
                "description": "All LOS codes+descriptions you inferred for this module. Use format LM-letter, e.g. QM01-a.",
                "items": {
                    "type": "object",
                    "properties": {
                        "los_code": {"type": "string"},
                        "description": {"type": "string"},
                        "bloom_level": {"type": "integer", "minimum": 1, "maximum": 6},
                    },
                    "required": ["los_code", "description", "bloom_level"],
                },
            },
            "questions": {
                "type": "array",
                "minItems": MIN_QUESTIONS_PER_LM,
                "items": {
                    "type": "object",
                    "properties": {
                        "stem": {"type": "string"},
                        "choice_a": {"type": "string"},
                        "choice_b": {"type": "string"},
                        "choice_c": {"type": "string"},
                        "correct_answer": {"type": "string", "enum": ["A", "B", "C"]},
                        "explanation": {"type": "string"},
                        "difficulty": {"type": "integer", "minimum": 1, "maximum": 5},
                        "los_code": {"type": "string"},
                    },
                    "required": ["stem", "choice_a", "choice_b", "choice_c", "correct_answer", "explanation", "difficulty", "los_code"],
                },
            },
        },
        "required": ["module_code", "inferred_los", "questions"],
    },
}


async def fetch_modules(conn, only: list[str] | None) -> list[dict]:
    rows = await conn.fetch("""
        SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name
        FROM learning_modules lm JOIN topics t ON t.id = lm.topic_id
        ORDER BY t.sort_order, lm.sort_order
    """)
    modules = [dict(r) for r in rows]
    if only:
        want = {c.strip().upper() for c in only}
        modules = [m for m in modules if m["code"].upper() in want]
    return modules


def build_user_message(module: dict, count: int) -> str:
    return f"""Generate at least {count} unique CFA Level I questions for this module.

Module code: {module["code"]}
Module title: {module["title"]}
Topic: {module["topic_code"]} — {module["topic_name"]}

Inferring LOS: list ALL Learning Outcome Statements you know for this module in `inferred_los`, then distribute questions evenly across them. Aim for at least 2 questions per LOS when possible.

Emit exactly one `emit_question_batch` tool call. Do NOT output any text outside the tool call."""


async def generate_for_module(client: anthropic.AsyncAnthropic, module: dict, count: int) -> dict:
    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        tools=[QUESTION_TOOL],
        tool_choice={"type": "tool", "name": "emit_question_batch"},
        messages=[{"role": "user", "content": build_user_message(module, count)}],
    )
    for block in response.content:
        if block.type == "tool_use" and block.name == "emit_question_batch":
            return block.input
    raise RuntimeError(f"No tool call in response for {module['code']}")


async def insert_questions(conn, module: dict, batch: dict, seed_los: bool) -> tuple[int, int]:
    inserted_los = 0
    inserted_q = 0

    los_id_by_code: dict[str, int] = {}

    if seed_los:
        for los in batch.get("inferred_los", []):
            row = await conn.fetchrow("""
                INSERT INTO learning_outcomes (module_id, code, description, bloom_level)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description
                RETURNING id
            """, module["id"], los["los_code"], los["description"], los["bloom_level"])
            los_id_by_code[los["los_code"]] = row["id"]
            inserted_los += 1

    for q in batch.get("questions", []):
        outcome_id = los_id_by_code.get(q["los_code"]) if seed_los else None
        await conn.execute("""
            INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c,
                                   correct_answer, explanation, difficulty)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """, module["id"], outcome_id, q["stem"], q["choice_a"], q["choice_b"], q["choice_c"],
             q["correct_answer"], q["explanation"], q["difficulty"])
        inserted_q += 1

    return inserted_los, inserted_q


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=MIN_QUESTIONS_PER_LM, help="Minimum questions per LM (default 20)")
    parser.add_argument("--only", type=str, default=None, help="Comma-separated LM codes (e.g. QM-01,QM-02)")
    parser.add_argument("--seed-los", action="store_true", help="Also insert inferred LOS into learning_outcomes")
    parser.add_argument("--dry-run", action="store_true", help="Generate but don't insert")
    parser.add_argument("--dump", type=str, default=None, help="Also dump batches to JSON file")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set in env or backend/.env", file=sys.stderr)
        sys.exit(1)

    only = args.only.split(",") if args.only else None
    conn = await asyncpg.connect(DB_URL)
    modules = await fetch_modules(conn, only)
    if not modules:
        print("No modules matched.", file=sys.stderr)
        await conn.close()
        sys.exit(1)

    print(f"Generating ≥{args.count} questions for {len(modules)} module(s) using {MODEL}")
    print(f"LOS seeding: {'on' if args.seed_los else 'off'} · dry-run: {'on' if args.dry_run else 'off'}")
    print("─" * 70)

    client = anthropic.AsyncAnthropic(api_key=API_KEY)
    totals = {"modules": 0, "los": 0, "questions": 0, "failed": 0}
    all_batches = []

    for i, module in enumerate(modules, 1):
        label = f"[{i}/{len(modules)}] {module['topic_code']}/{module['code']} — {module['title'][:50]}"
        print(f"{label}", flush=True)
        try:
            batch = await generate_for_module(client, module, args.count)
            n_los = len(batch.get("inferred_los", []))
            n_q = len(batch.get("questions", []))
            print(f"    → {n_los} LOS inferred, {n_q} questions generated")

            if args.dump:
                all_batches.append({"module_code": module["code"], **batch})

            if not args.dry_run:
                los_ins, q_ins = await insert_questions(conn, module, batch, args.seed_los)
                print(f"    ✓ inserted: {los_ins} LOS, {q_ins} questions")
                totals["los"] += los_ins
                totals["questions"] += q_ins
            totals["modules"] += 1
        except Exception as e:
            print(f"    ✗ failed: {e}", file=sys.stderr)
            totals["failed"] += 1

    if args.dump:
        Path(args.dump).write_text(json.dumps(all_batches, indent=2))
        print(f"\nDumped raw batches → {args.dump}")

    await conn.close()
    print("─" * 70)
    print(f"Done. {totals['modules']}/{len(modules)} modules OK, {totals['failed']} failed.")
    print(f"Inserted: {totals['los']} LOS, {totals['questions']} questions.")


if __name__ == "__main__":
    asyncio.run(main())
