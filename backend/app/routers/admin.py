import json
import os
import re
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.routers.auth import send_email, _wrap_email_html

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Helpers ──────────────────────────────────────────────────

def _verify_admin_key(key: str):
    """Raise 403 if the admin key is missing or wrong."""
    if not settings.admin_secret_key or key != settings.admin_secret_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")


# ── Schemas ──────────────────────────────────────────────────

class AdminActionRequest(BaseModel):
    key: str
    user_id: str


# ── Endpoints ────────────────────────────────────────────────

@router.get("/users")
async def list_users(key: str = "", db: AsyncSession = Depends(get_db)):
    """List all users. Requires admin secret key."""
    _verify_admin_key(key)

    result = await db.execute(text("""
        SELECT id, email, display_name, provider, is_active, last_login_at, created_at
        FROM users
        ORDER BY created_at DESC
    """))
    users = []
    for row in result.mappings().all():
        u = dict(row)
        u["id"] = str(u["id"])
        u["last_login_at"] = str(u["last_login_at"]) if u["last_login_at"] else None
        u["created_at"] = str(u["created_at"]) if u["created_at"] else None
        users.append(u)
    return users


@router.post("/activate")
async def activate_user(req: AdminActionRequest, db: AsyncSession = Depends(get_db)):
    """Activate a user account and send them a notification email."""
    _verify_admin_key(req.key)

    # Get user
    row = await db.execute(
        text("SELECT id, email, display_name, is_active FROM users WHERE id = :uid"),
        {"uid": req.user_id},
    )
    user = row.mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["is_active"]:
        return {"status": "already_active", "message": "User is already active"}

    # Activate
    await db.execute(
        text("UPDATE users SET is_active = true, updated_at = now() WHERE id = :uid"),
        {"uid": req.user_id},
    )
    await db.commit()

    # Send activation email
    html_content = f"""
        <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;">
          Great news, {user['display_name']}!
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px 0;">
          Your Wingman account has been activated. You can now log in and start studying.
        </p>
        <a href="{settings.frontend_url}/login"
           style="display: inline-block; background: #a855f7; color: #fff; text-decoration: none;
                  padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Log in to Wingman
        </a>
    """
    send_email(
        to_email=user["email"],
        subject="Wingman - Your Account Has Been Activated!",
        html_body=_wrap_email_html(html_content),
        text_body=f"Hi {user['display_name']}, your Wingman account has been activated! You can now log in at {settings.frontend_url}/login",
    )

    return {"status": "activated", "message": f"User {user['email']} activated and notified by email"}


@router.post("/deactivate")
async def deactivate_user(req: AdminActionRequest, db: AsyncSession = Depends(get_db)):
    """Deactivate a user account."""
    _verify_admin_key(req.key)

    row = await db.execute(
        text("SELECT id, email, is_active FROM users WHERE id = :uid"),
        {"uid": req.user_id},
    )
    user = row.mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user["is_active"]:
        return {"status": "already_inactive", "message": "User is already inactive"}

    await db.execute(
        text("UPDATE users SET is_active = false, updated_at = now() WHERE id = :uid"),
        {"uid": req.user_id},
    )
    await db.commit()

    return {"status": "deactivated", "message": f"User {user['email']} deactivated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, key: str = "", db: AsyncSession = Depends(get_db)):
    """Delete a user and all rows that reference it. Requires admin key."""
    _verify_admin_key(key)

    row = await db.execute(
        text("SELECT id, email FROM users WHERE id = :uid"),
        {"uid": user_id},
    )
    user = row.mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tables = await db.execute(text("""
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON t.table_schema = c.table_schema
         AND t.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND c.column_name = 'user_id'
          AND c.table_name <> 'users'
          AND t.table_type = 'BASE TABLE'
        ORDER BY c.table_name
    """))
    for table in [r[0] for r in tables.all()]:
        await db.execute(
            text(f'DELETE FROM "{table}" WHERE user_id = :uid'),  # noqa: S608
            {"uid": user_id},
        )
    await db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
    await db.commit()
    return {"status": "deleted", "message": f"User {user['email']} deleted"}


# ══════════════════════════════════════════════════════════════
# QUESTIONS CRUD
# ══════════════════════════════════════════════════════════════

class QuestionCreate(BaseModel):
    module_id: int
    outcome_id: int | None = None
    stem: str
    choice_a: str
    choice_b: str
    choice_c: str
    correct_answer: str  # A, B, or C
    explanation: str = ""
    difficulty: int = 2

class QuestionUpdate(BaseModel):
    stem: str | None = None
    choice_a: str | None = None
    choice_b: str | None = None
    choice_c: str | None = None
    correct_answer: str | None = None
    explanation: str | None = None
    difficulty: int | None = None
    outcome_id: int | None = None
    module_id: int | None = None


@router.get("/questions")
async def list_questions(
    module_id: int | None = None,
    topic_code: str | None = None,
    difficulty: int | None = None,
    page: int = 1,
    limit: int = 50,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """List questions with filters and pagination."""
    _verify_admin_key(key)
    where_clauses = []
    params: dict = {}

    if module_id:
        where_clauses.append("q.module_id = :mid")
        params["mid"] = module_id
    if topic_code:
        where_clauses.append("t.code = :tcode")
        params["tcode"] = topic_code
    if difficulty:
        where_clauses.append("q.difficulty = :diff")
        params["diff"] = difficulty

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    offset = (page - 1) * limit
    params["lim"] = limit
    params["off"] = offset

    # Count total + difficulty breakdown (global, respects filters but ignores pagination)
    stats_result = await db.execute(text(f"""
        SELECT q.difficulty, COUNT(*) AS n FROM questions q
        JOIN learning_modules lm ON q.module_id = lm.id
        JOIN topics t ON lm.topic_id = t.id
        {where_sql}
        GROUP BY q.difficulty
    """), params)
    difficulty_breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    total = 0
    for row in stats_result.mappings().all():
        d = int(row["difficulty"]) if row["difficulty"] is not None else 3
        n = int(row["n"])
        if 1 <= d <= 5:
            difficulty_breakdown[d] = n
        total += n

    # Fetch page
    result = await db.execute(text(f"""
        SELECT q.id, q.module_id, q.outcome_id, q.stem, q.choice_a, q.choice_b, q.choice_c,
               q.correct_answer, q.explanation, q.difficulty, q.created_at,
               lm.code AS lm_code, t.code AS topic_code,
               lo.code AS outcome_code
        FROM questions q
        JOIN learning_modules lm ON q.module_id = lm.id
        JOIN topics t ON lm.topic_id = t.id
        LEFT JOIN learning_outcomes lo ON q.outcome_id = lo.id
        {where_sql}
        ORDER BY t.sort_order, lm.sort_order, q.id
        LIMIT :lim OFFSET :off
    """), params)

    questions = []
    for row in result.mappings().all():
        q = dict(row)
        q["created_at"] = str(q["created_at"]) if q["created_at"] else None
        questions.append(q)

    return {
        "questions": questions,
        "total": total,
        "page": page,
        "limit": limit,
        "difficulty_breakdown": difficulty_breakdown,
    }


@router.get("/questions/{question_id}")
async def get_question(question_id: int, key: str = "", db: AsyncSession = Depends(get_db)):
    """Get a single question by ID."""
    _verify_admin_key(key)
    result = await db.execute(text("""
        SELECT q.*, lm.code AS lm_code, t.code AS topic_code, lo.code AS outcome_code
        FROM questions q
        JOIN learning_modules lm ON q.module_id = lm.id
        JOIN topics t ON lm.topic_id = t.id
        LEFT JOIN learning_outcomes lo ON q.outcome_id = lo.id
        WHERE q.id = :qid
    """), {"qid": question_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Question not found")
    q = dict(row)
    q["created_at"] = str(q["created_at"]) if q["created_at"] else None
    return q


@router.post("/questions")
async def create_question(req: QuestionCreate, key: str = "", db: AsyncSession = Depends(get_db)):
    """Create a new question."""
    _verify_admin_key(key)
    result = await db.execute(text("""
        INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c, correct_answer, explanation, difficulty)
        VALUES (:mid, :oid, :stem, :a, :b, :c, :ans, :expl, :diff)
        RETURNING id
    """), {
        "mid": req.module_id, "oid": req.outcome_id, "stem": req.stem,
        "a": req.choice_a, "b": req.choice_b, "c": req.choice_c,
        "ans": req.correct_answer.upper(), "expl": req.explanation, "diff": req.difficulty,
    })
    qid = result.scalar()
    await db.commit()
    return {"id": qid, "status": "created"}


@router.patch("/questions/{question_id}")
async def update_question(
    question_id: int,
    req: QuestionUpdate,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Update a question (partial)."""
    _verify_admin_key(key)
    updates = []
    params: dict = {"qid": question_id}
    for field in ["stem", "choice_a", "choice_b", "choice_c", "explanation", "module_id"]:
        val = getattr(req, field, None)
        if val is not None:
            updates.append(f"{field} = :{field}")
            params[field] = val
    if req.correct_answer is not None:
        updates.append("correct_answer = :correct_answer")
        params["correct_answer"] = req.correct_answer.upper()
    if req.difficulty is not None:
        updates.append("difficulty = :difficulty")
        params["difficulty"] = req.difficulty
    if req.outcome_id is not None:
        updates.append("outcome_id = :outcome_id")
        params["outcome_id"] = req.outcome_id

    if not updates:
        return {"status": "no_changes"}

    await db.execute(text(f"UPDATE questions SET {', '.join(updates)} WHERE id = :qid"), params)
    await db.commit()
    return {"id": question_id, "status": "updated"}


@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, key: str = "", db: AsyncSession = Depends(get_db)):
    """Delete a question."""
    _verify_admin_key(key)
    # Delete related question_attempts first
    await db.execute(text("DELETE FROM question_attempts WHERE question_id = :qid"), {"qid": question_id})
    await db.execute(text("DELETE FROM questions WHERE id = :qid"), {"qid": question_id})
    await db.commit()
    return {"id": question_id, "status": "deleted"}


# ══════════════════════════════════════════════════════════════
# FLASHCARDS CRUD
# ══════════════════════════════════════════════════════════════

class FlashcardCreate(BaseModel):
    module_id: int
    outcome_id: int | None = None
    front: str
    back: str
    tags: list[str] = []

class FlashcardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    tags: list[str] | None = None
    outcome_id: int | None = None
    module_id: int | None = None


@router.get("/flashcards")
async def list_flashcards(
    module_id: int | None = None,
    topic_code: str | None = None,
    page: int = 1,
    limit: int = 50,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """List flashcards with filters and pagination."""
    _verify_admin_key(key)
    where_clauses = []
    params: dict = {}

    if module_id:
        where_clauses.append("f.module_id = :mid")
        params["mid"] = module_id
    if topic_code:
        where_clauses.append("t.code = :tcode")
        params["tcode"] = topic_code

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    offset = (page - 1) * limit
    params["lim"] = limit
    params["off"] = offset

    count_result = await db.execute(text(f"""
        SELECT COUNT(*) FROM flashcards f
        JOIN learning_modules lm ON f.module_id = lm.id
        JOIN topics t ON lm.topic_id = t.id
        {where_sql}
    """), params)
    total = count_result.scalar()

    result = await db.execute(text(f"""
        SELECT f.id, f.module_id, f.outcome_id, f.front, f.back, f.tags, f.created_at,
               lm.code AS lm_code, t.code AS topic_code,
               lo.code AS outcome_code
        FROM flashcards f
        JOIN learning_modules lm ON f.module_id = lm.id
        JOIN topics t ON lm.topic_id = t.id
        LEFT JOIN learning_outcomes lo ON f.outcome_id = lo.id
        {where_sql}
        ORDER BY t.sort_order, lm.sort_order, f.id
        LIMIT :lim OFFSET :off
    """), params)

    flashcards = []
    for row in result.mappings().all():
        fc = dict(row)
        fc["created_at"] = str(fc["created_at"]) if fc["created_at"] else None
        fc["tags"] = list(fc["tags"]) if fc["tags"] else []
        flashcards.append(fc)

    return {"flashcards": flashcards, "total": total, "page": page, "limit": limit}


@router.post("/flashcards")
async def create_flashcard(req: FlashcardCreate, key: str = "", db: AsyncSession = Depends(get_db)):
    """Create a new flashcard."""
    _verify_admin_key(key)
    result = await db.execute(text("""
        INSERT INTO flashcards (module_id, outcome_id, front, back, tags)
        VALUES (:mid, :oid, :front, :back, :tags)
        RETURNING id
    """), {
        "mid": req.module_id, "oid": req.outcome_id,
        "front": req.front, "back": req.back, "tags": req.tags,
    })
    fid = result.scalar()
    await db.commit()
    return {"id": fid, "status": "created"}


@router.patch("/flashcards/{flashcard_id}")
async def update_flashcard(
    flashcard_id: int,
    req: FlashcardUpdate,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Update a flashcard (partial)."""
    _verify_admin_key(key)
    updates = []
    params: dict = {"fid": flashcard_id}
    for field in ["front", "back", "module_id"]:
        val = getattr(req, field, None)
        if val is not None:
            updates.append(f"{field} = :{field}")
            params[field] = val
    if req.tags is not None:
        updates.append("tags = :tags")
        params["tags"] = req.tags
    if req.outcome_id is not None:
        updates.append("outcome_id = :outcome_id")
        params["outcome_id"] = req.outcome_id

    if not updates:
        return {"status": "no_changes"}

    await db.execute(text(f"UPDATE flashcards SET {', '.join(updates)} WHERE id = :fid"), params)
    await db.commit()
    return {"id": flashcard_id, "status": "updated"}


@router.delete("/flashcards/{flashcard_id}")
async def delete_flashcard(flashcard_id: int, key: str = "", db: AsyncSession = Depends(get_db)):
    """Delete a flashcard."""
    _verify_admin_key(key)
    await db.execute(text("DELETE FROM flashcards WHERE id = :fid"), {"fid": flashcard_id})
    await db.commit()
    return {"id": flashcard_id, "status": "deleted"}


# ══════════════════════════════════════════════════════════════
# REFERENCE DATA (for dropdowns in frontend)
# ══════════════════════════════════════════════════════════════

@router.get("/modules")
async def list_modules_for_admin(key: str = "", db: AsyncSession = Depends(get_db)):
    """List all modules with topic info, question/flashcard counts."""
    _verify_admin_key(key)
    result = await db.execute(text("""
        SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name,
               (SELECT COUNT(*) FROM questions WHERE module_id = lm.id) AS question_count,
               (SELECT COUNT(*) FROM flashcards WHERE module_id = lm.id) AS flashcard_count,
               (SELECT COUNT(*) FROM learning_outcomes WHERE module_id = lm.id) AS outcome_count
        FROM learning_modules lm
        JOIN topics t ON lm.topic_id = t.id
        ORDER BY t.sort_order, lm.sort_order
    """))
    return [dict(row) for row in result.mappings().all()]


@router.get("/outcomes/{module_id}")
async def list_outcomes_for_module(module_id: int, key: str = "", db: AsyncSession = Depends(get_db)):
    """List learning outcomes for a module (for dropdown)."""
    _verify_admin_key(key)
    result = await db.execute(text("""
        SELECT id, code, description, bloom_level
        FROM learning_outcomes WHERE module_id = :mid
        ORDER BY sort_order
    """), {"mid": module_id})
    return [dict(row) for row in result.mappings().all()]


@router.get("/los-deficit")
async def list_los_deficit(
    min_score: int = 1,
    topic: Optional[str] = None,
    limit: int = 500,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """
    Rank LOS by deficit_score (0..5). See db/migrations/010_los_deficit_view.sql.

    Query params:
      min_score : only return LOS with deficit_score >= min_score (default 1)
      topic     : filter by topic_code (ETH, QM, ECO, FSA, CORP, EQU, FI, DER, ALT, PM)
      limit     : cap result size (default 500)
    """
    _verify_admin_key(key)
    result = await db.execute(text("""
        SELECT *
        FROM los_deficit_v
        WHERE deficit_score >= :min_score
        AND (CAST(:topic AS text) IS NULL OR topic_code = CAST(:topic AS text))
        ORDER BY deficit_score DESC, attempts_total DESC, los_code
        LIMIT :lim
    """), {"min_score": min_score, "topic": topic, "lim": limit})
    rows = [dict(r) for r in result.mappings().all()]

    summary = await db.execute(text("""
        SELECT deficit_score, COUNT(*) AS n
        FROM los_deficit_v GROUP BY deficit_score ORDER BY deficit_score DESC
    """))
    distribution = {int(r["deficit_score"]): int(r["n"]) for r in summary.mappings().all()}

    return {
        "items": rows,
        "count": len(rows),
        "distribution": distribution,
    }


# ══════════════════════════════════════════════════════════════
# AI QUESTION GENERATION (Claude API)
# ══════════════════════════════════════════════════════════════

class GenerateQuestionsRequest(BaseModel):
    module_id: int
    count: int = 5
    difficulty: int = 3
    question_type: str = "qbank"  # "qbank" or "mock"


@router.post("/generate-questions")
async def generate_questions(
    req: GenerateQuestionsRequest,
    key: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Generate questions using Claude API and insert them into the database."""
    _verify_admin_key(key)
    import anthropic

    from app.config import settings as _s
    api_key = _s.anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "sk-REPLACE_ME":
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    # Fetch module info + LOS
    mod_row = await db.execute(text("""
        SELECT lm.id, lm.code, lm.title, t.code AS topic_code, t.name AS topic_name
        FROM learning_modules lm JOIN topics t ON lm.topic_id = t.id
        WHERE lm.id = :mid
    """), {"mid": req.module_id})
    module = mod_row.mappings().first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    los_rows = await db.execute(text("""
        SELECT id, code, description, bloom_level
        FROM learning_outcomes WHERE module_id = :mid ORDER BY sort_order
    """), {"mid": req.module_id})
    outcomes = los_rows.mappings().all()

    los_text = "\n".join([
        f"- {o['code']} (Bloom {o['bloom_level']}): {o['description']}" for o in outcomes
    ])

    diff_labels = {1: "very easy (recall/definition)", 2: "easy (basic application)",
                   3: "medium (analysis/comparison)", 4: "hard (multi-step calculation)",
                   5: "expert (complex scenario/integration)"}
    diff_desc = diff_labels.get(req.difficulty, "medium")
    is_mock = req.question_type == "mock"
    style = "CFA Level I mock exam style" if is_mock else "CFA Level I QBank practice style"

    prompt = f"""Generate exactly {req.count} high-quality {style} multiple-choice questions for the CFA Level I curriculum.

**Module**: {module['code']} — {module['title']}
**Topic**: {module['topic_code']} — {module['topic_name']}
**Difficulty**: {req.difficulty}/5 ({diff_desc})

**Learning Outcome Statements (LOS)**:
{los_text}

**Requirements**:
- Each question MUST test one of the LOS listed above
- 3 answer choices (A, B, C) — only one correct
- Include a detailed explanation for the correct answer
- Use concrete numbers, scenarios, and calculations where appropriate
- Avoid trivial definitions for difficulty >= 3

Return ONLY a JSON array:
[{{"outcome_code":"XX-NN-LONN","stem":"...","choice_a":"...","choice_b":"...","choice_c":"...","correct_answer":"A","explanation":"...","difficulty":{req.difficulty}}}]"""

    # Scale max_tokens with count: ~1200 tokens per detailed question, with headroom.
    max_tokens = min(32000, max(4096, req.count * 1500))

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        truncated = response.stop_reason == "max_tokens"
        if truncated:
            logger.warning(
                f"AI response hit max_tokens={max_tokens} (count={req.count}); "
                f"will try to salvage complete questions"
            )
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        lb = raw.find("[")
        if lb != -1:
            raw = raw[lb:]
        rb = raw.rfind("]")
        if rb != -1:
            raw = raw[: rb + 1]
        try:
            questions = json.loads(raw, strict=False)
        except json.JSONDecodeError:
            cleaned = re.sub(r",\s*([\]}])", r"\1", raw)
            try:
                questions = json.loads(cleaned, strict=False)
            except json.JSONDecodeError:
                # Salvage: keep only complete top-level objects up to the last balanced "},"
                if not raw.startswith("["):
                    raise
                last_close = -1
                depth = 0
                in_str = False
                esc = False
                for i, ch in enumerate(raw):
                    if esc:
                        esc = False
                        continue
                    if ch == "\\" and in_str:
                        esc = True
                        continue
                    if ch == '"':
                        in_str = not in_str
                        continue
                    if in_str:
                        continue
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            last_close = i
                if last_close == -1:
                    raise
                salvaged = raw[: last_close + 1] + "]"
                questions = json.loads(salvaged, strict=False)
                logger.warning(
                    f"Salvaged {len(questions)} complete question(s) from truncated response"
                )
    except json.JSONDecodeError as e:
        logger.error(f"AI parse error: {e}; stop_reason={getattr(response, 'stop_reason', '?')}")
        raise HTTPException(
            status_code=500,
            detail=(
                "AI response was truncated before completing the JSON. "
                "Try a smaller count or lower difficulty."
                if truncated
                else "Failed to parse AI response"
            ),
        )
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")

    outcome_lookup = {o["code"]: o["id"] for o in outcomes}

    inserted = []
    for q in questions:
        outcome_id = outcome_lookup.get(q.get("outcome_code"))
        if not outcome_id and outcomes:
            outcome_id = outcomes[0]["id"]

        result = await db.execute(text("""
            INSERT INTO questions (module_id, outcome_id, stem, choice_a, choice_b, choice_c,
                                   correct_answer, explanation, difficulty)
            VALUES (:mid, :oid, :stem, :a, :b, :c, :ans, :expl, :diff)
            RETURNING id
        """), {
            "mid": req.module_id, "oid": outcome_id,
            "stem": q["stem"], "a": q["choice_a"], "b": q["choice_b"], "c": q["choice_c"],
            "ans": q["correct_answer"].upper(), "expl": q["explanation"],
            "diff": q.get("difficulty", req.difficulty),
        })
        inserted.append({"id": result.scalar(), "stem": q["stem"][:80], "outcome_code": q.get("outcome_code")})

    await db.commit()

    return {
        "status": "generated", "count": len(inserted), "module": module["code"],
        "difficulty": req.difficulty, "type": req.question_type, "questions": inserted,
        "usage": {"input_tokens": response.usage.input_tokens, "output_tokens": response.usage.output_tokens},
    }
