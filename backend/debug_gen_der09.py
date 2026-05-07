"""Debug — call Claude directly for DER-09 with require_calculation, log raw."""
import asyncio, os, sys, json
import anthropic, asyncpg

sys.path.insert(0, "/app")
from app.services.question_generator import (
    SYSTEM_PROMPT, MAX_TOKENS, DEFAULT_MODEL,
    build_tool_schema, build_user_message,
    fetch_module, fetch_los_for_module,
)


async def main():
    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman").replace("postgresql+asyncpg://", "postgresql://", 1)
    conn = await asyncpg.connect(db_url)
    module = await fetch_module(conn, "DER-09")
    los = await fetch_los_for_module(conn, module["id"])
    await conn.close()
    print(f"module: {module['code']} — {module['title']}")
    print(f"LOS count: {len(los)}")

    user_msg = build_user_message(
        module, los, count=5,
        difficulty_target=4,
        require_calculation=True,
    )
    print("=== USER MESSAGE (last 1500 chars) ===")
    print(user_msg[-1500:])
    print("=== END USER MESSAGE ===\n")

    client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = await client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=MAX_TOKENS,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        tools=[build_tool_schema(min_questions=5)],
        tool_choice={"type": "tool", "name": "emit_question_batch"},
        messages=[{"role": "user", "content": user_msg}],
    )
    print(f"stop_reason: {response.stop_reason}")
    print(f"usage: {response.usage}")
    print(f"content blocks: {len(response.content)}")
    for i, b in enumerate(response.content):
        print(f"  block {i}: type={b.type}", end="")
        if b.type == "text":
            print(f"  text={b.text[:300]}")
        elif b.type == "tool_use":
            print(f"  name={b.name}")
            input_data = b.input
            if isinstance(input_data, dict) and "questions" in input_data:
                qs = input_data["questions"]
                print(f"    questions count: {len(qs)}")
                if qs:
                    first = qs[0]
                    if isinstance(first, dict):
                        print(f"    first question keys: {list(first.keys())}")
                        print(f"    first stem: {first.get('stem','')[:100]}")
                        print(f"    is_calculation: {first.get('is_calculation')}")
                        print(f"    calculation: {first.get('calculation')}")
                    else:
                        print(f"    first item type: {type(first).__name__}, value: {str(first)[:200]}")
                else:
                    print(f"    raw input: {json.dumps(input_data, indent=2)[:1000]}")
            else:
                print(f"    raw input: {json.dumps(input_data, indent=2)[:1000]}")
        else:
            print(f"  unknown block: {b}")


if __name__ == "__main__":
    asyncio.run(main())
