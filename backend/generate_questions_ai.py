#!/usr/bin/env python3
"""
CFA Level I Question Bank Generator using Anthropic Claude API.
Generates 100 QBANK + 100 MOCK questions per learning module.
Inserts directly into PostgreSQL.
"""
import os
import sys
import json
import time
import asyncio
import anthropic
import asyncpg

# ── Config ──────────────────────────────────────────────────
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://wingman:wingman_secret@db:5432/wingman")
MODEL = "claude-sonnet-4-20250514"
BATCH_SIZE = 25  # questions per API call
QBANK_TARGET = 100
MOCK_TARGET = 100

# Convert asyncpg URL format
DB_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


SYSTEM_PROMPT = """You are an expert CFA Level I exam question writer. You create high-quality multiple-choice questions that closely mirror the style, difficulty, and content of real CFA Institute exams.

Rules:
1. Each question must have exactly 3 choices: A, B, C
2. Exactly one answer is correct
3. Questions must be specific, testing actual CFA L1 curriculum knowledge
4. Distractors (wrong answers) should be plausible and based on common mistakes
5. Explanations must be clear and educational
6. Difficulty ranges from 1 (easy recall) to 5 (complex application)
7. Mix question types: conceptual, calculation, application, interpretation
8. For calculation questions, include specific numbers and show the math in explanations
9. Never repeat the same question concept within a batch

Return ONLY a valid JSON array of objects with these exact keys:
{"stem": "...", "a": "...", "b": "...", "c": "...", "correct": "A|B|C", "explanation": "...", "difficulty": 1-5}"""


def get_module_prompt(module_code: str, module_title: str, question_type: str, batch_num: int, total_batches: int) -> str:
    type_desc = {
        "qbank": "practice questions for study and review. Include a mix of easy (30%), medium (50%), and hard (20%) questions. Focus on building understanding of core concepts.",
        "mock": "exam-simulation questions matching real CFA exam difficulty. Include 20% easy, 40% medium, and 40% hard questions. Focus on application, analysis, and tricky distractors."
    }

    return f"""Generate exactly {BATCH_SIZE} unique CFA Level I {question_type.upper()} questions for:

Module: {module_code} — {module_title}
Type: {type_desc[question_type]}
Batch: {batch_num}/{total_batches} — make these questions DIFFERENT from other batches. {"Focus on foundational concepts and definitions." if batch_num == 1 else "Focus on calculations and numerical problems." if batch_num == 2 else "Focus on application scenarios and case-based questions." if batch_num == 3 else "Focus on tricky edge cases and common exam pitfalls."}

Return a JSON array of {BATCH_SIZE} question objects. No markdown, no code fences, just the JSON array."""


async def generate_batch(client: anthropic.Anthropic, module_code: str, module_title: str, question_type: str, batch_num: int, total_batches: int) -> list:
    """Generate a batch of questions using Claude API."""
    prompt = get_module_prompt(module_code, module_title, question_type, batch_num, total_batches)

    for attempt in range(3):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=8000,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )

            text = response.content[0].text.strip()
            # Remove markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

            questions = json.loads(text)

            # Validate
            valid = []
            for q in questions:
                if all(k in q for k in ("stem", "a", "b", "c", "correct", "explanation", "difficulty")):
                    if q["correct"] in ("A", "B", "C") and 1 <= q["difficulty"] <= 5:
                        valid.append(q)

            print(f"    ✓ {module_code} {question_type} batch {batch_num}: {len(valid)} valid questions")
            return valid

        except json.JSONDecodeError as e:
            print(f"    ✗ {module_code} {question_type} batch {batch_num}: JSON parse error (attempt {attempt+1})")
            if attempt < 2:
                time.sleep(2)
        except anthropic.RateLimitError:
            print(f"    ⏳ Rate limited, waiting 30s...")
            time.sleep(30)
        except Exception as e:
            print(f"    ✗ {module_code} {question_type} batch {batch_num}: {e} (attempt {attempt+1})")
            if attempt < 2:
                time.sleep(5)

    return []


async def insert_questions(pool: asyncpg.Pool, module_id: int, questions: list, question_type: str):
    """Insert questions into the database."""
    async with pool.acquire() as conn:
        for q in questions:
            await conn.execute(
                """INSERT INTO questions (module_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty, question_type)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                module_id, q["stem"], q["a"], q["b"], q["c"],
                q["correct"], q["explanation"], q["difficulty"], question_type
            )


async def main():
    if not API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    print(f"Connecting to DB: {DB_URL}")
    pool = await asyncpg.create_pool(DB_URL, min_size=1, max_size=3)

    # Get all modules
    async with pool.acquire() as conn:
        modules = await conn.fetch(
            "SELECT lm.id, lm.code, lm.title, t.code as topic FROM learning_modules lm JOIN topics t ON t.id = lm.topic_id ORDER BY t.sort_order, lm.sort_order"
        )
        # Check existing question counts
        existing = await conn.fetch(
            "SELECT module_id, question_type, COUNT(*) as cnt FROM questions GROUP BY module_id, question_type"
        )

    existing_map = {}
    for row in existing:
        key = (row["module_id"], row["question_type"])
        existing_map[key] = row["cnt"]

    client = anthropic.Anthropic(api_key=API_KEY)

    total_generated = 0
    total_modules = len(modules)

    for idx, mod in enumerate(modules):
        module_id = mod["id"]
        module_code = mod["code"]
        module_title = mod["title"]
        topic = mod["topic"]

        print(f"\n[{idx+1}/{total_modules}] {module_code} — {module_title}")

        for qtype, target in [("qbank", QBANK_TARGET), ("mock", MOCK_TARGET)]:
            existing_count = existing_map.get((module_id, qtype), 0)
            needed = target - existing_count

            if needed <= 0:
                print(f"  {qtype}: already has {existing_count} questions, skipping")
                continue

            print(f"  {qtype}: need {needed} more (have {existing_count})")

            num_batches = (needed + BATCH_SIZE - 1) // BATCH_SIZE
            all_questions = []

            for batch_num in range(1, num_batches + 1):
                batch = await generate_batch(client, module_code, module_title, qtype, batch_num, num_batches)
                all_questions.extend(batch)

                # Respect rate limits
                time.sleep(1)

            # Trim to exactly what we need
            all_questions = all_questions[:needed]

            if all_questions:
                await insert_questions(pool, module_id, all_questions, qtype)
                total_generated += len(all_questions)
                print(f"  → Inserted {len(all_questions)} {qtype} questions")

    await pool.close()
    print(f"\n{'='*50}")
    print(f"DONE! Total questions generated: {total_generated}")
    print(f"{'='*50}")


if __name__ == "__main__":
    asyncio.run(main())
