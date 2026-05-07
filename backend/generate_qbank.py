"""
Generate QBank questions for all topics using Claude API.
Run directly: python generate_qbank.py [TOPIC] [--count N]

Examples:
  python generate_qbank.py          # All topics, 5 per LOS
  python generate_qbank.py ETH      # Only Ethics
  python generate_qbank.py FI --count 10  # FI, 10 per LOS
"""
import sys
import os
import json
import time
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import groq
from groq import Groq
from sqlalchemy import text
from app.database import engine

GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
if not GROQ_KEY:
    from dotenv import dotenv_values
    _vals = dotenv_values(Path(__file__).parent / ".env")
    GROQ_KEY = _vals.get("GROQ_API_KEY", "")

if not GROQ_KEY:
    print("ERROR: No GROQ_API_KEY found")
    sys.exit(1)

TARGET_PER_LOS = 5
MODEL = "llama-3.3-70b-versatile"


def generate_questions_for_los(client, topic_name, module_title, los_list, count):
    """Call Groq (Llama 3.3 70B) to generate questions for a batch of LOS."""
    los_text = "\n".join([
        f"- {lo['code']} (Bloom {lo['bloom_level']}): {lo['description']}"
        for lo in los_list
    ])

    prompt = f"""Generate exactly {count} high-quality CFA Level I exam-style multiple-choice questions.

Topic: {topic_name}
Module: {module_title}

Learning Outcome Statements to cover:
{los_text}

RULES:
1. Each question has exactly 3 choices: A, B, C
2. Distribute questions across the LOS listed above
3. Match the Bloom taxonomy level of each LOS
4. Include realistic distractors based on common candidate mistakes
5. Write clear, unambiguous stems

Return ONLY a JSON array. Each element:
{{"los_code": "...", "stem": "...", "choice_a": "...", "choice_b": "...", "choice_c": "...", "correct": "A/B/C", "explanation": "...", "difficulty": 1-5}}

Return ONLY valid JSON. No markdown, no commentary."""

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    text_content = response.choices[0].message.content.strip()

    # Repair truncated JSON: close any open strings/arrays
    if text_content and not text_content.rstrip().endswith(']'):
        # Find last complete object
        last_brace = text_content.rfind('}')
        if last_brace > 0:
            text_content = text_content[:last_brace + 1] + ']'
    # Clean markdown fences if present
    if text_content.startswith("```"):
        text_content = text_content.split("\n", 1)[1]
        if text_content.endswith("```"):
            text_content = text_content[:-3]

    return json.loads(text_content)


async def main():
    topic_filter = sys.argv[1].upper() if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else None
    count_per_los = TARGET_PER_LOS
    if '--count' in sys.argv:
        idx = sys.argv.index('--count')
        count_per_los = int(sys.argv[idx + 1])

    client = Groq(api_key=GROQ_KEY)
    print(f"Groq key: {GROQ_KEY[:15]}...OK")
    print(f"Model: {MODEL}")
    print(f"Target: {count_per_los} questions per LOS")
    print()

    async with engine.begin() as conn:
        # Get topics
        if topic_filter:
            rows = await conn.execute(text("SELECT id, code, name FROM topics WHERE code = :c"), {"c": topic_filter})
        else:
            rows = await conn.execute(text("SELECT id, code, name FROM topics ORDER BY sort_order"))
        topics = [dict(r._mapping) for r in rows]

        total_generated = 0

        for topic in topics:
            print(f"== {topic['code']} -{topic['name']} ==")

            # Get modules
            mods = await conn.execute(text("""
                SELECT id, code, title FROM learning_modules WHERE topic_id = :tid ORDER BY sort_order
            """), {"tid": topic["id"]})
            modules = [dict(r._mapping) for r in mods]

            for mod in modules:
                # Get LOS with question counts
                los_rows = await conn.execute(text("""
                    SELECT lo.id, lo.code, lo.description, lo.bloom_level,
                        COALESCE((SELECT COUNT(*) FROM questions WHERE outcome_id = lo.id), 0)::int AS q_count
                    FROM learning_outcomes lo WHERE lo.module_id = :mid ORDER BY lo.sort_order
                """), {"mid": mod["id"]})
                outcomes = [dict(r._mapping) for r in los_rows]

                # Filter LOS needing questions
                needing = [o for o in outcomes if o["q_count"] < count_per_los]
                if not needing:
                    print(f"  {mod['code']:10s} OK full ({len(outcomes)} LOS)")
                    continue

                total_needed = sum(min(count_per_los - o["q_count"], count_per_los) for o in needing)
                total_needed = min(total_needed, 10)  # Cap per API call to avoid JSON truncation
                print(f"  {mod['code']:10s} generating {total_needed}q for {len(needing)} LOS...", end=" ", flush=True)

                try:
                    questions = generate_questions_for_los(
                        client, topic["name"], mod["title"], needing, total_needed
                    )

                    inserted = 0
                    for q in questions:
                        # Find matching LOS
                        los_code = q.get("los_code", "")
                        outcome_id = None
                        for o in outcomes:
                            if o["code"] == los_code:
                                outcome_id = o["id"]
                                break
                        if not outcome_id and outcomes:
                            outcome_id = outcomes[0]["id"]

                        await conn.execute(text("""
                            INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c,
                                correct_answer, explanation, difficulty, question_type)
                            VALUES (:mid, :oid, :stem, :a, :b, :c, :ans, :exp, :diff, 'qbank')
                        """), {
                            "mid": mod["id"], "oid": outcome_id,
                            "stem": q["stem"], "a": q["choice_a"], "b": q["choice_b"], "c": q["choice_c"],
                            "ans": q["correct"][0].upper(), "exp": q.get("explanation", ""),
                            "diff": min(5, max(1, int(q.get("difficulty", 3)))),
                        })
                        inserted += 1

                    total_generated += inserted
                    print(f"OK {inserted}q")
                    time.sleep(1)  # Rate limit

                except json.JSONDecodeError as e:
                    print(f"FAIL JSON error: {e}")
                except groq.AuthenticationError:
                    print("FAIL API KEY INVALID -aborting")
                    return
                except groq.RateLimitError:
                    print("FAIL rate limited -waiting 30s")
                    time.sleep(30)
                except Exception as e:
                    print(f"FAIL {type(e).__name__}: {e}")

            print()

    print(f"\n{'='*50}")
    print(f"DONE -{total_generated} questions generated total")


if __name__ == "__main__":
    asyncio.run(main())
