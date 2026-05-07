"""Weaknesses tab: aggregated view of weakness_log + actions to resolve/inject."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.services.planning_skill import invalidate_planning_cache

router = APIRouter(prefix="/api/weaknesses", tags=["weaknesses"])


# ── GET /api/weaknesses/overview ────────────────────────────
# KPIs + topic-level heatmap.

@router.get("/overview")
async def weaknesses_overview(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Totals + severity bucket counts
    totals_row = await db.execute(
        text(
            """
            SELECT
              COUNT(*) FILTER (WHERE resolved = false)                                AS active,
              COUNT(*) FILTER (WHERE resolved = false AND severity >= 4)              AS critical,
              COUNT(*) FILTER (WHERE resolved = false AND severity = 3)               AS high,
              COUNT(*) FILTER (WHERE resolved = false AND severity <= 2)              AS medium_low,
              COUNT(*) FILTER (WHERE resolved = true  AND resolved_at > now() - interval '30 days') AS resolved_30d
            FROM weakness_log
            WHERE user_id = :uid
            """
        ),
        {"uid": user_id},
    )
    totals = dict(totals_row.mappings().first() or {})

    # Top priority: oldest unresolved critical
    top_row = await db.execute(
        text(
            """
            SELECT lm.code AS lm_code, lo.code AS los_code,
                   wl.created_at, wl.severity,
                   EXTRACT(day FROM now() - wl.created_at)::int AS age_days
            FROM weakness_log wl
            JOIN learning_modules lm ON lm.id = wl.module_id
            LEFT JOIN learning_outcomes lo ON lo.id = wl.outcome_id
            WHERE wl.user_id = :uid AND wl.resolved = false
            ORDER BY wl.severity DESC, wl.created_at ASC
            LIMIT 1
            """
        ),
        {"uid": user_id},
    )
    top = top_row.mappings().first()

    # Heatmap: per-topic counts by severity bucket
    heatmap_rows = await db.execute(
        text(
            """
            SELECT t.code AS topic_code, t.name AS topic_name, t.weight_pct,
                   COUNT(*) FILTER (WHERE wl.severity >= 4)  AS critical,
                   COUNT(*) FILTER (WHERE wl.severity = 3)   AS high,
                   COUNT(*) FILTER (WHERE wl.severity <= 2)  AS medium_low,
                   COUNT(*)                                   AS total
            FROM weakness_log wl
            JOIN learning_modules lm ON lm.id = wl.module_id
            JOIN topics t ON t.id = lm.topic_id
            WHERE wl.user_id = :uid AND wl.resolved = false
            GROUP BY t.code, t.name, t.weight_pct, t.sort_order
            ORDER BY critical DESC, high DESC, total DESC
            """
        ),
        {"uid": user_id},
    )
    heatmap = [dict(r) for r in heatmap_rows.mappings()]
    for h in heatmap:
        h["weight_pct"] = float(h["weight_pct"]) if h["weight_pct"] is not None else 0.0

    # Topic most at risk = highest critical count weighted by exam weight
    at_risk = None
    if heatmap:
        scored = sorted(heatmap, key=lambda r: (r["critical"] * 3 + r["high"] * 2) * max(r["weight_pct"], 1), reverse=True)
        at_risk = scored[0] if scored[0]["total"] > 0 else None

    # Estimated score impact (rough heuristic)
    # severity 4-5 ≈ 3pts at risk each, severity 3 ≈ 2pts, severity ≤ 2 ≈ 1pt
    score_impact = (totals.get("critical", 0) or 0) * 3 + (totals.get("high", 0) or 0) * 2 + (totals.get("medium_low", 0) or 0) * 1

    return {
        "active": int(totals.get("active") or 0),
        "critical": int(totals.get("critical") or 0),
        "high": int(totals.get("high") or 0),
        "medium_low": int(totals.get("medium_low") or 0),
        "resolved_30d": int(totals.get("resolved_30d") or 0),
        "top_priority": (
            {
                "lm_code": top["lm_code"],
                "los_code": top["los_code"],
                "age_days": int(top["age_days"] or 0),
                "severity": int(top["severity"] or 0),
            } if top else None
        ),
        "topic_at_risk": at_risk,
        "estimated_score_impact": int(score_impact),
        "heatmap": heatmap,
    }


# ── GET /api/weaknesses/los ────────────────────────────────
# Detailed list of unresolved weaknesses, one row per LOS (or LM if no LOS).

@router.get("/los")
async def weaknesses_los(
    user_id: str = Depends(current_user_id),
    include_resolved: bool = False,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    filter_sql = "" if include_resolved else "AND wl.resolved = false"
    result = await db.execute(
        text(
            f"""
            SELECT
                wl.id, wl.severity, wl.weakness_type, wl.notes, wl.resolved,
                wl.created_at, wl.resolved_at,
                EXTRACT(day FROM now() - wl.created_at)::int AS age_days,
                lm.code AS lm_code, lm.title AS lm_title,
                t.code AS topic_code, t.weight_pct,
                lo.code AS los_code, lo.description AS los_description
            FROM weakness_log wl
            JOIN learning_modules lm ON lm.id = wl.module_id
            JOIN topics t ON t.id = lm.topic_id
            LEFT JOIN learning_outcomes lo ON lo.id = wl.outcome_id
            WHERE wl.user_id = :uid {filter_sql}
            ORDER BY wl.resolved ASC, wl.severity DESC, wl.created_at ASC
            LIMIT :lim
            """
        ),
        {"uid": user_id, "lim": limit},
    )
    rows = result.mappings().all()
    return [
        {
            **dict(r),
            "created_at": str(r["created_at"]),
            "resolved_at": str(r["resolved_at"]) if r["resolved_at"] else None,
            "weight_pct": float(r["weight_pct"]) if r["weight_pct"] is not None else 0.0,
        }
        for r in rows
    ]


# ── POST /api/weaknesses/{id}/resolve ──────────────────────

@router.post("/{weakness_id}/resolve")
async def resolve_weakness(
    weakness_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE weakness_log
            SET resolved = true, resolved_at = now()
            WHERE id = :id AND user_id = :uid
            RETURNING id
            """
        ),
        {"id": weakness_id, "uid": user_id},
    )
    if result.scalar() is None:
        raise HTTPException(status_code=404, detail="Weakness not found")
    await db.commit()
    await invalidate_planning_cache(user_id)  # tomorrow's plan no longer remediates this
    return {"resolved": weakness_id}


# ── POST /api/weaknesses/{id}/unresolve ────────────────────
# Inverse of /resolve — flip a weakness back to active so Rule 11 picks it
# up again. Useful when the user marked it resolved by mistake or it
# regressed after a later session.

@router.post("/{weakness_id}/unresolve")
async def unresolve_weakness(
    weakness_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE weakness_log
            SET resolved = false, resolved_at = NULL
            WHERE id = :id AND user_id = :uid
            RETURNING id
            """
        ),
        {"id": weakness_id, "uid": user_id},
    )
    if result.scalar() is None:
        raise HTTPException(status_code=404, detail="Weakness not found")
    await db.commit()
    await invalidate_planning_cache(user_id)  # next plan should remediate again
    return {"unresolved": weakness_id}


# ── POST /api/weaknesses/{id}/inject ───────────────────────
# Boost the weakness (severity + 1 if not yet max) and force a fresh plan
# so Rule 11 remediation picks it up on the next generation.

@router.post("/{weakness_id}/inject")
async def inject_weakness(
    weakness_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE weakness_log
            SET severity = LEAST(severity + 1, 5),
                created_at = now()
            WHERE id = :id AND user_id = :uid AND resolved = false
            RETURNING id, severity
            """
        ),
        {"id": weakness_id, "uid": user_id},
    )
    row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Weakness not found or already resolved")
    await db.commit()
    await invalidate_planning_cache(user_id)
    return {"injected": row["id"], "new_severity": int(row["severity"])}


# ── POST /api/weaknesses/inject-all ────────────────────────
# Bump all unresolved critical+high weaknesses + invalidate planning.

@router.post("/inject-all")
async def inject_all_weaknesses(
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE weakness_log
            SET severity = LEAST(severity + 1, 5), created_at = now()
            WHERE user_id = :uid AND resolved = false AND severity >= 3
            RETURNING id
            """
        ),
        {"uid": user_id},
    )
    ids = [r[0] for r in result.all()]
    await db.commit()
    await invalidate_planning_cache(user_id)
    return {"injected_count": len(ids), "ids": ids}
