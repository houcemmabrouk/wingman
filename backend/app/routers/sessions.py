"""End-of-session checklist: form + PDF export + weakness sync."""
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import current_user_id
from app.routers.content import _markdown_to_pdf, GENERATED_ROOT
from app.services.planning_skill import invalidate_planning_cache

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

SESSIONS_ROOT = GENERATED_ROOT / "sessions"


# ── Schemas ───────────────────────────────────────────────────

class BlockEntry(BaseModel):
    order: int
    topic_code: str
    lm_code: Optional[str] = None
    activity: str
    minutes_planned: int = 0
    done: bool = False


class LosMasteryEntry(BaseModel):
    lm_code: str
    los_code: str
    los_description: str
    rag: Literal["red", "amber", "green", "unset"] = "unset"


class ChecklistPayload(BaseModel):
    session_date: Optional[str] = None  # YYYY-MM-DD
    blocks: list[BlockEntry] = Field(default_factory=list)
    los_mastery: list[LosMasteryEntry] = Field(default_factory=list)
    notes: str = ""
    energy: Optional[int] = Field(default=None, ge=1, le=5)
    confidence: Optional[int] = Field(default=None, ge=1, le=5)
    minutes_actual: int = 0


# ── GET /api/sessions/checklist/context ───────────────────────
# Returns blocks (from today's planning) + LOS for the LMs touched.

@router.get("/checklist/context")
async def checklist_context(
    lm_codes: str = "",
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Build the pre-filled form: today's planning blocks + LOS for each LM."""
    codes = [c.strip() for c in lm_codes.split(",") if c.strip()]
    los_rows: list[dict] = []
    if codes:
        result = await db.execute(
            text(
                """
                SELECT lm.code AS lm_code, lo.code AS los_code, lo.description
                FROM learning_outcomes lo
                JOIN learning_modules lm ON lm.id = lo.module_id
                WHERE lm.code = ANY(:codes)
                ORDER BY lm.code, lo.sort_order, lo.code
                """
            ),
            {"codes": codes},
        )
        los_rows = [dict(r._mapping) for r in result]

    return {"los": los_rows}


# ── POST /api/sessions/checklist ──────────────────────────────
# Persist the checklist, sync weakness_log for 🔴 LOS, generate PDF.

@router.post("/checklist")
async def save_checklist(
    payload: ChecklistPayload,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sdate = date.fromisoformat(payload.session_date) if payload.session_date else date.today()
    minutes_planned = sum(b.minutes_planned for b in payload.blocks)

    # Persist checklist
    row = await db.execute(
        text(
            """
            INSERT INTO session_checklists
              (user_id, session_date, blocks, los_mastery, notes, energy, confidence,
               minutes_planned, minutes_actual)
            VALUES
              (:uid, :sdate, CAST(:blocks AS jsonb), CAST(:los AS jsonb),
               :notes, :energy, :confidence, :mplan, :mact)
            RETURNING id
            """
        ),
        {
            "uid": user_id,
            "sdate": sdate,
            "blocks": json.dumps([b.model_dump() for b in payload.blocks]),
            "los": json.dumps([l.model_dump() for l in payload.los_mastery]),
            "notes": payload.notes,
            "energy": payload.energy,
            "confidence": payload.confidence,
            "mplan": minutes_planned,
            "mact": payload.minutes_actual,
        },
    )
    checklist_id = row.scalar()

    # Sync weakness_log: any 🔴 LOS becomes a weakness (severity 3)
    red_los = [l for l in payload.los_mastery if l.rag == "red"]
    for entry in red_los:
        module_row = await db.execute(
            text("SELECT id FROM learning_modules WHERE code = :c"),
            {"c": entry.lm_code},
        )
        module_id = module_row.scalar()
        outcome_row = await db.execute(
            text("SELECT id FROM learning_outcomes WHERE code = :c"),
            {"c": entry.los_code},
        )
        outcome_id = outcome_row.scalar()
        if module_id is None:
            continue
        await db.execute(
            text(
                """
                INSERT INTO weakness_log
                  (user_id, module_id, outcome_id, weakness_type, severity, notes)
                VALUES
                  (:uid, :mid, :oid, 'recall', 3, :note)
                """
            ),
            {
                "uid": user_id,
                "mid": module_id,
                "oid": outcome_id,
                "note": f"End-of-session self-rating (red) on {sdate.isoformat()}",
            },
        )

    # Generate PDF
    user_dir = SESSIONS_ROOT / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = user_dir / f"{sdate.isoformat()}_session_{checklist_id}.pdf"
    md = _render_checklist_markdown(payload, sdate, minutes_planned)
    _markdown_to_pdf(md, str(pdf_path),
                     title=f"Session Checklist — {sdate.isoformat()}",
                     subtitle=f"Wingman · {len(payload.blocks)} blocks · {payload.minutes_actual}/{minutes_planned} min")

    await db.execute(
        text("UPDATE session_checklists SET pdf_path = :p WHERE id = :id"),
        {"p": str(pdf_path.relative_to(GENERATED_ROOT.parent)), "id": checklist_id},
    )
    await db.commit()

    # Invalidate cached plan so tomorrow's plan picks up new weaknesses
    await invalidate_planning_cache(user_id)

    return {
        "id": checklist_id,
        "pdf_url": f"/api/sessions/checklist/{checklist_id}/pdf",
        "weaknesses_recorded": len(red_los),
        "minutes_planned": minutes_planned,
        "minutes_actual": payload.minutes_actual,
    }


# ── GET /api/sessions/checklist/{id}/pdf ──────────────────────

@router.get("/checklist/{checklist_id}/pdf")
async def download_checklist_pdf(checklist_id: int, db: AsyncSession = Depends(get_db)):
    row = await db.execute(
        text("SELECT pdf_path FROM session_checklists WHERE id = :id"),
        {"id": checklist_id},
    )
    rel_path = row.scalar()
    if not rel_path:
        raise HTTPException(status_code=404, detail="Checklist PDF not found")
    pdf_path = GENERATED_ROOT.parent / rel_path
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file missing on disk")
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
        headers={"Content-Disposition": f'inline; filename="{pdf_path.name}"'},
    )


# ── GET /api/sessions/checklist/history ───────────────────────

@router.delete("/checklist/{checklist_id}")
async def delete_checklist(
    checklist_id: int,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a study session checklist owned by user_id.

    Ownership is enforced; row is removed atomically.
    """
    owned = await db.execute(
        text("SELECT 1 FROM session_checklists WHERE id = :cid AND user_id = :uid"),
        {"cid": checklist_id, "uid": user_id},
    )
    if owned.scalar() is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    await db.execute(
        text("DELETE FROM session_checklists WHERE id = :cid AND user_id = :uid"),
        {"cid": checklist_id, "uid": user_id},
    )
    await db.commit()
    return {"deleted": checklist_id}


@router.get("/checklist/history")
async def checklist_history(
    limit: int = 30,
    include_blocks: bool = False,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # `include_blocks=true` returns the full blocks jsonb so the frontend can
    # render an expand-on-click block list per study session.
    cols = """id, session_date, energy, confidence,
              minutes_planned, minutes_actual,
              jsonb_array_length(blocks) AS block_count,
              jsonb_array_length(los_mastery) AS los_count,
              created_at"""
    if include_blocks:
        cols += ", blocks"
    result = await db.execute(
        text(
            f"""
            SELECT {cols}
            FROM session_checklists
            WHERE user_id = :uid
            ORDER BY session_date DESC, created_at DESC
            LIMIT :lim
            """
        ),
        {"uid": user_id, "lim": limit},
    )
    rows = result.mappings().all()
    return [
        {
            **dict(r),
            "session_date": str(r["session_date"]),
            "created_at": str(r["created_at"]),
            "pdf_url": f"/api/sessions/checklist/{r['id']}/pdf",
        }
        for r in rows
    ]


# ── Markdown template ─────────────────────────────────────────

def _render_checklist_markdown(p: ChecklistPayload, sdate: date, minutes_planned: int) -> str:
    """Render the checklist as structured Markdown that converts cleanly to PDF via _markdown_to_pdf."""
    lines: list[str] = []

    # ── Title & top-level KPIs ──
    lines.append(f"# Session Checklist — {sdate.strftime('%A %B %d, %Y')}")
    lines.append("")

    # KPI table (cleaner than inline text in PDF layout)
    completion_pct = 0
    if minutes_planned > 0:
        completion_pct = round(100 * p.minutes_actual / minutes_planned)
    done_count = sum(1 for b in p.blocks if b.done)
    block_pct = round(100 * done_count / len(p.blocks)) if p.blocks else 0

    lines.append("## Summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("|--------|-------|")
    lines.append(f"| Blocks completed | {done_count}/{len(p.blocks)} ({block_pct}%) |")
    lines.append(f"| Time (actual / planned) | {p.minutes_actual} / {minutes_planned} min ({completion_pct}%) |")
    if p.energy is not None:
        bar = "#" * p.energy + "-" * (5 - p.energy)
        lines.append(f"| Energy | [{bar}] {p.energy}/5 |")
    if p.confidence is not None:
        bar = "#" * p.confidence + "-" * (5 - p.confidence)
        lines.append(f"| Confidence | [{bar}] {p.confidence}/5 |")
    lines.append("")

    # ── Blocks ──
    if p.blocks:
        lines.append("## Today's Blocks")
        lines.append("")
        lines.append("| # | Done | Topic | LM | Activity | Planned |")
        lines.append("|---|------|-------|----|----------|---------|")
        for b in p.blocks:
            tick = "[X]" if b.done else "[ ]"
            lines.append(f"| {b.order} | {tick} | {b.topic_code} | {b.lm_code or '-'} | {b.activity} | {b.minutes_planned}m |")
        lines.append("")

    # ── LOS Mastery ──
    if p.los_mastery:
        counts = {"red": 0, "amber": 0, "green": 0, "unset": 0}
        for l in p.los_mastery:
            counts[l.rag] += 1

        lines.append("## LOS Mastery (RAG)")
        lines.append("")
        lines.append(f"**Overview**: {counts['green']} mastered · {counts['amber']} unstable · "
                     f"**{counts['red']} to redo** · {counts['unset']} not assessed")
        lines.append("")

        # Split by RAG for prominence
        red_entries = [l for l in p.los_mastery if l.rag == "red"]
        if red_entries:
            lines.append("### LOS to redo (injected as weaknesses)")
            lines.append("")
            lines.append("| LM | LOS | Description |")
            lines.append("|----|-----|-------------|")
            for l in red_entries:
                desc = (l.los_description or "")[:60]
                lines.append(f"| {l.lm_code} | {l.los_code} | {desc} |")
            lines.append("")

        rated = [l for l in p.los_mastery if l.rag != "unset" and l.rag != "red"]
        if rated:
            lines.append("### Other ratings")
            lines.append("")
            lines.append("| LM | LOS | Status | Description |")
            lines.append("|----|-----|--------|-------------|")
            rag_label = {"amber": "AMBER", "green": "GREEN"}
            for l in rated:
                desc = (l.los_description or "")[:55]
                lines.append(f"| {l.lm_code} | {l.los_code} | {rag_label[l.rag]} | {desc} |")
            lines.append("")

    # ── Notes ──
    if p.notes.strip():
        lines.append("## Notes & Observations")
        lines.append("")
        for line in p.notes.strip().split("\n"):
            if line.strip():
                lines.append(line.rstrip())
            else:
                lines.append("")
        lines.append("")

    # ── Tomorrow Actions (auto-derived) ──
    actions: list[str] = []
    undone = [b for b in p.blocks if not b.done]
    red = [l for l in p.los_mastery if l.rag == "red"]
    amber = [l for l in p.los_mastery if l.rag == "amber"]

    for b in undone:
        actions.append(f"Reschedule: **{b.topic_code} {b.activity}** ({b.lm_code or '-'}, {b.minutes_planned} min) — not completed today.")
    for l in red:
        actions.append(f"Redo LOS **{l.los_code}** ({l.lm_code}) — weakness injected into tomorrow's plan (Rule 11).")
    for l in amber[:3]:  # cap to avoid bloat
        actions.append(f"Review LOS **{l.los_code}** ({l.lm_code}) — unstable, revisit in flashcard deck.")
    if p.energy is not None and p.energy <= 2:
        actions.append("Consider a rest/light day tomorrow — energy reported as low.")
    if p.confidence is not None and p.confidence <= 2:
        actions.append("Schedule a recall-focused session tomorrow — confidence low.")

    if actions:
        lines.append("## Tomorrow's Actions")
        lines.append("")
        for a in actions:
            lines.append(f"- {a}")
        lines.append("")

    lines.append("---")
    lines.append(f"*Generated by Wingman on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}.*")
    return "\n".join(lines)
