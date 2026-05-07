import json
import random
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import current_user_id
from app.services.srs import update_srs
from app.services.mastery import update_mastery_cascade
from app.services.weakness_detector import check_weakness
from app.services.planning_skill import invalidate_planning_cache

router = APIRouter(prefix="/api", tags=["knowledge"])


# ── Schemas ───────────────────────────────────────────────────

class QCMStartRequest(BaseModel):
    lm_id: int
    question_count: int = 10
    time_limit_min: int = 15
    difficulty_mode: str = "adaptive"  # "adaptive" | "easy" | "medium" | "hard" | "mixed"


class QCMSubmitRequest(BaseModel):
    session_id: int
    answers: list[dict]  # [{ question_id, answer }]


class QCMCheckRequest(BaseModel):
    question_id: int
    answer: str  # "A" | "B" | "C"


class MockStartRequest(BaseModel):
    pass


class FlashcardReviewRequest(BaseModel):
    flashcard_id: int
    lm_id: int
    score: int  # 0, 1, 2


class CoachRequest(BaseModel):
    question: str
    lm_id: int | None = None


class AnalyzeSessionRequest(BaseModel):
    session_id: int


# ── GET /api/modules ─────────────────────────────────────────

@router.get("/modules")
async def get_modules(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return all learning modules grouped by topic, with question/flashcard counts and mastery."""
    result = await db.execute(text("""
        SELECT lm.id, lm.code, lm.title, lm.sort_order,
               t.id AS topic_id, t.code AS topic_code, t.name AS topic_name, t.weight_pct,
               COALESCE(qc.cnt, 0) AS question_count,
               COALESCE(fc.cnt, 0) AS flashcard_count
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN (SELECT module_id, COUNT(*) AS cnt FROM questions GROUP BY module_id) qc ON qc.module_id = lm.id
        LEFT JOIN (SELECT module_id, COUNT(*) AS cnt FROM flashcards GROUP BY module_id) fc ON fc.module_id = lm.id
        ORDER BY t.sort_order, lm.sort_order
    """))
    rows = result.mappings().all()

    mastery_map: dict[int, dict] = {}
    m_result = await db.execute(text("""
        SELECT module_id, mastery_level, last_studied
        FROM lm_mastery WHERE user_id = :uid
    """), {"uid": user_id})
    for m in m_result.mappings().all():
        mastery_map[m["module_id"]] = {
            "mastery_level": float(m["mastery_level"]) if m["mastery_level"] else None,
            "last_studied": str(m["last_studied"]) if m["last_studied"] else None,
        }

    topics_dict: dict[int, dict] = {}
    for r in rows:
        tid = r["topic_id"]
        if tid not in topics_dict:
            topics_dict[tid] = {
                "id": tid,
                "code": r["topic_code"],
                "name": r["topic_name"],
                "weight_pct": float(r["weight_pct"]),
                "modules": [],
            }
        mm = mastery_map.get(r["id"], {})
        topics_dict[tid]["modules"].append({
            "id": r["id"],
            "code": r["code"],
            "title": r["title"],
            "question_count": r["question_count"],
            "flashcard_count": r["flashcard_count"],
            "mastery_level": mm.get("mastery_level"),
            "last_studied": mm.get("last_studied"),
        })

    return {"topics": list(topics_dict.values())}


# ── GET /api/sessions/history ────────────────────────────────

@router.get("/sessions/history")
async def get_session_history(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return recent sessions with scores for a user."""
    result = await db.execute(text("""
        SELECT s.id AS session_id, s.session_type, s.started_at, s.duration_sec,
               pr.score AS score_pct, pr.questions_total, pr.questions_correct,
               lm.code AS module_code, lm.title AS module_title,
               t.code AS topic_code,
               CASE WHEN sa.id IS NOT NULL THEN true ELSE false END AS has_ai_analysis
        FROM sessions s
        LEFT JOIN performance_records pr ON pr.session_id = s.id
        LEFT JOIN learning_modules lm ON lm.id = pr.module_id
        LEFT JOIN topics t ON t.id = lm.topic_id
        LEFT JOIN session_analyses sa ON sa.session_id = s.id
        WHERE s.user_id = :uid AND s.ended_at IS NOT NULL
        ORDER BY s.started_at DESC
        LIMIT :lim OFFSET :off
    """), {"uid": user_id, "lim": limit, "off": offset})
    rows = result.mappings().all()

    count_result = await db.execute(text(
        "SELECT COUNT(*) FROM sessions WHERE user_id = :uid AND ended_at IS NOT NULL"
    ), {"uid": user_id})
    total = count_result.scalar() or 0

    return {
        "sessions": [
            {
                **dict(r),
                "started_at": str(r["started_at"]) if r["started_at"] else None,
                "score_pct": float(r["score_pct"]) if r["score_pct"] is not None else None,
            }
            for r in rows
        ],
        "total": total,
    }


# ── DELETE /api/sessions/{id} ────────────────────────────────

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a quiz/mock session along with its dependent rows.

    Ownership is enforced — the session is only removed if user_id matches.
    Children (performance_records, session_analyses, question_attempts) are
    cleared explicitly so the call works even without ON DELETE CASCADE.
    """
    owned = await db.execute(
        text("SELECT 1 FROM sessions WHERE id = :sid AND user_id = :uid"),
        {"sid": session_id, "uid": user_id},
    )
    if owned.scalar() is None:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.execute(text("DELETE FROM session_analyses WHERE session_id = :sid"), {"sid": session_id})
    await db.execute(text("DELETE FROM question_attempts WHERE session_id = :sid"), {"sid": session_id})
    await db.execute(text("DELETE FROM performance_records WHERE session_id = :sid"), {"sid": session_id})
    await db.execute(text("DELETE FROM sessions WHERE id = :sid AND user_id = :uid"),
                     {"sid": session_id, "uid": user_id})
    await db.commit()
    return {"deleted": session_id}


# ── GET /api/sessions/{id}/details ───────────────────────────

@router.get("/sessions/{session_id}/details")
async def get_session_details(
    session_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return full session details with question attempts and AI analysis."""
    # Session info
    sess = await db.execute(text("""
        SELECT s.id, s.session_type, s.started_at, s.ended_at, s.duration_sec,
               pr.score, pr.questions_total, pr.questions_correct
        FROM sessions s
        LEFT JOIN performance_records pr ON pr.session_id = s.id
        WHERE s.id = :sid AND s.user_id = :uid
    """), {"sid": session_id, "uid": user_id})
    session = sess.mappings().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Question attempts
    attempts = await db.execute(text("""
        SELECT qa.question_id, qa.selected_answer, qa.is_correct,
               q.stem, q.correct_answer, q.explanation,
               lm.code AS module_code, t.code AS topic_code
        FROM question_attempts qa
        JOIN questions q ON q.id = qa.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE qa.session_id = :sid
        ORDER BY qa.id
    """), {"sid": session_id})
    details = [dict(r) for r in attempts.mappings().all()]

    # AI analysis (if cached)
    analysis_row = await db.execute(text(
        "SELECT analysis_json FROM session_analyses WHERE session_id = :sid"
    ), {"sid": session_id})
    analysis = analysis_row.scalar()

    return {
        "session": {
            **dict(session),
            "started_at": str(session["started_at"]) if session["started_at"] else None,
            "ended_at": str(session["ended_at"]) if session["ended_at"] else None,
            "score": float(session["score"]) if session["score"] is not None else None,
        },
        "details": details,
        "ai_analysis": json.loads(analysis) if analysis else None,
    }


# ── POST /api/ai/analyze-session ────────────────────────────

@router.post("/ai/analyze-session")
async def analyze_session(
    req: AnalyzeSessionRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Call Claude API to analyze session performance. Caches result."""
    # Verify session belongs to user FIRST so a stranger can't read another
    # user's cached analysis by guessing session_id.
    sess = await db.execute(text(
        "SELECT id, session_type FROM sessions WHERE id = :sid AND user_id = :uid"
    ), {"sid": req.session_id, "uid": user_id})
    if not sess.mappings().first():
        raise HTTPException(status_code=404, detail="Session not found")

    cached = await db.execute(text(
        "SELECT analysis_json FROM session_analyses WHERE session_id = :sid"
    ), {"sid": req.session_id})
    cached_row = cached.scalar()
    if cached_row:
        return {"analysis": json.loads(cached_row), "cached": True}

    # Fetch attempts
    attempts = await db.execute(text("""
        SELECT qa.selected_answer, qa.is_correct,
               q.stem, q.correct_answer, q.explanation,
               lm.code AS module_code, lm.title AS module_title,
               t.code AS topic_code, t.name AS topic_name
        FROM question_attempts qa
        JOIN questions q ON q.id = qa.question_id
        JOIN learning_modules lm ON lm.id = q.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE qa.session_id = :sid
        ORDER BY qa.id
    """), {"sid": req.session_id})
    rows = [dict(r) for r in attempts.mappings().all()]

    if not rows:
        raise HTTPException(status_code=400, detail="No attempts found for this session")

    correct = sum(1 for r in rows if r["is_correct"])
    total = len(rows)
    score_pct = round((correct / total) * 100, 1)

    # Build prompt for Claude
    incorrect_items = []
    for r in rows:
        if not r["is_correct"]:
            incorrect_items.append(
                f"- [{r['topic_code']}/{r['module_code']}] {r['stem'][:150]}\n"
                f"  User: {r['selected_answer']} | Correct: {r['correct_answer']}\n"
                f"  Explanation: {(r['explanation'] or 'N/A')[:200]}"
            )

    topic_breakdown = defaultdict(lambda: {"correct": 0, "total": 0})
    for r in rows:
        key = f"{r['topic_code']} — {r['topic_name']}"
        topic_breakdown[key]["total"] += 1
        if r["is_correct"]:
            topic_breakdown[key]["correct"] += 1

    topic_summary = "\n".join(
        f"  {k}: {v['correct']}/{v['total']} ({round(v['correct']/v['total']*100)}%)"
        for k, v in topic_breakdown.items()
    )

    system_prompt = """You are an expert CFA Level I tutor. Analyze the student's quiz results and provide structured feedback.

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overall assessment in French",
  "error_patterns": [
    { "type": "conceptual|calculation|trick|recall", "description": "...", "count": N }
  ],
  "weak_areas": [
    { "topic": "...", "subtopic": "...", "severity": "high|medium|low", "detail": "..." }
  ],
  "recommendations": [
    { "priority": 1, "action": "...", "module_code": "XX-NN", "reason": "..." }
  ],
  "enhanced_explanations": [
    { "question_stem": "first 80 chars...", "explanation": "clear explanation", "key_concept": "...", "study_tip": "..." }
  ]
}

Rules:
- Write all text in French
- Be specific and actionable
- Focus on CFA exam relevance
- Limit enhanced_explanations to the 5 most important wrong answers"""

    user_message = f"""Score: {score_pct}% ({correct}/{total})

Topic breakdown:
{topic_summary}

Incorrect answers ({total - correct}):
{chr(10).join(incorrect_items[:20])}"""

    api_key = settings.anthropic_api_key
    if not api_key:
        # Return a basic analysis without AI
        basic = {
            "summary": f"Score de {score_pct}% — {correct} bonnes reponses sur {total}.",
            "error_patterns": [],
            "weak_areas": [],
            "recommendations": [],
            "enhanced_explanations": [],
        }
        return {"analysis": basic, "cached": False, "ai_powered": False}

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        content = response.content[0].text

        # Parse JSON from response (handle markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        analysis = json.loads(content.strip())
    except json.JSONDecodeError:
        analysis = {
            "summary": f"Score de {score_pct}%.",
            "error_patterns": [],
            "weak_areas": [],
            "recommendations": [],
            "enhanced_explanations": [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(e)}")

    # Cache in DB
    await db.execute(text("""
        INSERT INTO session_analyses (session_id, analysis_json)
        VALUES (:sid, :json)
        ON CONFLICT (session_id) DO UPDATE SET analysis_json = :json, created_at = now()
    """), {"sid": req.session_id, "json": json.dumps(analysis)})
    await db.commit()

    return {"analysis": analysis, "cached": False, "ai_powered": True}


# ── POST /api/qcm/start ──────────────────────────────────────

async def _select_qbank_questions(db: AsyncSession, lm_id: int, user_id: str, n: int, mode: str) -> list[dict]:
    """Select QBank-style questions from a single module, respecting difficulty mode."""
    result = await db.execute(text("""
        SELECT id, stem, choice_a, choice_b, choice_c, difficulty
        FROM questions
        WHERE module_id = :mid
          AND disabled_at IS NULL
    """), {"mid": lm_id})
    all_questions = list(result.mappings().all())
    if not all_questions:
        return []
    n = min(n, len(all_questions))

    if mode == "easy":
        pool = [q for q in all_questions if q["difficulty"] <= 2] or all_questions
        return random.sample(pool, min(n, len(pool)))
    if mode == "medium":
        pool = [q for q in all_questions if 2 <= q["difficulty"] <= 3] or all_questions
        return random.sample(pool, min(n, len(pool)))
    if mode == "hard":
        pool = [q for q in all_questions if q["difficulty"] >= 3] or all_questions
        return random.sample(pool, min(n, len(pool)))
    if mode == "mixed":
        easy = [q for q in all_questions if q["difficulty"] <= 1]
        med = [q for q in all_questions if q["difficulty"] in (2, 3)]
        hard = [q for q in all_questions if q["difficulty"] >= 4]
        n_easy = max(1, int(n * 0.2))
        n_hard = max(1, int(n * 0.3))
        n_med = n - n_easy - n_hard
        selected = (
            random.sample(easy, min(n_easy, len(easy)))
            + random.sample(med, min(n_med, len(med)))
            + random.sample(hard, min(n_hard, len(hard)))
        )
        if len(selected) < n:
            remaining = [q for q in all_questions if q not in selected]
            selected += random.sample(remaining, min(n - len(selected), len(remaining)))
        random.shuffle(selected)
        return selected

    # adaptive (default)
    mastery_row = await db.execute(text("""
        SELECT mastery_level FROM lm_mastery
        WHERE user_id = :uid AND module_id = :mid
    """), {"uid": user_id, "mid": lm_id})
    mastery = float(mastery_row.scalar() or 0)
    if mastery < 40:
        target_range = (1, 2)
    elif mastery < 70:
        target_range = (2, 3)
    else:
        target_range = (3, 5)
    preferred = [q for q in all_questions if target_range[0] <= q["difficulty"] <= target_range[1]]
    others = [q for q in all_questions if q not in preferred]
    n_pref = min(len(preferred), int(n * 0.7))
    n_other = n - n_pref
    selected = random.sample(preferred, n_pref) + random.sample(others, min(n_other, len(others)))
    if len(selected) < n:
        remaining = [q for q in all_questions if q not in selected]
        selected += random.sample(remaining, min(n - len(selected), len(remaining)))
    random.shuffle(selected)
    return selected


async def _select_mock_questions(db: AsyncSession, target: int = 180) -> list[dict]:
    """Select full-length mock questions across all topics, weighted by exam weight."""
    result = await db.execute(text("""
        SELECT q.id, q.stem, q.choice_a, q.choice_b, q.choice_c, q.difficulty,
               t.weight_pct, t.code AS topic_code
        FROM questions q
        JOIN learning_modules lm ON lm.id = q.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE q.disabled_at IS NULL
    """))
    all_questions = result.mappings().all()
    if not all_questions:
        return []

    by_topic: dict[str, list] = {}
    for q in all_questions:
        by_topic.setdefault(q["topic_code"], []).append(q)

    selected = []
    for tc, qs in by_topic.items():
        weight = float(qs[0]["weight_pct"]) / 100
        count = max(1, int(target * weight))
        selected.extend(random.sample(qs, min(count, len(qs))))

    random.shuffle(selected)
    return selected[:target]


async def _create_exam_session(db: AsyncSession, user_id: str, session_type: str) -> int:
    row = await db.execute(text("""
        INSERT INTO sessions (user_id, session_type, started_at)
        VALUES (:uid, :stype, now())
        RETURNING id
    """), {"uid": user_id, "stype": session_type})
    sid = row.scalar()
    await db.commit()
    return sid


def _serialize_questions(questions: list[dict], include_difficulty: bool = False) -> list[dict]:
    out = []
    for q in questions:
        item = {
            "id": q["id"],
            "stem": q["stem"],
            "option_a": q["choice_a"],
            "option_b": q["choice_b"],
            "option_c": q["choice_c"],
        }
        if include_difficulty and "difficulty" in q:
            item["difficulty"] = q["difficulty"]
        out.append(item)
    return out


# ── POST /api/qcm/start — QBank (single module, difficulty-aware) ──

@router.post("/qcm/start")
async def qcm_start(
    req: QCMStartRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    selected = await _select_qbank_questions(db, req.lm_id, user_id, req.question_count, req.difficulty_mode)
    if not selected:
        return {"error": "No questions found for this module"}
    session_id = await _create_exam_session(db, user_id, "quiz")
    return {
        "session_id": session_id,
        "question_count": len(selected),
        "time_limit_min": req.time_limit_min,
        "difficulty_mode": req.difficulty_mode,
        "questions": _serialize_questions(selected, include_difficulty=True),
    }


# ── POST /api/qcm/check — per-question instant feedback (no DB write) ──

@router.post("/qcm/check")
async def qcm_check(req: QCMCheckRequest, db: AsyncSession = Depends(get_db)):
    """Reveal the correct answer + explanation for a single question.
    No write — qcm/submit still persists all attempts at the end of the session.
    """
    row = await db.execute(
        text("SELECT correct_answer, explanation FROM questions WHERE id = :qid"),
        {"qid": req.question_id},
    )
    q = row.mappings().first()
    if not q:
        return {"error": "Question not found"}

    user_answer = (req.answer or "").upper().strip()
    return {
        "question_id": req.question_id,
        "user_answer": user_answer,
        "correct_answer": q["correct_answer"],
        "is_correct": user_answer == q["correct_answer"],
        "explanation": q["explanation"],
    }


# ── POST /api/qcm/submit ─────────────────────────────────────

@router.post("/qcm/submit")
async def qcm_submit(
    req: QCMSubmitRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Confirm the session belongs to the caller — otherwise user A could
    # submit answers (and corrupt mastery / SRS) on user B's open session.
    sess = await db.execute(
        text("SELECT 1 FROM sessions WHERE id = :sid AND user_id = :uid"),
        {"sid": req.session_id, "uid": user_id},
    )
    if sess.scalar() is None:
        return {"error": "Session not found"}

    correct = 0
    details = []
    # Track per-module stats for proper performance_records
    module_stats: dict[int, dict] = defaultdict(lambda: {"correct": 0, "total": 0})

    for ans in req.answers:
        q_id = ans.get("question_id")
        user_answer = ans.get("answer", "").upper()

        q_row = await db.execute(text("""
            SELECT id, stem, correct_answer, explanation, module_id
            FROM questions WHERE id = :qid
        """), {"qid": q_id})
        q = q_row.mappings().first()
        if not q:
            continue

        is_correct = user_answer == q["correct_answer"]
        if is_correct:
            correct += 1

        module_stats[q["module_id"]]["total"] += 1
        if is_correct:
            module_stats[q["module_id"]]["correct"] += 1

        await db.execute(text("""
            INSERT INTO question_attempts (session_id, question_id, user_id, selected_answer, is_correct)
            VALUES (:sid, :qid, :uid, :ans, :corr)
        """), {"sid": req.session_id, "qid": q_id, "uid": user_id, "ans": user_answer, "corr": is_correct})

        details.append({
            "question_id": q_id,
            "stem": q["stem"][:120] + "..." if len(q["stem"]) > 120 else q["stem"],
            "user_answer": user_answer,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q["explanation"],
        })

    total = len(req.answers)
    score_pct = round((correct / total) * 100, 1) if total > 0 else 0

    await db.execute(text("""
        UPDATE sessions SET ended_at = now(),
            duration_sec = EXTRACT(EPOCH FROM (now() - started_at))::int
        WHERE id = :sid
    """), {"sid": req.session_id})

    # Record performance per module (fixes mock exam bug)
    for mid, stats in module_stats.items():
        mod_score = round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        await db.execute(text("""
            INSERT INTO performance_records (session_id, module_id, score, questions_total, questions_correct)
            VALUES (:sid, :mid, :score, :total, :correct)
        """), {"sid": req.session_id, "mid": mid, "score": mod_score, "total": stats["total"], "correct": stats["correct"]})
        await update_srs(db, user_id, mid, mod_score)
        await update_mastery_cascade(db, user_id, mid)
        await check_weakness(db, user_id, mid, mod_score)

    await db.commit()
    await invalidate_planning_cache(user_id)

    return {
        "session_id": req.session_id,
        "score_pct": score_pct,
        "correct": correct,
        "incorrect": total - correct,
        "total": total,
        "details": details,
    }


# ── POST /api/mock/start ─────────────────────────────────────

# ── POST /api/mock/start — full-length mock (all topics, weighted) ──

@router.post("/mock/start")
async def mock_start(
    req: MockStartRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    selected = await _select_mock_questions(db, target=180)
    if not selected:
        return {"error": "No questions in database"}
    session_id = await _create_exam_session(db, user_id, "mock_exam")
    return {
        "session_id": session_id,
        "question_count": len(selected),
        "time_limit_min": 270,
        "questions": _serialize_questions(selected),
    }


# ── POST /api/mock/submit — delegates to qcm/submit (unified path) ──

@router.post("/mock/submit")
async def mock_submit(
    req: QCMSubmitRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await qcm_submit(req, user_id, db)


# ── POST /api/exam/start — unified entry point (mode: "qbank" | "mock") ──

class ExamStartRequest(BaseModel):
    mode: str  # "qbank" or "mock"
    lm_id: int | None = None  # required for qbank
    question_count: int = 20
    difficulty_mode: str = "adaptive"


@router.post("/exam/start")
async def exam_start(
    req: ExamStartRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if req.mode == "qbank":
        if not req.lm_id:
            return {"error": "lm_id required for qbank mode"}
        selected = await _select_qbank_questions(db, req.lm_id, user_id, req.question_count, req.difficulty_mode)
        session_type = "quiz"
        include_difficulty = True
        time_limit_min = max(10, req.question_count * 2)
    elif req.mode == "mock":
        selected = await _select_mock_questions(db, target=req.question_count or 180)
        session_type = "mock_exam"
        include_difficulty = False
        time_limit_min = 270
    else:
        return {"error": f"Unknown mode: {req.mode}. Use 'qbank' or 'mock'."}

    if not selected:
        return {"error": "No questions available"}
    session_id = await _create_exam_session(db, user_id, session_type)
    return {
        "session_id": session_id,
        "mode": req.mode,
        "question_count": len(selected),
        "time_limit_min": time_limit_min,
        "questions": _serialize_questions(selected, include_difficulty=include_difficulty),
    }


# ── POST /api/exam/submit — unified submit ──

@router.post("/exam/submit")
async def exam_submit(
    req: QCMSubmitRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await qcm_submit(req, user_id, db)


# ── GET /api/flashcards ───────────────────────────────────────

@router.get("/flashcards")
async def get_flashcards(
    lm_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT f.id, f.front, f.back, f.tags,
               sq.next_review, sq.ease_factor
        FROM flashcards f
        LEFT JOIN srs_queue sq ON sq.card_type = 'flashcard'
            AND sq.card_id = f.id AND sq.user_id = :uid
        WHERE f.module_id = :mid
        ORDER BY COALESCE(sq.next_review, '1970-01-01') ASC
    """), {"uid": user_id, "mid": lm_id})
    rows = result.mappings().all()
    return [
        {**dict(r), "next_review": str(r["next_review"]) if r["next_review"] else None}
        for r in rows
    ]


# ── POST /api/flashcards/review ───────────────────────────────

@router.post("/flashcards/review")
async def review_flashcard(
    req: FlashcardReviewRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    score_map = {0: 30.0, 1: 65.0, 2: 90.0}
    score_pct = score_map.get(req.score, 65.0)

    await update_srs(db, user_id, req.lm_id, score_pct)

    return {"status": "reviewed", "score_pct": score_pct, "flashcard_id": req.flashcard_id}


# ── POST /api/coach ───────────────────────────────────────────

@router.post("/coach")
async def coach_ask(
    req: CoachRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """AI Coach powered by Claude API."""
    lm_context = ""
    if req.lm_id:
        row = await db.execute(text("""
            SELECT lm.code, lm.title, t.name AS topic_name
            FROM learning_modules lm
            JOIN topics t ON t.id = lm.topic_id
            WHERE lm.id = :id
        """), {"id": req.lm_id})
        lm = row.mappings().first()
        if lm:
            lm_context = f"Module: {lm['code']} — {lm['title']} (Topic: {lm['topic_name']})"

    # Fetch recent performance for context
    perf_context = ""
    if req.lm_id:
        perf = await db.execute(text("""
            SELECT mastery_level FROM lm_mastery
            WHERE user_id = :uid AND module_id = :mid
        """), {"uid": user_id, "mid": req.lm_id})
        m = perf.mappings().first()
        if m and m["mastery_level"]:
            perf_context = f"Mastery: {m['mastery_level']}%"

    api_key = settings.anthropic_api_key
    if not api_key:
        return {
            "answer": f"Coach IA non disponible — configurez ANTHROPIC_API_KEY. "
                      f"Votre question: \"{req.question}\" {f'({lm_context})' if lm_context else ''}",
            "source_lm": req.lm_id,
        }

    system_prompt = f"""You are Wingman Coach, an expert CFA Level I study assistant.
You help students understand concepts, solve problems, and prepare for the exam.

{f"Context: {lm_context}" if lm_context else ""}
{f"Student performance: {perf_context}" if perf_context else ""}

Rules:
- Be concise and exam-focused (max 300 words)
- Use formulas with proper notation when relevant
- Reference CFA curriculum concepts
- Respond in the same language as the student's question
- If a calculation is involved, show step-by-step
"""

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": req.question}],
        )
        answer = response.content[0].text
    except Exception as e:
        answer = f"Erreur du coach IA: {str(e)}"

    return {"answer": answer, "source_lm": req.lm_id}


# ── GET /api/performance/scores (aggregated per module) ───────

@router.get("/performance/scores")
async def performance_scores(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT lm.code AS module_code, lm.title AS module_title,
               t.code AS topic_code,
               ROUND(AVG(pr.score), 1) AS avg_score,
               COUNT(pr.id) AS attempt_count
        FROM performance_records pr
        JOIN sessions s ON s.id = pr.session_id
        JOIN learning_modules lm ON lm.id = pr.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE s.user_id = :uid
        GROUP BY lm.code, lm.title, t.code
        ORDER BY AVG(pr.score) ASC
    """), {"uid": user_id})
    rows = result.mappings().all()
    return [
        {**dict(r), "avg_score": float(r["avg_score"])}
        for r in rows
    ]
