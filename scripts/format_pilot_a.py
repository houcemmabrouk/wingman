"""Format the pilot-A questions into a single readable markdown.

Queries the DB directly to avoid TSV parsing issues with multiline text.
Run via:  docker exec wingman-backend python /tmp/format_pilot_a.py
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import asyncpg

OUT = Path("/tmp/los_compare/pilot_a_review.md")
DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wingman:wingman_secret@db:5432/wingman")
DSN = DB_URL.replace("postgresql+asyncpg://", "postgresql://", 1)


async def main():
    conn = await asyncpg.connect(DSN)
    rows = await conn.fetch("""
        SELECT q.id, lm.code AS module, lo.code AS los_code, q.difficulty,
               q.stem, q.choice_a, q.choice_b, q.choice_c, q.correct_answer,
               q.explanation, q.los_anchor, q.standard_citation,
               q.trap_per_distractor::text AS traps_json
        FROM questions q
        LEFT JOIN learning_outcomes lo ON lo.id = q.outcome_id
        JOIN learning_modules lm ON lm.id = q.module_id
        WHERE q.generated_at >= '2026-05-05 11:30:00'
        ORDER BY lm.code, q.id
    """)
    await conn.close()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append("# Pilote A — 29 questions inserees (2026-05-05)\n\n")
    lines.append(f"Inspection structurelle + pedagogique. {len(rows)} questions, 5 LOS, target diff 4.\n\n")
    lines.append("Pour chaque question : stem, 3 choix (avec named trap), bonne reponse, explanation, anchor, citation.\n\n")
    lines.append("---\n\n")

    current_mod = None
    for r in rows:
        if r["module"] != current_mod:
            lines.append(f"## {r['module']}\n\n")
            current_mod = r["module"]
        try:
            parsed = json.loads(r["traps_json"]) if r["traps_json"] else {}
            traps = parsed if isinstance(parsed, dict) else {}
        except Exception:
            traps = {}

        correct = (r["correct_answer"] or "").strip()
        lines.append(f"### Q{r['id']} · {r['los_code']} · diff **{r['difficulty']}**\n\n")
        lines.append(f"**Stem :**\n\n> {r['stem']}\n\n")
        for letter, text in [("A", r["choice_a"]), ("B", r["choice_b"]), ("C", r["choice_c"])]:
            marker = "[x]" if letter == correct else "[ ]"
            trap = traps.get(letter, "") or ""
            if letter == correct:
                lines.append(f"- {marker} **{letter}.** {text}\n")
            else:
                lines.append(f"- {marker} **{letter}.** {text}\n")
                if trap:
                    lines.append(f"    - _trap: {trap}_\n")
        lines.append(f"\n**Bonne reponse :** **{correct}**\n\n")
        lines.append(f"**Explanation :**\n\n{r['explanation']}\n\n")
        lines.append(f"**Anchor :** _{r['los_anchor']}_\n\n")
        lines.append(f"**Citation :** `{r['standard_citation']}`\n\n")
        lines.append("---\n\n")

    OUT.write_text("".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}, {OUT.stat().st_size} bytes, {len(rows)} questions")


if __name__ == "__main__":
    asyncio.run(main())
