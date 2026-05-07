import traceback
from datetime import datetime, timezone

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_db, engine
from app.deps import current_user_id
from app.middleware.auth import AuthMiddleware
from app.middleware.logging_mw import LoggingMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.routers import planning, performance, knowledge, content, progress, alerts, diagnostic, auth, admin, ai, kpis, sessions, weaknesses, coach_session, coach_mail, user_profile, nba, nba_v1, memory, readiness, errors, disputes, inbox, weekly_digest
from app.routers.errors import record_error
from app.services.planning_skill import invalidate_planning_cache

app = FastAPI(
    title="Wingman API",
    description="Learning OS for CFA Level I",
    version="1.0.0",
)

# ── Middleware (order matters: last added = first executed) ────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://wingman.veridis.shop", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# ── Routers ───────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(planning.router)
app.include_router(performance.router)
app.include_router(knowledge.router)
app.include_router(content.router)
app.include_router(progress.router)
app.include_router(alerts.router)
app.include_router(diagnostic.router)
app.include_router(diagnostic.router_v1)
app.include_router(ai.router)
app.include_router(kpis.router)
app.include_router(sessions.router)
app.include_router(weaknesses.router)
app.include_router(coach_session.router)
app.include_router(coach_mail.router)
app.include_router(user_profile.router)
app.include_router(nba.router)
app.include_router(nba_v1.router)
app.include_router(memory.router)
app.include_router(readiness.router)
app.include_router(errors.router)
app.include_router(disputes.router)
app.include_router(inbox.router)
app.include_router(weekly_digest.router)


# ── Global exception handler — logs every unhandled exception ─
# Catches anything not handled by route-level try/except. We log to the
# system_errors table on a separate session so the failed request's session
# (which may be in a bad state) doesn't poison the insert.

@app.exception_handler(Exception)
async def _log_unhandled_exception(request: Request, exc: Exception):
    uid = getattr(request.state, "user_id", None)
    if not (isinstance(uid, str) and uid):
        uid = None
    try:
        async with async_session() as log_db:
            await record_error(
                log_db,
                user_id=uid,
                source="backend",
                kind=type(exc).__name__[:40],
                message=str(exc),
                stack=traceback.format_exc(),
                context={
                    "method": request.method,
                    "path": str(request.url.path),
                    "query": str(request.url.query) or None,
                },
            )
    except Exception:
        # Never let the logger itself break the response.
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "kind": type(exc).__name__},
    )

# ── Demo user ─────────────────────────────────────────────────

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
_demo_seeded = False


async def ensure_demo_user(db: AsyncSession):
    global _demo_seeded
    if _demo_seeded:
        return
    row = await db.execute(text("SELECT id FROM users WHERE id = :uid"), {"uid": DEMO_USER_ID})
    if row.scalar() is None:
        await db.execute(text("""
            INSERT INTO users (id, email, password_hash, display_name, provider)
            VALUES (:uid, 'demo@wingman.dev', 'noop', 'Demo User', 'password')
        """), {"uid": DEMO_USER_ID})
        await db.execute(text("""
            INSERT INTO user_profiles (user_id, exam_date, daily_minutes_goal, streak_current, xp_total)
            VALUES (:uid, CURRENT_DATE + INTERVAL '90 days', 90, 7, 1250)
        """), {"uid": DEMO_USER_ID})
        await db.execute(text("""
            INSERT INTO alerts (user_id, alert_type, title, body) VALUES
            (:uid, 'review_due', 'Révision SRS disponible', '12 cartes arrivent à échéance'),
            (:uid, 'streak_risk', 'Streak en danger', 'Étudiez aujourd''hui pour maintenir votre série de 7 jours')
        """), {"uid": DEMO_USER_ID})
        plan_row = await db.execute(text("""
            INSERT INTO study_plans (user_id, name, start_date, end_date)
            VALUES (:uid, 'Default Plan', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days')
            RETURNING id
        """), {"uid": DEMO_USER_ID})
        plan_id = plan_row.scalar()
        await db.execute(text("""
            INSERT INTO plan_entries (plan_id, module_id, scheduled_date, status)
            SELECT :plan_id, lm.id, CURRENT_DATE,
                   CASE WHEN lm.code = 'QM-01' THEN 'completed'
                        WHEN lm.code = 'QM-02' THEN 'in_progress'
                        ELSE 'pending' END
            FROM learning_modules lm
            WHERE lm.code IN ('QM-01','QM-02','QM-03','ETH-01')
        """), {"plan_id": plan_id})
        await db.commit()
    _demo_seeded = True


# ── Health ────────────────────────────────────────────────────

@app.get("/api/auth/config")
async def auth_config():
    from app.config import settings
    return {
        "auth_disabled": settings.auth_disabled,
        "google_enabled": bool(settings.google_client_id),
    }


@app.get("/health")
async def health():
    db_ok = "ok"
    redis_ok = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = "error"
    try:
        import redis as redis_lib
        r = redis_lib.from_url("redis://redis:6379/0", socket_timeout=2)
        r.ping()
    except Exception:
        redis_ok = "unavailable"
    return {"status": "ok", "db": db_ok, "redis": redis_ok, "version": "1.0.0"}


# ── Data injection monitor ────────────────────────────────

@app.get("/api/data-status")
async def data_status(db: AsyncSession = Depends(get_db)):
    counts: dict = {}
    tables = [
        ("topics", "topics"),
        ("learning_modules", "learning_modules"),
        ("learning_outcomes", "learning_outcomes"),
        ("questions", "questions"),
        ("flashcards", "flashcards"),
        ("users", "users"),
        ("user_profiles", "user_profiles"),
        ("study_plans", "study_plans"),
        ("plan_entries", "plan_entries"),
        ("sessions", "sessions"),
        ("performance_records", "performance_records"),
        ("question_attempts", "question_attempts"),
        ("srs_queue", "srs_queue"),
        ("lm_mastery", "lm_mastery"),
        ("alerts", "alerts"),
        ("weakness_log", "weakness_log"),
        ("progress_snapshots", "progress_snapshots"),
        ("content_assets", "content_assets"),
        ("content_vectors", "content_vectors"),
    ]
    for label, table in tables:
        try:
            r = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))  # noqa: S608
            counts[label] = r.scalar()
        except Exception:
            counts[label] = -1

    # Per-topic breakdown
    topic_breakdown = []
    try:
        rows = await db.execute(text("""
            SELECT t.code, t.name,
                COUNT(DISTINCT lm.id) AS modules,
                (SELECT COUNT(*) FROM learning_outcomes lo WHERE lo.module_id IN (SELECT id FROM learning_modules WHERE topic_id = t.id)) AS outcomes,
                (SELECT COUNT(*) FROM questions q WHERE q.module_id IN (SELECT id FROM learning_modules WHERE topic_id = t.id)) AS questions,
                (SELECT COUNT(*) FROM flashcards f WHERE f.module_id IN (SELECT id FROM learning_modules WHERE topic_id = t.id)) AS flashcards
            FROM topics t
            LEFT JOIN learning_modules lm ON lm.topic_id = t.id
            GROUP BY t.id, t.code, t.name, t.sort_order
            ORDER BY t.sort_order
        """))
        for r in rows.mappings().all():
            topic_breakdown.append(dict(r))
    except Exception:
        pass

    return {"counts": counts, "topic_breakdown": topic_breakdown}


# ── GET /api/v1/topics ────────────────────────────────────────

@app.get("/api/v1/topics")
async def list_topics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT id, code, name, weight_pct FROM topics ORDER BY sort_order"))
    return [dict(r._mapping) for r in result]


# ── GET /api/v1/daily-brief ──────────────────────────────────

@app.get("/api/v1/daily-brief")
async def daily_brief(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from app.services.user_metrics import compute_streak
    try:
        row = await db.execute(text("""
            SELECT
                u.id AS user_id, u.display_name,
                up.streak_current, up.xp_total, up.daily_minutes_goal, up.exam_date,
                COALESCE((SELECT SUM(s.duration_sec)/60 FROM sessions s WHERE s.user_id=u.id AND s.started_at::date=CURRENT_DATE), 0) AS today_minutes,
                COALESCE((SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.started_at::date=CURRENT_DATE), 0) AS today_sessions,
                COALESCE((SELECT COUNT(*) FROM srs_queue sq WHERE sq.user_id=u.id AND sq.next_review<=now()), 0) AS cards_due,
                COALESCE((SELECT COUNT(*) FROM alerts a WHERE a.user_id=u.id AND a.is_read=false), 0) AS unread_alerts
            FROM users u JOIN user_profiles up ON up.user_id=u.id WHERE u.id=:uid
        """), {"uid": user_id})
        r = row.mappings().first()
        if not r:
            return _default_brief(user_id)
        data = dict(r)
        data["streak_current"] = await compute_streak(db, user_id)
        if data["exam_date"]:
            delta = data["exam_date"] - datetime.now(timezone.utc).date()
            data["days_until_exam"] = max(0, delta.days)
            data["exam_date"] = str(data["exam_date"])
        else:
            data["days_until_exam"] = None
        data["user_id"] = str(data["user_id"])
        return data
    except Exception:
        return _default_brief(user_id)


def _default_brief(user_id: str):
    """Fallback when DB is unavailable."""
    from datetime import date, timedelta
    exam = date.today() + timedelta(days=150)
    return {
        "user_id": user_id, "display_name": "User",
        "streak_current": 0, "xp_total": 0, "daily_minutes_goal": 90,
        "exam_date": str(exam), "today_minutes": 0, "today_sessions": 0,
        "cards_due": 0, "unread_alerts": 0, "days_until_exam": 150,
    }


# ── Session endpoints (Daily Monitor) ────────────────────────

class SessionStartRequest(BaseModel):
    session_type: str = "study"


class SessionStopRequest(BaseModel):
    session_id: int


@app.post("/api/v1/session/start")
async def session_start(
    req: SessionStartRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        INSERT INTO sessions (user_id, session_type) VALUES (:uid, :stype) RETURNING id, started_at, session_type
    """), {"uid": user_id, "stype": req.session_type})
    await db.commit()
    r = result.mappings().first()
    return {"session_id": r["id"], "started_at": str(r["started_at"]), "session_type": r["session_type"]}


@app.post("/api/v1/session/stop")
async def session_stop(
    req: SessionStopRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        UPDATE sessions SET ended_at=now(), duration_sec=EXTRACT(EPOCH FROM (now()-started_at))::int
        WHERE id=:sid AND user_id=:uid RETURNING duration_sec
    """), {"sid": req.session_id, "uid": user_id})
    await db.commit()
    r = result.mappings().first()
    if not r:
        return {"error": "session not found"}
    duration = r["duration_sec"] or 0
    xp_gain = max(1, duration // 60)
    await db.execute(text("UPDATE user_profiles SET xp_total=xp_total+:xp WHERE user_id=:uid"),
                     {"xp": xp_gain, "uid": user_id})
    await db.commit()
    await invalidate_planning_cache(user_id)
    return {"duration_sec": duration}


# ── Alerts ────────────────────────────────────────────────────

@app.get("/api/v1/alerts")
async def get_alerts(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(text("""
            SELECT id, alert_type, title, body, is_read, created_at
            FROM alerts WHERE user_id=:uid AND is_read=false ORDER BY created_at DESC LIMIT 10
        """), {"uid": user_id})
        return [{**dict(r), "created_at": str(r["created_at"])} for r in result.mappings().all()]
    except Exception:
        return []


# ── Plan Today (Daily Monitor) ────────────────────────────────

@app.get("/api/v1/plan/today")
async def plan_today_v1(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(text("""
            SELECT pe.id, lm.code AS module_code, lm.title AS module_title,
                   pe.scheduled_date, pe.status, t.code AS topic_code
            FROM plan_entries pe
            JOIN study_plans sp ON sp.id=pe.plan_id
            JOIN learning_modules lm ON lm.id=pe.module_id
            JOIN topics t ON t.id=lm.topic_id
            WHERE sp.user_id=:uid AND pe.scheduled_date=CURRENT_DATE
            ORDER BY CASE pe.status WHEN 'in_progress' THEN 1 WHEN 'pending' THEN 2
                     WHEN 'completed' THEN 3 WHEN 'skipped' THEN 4 END, lm.sort_order
        """), {"uid": user_id})
        return [{**dict(r), "scheduled_date": str(r["scheduled_date"])} for r in result.mappings().all()]
    except Exception:
        return []
