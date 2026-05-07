#!/usr/bin/env python3
"""
Generate 100 questions per learning module using Claude API.
Run: python generate_questions.py

Requires:
  pip install anthropic psycopg2-binary
  Docker DB running on localhost:5432
"""

import json
import os
import sys
import time
import psycopg2
from psycopg2.extras import RealDictCursor

# ── CONFIG ──
DB_URL = "postgresql://wingman:wingman_secret@localhost:5432/wingman"
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
TARGET_PER_MODULE = 100
BATCH_SIZE = 15  # questions per API call
MODEL = "claude-sonnet-4-20250514"

# Read API key from .env if not in environment
if not API_KEY:
    try:
        with open(os.path.join(os.path.dirname(__file__), ".env")) as f:
            for line in f:
                if line.startswith("ANTHROPIC_API_KEY="):
                    API_KEY = line.strip().split("=", 1)[1]
    except FileNotFoundError:
        pass

if not API_KEY or API_KEY == "sk-REPLACE_ME":
    print("ERROR: Set ANTHROPIC_API_KEY in .env or environment")
    sys.exit(1)

import anthropic
client = anthropic.Anthropic(api_key=API_KEY)


def get_db():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)


def get_modules(conn):
    """Get all learning modules with topic info."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name, t.weight_pct
            FROM learning_modules lm
            JOIN topics t ON lm.topic_id = t.id
            ORDER BY t.sort_order, lm.sort_order
        """)
        return cur.fetchall()


def get_outcomes(conn, module_id):
    """Get learning outcomes for a module."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, code, description, bloom_level
            FROM learning_outcomes WHERE module_id = %s ORDER BY sort_order
        """, (module_id,))
        return cur.fetchall()


def count_questions(conn, module_id):
    """Count existing questions for a module."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) AS cnt FROM questions WHERE module_id = %s", (module_id,))
        return cur.fetchone()["cnt"]


def generate_batch(module, outcomes, batch_size, difficulty_mix, existing_count):
    """Call Claude API to generate a batch of questions."""
    los_text = "\n".join([
        f"- {o['code']} (Bloom {o['bloom_level']}): {o['description']}"
        for o in outcomes
    ])

    prompt = f"""Generate exactly {batch_size} high-quality CFA Level I exam-style multiple-choice questions.

**Module**: {module['code']} — {module['title']}
**Topic**: {module['topic_code']} — {module['topic_name']} (Exam weight: {module['weight_pct']}%)
**Difficulty mix**: {difficulty_mix}
**This module already has {existing_count} questions. Generate NEW, DIFFERENT questions.**

**Learning Outcome Statements (LOS) — distribute questions across ALL of them**:
{los_text}

**Requirements**:
- Each question MUST specify which LOS it tests via outcome_code
- 3 answer choices (A, B, C) — only one correct
- Include a detailed explanation for the correct answer
- Use concrete numbers, real-world scenarios, and calculations
- Avoid repeating question patterns — each question should test a unique angle
- CFA Level I exam realistic style
- Questions should be diverse: some conceptual, some calculation-based, some scenario-based

Return ONLY a JSON array (no markdown):
[{{"outcome_code":"XX-NN-LONN","stem":"...","choice_a":"...","choice_b":"...","choice_c":"...","correct_answer":"A","explanation":"...","difficulty":3}}]"""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        questions = json.loads(raw)
        tokens = response.usage.input_tokens + response.usage.output_tokens
        return questions, tokens
    except json.JSONDecodeError as e:
        print(f"    JSON parse error: {e}")
        return [], 0
    except Exception as e:
        print(f"    API error: {e}")
        return [], 0


def insert_questions(conn, module_id, questions, outcome_lookup):
    """Insert generated questions into DB."""
    inserted = 0
    with conn.cursor() as cur:
        for q in questions:
            outcome_id = outcome_lookup.get(q.get("outcome_code"))
            if not outcome_id:
                # Fallback: first outcome
                outcome_id = list(outcome_lookup.values())[0] if outcome_lookup else None

            try:
                cur.execute("""
                    INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c,
                                           correct_answer, explanation, difficulty)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    module_id, outcome_id,
                    q["stem"], q["choice_a"], q["choice_b"], q["choice_c"],
                    q["correct_answer"].upper(), q["explanation"],
                    q.get("difficulty", 3),
                ))
                inserted += 1
            except Exception as e:
                print(f"    Insert error: {e}")
    conn.commit()
    return inserted


def main():
    conn = get_db()
    modules = get_modules(conn)

    print(f"{'='*60}")
    print(f"  WINGMAN QUESTION GENERATOR")
    print(f"  Target: {TARGET_PER_MODULE} questions per module")
    print(f"  Modules: {len(modules)}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"{'='*60}\n")

    total_generated = 0
    total_tokens = 0
    total_skipped = 0

    for i, mod in enumerate(modules, 1):
        existing = count_questions(conn, mod["id"])
        needed = max(0, TARGET_PER_MODULE - existing)

        if needed == 0:
            print(f"[{i:2}/{len(modules)}] {mod['code']:8} — {existing:3} questions (FULL, skip)")
            total_skipped += 1
            continue

        outcomes = get_outcomes(conn, mod["id"])
        if not outcomes:
            print(f"[{i:2}/{len(modules)}] {mod['code']:8} — NO OUTCOMES (skip)")
            total_skipped += 1
            continue

        outcome_lookup = {o["code"]: o["id"] for o in outcomes}

        print(f"[{i:2}/{len(modules)}] {mod['code']:8} — {existing:3} existing, generating {needed}...")

        mod_generated = 0
        mod_tokens = 0
        batch_num = 0

        while mod_generated < needed:
            batch_num += 1
            remaining = needed - mod_generated
            batch = min(BATCH_SIZE, remaining)

            # Vary difficulty across batches
            if batch_num % 5 == 1:
                diff_mix = "mostly easy (difficulty 1-2)"
            elif batch_num % 5 == 2:
                diff_mix = "mostly medium (difficulty 2-3)"
            elif batch_num % 5 == 3:
                diff_mix = "mostly hard (difficulty 3-4)"
            elif batch_num % 5 == 4:
                diff_mix = "mixed (difficulty 1-5)"
            else:
                diff_mix = "expert level (difficulty 4-5)"

            questions, tokens = generate_batch(
                mod, outcomes, batch, diff_mix, existing + mod_generated
            )

            if not questions:
                print(f"    Batch {batch_num} FAILED — retrying in 5s...")
                time.sleep(5)
                continue

            inserted = insert_questions(conn, mod["id"], questions, outcome_lookup)
            mod_generated += inserted
            mod_tokens += tokens

            print(f"    Batch {batch_num}: +{inserted} questions ({mod_generated}/{needed}) [{tokens} tokens]")

            # Rate limiting — avoid hitting API limits
            time.sleep(1)

        total_generated += mod_generated
        total_tokens += mod_tokens
        print(f"    DONE: {mod['code']} — {mod_generated} generated ({existing + mod_generated} total)\n")

    conn.close()

    print(f"\n{'='*60}")
    print(f"  COMPLETE")
    print(f"  Generated: {total_generated} questions")
    print(f"  Skipped: {total_skipped} modules (already full)")
    print(f"  Total tokens: {total_tokens:,}")
    print(f"  Estimated cost: ~${total_tokens * 0.000003:.2f}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
