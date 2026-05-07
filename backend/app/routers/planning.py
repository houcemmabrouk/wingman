from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.srs import update_srs
from app.services.planning_skill import (
    get_planning_state,
    invalidate_planning_cache,
    set_coach_override,
    drop_coach_override,
)

router = APIRouter(prefix="/api/plan", tags=["planning"])


# ── Schemas ───────────────────────────────────────────────────

class PlanGenerateRequest(BaseModel):
    exam_date: str  # YYYY-MM-DD
    daily_hours: float = 2.0


class RecalibrateRequest(BaseModel):
    lm_id: int
    score_pct: float


class RollbackRequest(BaseModel):
    version: int


# ── POST /api/plan/generate ──────────────────────────────────

@router.post("/generate")
async def generate_plan(
    req: PlanGenerateRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    exam = date.fromisoformat(req.exam_date)
    today = date.today()
    total_days = (exam - today).days
    if total_days <= 0:
        return {"error": "exam_date must be in the future"}

    daily_minutes = int(req.daily_hours * 60)

    # Fetch all LMs with topic weights
    result = await db.execute(text("""
        SELECT lm.id, lm.code, lm.title, lm.sort_order,
               t.weight_pct, t.code AS topic_code
        FROM learning_modules lm
        JOIN topics t ON t.id = lm.topic_id
        ORDER BY t.sort_order, lm.sort_order
    """))
    modules = [dict(r._mapping) for r in result]

    # Calculate ROI per module
    for m in modules:
        difficulty = 3  # default medium
        estimated_hours = 2.0
        m["roi"] = float(m["weight_pct"]) * difficulty / estimated_hours
        m["allocated_minutes"] = max(30, int(daily_minutes * float(m["weight_pct"]) / 100))

    # Sort by ROI descending
    modules.sort(key=lambda x: x["roi"], reverse=True)

    # Create study plan
    plan_row = await db.execute(text("""
        INSERT INTO study_plans (user_id, name, start_date, end_date)
        VALUES (:uid, 'Plan CFA L1', :start, :end)
        RETURNING id
    """), {"uid": user_id, "start": today, "end": exam})
    plan_id = plan_row.scalar()

    # Distribute modules across available days
    entries = []
    current_date = today + timedelta(days=1)
    day_minutes_used = 0
    day_index = 0

    for m in modules:
        if current_date > exam:
            break
        if day_minutes_used + m["allocated_minutes"] > daily_minutes:
            current_date += timedelta(days=1)
            day_minutes_used = 0
            if current_date > exam:
                break

        await db.execute(text("""
            INSERT INTO plan_entries (plan_id, module_id, scheduled_date, status)
            VALUES (:plan_id, :mod_id, :sdate, 'pending')
        """), {"plan_id": plan_id, "mod_id": m["id"], "sdate": current_date})

        entries.append({
            "module_code": m["code"],
            "module_title": m["title"],
            "scheduled_date": str(current_date),
            "allocated_minutes": m["allocated_minutes"],
            "roi": round(m["roi"], 2),
        })
        day_minutes_used += m["allocated_minutes"]

    await db.commit()

    return {
        "plan_id": plan_id,
        "total_entries": len(entries),
        "start_date": str(today),
        "exam_date": str(exam),
        "entries": entries,
    }


# ── POST /api/plan/recalibrate ───────────────────────────────

@router.post("/recalibrate")
async def recalibrate_plan(
    req: RecalibrateRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Update SRS
    await update_srs(db, user_id, req.lm_id, req.score_pct)

    if req.score_pct >= 60:
        return {"action": "none", "message": "Score acceptable, pas de recalibration nécessaire"}

    # Find current active plan
    plan_row = await db.execute(text("""
        SELECT id FROM study_plans
        WHERE user_id = :uid AND is_active = true
        ORDER BY created_at DESC LIMIT 1
    """), {"uid": user_id})
    plan_id = plan_row.scalar()
    if not plan_id:
        return {"error": "No active plan found"}

    # Get next 5 available days
    result = await db.execute(text("""
        SELECT DISTINCT scheduled_date
        FROM plan_entries
        WHERE plan_id = :pid AND scheduled_date > CURRENT_DATE AND status = 'pending'
        ORDER BY scheduled_date
        LIMIT 5
    """), {"pid": plan_id})
    available_dates = [r[0] for r in result]

    if not available_dates:
        return {"error": "No available dates for recalibration"}

    # Inject the failed LM into a near date
    target_date = available_dates[min(1, len(available_dates) - 1)]
    await db.execute(text("""
        INSERT INTO plan_entries (plan_id, module_id, scheduled_date, status)
        VALUES (:pid, :mid, :dt, 'pending')
    """), {"pid": plan_id, "mid": req.lm_id, "dt": target_date})

    await db.commit()

    # Get LM info
    lm_row = await db.execute(text(
        "SELECT code, title FROM learning_modules WHERE id = :id"
    ), {"id": req.lm_id})
    lm = lm_row.mappings().first()

    return {
        "action": "recalibrated",
        "lm_code": lm["code"] if lm else "?",
        "lm_title": lm["title"] if lm else "?",
        "injected_date": str(target_date),
        "score_pct": req.score_pct,
    }


# ── GET /api/plan/today ──────────────────────────────────────

@router.get("/today")
async def plan_today(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT
            pe.id, lm.id AS lm_id, lm.code AS module_code, lm.title AS module_title,
            pe.scheduled_date, pe.status, t.code AS topic_code
        FROM plan_entries pe
        JOIN study_plans sp ON sp.id = pe.plan_id
        JOIN learning_modules lm ON lm.id = pe.module_id
        JOIN topics t ON t.id = lm.topic_id
        WHERE sp.user_id = :uid AND pe.scheduled_date = CURRENT_DATE
        ORDER BY
            CASE pe.status
                WHEN 'in_progress' THEN 1
                WHEN 'pending'     THEN 2
                WHEN 'completed'   THEN 3
                WHEN 'skipped'     THEN 4
            END,
            lm.sort_order
    """), {"uid": user_id})
    rows = result.mappings().all()
    return [
        {**dict(r), "scheduled_date": str(r["scheduled_date"])}
        for r in rows
    ]


# ── POST /api/plan/entry/{id}/complete ────────────────────────

@router.post("/entry/{entry_id}/complete")
async def complete_entry(
    entry_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        UPDATE plan_entries pe
        SET status = 'completed'
        FROM study_plans sp
        WHERE pe.id = :id
          AND pe.plan_id = sp.id
          AND sp.user_id = :uid
    """), {"id": entry_id, "uid": user_id})
    await db.commit()
    if result.rowcount == 0:
        return {"error": "entry not found"}
    await invalidate_planning_cache(user_id)
    return {"status": "completed", "entry_id": entry_id}


# ── GET /api/plan/history ─────────────────────────────────────

@router.get("/history")
async def plan_history(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT id, name, start_date, end_date, is_active, created_at
        FROM study_plans
        WHERE user_id = :uid
        ORDER BY created_at DESC
    """), {"uid": user_id})
    rows = result.mappings().all()
    return [
        {**dict(r), "start_date": str(r["start_date"]), "end_date": str(r["end_date"]),
         "created_at": str(r["created_at"])}
        for r in rows
    ]


# ── POST /api/plan/rollback ──────────────────────────────────

# ── GET /api/planning/state — unified DTO for every view ──

@router.get("/state")
async def planning_state(
    user_id: str = Depends(current_user_id),
    refresh: bool = False,
    use_cache: bool = True,  # cache by default; session-end endpoints invalidate it
    minutes_override: Optional[int] = None,  # dashboard time selector (30/45/60/90/120)
    db: AsyncSession = Depends(get_db),
):
    # Tab loads serve the cached plan. Session-end endpoints (checklist, performance,
    # debrief, weaknesses) call invalidate_planning_cache(), so the next tab load after
    # a session automatically produces a fresh plan. Explicit refresh=true or a
    # minutes_override (time selector changed) still forces regeneration.
    force = refresh or not use_cache or minutes_override is not None
    try:
        return await get_planning_state(
            db, user_id, force_refresh=force, minutes_override=minutes_override
        )
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}


@router.post("/state/invalidate")
async def planning_state_invalidate(
    user_id: str = Depends(current_user_id),
):
    await invalidate_planning_cache(user_id)
    return {"invalidated": True, "user_id": user_id}


# ── POST /api/plan/coach-override ────────────────────────────
# Replace today's plan with the Coach's proposal. Lasts until the next
# session-end (cache is invalidated then) or until /drop-coach is called.

class CoachBlock(BaseModel):
    order: Optional[int] = None
    topic_code: str
    lm_code: Optional[str] = None
    activity: str = "Targeted QBank"
    minutes: int = 15
    rationale_rule: int = 11


class CoachOverrideRequest(BaseModel):
    blocks: list[CoachBlock]
    rationale: str = ""
    session_mode: Optional[str] = None  # e.g. "reinforce" | "explore" | "mock"


@router.post("/coach-override")
async def coach_override(
    req: CoachOverrideRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    dto = await set_coach_override(
        db,
        user_id=user_id,
        coach_blocks=[b.model_dump() for b in req.blocks],
        rationale=req.rationale,
        session_mode=req.session_mode,
    )
    return dto


# ── POST /api/plan/drop-coach ────────────────────────────────
# Explicitly drop the coach override and force a normal plan on next fetch.

@router.post("/drop-coach")
async def drop_coach(
    user_id: str = Depends(current_user_id),
):
    await drop_coach_override(user_id)
    return {"dropped": True, "user_id": user_id}


# ── GET /api/plan/month-outlook ──────────────────────────────
# Extends the 7-day week_outlook from the planning skill into a 30-day
# projection by cycling the weekly pattern. Days 0-6 come from the LLM
# (source = 'planned'); days 7-29 are deterministic projections (source =
# 'projected') so the UI can shade them differently and the user knows
# they're not committed plans.

@router.get("/month-outlook")
async def month_outlook(
    user_id: str = Depends(current_user_id),
    days: int = 30,
    db: AsyncSession = Depends(get_db),
):
    days = max(7, min(days, 60))  # clamp 7..60
    state = await get_planning_state(db, user_id, force_refresh=False)
    week = state.get("week_outlook") or []
    # Index the LLM week by day_offset for O(1) lookup
    by_off = {int(w["day_offset"]): w for w in week}

    today = date.today()
    out = []
    for i in range(days):
        if i in by_off:
            d = dict(by_off[i])
            d["source"] = "planned"
        else:
            # Project: cycle the weekly pattern (mod 7) and tag as projected.
            template = by_off.get(i % 7) or {}
            d = {
                "day_offset":        i,
                "focus_topic_codes": template.get("focus_topic_codes", []),
                "total_minutes":     int(template.get("total_minutes", 60)),
                "includes_mock":     bool(template.get("includes_mock", False)),
                "includes_srs":      bool(template.get("includes_srs", True)),
                "is_rest_day":       bool(template.get("is_rest_day", False)),
                "source":            "projected",
            }
        d["date"] = (today + timedelta(days=i)).isoformat()
        d["weekday"] = (today + timedelta(days=i)).strftime("%a")
        out.append(d)

    # Aggregate quick stats for the month header
    planned_minutes = sum(d["total_minutes"] for d in out if not d["is_rest_day"])
    rest_days = sum(1 for d in out if d["is_rest_day"])
    mock_days = sum(1 for d in out if d["includes_mock"])

    return {
        "user_id":         user_id,
        "days":            days,
        "outlook":         out,
        "planned_minutes": planned_minutes,
        "rest_days":       rest_days,
        "mock_days":       mock_days,
        "source_split": {
            "planned":   sum(1 for d in out if d["source"] == "planned"),
            "projected": sum(1 for d in out if d["source"] == "projected"),
        },
    }


@router.post("/rollback")
async def rollback_plan(
    version: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Deactivate all plans
    await db.execute(text("""
        UPDATE study_plans SET is_active = false WHERE user_id = :uid
    """), {"uid": user_id})

    # Activate the target version (by id order)
    result = await db.execute(text("""
        SELECT id FROM study_plans WHERE user_id = :uid ORDER BY created_at
    """), {"uid": user_id})
    plans = [r[0] for r in result]

    if version < 1 or version > len(plans):
        return {"error": f"Version {version} not found. Available: 1-{len(plans)}"}

    target_id = plans[version - 1]
    await db.execute(text("""
        UPDATE study_plans SET is_active = true WHERE id = :id AND user_id = :uid
    """), {"id": target_id, "uid": user_id})
    await db.commit()

    return {"status": "rolled_back", "active_plan_id": target_id, "version": version}
