import json
import zipfile
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from loguru import logger
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.services.content_pipeline import generate_pdf_content, generate_audio_content, generate_full_lm
from app.services import job_state

router = APIRouter(prefix="/api/content", tags=["content"])

# ── Path to generated content on disk ────────────────────────
GENERATED_ROOT = Path(__file__).resolve().parent.parent.parent / "generated_content"
# Global, non-LM-scoped assets (calculator setup tutorials, cheatsheets, etc.).
SETUP_ASSETS_ROOT = Path(__file__).resolve().parent.parent.parent / "setup_assets"


def _verify_admin_key(key: str) -> None:
    if not settings.admin_secret_key or key != settings.admin_secret_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")


def _sanitize_text(text: str) -> str:
    """Replace Unicode chars unsupported by latin-1 PDF fonts."""
    replacements = {
        '\u2014': '--', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u2022': '*',
        '\u2192': '->', '\u2190': '<-', '\u2194': '<->', '\u2265': '>=',
        '\u2264': '<=', '\u2260': '!=', '\u00d7': 'x', '\u00f7': '/',
        '\u221a': 'sqrt', '\u03b1': 'alpha', '\u03b2': 'beta', '\u03bc': 'mu',
        '\u03c3': 'sigma', '\u03c0': 'pi', '\u0394': 'Delta', '\u03a3': 'Sigma',
    }
    for char, repl in replacements.items():
        text = text.replace(char, repl)
    # Strip any remaining non-latin-1 characters
    return text.encode('latin-1', errors='replace').decode('latin-1')


def _markdown_to_pdf(md_text: str, output_path: str, title: str = "", subtitle: str = ""):
    """Convert Markdown text to a styled PDF using fpdf2."""
    from fpdf import FPDF

    title = _sanitize_text(title)
    subtitle = _sanitize_text(subtitle)
    md_text = _sanitize_text(md_text)

    pdf = FPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(140, 140, 140)
    pdf.cell(0, 5, "Wingman -- CFA Level I", align="L")
    pdf.cell(0, 5, subtitle, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, pdf.get_y() + 1, 200, pdf.get_y() + 1)
    pdf.ln(6)

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(30, 30, 60)
    pdf.multi_cell(0, 10, title)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 120)
    pdf.cell(0, 6, subtitle, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Parse markdown line by line for reliable rendering
    pdf.set_text_color(30, 30, 30)
    in_table = False
    table_rows: list[list[str]] = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        # Calculate column widths
        num_cols = max(len(r) for r in table_rows) if table_rows else 1
        col_w = min(45, 190 // num_cols)
        for i, row in enumerate(table_rows):
            pdf.set_font("Helvetica", "B" if i == 0 else "", 8)
            for j, cell in enumerate(row):
                if j < num_cols:
                    pdf.cell(col_w, 6, cell.strip()[:50], border=1)
            pdf.ln()
        pdf.ln(3)
        table_rows = []
        in_table = False

    for line in md_text.split('\n'):
        stripped = line.strip()

        # Skip table separator lines
        if stripped and all(c in '-|: ' for c in stripped):
            continue

        # Table row
        if '|' in stripped and stripped.startswith('|'):
            in_table = True
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            table_rows.append(cells)
            continue

        if in_table:
            flush_table()

        # Headings
        if stripped.startswith('#### '):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(50, 50, 80)
            pdf.multi_cell(0, 6, stripped[5:])
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
        elif stripped.startswith('### '):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(40, 40, 70)
            pdf.multi_cell(0, 7, stripped[4:])
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
        elif stripped.startswith('## '):
            pdf.ln(5)
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(30, 30, 60)
            pdf.multi_cell(0, 8, stripped[3:])
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(2)
        elif stripped.startswith('# '):
            pdf.ln(6)
            pdf.set_font("Helvetica", "B", 16)
            pdf.set_text_color(20, 20, 50)
            pdf.multi_cell(0, 9, stripped[2:])
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
        elif stripped.startswith('- ') or stripped.startswith('* '):
            bullet_text = stripped[2:]
            # Handle **bold** in bullets
            parts = re.split(r'\*\*(.+?)\*\*', bullet_text)
            pdf.cell(8, 5, chr(149))  # bullet char
            for k, part in enumerate(parts):
                if k % 2 == 1:
                    pdf.set_font("Helvetica", "B", 10)
                else:
                    pdf.set_font("Helvetica", "", 10)
                pdf.write(5, part)
            pdf.ln()
        elif stripped.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
            num_end = stripped.index('.') + 1
            num = stripped[:num_end]
            rest = stripped[num_end:].strip()
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(8, 5, num)
            pdf.set_font("Helvetica", "", 10)
            pdf.write(5, rest)
            pdf.ln()
        elif stripped == '---' or stripped == '***':
            pdf.ln(2)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(4)
        elif stripped:
            pdf.set_font("Helvetica", "", 10)
            # Handle inline **bold**
            parts = re.split(r'\*\*(.+?)\*\*', stripped)
            for k, part in enumerate(parts):
                if k % 2 == 1:
                    pdf.set_font("Helvetica", "B", 10)
                else:
                    pdf.set_font("Helvetica", "", 10)
                pdf.write(5, part)
            pdf.ln()
        else:
            pdf.ln(3)

    if in_table:
        flush_table()

    # Footer on last page
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(0, 5, "Generated by Wingman -- CFA Level I Learning OS", align="C")

    pdf.output(output_path)


# ── Formula detection for the Full Course Script ──
# A line is considered a formula block if it matches any of:
#   • starts/ends with $$ … $$ (LaTeX block math)
#   • wrapped in \[ … \]
#   • code fence containing math operators
#   • contains '=' AND at least one math operator (× ÷ √ Σ ∫ π ∂ ≤ ≥ ≠ ± ∞ Δ µ α β γ θ σ)
#     OR LaTeX command like \frac, \sqrt, \sum, \int, ^{...}, _{...}
import re as _re_formula
_FORMULA_RE = _re_formula.compile(
    r"(?:\$\$.+?\$\$|\\\[.+?\\\]|"
    r"\\frac\{|\\sqrt\{|\\sum|\\int|\\prod|\\alpha|\\beta|\\gamma|\\sigma|\\Delta|\\pi|"
    r"[×÷√Σ∫πΔµαβγθσ∂≤≥≠±∞]"
    r")",
    _re_formula.UNICODE,
)
_INLINE_MATH_RE = _re_formula.compile(r"\$([^$\n]+?)\$")


def _line_is_formula(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if s.startswith("$$") and s.endswith("$$"):
        return True
    if s.startswith("\\[") and s.endswith("\\]"):
        return True
    if "=" in s and _FORMULA_RE.search(s):
        return True
    return False


def _strip_math_delims(s: str) -> str:
    s = s.strip()
    if s.startswith("$$") and s.endswith("$$"):
        return s[2:-2].strip()
    if s.startswith("\\[") and s.endswith("\\]"):
        return s[2:-2].strip()
    return s


def _render_formula_box(pdf, text: str):
    """Render a centered, light-fill, bordered formula block."""
    text = _sanitize_text(_strip_math_delims(text))
    pdf.ln(2)
    pdf.set_fill_color(245, 247, 252)
    pdf.set_draw_color(180, 190, 220)
    pdf.set_text_color(20, 30, 80)
    pdf.set_font("Courier", "B", 11)
    # Multi-cell with fill & border
    pdf.cell(0, 9, text, border=1, align="C", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.set_draw_color(0, 0, 0)
    pdf.ln(2)


def _render_text_with_inline_math(pdf, text: str):
    """Render a text line, highlighting any $...$ inline math segments
    with bold + light fill."""
    parts: list[tuple[str, bool]] = []
    last = 0
    for m in _INLINE_MATH_RE.finditer(text):
        if m.start() > last:
            parts.append((text[last:m.start()], False))
        parts.append((m.group(1), True))
        last = m.end()
    if last < len(text):
        parts.append((text[last:], False))
    if not parts:
        parts = [(text, False)]

    for seg, is_math in parts:
        if is_math:
            pdf.set_font("Courier", "B", 10)
            pdf.set_text_color(20, 30, 100)
            pdf.write(5, " " + seg + " ")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(30, 30, 30)
        else:
            # Handle inline **bold** within non-math parts
            bold_parts = re.split(r'\*\*(.+?)\*\*', seg)
            for k, part in enumerate(bold_parts):
                if k % 2 == 1:
                    pdf.set_font("Helvetica", "B", 10)
                else:
                    pdf.set_font("Helvetica", "", 10)
                pdf.write(5, part)
    pdf.ln()


def _full_course_to_pdf(md_text: str, output_path: str, title: str, subtitle: str = ""):
    """Convert the full course markdown to a styled PDF with formula highlighting.

    Same chrome as `_markdown_to_pdf` but:
      • Lines that look like formulas are rendered in a centered Courier bold box
      • Inline $...$ math is highlighted in Courier bold blue
    """
    from fpdf import FPDF

    title = _sanitize_text(title)
    subtitle = _sanitize_text(subtitle)
    md_text = _sanitize_text(md_text)

    pdf = FPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(140, 140, 140)
    pdf.cell(0, 5, "Wingman -- Full Course Script", align="L")
    pdf.cell(0, 5, subtitle, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.line(10, pdf.get_y() + 1, 200, pdf.get_y() + 1)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(30, 30, 60)
    pdf.multi_cell(0, 10, title)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 120)
    pdf.cell(0, 6, subtitle, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    pdf.set_text_color(30, 30, 30)
    in_code = False
    code_buffer: list[str] = []

    def flush_code():
        nonlocal in_code, code_buffer
        if not code_buffer:
            in_code = False
            return
        joined = " ".join(c.strip() for c in code_buffer if c.strip())
        if joined:
            _render_formula_box(pdf, joined)
        code_buffer = []
        in_code = False

    for line in md_text.split('\n'):
        stripped = line.strip()

        # Code fences delimit a block — we treat its content as formula candidate
        if stripped.startswith("```"):
            if in_code:
                flush_code()
            else:
                in_code = True
            continue
        if in_code:
            code_buffer.append(line)
            continue

        # Headings
        if stripped.startswith('### '):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 12); pdf.set_text_color(40, 40, 70)
            pdf.multi_cell(0, 7, stripped[4:])
            pdf.set_font("Helvetica", "", 10); pdf.set_text_color(30, 30, 30)
            continue
        if stripped.startswith('## '):
            pdf.ln(5)
            pdf.set_font("Helvetica", "B", 14); pdf.set_text_color(30, 30, 60)
            pdf.multi_cell(0, 8, stripped[3:])
            pdf.set_font("Helvetica", "", 10); pdf.set_text_color(30, 30, 30)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(2)
            continue
        if stripped.startswith('# '):
            pdf.ln(6)
            pdf.set_font("Helvetica", "B", 16); pdf.set_text_color(20, 20, 50)
            pdf.multi_cell(0, 9, stripped[2:])
            pdf.set_font("Helvetica", "", 10); pdf.set_text_color(30, 30, 30)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y()); pdf.ln(3)
            continue

        # Formula block (entire line)
        if _line_is_formula(stripped):
            _render_formula_box(pdf, stripped)
            continue

        # Bullet
        if stripped.startswith('- ') or stripped.startswith('* '):
            pdf.cell(8, 5, chr(149))
            _render_text_with_inline_math(pdf, stripped[2:])
            continue

        # Empty → vertical gap
        if not stripped:
            pdf.ln(3)
            continue

        # Default: paragraph with inline math/bold support
        _render_text_with_inline_math(pdf, stripped)

    if in_code:
        flush_code()

    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(0, 5, "Generated by Wingman -- CFA Level I Learning OS", align="C")
    pdf.output(output_path)


# ── Streaming ZIP helper ─────────────────────────────────────
# The download endpoints used to build the entire ZIP in `io.BytesIO()` with
# ZIP_DEFLATED before sending a single byte. With ~1.25 GB of MP3 (already
# compressed) that meant: full RAM allocation, full CPU burn for ~0% gain on
# DEFLATE, and the worker blocked end-to-end before the browser saw anything.
# This sink lets `zipfile.ZipFile` write into a non-seekable buffer that we
# drain after each entry, yielding the bytes to the HTTP response as we go.
class _StreamSink:
    def __init__(self):
        self.buf = bytearray()
        self.offset = 0
    def write(self, data):
        self.buf.extend(data)
        self.offset += len(data)
        return len(data)
    def tell(self):
        return self.offset
    def flush(self):
        pass
    def seekable(self):
        return False


def _stream_zip(file_pairs):
    """Yield ZIP bytes built on-the-fly from `(arc_name, path)` pairs.

    Uses ZIP_STORED — most of the served content is already compressed
    (MP3/PDF/SVG) so DEFLATE wastes CPU for negligible size gain. Non-seekable
    sink → ZipFile emits data descriptors instead of patching headers, which
    is what lets us start streaming before the archive is finished.
    """
    sink = _StreamSink()
    with zipfile.ZipFile(sink, "w", zipfile.ZIP_STORED, allowZip64=True) as zf:
        for arc_name, fpath in file_pairs:
            zf.write(str(fpath), arc_name)
            if sink.buf:
                chunk = bytes(sink.buf)
                sink.buf.clear()
                yield chunk
    # Central directory is flushed when the `with` exits — emit the tail.
    if sink.buf:
        yield bytes(sink.buf)
        sink.buf.clear()


def _streaming_zip_response(file_pairs, filename: str) -> StreamingResponse:
    return StreamingResponse(
        _stream_zip(file_pairs),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── GET /api/content/download-everything — all content as ZIP ──
@router.get("/download-everything")
async def download_everything():
    """Download ALL generated content across all modules as a single ZIP."""
    if not GENERATED_ROOT.exists():
        raise HTTPException(status_code=404, detail="No generated content found")

    pairs: list[tuple[str, Path]] = []
    for topic_dir in sorted(GENERATED_ROOT.iterdir()):
        if not topic_dir.is_dir():
            continue
        for lm_dir in sorted(topic_dir.iterdir()):
            if not lm_dir.is_dir():
                continue
            manifest_path = lm_dir / "manifest.json"
            if not manifest_path.exists():
                continue
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            for asset in manifest.get("assets", []):
                if asset.get("status") != "success":
                    continue
                asset_path = lm_dir / asset["filename"]
                if asset_path.exists():
                    arc_name = f"{topic_dir.name}/{lm_dir.name}/{asset['filename']}"
                    pairs.append((arc_name, asset_path))

    if not pairs:
        raise HTTPException(status_code=404, detail="No assets to download")

    return _streaming_zip_response(pairs, "wingman-all-content.zip")


# ── GET /api/content/download-by-type/{asset_key} — all assets of one type ──
@router.get("/download-by-type/{asset_key}")
async def download_by_asset_type(asset_key: str):
    """Download all instances of a specific asset type across all modules.

    The frontend Content Manager lists asset types like `00_full_course`
    (MP3) or `17_learning_map` (SVG); the file we want for a given key is
    not always a PDF, so we use a per-key preferred extension list. The
    first existing extension wins to avoid zipping a `.md` script when
    the user asked for the `.mp3` audio.
    """
    if not GENERATED_ROOT.exists():
        raise HTTPException(status_code=404, detail="No generated content found")

    # Primary extension first, fallbacks after. `.md` is rendered as a
    # last-resort source-of-truth for some assets.
    EXT_PRIORITY: dict[str, list[str]] = {
        "00_full_course":   [".mp3", ".md"],
        "00_full_course_script": [".pdf", ".md"],
        "12_flashcards":    [".json"],
        "17_learning_map":  [".svg", ".dot"],
    }
    # Some asset_keys are logical aliases over a shared on-disk stem.
    STEM_ALIAS: dict[str, str] = {
        "00_full_course_script": "00_full_course",
    }
    default_exts = [".pdf", ".json", ".md", ".mp3", ".svg"]
    extensions = EXT_PRIORITY.get(asset_key, default_exts)
    real_stem = STEM_ALIAS.get(asset_key, asset_key)

    # Use the shared helper to look up files under either the new naming
    # convention (`<TOPIC>-<LM>-<key>.<ext>`) or the legacy bare name.
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
    from asset_naming import find_asset_path  # type: ignore

    pairs: list[tuple[str, Path]] = []
    for topic_dir in sorted(GENERATED_ROOT.iterdir()):
        if not topic_dir.is_dir():
            continue
        for lm_dir in sorted(topic_dir.iterdir()):
            if not lm_dir.is_dir():
                continue
            fpath = find_asset_path(lm_dir, topic_dir.name, lm_dir.name, real_stem, extensions)
            if fpath and fpath.exists():
                ext = fpath.suffix
                arc_name = f"{topic_dir.name}-{lm_dir.name}-{asset_key}{ext}"
                pairs.append((arc_name, fpath))

    if not pairs:
        raise HTTPException(status_code=404, detail=f"No assets found for type: {asset_key}")

    return _streaming_zip_response(pairs, f"wingman-{asset_key}.zip")


# ── GET /api/content/download-by-topic/{topic} — all content for a topic ──
@router.get("/download-by-topic/{topic}")
async def download_by_topic(topic: str):
    """Download all generated content for a specific topic."""
    topic_dir = GENERATED_ROOT / topic
    if not topic_dir.exists():
        raise HTTPException(status_code=404, detail=f"No content for topic: {topic}")

    pairs: list[tuple[str, Path]] = []
    for lm_dir in sorted(topic_dir.iterdir()):
        if not lm_dir.is_dir():
            continue
        manifest_path = lm_dir / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for asset in manifest.get("assets", []):
            if asset.get("status") != "success":
                continue
            asset_path = lm_dir / asset["filename"]
            if asset_path.exists():
                arc_name = f"{lm_dir.name}/{asset['filename']}"
                pairs.append((arc_name, asset_path))

    if not pairs:
        raise HTTPException(status_code=404, detail=f"No assets found for topic: {topic}")

    return _streaming_zip_response(pairs, f"wingman-{topic}-content.zip")


# ── GET /api/content/generated — list all available modules ──
@router.get("/generated")
async def list_generated_modules():
    """Return list of all modules that have generated content."""
    modules = []
    if not GENERATED_ROOT.exists():
        return modules
    for topic_dir in sorted(GENERATED_ROOT.iterdir()):
        if not topic_dir.is_dir():
            continue
        for lm_dir in sorted(topic_dir.iterdir()):
            if not lm_dir.is_dir():
                continue
            manifest_path = lm_dir / "manifest.json"
            if manifest_path.exists():
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                modules.append({
                    "topic": topic_dir.name,
                    "lm_code": lm_dir.name,
                    "title": manifest.get("module", {}).get("title", ""),
                    "asset_count": len([a for a in manifest.get("assets", []) if a.get("status") == "success"]),
                    "total_size_kb": sum(a.get("size_kb", 0) for a in manifest.get("assets", [])),
                })
    return modules


# ── GET /api/content/generated/{topic}/{lm_code} — manifest ─
@router.get("/generated/{topic}/{lm_code}")
async def get_generated_manifest(topic: str, lm_code: str):
    """Return manifest for a specific module's generated content."""
    manifest_path = GENERATED_ROOT / topic / lm_code / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="No generated content for this module")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return manifest


# ── GET /api/content/generated/{topic}/{lm_code}/download-all ─
# NOTE: This route MUST be before the {filename} catch-all route
@router.get("/generated/{topic}/{lm_code}/download-all")
async def download_all_generated(topic: str, lm_code: str):
    """Download all generated content for a module as a ZIP archive."""
    module_dir = GENERATED_ROOT / topic / lm_code
    manifest_path = module_dir / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="No generated content for this module")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assets = manifest.get("assets", [])

    pairs: list[tuple[str, Path]] = []
    for asset in assets:
        if asset.get("status") != "success":
            continue
        asset_path = module_dir / asset["filename"]
        if asset_path.exists():
            pairs.append((asset["filename"], asset_path))

    return _streaming_zip_response(pairs, f"{topic}-{lm_code}-content.zip")


# ── POST /api/content/rebuild-full-course-pdfs ──────────────
# Re-render every existing `00_full_course.md` into a Wingman-styled PDF
# (option A: no Claude call, pure renderer). Idempotent — safe to re-run.
@router.post("/rebuild-full-course-pdfs")
async def rebuild_full_course_pdfs(force: bool = False, key: str = ""):
    """Walk all generated modules, find `00_full_course.md`, render PDF.

    Query params:
      - force=true to re-render even if a `.pdf` already exists.
    """
    _verify_admin_key(key)
    import subprocess as sp, sys, asyncio
    from wingman_course_builder.topics import topic_name_en, topic_name_fr_short

    backend_root = Path(__file__).resolve().parent.parent.parent
    builder = backend_root / "wingman_course_builder" / "build_audio_script_pdf.py"
    if not builder.exists():
        raise HTTPException(status_code=500, detail="builder script missing")

    if not GENERATED_ROOT.exists():
        return {"rendered": [], "skipped": [], "failed": []}

    results = {"rendered": [], "skipped": [], "failed": []}
    loop = asyncio.get_event_loop()

    for topic_dir in sorted(GENERATED_ROOT.iterdir()):
        if not topic_dir.is_dir() or topic_dir.name.startswith("."):
            continue
        for lm_dir in sorted(topic_dir.iterdir()):
            if not lm_dir.is_dir():
                continue
            md = lm_dir / "00_full_course.md"
            pdf = lm_dir / "00_full_course.pdf"
            tag = f"{topic_dir.name}/{lm_dir.name}"
            if not md.exists():
                continue
            if pdf.exists() and not force:
                results["skipped"].append(tag)
                continue

            # Pull title from manifest if present
            title_en = ""
            manifest_path = lm_dir / "manifest.json"
            if manifest_path.exists():
                try:
                    m = json.loads(manifest_path.read_text(encoding="utf-8"))
                    title_en = m.get("module", {}).get("title", "") or ""
                except Exception:
                    pass

            module_num = lm_dir.name.replace("LM", "").lstrip("0") or "0"
            module_num = module_num.zfill(2)
            args = [
                sys.executable, str(builder), str(md), str(pdf),
                "--topic-en", topic_name_en(topic_dir.name),
                "--topic-fr-short", topic_name_fr_short(topic_dir.name),
                "--module-num", module_num,
                "--title-en", title_en or f"{topic_dir.name}-{lm_dir.name}",
                "--title-fr", title_en or f"{topic_dir.name}-{lm_dir.name}",
            ]
            def _run(a=args):
                return sp.run(a, capture_output=True, timeout=180)
            try:
                r = await loop.run_in_executor(None, _run)
                if r.returncode == 0 and pdf.exists():
                    results["rendered"].append(tag)
                else:
                    err = r.stderr.decode(errors="replace")[-200:]
                    results["failed"].append({"lm": tag, "err": err})
            except Exception as e:
                results["failed"].append({"lm": tag, "err": f"{type(e).__name__}: {e}"})

    return {
        "total": sum(len(v) if isinstance(v, list) else 0 for v in results.values()),
        "rendered_count": len(results["rendered"]),
        "skipped_count": len(results["skipped"]),
        "failed_count": len(results["failed"]),
        **results,
    }


# ── GET /api/content/setup — list all global setup assets ─────
# Returns the list of files in `backend/setup_assets/` so the frontend can
# render a card per tutorial. Filenames are exposed as-is; the frontend can
# humanize them for display.
@router.get("/setup")
async def list_setup_assets():
    if not SETUP_ASSETS_ROOT.exists():
        return {"files": []}
    files = []
    for p in sorted(SETUP_ASSETS_ROOT.iterdir()):
        if not p.is_file() or p.name.startswith(".") or p.name == "README.md":
            continue
        files.append({
            "filename": p.name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "ext": p.suffix.lower(),
        })
    return {"files": files}


# ── GET (and HEAD) /api/content/setup/{filename} — global setup assets ──
# Serves files from `backend/setup_assets/` (BA II Plus tutorial, etc.).
# Distinct from the LM-scoped /generated/... route because these assets are
# not tied to a topic/LM.
@router.api_route("/setup/{filename}", methods=["GET", "HEAD"])
async def download_setup_asset(filename: str):
    if not SETUP_ASSETS_ROOT.exists():
        raise HTTPException(status_code=404, detail="No setup assets directory")
    file_path = SETUP_ASSETS_ROOT / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        file_path.resolve().relative_to(SETUP_ASSETS_ROOT.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    media_types = {".pdf": "application/pdf", ".md": "text/markdown",
                   ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml"}
    media_type = media_types.get(file_path.suffix.lower(), "application/octet-stream")
    # `content_disposition_type="inline"` so iframes can render the PDF
    # instead of forcing a download. The frontend's "Télécharger" buttons
    # still trigger a save via the HTML5 `<a download>` attribute (works on
    # same-origin requests, which is what /proxy-api/* gives us).
    return FileResponse(
        str(file_path),
        media_type=media_type,
        filename=file_path.name,
        content_disposition_type="inline",
    )


# ── POST /api/content/upload/{topic}/{lm_code} ───────────────
@router.post("/upload/{topic}/{lm_code}")
async def upload_content(
    topic: str,
    lm_code: str,
    key: str = "",
    files: List[UploadFile] = File(...),
):
    """Upload one or more content files for a module. Updates or creates manifest."""
    _verify_admin_key(key)
    module_dir = GENERATED_ROOT / topic / lm_code
    module_dir.mkdir(parents=True, exist_ok=True)

    # Load or create manifest
    manifest_path = module_dir / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {
            "module": {"topic": topic, "code": f"{topic}-{lm_code}", "title": "", "los_count": 0, "exam_weight": "", "volume": 0, "learning_outcomes": []},
            "generated_at": "",
            "total_time_sec": 0,
            "assets": [],
        }

    # Track existing assets by filename
    existing = {a["filename"]: i for i, a in enumerate(manifest["assets"])}
    uploaded = []

    for file in files:
        # Read file content
        content = await file.read()
        size_kb = round(len(content) / 1024, 1)

        # Save to disk
        dest = module_dir / file.filename
        dest.write_bytes(content)

        # Update manifest
        asset_entry = {
            "title": file.filename.rsplit(".", 1)[0].replace("_", " ").title(),
            "filename": file.filename,
            "size_kb": size_kb,
            "status": "success",
        }

        if file.filename in existing:
            manifest["assets"][existing[file.filename]] = asset_entry
        else:
            manifest["assets"].append(asset_entry)

        uploaded.append({"filename": file.filename, "size_kb": size_kb})

    # Update timestamp
    manifest["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Save manifest
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "status": "ok",
        "topic": topic,
        "lm_code": lm_code,
        "uploaded": uploaded,
        "total_assets": len(manifest["assets"]),
    }


# ── ASSET GENERATION DEFINITIONS ─────────────────────────────
ASSET_PROMPTS = {
    "01_summary_notes": ("Summary Notes", "Generate comprehensive Summary Notes for this CFA L1 module.\n\nStructure:\n1. **Module Overview** — What this module covers and why it matters for the exam\n2. **Key Concepts** — Each major concept explained clearly with definitions\n3. **Key Formulas** — All formulas with variable definitions\n4. **Practical Examples** — At least 2 worked numerical examples\n5. **Exam Tips** — What to watch for on the actual exam\n\n1500-2000 words."),
    "02_synthesis": ("Synthesis", "Generate a Synthesis document. High-level conceptual overview connecting all ideas.\n\n1. **The Big Picture** — How this module fits the broader CFA curriculum\n2. **Concept Map** — How each concept relates to others\n3. **From Simple to Complex** — Build understanding layer by layer\n4. **Cross-Topic Links** — Connections to other CFA topics\n5. **One-Page Summary** — Ultra-condensed version\n\n800-1200 words."),
    "03_los_sheet": ("LOS Sheet", "Generate a LOS Sheet. For EACH LOS:\n- **LOS Code & Statement**\n- **Command Word** and what it means for the exam\n- **Key Knowledge** (3-5 bullets)\n- **Likely Question Format**\n- **Difficulty** and **Study Priority**"),
    "04_exam_traps": ("Exam Traps", "Generate an Exam Traps document (8+ traps). For each:\n- **Trap Name**\n- **The Mistake** candidates make\n- **Why It Happens**\n- **The Correct Approach**\n- **Example** mini-question"),
    "05_concept_on_concept": ("Concept on Concept", "Generate a Concept-on-Concept analysis. Layer concepts showing dependencies:\nFor each layer: prerequisites, core concept, how it builds on previous, what it enables next, quick check question."),
    "06_decision_tree": ("Decision Tree Sheet", "Generate Decision Trees for exam problem-solving. Create text-based decision trees for choosing the right method, formula, or approach. Clear indentation/arrows format."),
    "07_essential_sheet": ("Essential Sheet", "Generate a one-page Essential Sheet — absolute minimum needed for the exam. Ultra-dense bullets and formulas only. Sections: Must-Know Formulas, Key Definitions, Critical Distinctions, Quick Decision Rules."),
    "08_formula_sheet": ("Formula Sheet", "Generate a complete Formula Sheet. For EACH formula: name, formula (LaTeX-style), variable definitions, when to use, units/output, calculator keystrokes if applicable."),
    "09_reading_summary": ("Reading Summary", "Generate a Reading Summary — structured walkthrough of the module. Section-by-section summary, key exhibits/tables, end-of-chapter takeaways, practice problem themes. 1000-1500 words."),
    "10_tds_sheet": ("TDS Sheet", "Generate a TDS (Tables, Diagrams, Summaries) Sheet. Create comparison tables in Markdown format for all key concepts, methods, and formulas."),
    "11_blank_recall": ("Blank Recall Sheet", "Generate a Blank Recall Sheet — active recall with blanks. Fill-in-the-formula, complete-the-definition, true/false, match-the-concept, quick calculations. Include ANSWER KEY."),
    "12_flashcards": ("Flashcards", 'Generate 25 flashcards as JSON array. Each: {"id": N, "front": "question", "back": "answer", "difficulty": "easy|medium|hard", "tags": [...]}. Output ONLY valid JSON.'),
    "13_mock_pack": ("Mock Pack", "Generate 15 CFA-format multiple-choice questions. Each: question stem, 3 choices (A/B/C), correct answer, detailed explanation, LOS reference. Realistic exam difficulty."),
    "14_audio_script": ("Audio Script", "Generate an audio lecture script (~2000 words, 12-15 min). Conversational teaching voice, include [pause] markers, spell out formulas verbally."),
    "15_knowledge_audit": ("Knowledge Audit", "Generate a Knowledge Audit — self-assessment tool. For each LOS: checklist, quick test questions, score guide. End with Study Priority Matrix."),
    "16_weakness_pool": ("Weakness Pool", "Generate a Weakness Pool — targeted practice for hard aspects. Tricky calculations, conceptual nuances, edge cases, speed drill, common error analysis. Include solutions."),
    "17_learning_map": ("Learning Map", "Generate a visual learning concept map in Graphviz DOT format (Novak-style). Labeled edges explaining relationships, color-coded nodes (green=prerequisites, blue=pivot concept, yellow=derived concepts, pink=applications, note=insights). Return raw DOT only."),
}

# LM title lookup (subset — extend as needed)
LM_TITLES: dict[str, dict[str, str]] = {}  # populated from RAW_LMS data if needed


class GenerateAllRequest(BaseModel):
    lm_title: Optional[str] = None


class GenerateOneRequest(BaseModel):
    lm_title: Optional[str] = None
    asset_key: str  # e.g. "01_summary_notes"


# ── POST /api/content/generate-one/{topic}/{lm_code} ───────────
@router.post("/generate-one/{topic}/{lm_code}")
async def generate_one_asset(topic: str, lm_code: str, req: GenerateOneRequest, key: str = ""):
    """Generate a single asset for a module using Claude API."""
    _verify_admin_key(key)
    import subprocess as sp, sys, asyncio
    lm_title = req.lm_title or f"{topic}-{lm_code}"
    asset_key = req.asset_key
    script = Path(__file__).resolve().parent.parent.parent / "generate_all_assets.py"
    if not script.exists():
        raise HTTPException(status_code=500, detail="Generator script not found")

    from app.config import settings
    env = {**os.environ, "WINGMAN_NO_DB": "1", "ANTHROPIC_API_KEY": settings.anthropic_api_key}

    def _run():
        return sp.run(
            [sys.executable, str(script), topic, lm_code, lm_title, "--asset", asset_key],
            capture_output=True, env=env, timeout=120,
        )

    try:
        result = await asyncio.get_event_loop().run_in_executor(None, _run)
    except sp.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Generation timed out (2min limit)")

    if result.returncode != 0:
        err_text = result.stderr.decode(errors="replace")[-500:]
        raise HTTPException(status_code=500, detail=f"Generation failed: {err_text}")

    # Read updated manifest
    manifest_path = GENERATED_ROOT / topic / lm_code / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        asset_entry = next((a for a in manifest.get("assets", []) if a["filename"].startswith(asset_key)), None)
        return {
            "status": "ok",
            "topic": topic,
            "lm_code": lm_code,
            "asset_key": asset_key,
            "asset": asset_entry,
        }
    return {"status": "ok", "topic": topic, "lm_code": lm_code, "asset_key": asset_key}


# ── Pipeline helpers for /generate-all (assets + course + audio) ─────────────

PIPELINE_TOTAL_STEPS = 19  # 17 assets + 1 full-course md + 1 mp3

# Asset titles in the canonical order produced by generate_all_assets.py.
# Used to set jobState.label proactively to "currently in-flight asset" rather
# than "just-completed asset" (the script's stdout only signals completions).
ASSETS_ORDER = [
    "Fiche de revision", "Synthese", "Fiche des LOS", "Pieges d'examen",
    "Concept sur concept", "Arbre de decision", "Fiche essentielle",
    "Formulaire", "Resume de lecture", "Fiche TDS", "Rappel a blanc",
    "Flashcards", "Pack de questions mock", "Script audio",
    "Audit de connaissances", "Banque de faiblesses", "Carte visuelle d'apprentissage",
]
COURSE_LABEL = "Cours complet (Claude)"
TTS_LABEL = "Synthèse audio (Edge TTS)"

ASSET_LINE_RE = re.compile(r"Generating\s+(\S+)\s+\((.+?)\)\.\.\.\s*(OK|FAILED)", re.IGNORECASE)
TTS_CHUNK_RE = re.compile(r"\[TTS\]\s*Chunk\s+(\d+)/(\d+)")
COURSE_STREAM_RE = re.compile(r"(\d[\d,\s]*)\s*chars streamed")

# In-process registry of running subprocesses per job. Each job may have
# multiple concurrent procs (parallel asset pool), so we track a list per id.
# The cancel endpoint kills all of them at once.
_ACTIVE_JOB_PROCS: dict[str, list] = {}

# (filename stem, displayed title, preferred extension, fallback extensions)
KNOWN_ASSET_FILES = [
    ("01_summary_notes", "Fiche de revision", ".pdf", []),
    ("02_synthesis", "Synthese", ".pdf", []),
    ("03_los_sheet", "Fiche des LOS", ".pdf", []),
    ("04_exam_traps", "Pieges d'examen", ".pdf", []),
    ("05_concept_on_concept", "Concept sur concept", ".pdf", []),
    ("06_decision_tree", "Arbre de decision", ".pdf", []),
    ("07_essential_sheet", "Fiche essentielle", ".pdf", []),
    ("08_formula_sheet", "Formulaire", ".pdf", []),
    ("09_reading_summary", "Resume de lecture", ".pdf", []),
    ("10_tds_sheet", "Fiche TDS", ".pdf", []),
    ("11_blank_recall", "Rappel a blanc", ".pdf", []),
    ("12_flashcards", "Flashcards", ".json", []),
    ("13_mock_pack", "Pack de questions mock", ".pdf", []),
    ("14_audio_script", "Script audio", ".md", []),
    ("15_knowledge_audit", "Audit de connaissances", ".pdf", []),
    ("16_weakness_pool", "Banque de faiblesses", ".pdf", []),
    ("17_learning_map", "Carte visuelle d'apprentissage", ".svg", [".dot"]),
    ("00_full_course", "Full Course Audio", ".mp3", []),
    ("00_full_course", "Full Course", ".pdf", [".md"]),
]


def _refresh_manifest_from_disk(lm_dir: Path, topic: str, lm_code: str, lm_title: str) -> None:
    """Rewrite manifest.json from what's actually present on disk.

    Called in a `finally` block at the end of every generate-all pipeline run
    (success, error, or interruption) so the user always has access to the
    assets they've paid for, even if the run didn't complete.
    """
    manifest_path = lm_dir / "manifest.json"
    try:
        existing = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    except Exception:
        existing = {}

    assets: list[dict] = []
    for stem, title, ext, fallbacks in KNOWN_ASSET_FILES:
        for candidate in (ext, *fallbacks):
            f = lm_dir / f"{stem}{candidate}"
            if f.exists():
                assets.append({
                    "title": title,
                    "filename": f"{stem}{candidate}",
                    "size_kb": round(f.stat().st_size / 1024, 1),
                    "status": "success",
                })
                break

    manifest = {
        "module": existing.get("module") or {
            "topic": topic, "code": f"{topic}-{lm_code}", "title": lm_title,
        },
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "assets": assets,
    }
    if "total_time_sec" in existing:
        manifest["total_time_sec"] = existing["total_time_sec"]
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


async def _run_pipeline_for_lm(job_id: str, topic: str, lm_code: str, lm_title: str) -> None:
    """Run generate_all_assets → generate_lm_course → generate_audio sequentially,
    streaming progress into Redis via job_state.update().
    """
    import asyncio
    backend_root = Path(__file__).resolve().parent.parent.parent
    all_script = backend_root / "generate_all_assets.py"
    course_script = backend_root / "generate_lm_course.py"
    audio_script = backend_root / "generate_audio.py"
    lm_dir = GENERATED_ROOT / topic / lm_code
    md_path = lm_dir / "00_full_course.md"
    mp3_path = lm_dir / "00_full_course.mp3"

    env = {
        **os.environ,
        "WINGMAN_NO_DB": "1",
        "ANTHROPIC_API_KEY": settings.anthropic_api_key,
        "PYTHONUNBUFFERED": "1",  # ensure subprocess prints flush per-line
    }

    async def _spawn(args: list[str]):
        import sys
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-u", *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
            cwd=str(backend_root),
        )
        _ACTIVE_JOB_PROCS.setdefault(job_id, []).append(proc)
        return proc

    def _unregister(proc):
        procs = _ACTIVE_JOB_PROCS.get(job_id, [])
        if proc in procs:
            procs.remove(proc)
        if not procs:
            _ACTIVE_JOB_PROCS.pop(job_id, None)

    async def _drain_stderr(proc) -> str:
        data = await proc.stderr.read()
        return data.decode(errors="replace")[-500:]

    try:
        # ── Phase A: 17 assets, sequential ─────────────────────
        # `step` is the 1-based index of the asset CURRENTLY in flight.
        # Label is set proactively to the asset Claude is working on right now.
        await job_state.update(
            job_id, phase="assets", step=1, label=ASSETS_ORDER[0],
            sub_message="", sub_pct=0,
        )
        proc = await _spawn([str(all_script), topic, lm_code, lm_title, "--skip-existing"])
        done = 0  # number of completed assets
        async for raw in proc.stdout:
            line = raw.decode(errors="replace").rstrip()
            m = ASSET_LINE_RE.search(line)
            if m:
                done += 1
                # Persist manifest after each asset so a sudden kill (SIGTERM
                # from uvicorn reload, OOM, etc.) still leaves the user's paid
                # content visible.
                try:
                    _refresh_manifest_from_disk(lm_dir, topic, lm_code, lm_title)
                except Exception:
                    pass
                if done < len(ASSETS_ORDER):
                    await job_state.update(
                        job_id, phase="assets", step=done + 1,
                        label=ASSETS_ORDER[done], sub_message="", sub_pct=0,
                    )
                else:
                    await job_state.update(
                        job_id, phase="course_md", step=18, label=COURSE_LABEL,
                        sub_message="", sub_pct=0,
                    )
        await proc.wait()
        _unregister(proc)
        if proc.returncode != 0:
            err = await _drain_stderr(proc)
            await job_state.update(job_id, status="error", error=f"Assets: {err}")
            return

        # ── Phase B: full course markdown via Claude ──────────
        await job_state.update(
            job_id, phase="course_md", step=18, label=COURSE_LABEL,
            sub_message="Streaming...", sub_pct=0,
        )
        if not md_path.exists():
            proc = await _spawn([str(course_script), topic, lm_code])
            async for raw in proc.stdout:
                line = raw.decode(errors="replace").rstrip()
                m = COURSE_STREAM_RE.search(line)
                if m:
                    chars = int(m.group(1).replace(",", "").replace(" ", ""))
                    # Target ~36k chars (~9k words, 90min target)
                    pct = min(99, round(chars / 36000 * 100))
                    await job_state.update(job_id, sub_message=f"{chars:,} chars streamed", sub_pct=pct)
            await proc.wait()
            _unregister(proc)
            if proc.returncode != 0 or not md_path.exists():
                err = await _drain_stderr(proc)
                await job_state.update(job_id, status="error", error=f"Course: {err or 'md not produced'}")
                return

        # ── Phase C: TTS via Edge ─────────────────────────────
        await job_state.update(
            job_id, phase="tts", step=19, label=TTS_LABEL,
            sub_message="Démarrage...", sub_pct=0,
        )
        if not mp3_path.exists():
            proc = await _spawn([str(audio_script), "--input", str(md_path), "--output", str(mp3_path)])
            async for raw in proc.stdout:
                line = raw.decode(errors="replace").rstrip()
                m = TTS_CHUNK_RE.search(line)
                if m:
                    cur, tot = int(m.group(1)), int(m.group(2))
                    pct = round(cur / tot * 100)
                    await job_state.update(job_id, sub_message=f"Chunk {cur}/{tot}", sub_pct=pct)
            await proc.wait()
            _unregister(proc)
            if proc.returncode != 0 or not mp3_path.exists():
                err = await _drain_stderr(proc)
                await job_state.update(job_id, status="error", error=f"TTS: {err or 'mp3 not produced'}")
                return

        size_kb = round(mp3_path.stat().st_size / 1024, 1)
        await job_state.update(
            job_id, status="done", phase="done", step=PIPELINE_TOTAL_STEPS,
            label="Terminé", sub_message=f"00_full_course.mp3 ({size_kb:.0f} KB)", sub_pct=100,
            mp3_size_kb=size_kb,
        )

    except Exception as e:
        await job_state.update(job_id, status="error", error=f"{type(e).__name__}: {e}")
    finally:
        # Best-effort kill any leftover subprocesses (e.g. on uncaught exception)
        for proc in _ACTIVE_JOB_PROCS.pop(job_id, []):
            if proc.returncode is None:
                try:
                    proc.kill()
                except ProcessLookupError:
                    pass
        # Always rewrite manifest.json from disk so the user can access whatever
        # was produced — even if the pipeline crashed midway.
        try:
            _refresh_manifest_from_disk(lm_dir, topic, lm_code, lm_title)
        except Exception:
            pass


# ── POST /api/content/generate-all/{topic}/{lm_code} ───────────
@router.post("/generate-all/{topic}/{lm_code}")
async def generate_all_assets(topic: str, lm_code: str, req: GenerateAllRequest, key: str = ""):
    """Launch the full content pipeline (assets + full course .md + .mp3) as a background job.
    Returns {job_id} immediately; poll /generate-all/job/{job_id} for progress.
    """
    _verify_admin_key(key)
    import asyncio
    lm_title = req.lm_title or f"{topic}-{lm_code}"
    backend_root = Path(__file__).resolve().parent.parent.parent
    for s in ("generate_all_assets.py", "generate_lm_course.py", "generate_audio.py"):
        if not (backend_root / s).exists():
            raise HTTPException(status_code=500, detail=f"Generator script missing: {s}")

    job_id = job_state.new_job_id()
    await job_state.create(job_id, total_steps=PIPELINE_TOTAL_STEPS, label="Démarrage")
    asyncio.create_task(_run_pipeline_for_lm(job_id, topic, lm_code, lm_title))
    return {"job_id": job_id, "total_steps": PIPELINE_TOTAL_STEPS}


# ── GET /api/content/generate-all/job/{job_id} ────────────────
@router.get("/generate-all/job/{job_id}")
async def generate_all_job(job_id: str):
    state = await job_state.get(job_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    return state


# ── POST /api/content/generate-all/job/{job_id}/cancel ────────
@router.post("/generate-all/job/{job_id}/cancel")
async def generate_all_cancel(job_id: str, key: str = ""):
    """Stop a running pipeline. Kills every active subprocess for this job
    (the parallel asset pool may have several at once) and marks the job as
    error so partial assets remain accessible (manifest is rewritten from disk
    in the pipeline's finally block)."""
    _verify_admin_key(key)
    for proc in list(_ACTIVE_JOB_PROCS.get(job_id, [])):
        if proc.returncode is None:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
    await job_state.update(job_id, status="error", error="Annulé par l'utilisateur")
    return {"status": "cancelled"}


class GenerateAudioRequest(BaseModel):
    lm_title: Optional[str] = None


# ── POST /api/content/generate-audio/{topic}/{lm_code} ───────
@router.post("/generate-audio/{topic}/{lm_code}")
async def generate_audio(topic: str, lm_code: str, req: GenerateAudioRequest, key: str = ""):
    """Generate the LM's 'full course' MP3:
       1. generate_lm_course.py → 00_full_course.md (Claude, cached)
       2. generate_audio.py --input ... --output 00_full_course.mp3 (Edge TTS, cached)
       3. update manifest.json so the frontend exposes 00_full_course.mp3.
    """
    _verify_admin_key(key)
    import subprocess as sp, sys, asyncio, json
    backend_root = Path(__file__).resolve().parent.parent.parent
    course_script = backend_root / "generate_lm_course.py"
    audio_script = backend_root / "generate_audio.py"
    if not course_script.exists() or not audio_script.exists():
        raise HTTPException(status_code=500, detail="Generator scripts not found")

    lm_dir = GENERATED_ROOT / topic / lm_code
    md_path = lm_dir / "00_full_course.md"
    mp3_path = lm_dir / "00_full_course.mp3"
    pdf_path = lm_dir / "00_full_course.pdf"

    from app.config import settings
    env = {**os.environ, "WINGMAN_NO_DB": "1", "ANTHROPIC_API_KEY": settings.anthropic_api_key}
    loop = asyncio.get_event_loop()

    # Step 1 — script markdown via Claude (skip if already on disk)
    if not md_path.exists():
        def _run_course():
            return sp.run(
                [sys.executable, str(course_script), topic, lm_code],
                capture_output=True, env=env, timeout=600,
            )
        try:
            result = await loop.run_in_executor(None, _run_course)
        except sp.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Course generation timed out (10min)")
        if result.returncode != 0:
            err = result.stderr.decode(errors="replace")[-500:]
            raise HTTPException(status_code=500, detail=f"Course generation failed: {err}")
        if not md_path.exists():
            raise HTTPException(status_code=500, detail="00_full_course.md not produced")

    # Step 1b — render the markdown into a Wingman-styled PDF (WeasyPrint).
    # Uses backend/wingman_course_builder/build_audio_script_pdf.py which
    # parses the audio script's `[pause Xs]` markers to derive sections /
    # subsections / paragraphs. Replaces the previous fpdf2 builder.
    if not pdf_path.exists() and md_path.exists():
        try:
            from wingman_course_builder.topics import topic_name_en, topic_name_fr_short
            builder = backend_root / "wingman_course_builder" / "build_audio_script_pdf.py"
            module_num = lm_code.replace("LM", "").lstrip("0") or "0"
            module_num = module_num.zfill(2)
            title_en = req.lm_title or f"{topic}-{lm_code}"
            args = [
                sys.executable, str(builder), str(md_path), str(pdf_path),
                "--topic-en", topic_name_en(topic),
                "--topic-fr-short", topic_name_fr_short(topic),
                "--module-num", module_num,
                "--title-en", title_en,
                "--title-fr", title_en,
            ]
            def _run_pdf():
                return sp.run(args, capture_output=True, env=env, timeout=180)
            result = await loop.run_in_executor(None, _run_pdf)
            if result.returncode != 0:
                err = result.stderr.decode(errors="replace")[-500:]
                logger.warning("Full course PDF rendering failed (rc={}): {}", result.returncode, err)
        except Exception as exc:
            logger.warning("Full course PDF rendering failed: {}", exc)

    # Step 2 — TTS via Edge (skip if MP3 already cached)
    if not mp3_path.exists():
        def _run_tts():
            return sp.run(
                [sys.executable, str(audio_script), "--input", str(md_path), "--output", str(mp3_path)],
                capture_output=True, env=env, timeout=1800,
            )
        try:
            result = await loop.run_in_executor(None, _run_tts)
        except sp.TimeoutExpired:
            raise HTTPException(status_code=504, detail="TTS generation timed out (30min)")
        if result.returncode != 0:
            err = result.stderr.decode(errors="replace")[-500:]
            raise HTTPException(status_code=500, detail=f"TTS generation failed: {err}")
        if not mp3_path.exists():
            raise HTTPException(status_code=500, detail="00_full_course.mp3 not produced")

    size_kb = round(mp3_path.stat().st_size / 1024, 1)

    # Step 3 — register the MP3 in manifest.json (replace any legacy short audio entry)
    manifest_path = lm_dir / "manifest.json"
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            assets = [a for a in manifest.get("assets", [])
                      if a.get("filename") not in ("00_full_course.mp3", "14_audio_synthesis.mp3")]
            assets.append({
                "title": "Full Course Audio",
                "filename": "00_full_course.mp3",
                "size_kb": size_kb,
                "status": "success",
            })
            manifest["assets"] = assets
            manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass  # manifest update is best-effort; the MP3 is what matters

    return {"status": "ok", "filename": "00_full_course.mp3", "size_kb": size_kb}


class GenerateAssetRequest(BaseModel):
    asset_key: str  # e.g. "01_summary_notes"
    lm_title: Optional[str] = None
    los: Optional[List[str]] = None


# ── POST /api/content/generate-asset/{topic}/{lm_code} ───────
@router.post("/generate-asset/{topic}/{lm_code}")
async def generate_single_asset(topic: str, lm_code: str, req: GenerateAssetRequest, key: str = ""):
    """Generate a single asset using Claude API."""
    _verify_admin_key(key)
    if req.asset_key not in ASSET_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown asset key: {req.asset_key}")

    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env")

    title, prompt = ASSET_PROMPTS[req.asset_key]
    lm_title = req.lm_title or f"{topic}-{lm_code}"

    # Build system prompt
    los_text = "\n".join(f"  {lo}" for lo in (req.los or []))
    system_prompt = f"""You are a CFA Level I curriculum expert and educational content designer.
You produce study materials that are:
- Precise, exam-focused, and technically accurate
- Aligned with the CFA Institute curriculum
- Formatted in clean Markdown with proper headings, tables, formulas, and bullet points
- Dense but readable — every sentence adds value

Module context:
- Topic: {topic}
- Module: {topic}-{lm_code} — {lm_title}
{f"Learning Outcomes:{chr(10)}{los_text}" if los_text else ""}
"""

    # Check for curriculum source text
    module_dir = GENERATED_ROOT / topic / lm_code
    source_path = module_dir / "source_curriculum.txt"
    if source_path.exists():
        curriculum = source_path.read_text(encoding="utf-8")
        if len(curriculum) > 60000:
            curriculum = curriculum[:60000] + "\n\n[... truncated ...]"
        system_prompt += f"\n=== CURRICULUM SOURCE TEXT ===\n{curriculum}\n=== END ===\n"

    # Call Claude API
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        start = time.time()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.content[0].text
        elapsed = time.time() - start
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    # Save file — convert Markdown to PDF (except flashcards which stay JSON)
    module_dir.mkdir(parents=True, exist_ok=True)
    is_json = req.asset_key == "12_flashcards"

    if is_json:
        filename = f"{req.asset_key}.json"
        filepath = module_dir / filename
        filepath.write_text(content, encoding="utf-8")
    else:
        filename = f"{req.asset_key}.pdf"
        filepath = module_dir / filename
        _markdown_to_pdf(content, str(filepath), title, f"{topic}-{lm_code}")

    size_kb = round(filepath.stat().st_size / 1024, 1)

    # Update manifest
    manifest_path = module_dir / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {
            "module": {"topic": topic, "code": f"{topic}-{lm_code}", "title": lm_title},
            "generated_at": "",
            "total_time_sec": 0,
            "assets": [],
        }

    asset_entry = {"title": title, "filename": filename, "size_kb": size_kb, "status": "success"}
    existing = {a["filename"]: i for i, a in enumerate(manifest["assets"])}
    if filename in existing:
        manifest["assets"][existing[filename]] = asset_entry
    else:
        manifest["assets"].append(asset_entry)
    manifest["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "status": "ok",
        "filename": filename,
        "title": title,
        "size_kb": size_kb,
        "time_sec": round(elapsed, 1),
    }


# ── Trash directory ──────────────────────────────────────────
TRASH_ROOT = GENERATED_ROOT / ".trash"


# ── DELETE /api/content/generated/{topic}/{lm_code}/{filename}
@router.delete("/generated/{topic}/{lm_code}/{filename}")
async def delete_generated_file(topic: str, lm_code: str, filename: str, key: str = ""):
    """Move a specific asset to trash and update manifest."""
    _verify_admin_key(key)
    file_path = GENERATED_ROOT / topic / lm_code / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Security check
    try:
        file_path.resolve().relative_to(GENERATED_ROOT.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    # Move to trash instead of deleting
    trash_dir = TRASH_ROOT / topic / lm_code
    trash_dir.mkdir(parents=True, exist_ok=True)
    trash_dest = trash_dir / filename
    # If already in trash, overwrite
    if trash_dest.exists():
        os.remove(trash_dest)
    import shutil
    shutil.move(str(file_path), str(trash_dest))

    # Save trash metadata
    trash_meta_path = TRASH_ROOT / "trash_index.json"
    trash_index = []
    if trash_meta_path.exists():
        try:
            trash_index = json.loads(trash_meta_path.read_text(encoding="utf-8"))
        except Exception:
            trash_index = []
    # Remove old entry for same file if exists
    trash_index = [e for e in trash_index if not (e["topic"] == topic and e["lm_code"] == lm_code and e["filename"] == filename)]
    trash_index.append({
        "topic": topic,
        "lm_code": lm_code,
        "filename": filename,
        "trashed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
    })
    trash_meta_path.write_text(json.dumps(trash_index, indent=2, ensure_ascii=False), encoding="utf-8")

    # Update manifest
    manifest_path = GENERATED_ROOT / topic / lm_code / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["assets"] = [a for a in manifest["assets"] if a["filename"] != filename]
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    return {"status": "trashed", "filename": filename}


# ── GET /api/content/trash ──────────────────────────────────
@router.get("/trash")
async def list_trash(key: str = ""):
    """List all trashed files."""
    _verify_admin_key(key)
    trash_meta_path = TRASH_ROOT / "trash_index.json"
    if not trash_meta_path.exists():
        return []
    try:
        trash_index = json.loads(trash_meta_path.read_text(encoding="utf-8"))
        # Add size info and verify files still exist
        result = []
        for entry in trash_index:
            fpath = TRASH_ROOT / entry["topic"] / entry["lm_code"] / entry["filename"]
            if fpath.exists():
                entry["size_kb"] = round(fpath.stat().st_size / 1024, 1)
                result.append(entry)
        return result
    except Exception:
        return []


# ── POST /api/content/trash/restore ─────────────────────────
@router.post("/trash/restore")
async def restore_from_trash(topic: str, lm_code: str, filename: str, key: str = ""):
    """Restore a file from trash back to its module."""
    _verify_admin_key(key)
    trash_path = TRASH_ROOT / topic / lm_code / filename
    if not trash_path.exists():
        raise HTTPException(status_code=404, detail="File not found in trash")

    # Restore to original location
    module_dir = GENERATED_ROOT / topic / lm_code
    module_dir.mkdir(parents=True, exist_ok=True)
    dest_path = module_dir / filename
    import shutil
    shutil.move(str(trash_path), str(dest_path))

    # Update manifest
    manifest_path = module_dir / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {
            "module": {"topic": topic, "code": f"{topic}-{lm_code}", "title": "", "los_count": 0,
                       "exam_weight": "", "volume": 0, "learning_outcomes": []},
            "generated_at": "", "total_time_sec": 0, "assets": [],
        }
    # Add back to manifest
    size_kb = round(dest_path.stat().st_size / 1024, 1)
    title = filename.rsplit(".", 1)[0].replace("_", " ").title()
    manifest["assets"].append({
        "title": title, "filename": filename, "size_kb": size_kb, "status": "success",
    })
    manifest["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    # Remove from trash index
    trash_meta_path = TRASH_ROOT / "trash_index.json"
    if trash_meta_path.exists():
        try:
            trash_index = json.loads(trash_meta_path.read_text(encoding="utf-8"))
            trash_index = [e for e in trash_index if not (e["topic"] == topic and e["lm_code"] == lm_code and e["filename"] == filename)]
            trash_meta_path.write_text(json.dumps(trash_index, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    return {"status": "restored", "filename": filename}


# ── DELETE /api/content/trash/empty ─────────────────────────
@router.delete("/trash/empty")
async def empty_trash(key: str = ""):
    """Permanently delete all trashed files."""
    _verify_admin_key(key)
    import shutil
    count = 0
    if TRASH_ROOT.exists():
        trash_meta_path = TRASH_ROOT / "trash_index.json"
        if trash_meta_path.exists():
            try:
                trash_index = json.loads(trash_meta_path.read_text(encoding="utf-8"))
                count = len(trash_index)
            except Exception:
                pass
        shutil.rmtree(TRASH_ROOT)
    return {"status": "emptied", "deleted_count": count}


# ── GET (and HEAD) /api/content/generated/{topic}/{lm_code}/{filename} ──
# HEAD is needed by the frontend to probe whether an asset exists without
# pulling the bytes (e.g. the Level 1 fiche check on /learning-by-doing).
@router.api_route("/generated/{topic}/{lm_code}/{filename}", methods=["GET", "HEAD"])
async def download_generated_file(topic: str, lm_code: str, filename: str):
    """Download a specific generated content file."""
    file_path = GENERATED_ROOT / topic / lm_code / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    # Security: ensure the resolved path is within GENERATED_ROOT
    try:
        file_path.resolve().relative_to(GENERATED_ROOT.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")

    # Determine media type
    suffix = file_path.suffix.lower()
    media_types = {
        ".md": "text/markdown",
        ".json": "application/json",
        ".pdf": "application/pdf",
        ".mp3": "audio/mpeg",
        ".txt": "text/plain",
        ".svg": "image/svg+xml",
        ".dot": "text/vnd.graphviz",
    }
    media_type = media_types.get(suffix, "application/octet-stream")
    # Default to inline so browsers render PDFs, SVGs and text files in-app (iframe, <img>).
    # Clients that want a forced download can use <a download="..."> on the link.
    disposition = "inline"

    return FileResponse(
        str(file_path),
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )


# ── Schemas ───────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    lm_id: int
    language: str = "fr"


class SearchRequest(BaseModel):
    query: str
    top_k: int = 3


# ── POST /api/content/generate/pdf ───────────────────────────

@router.post("/generate/pdf")
async def generate_pdf(req: GenerateRequest, key: str = "", db: AsyncSession = Depends(get_db)):
    _verify_admin_key(key)
    return await generate_pdf_content(db, req.lm_id, req.language)


# ── POST /api/content/generate/audio ─────────────────────────

@router.post("/generate/audio")
async def generate_audio(req: GenerateRequest, key: str = "", db: AsyncSession = Depends(get_db)):
    _verify_admin_key(key)
    return await generate_audio_content(db, req.lm_id, req.language)


# ── POST /api/content/generate/full ──────────────────────────

@router.post("/generate/full")
async def generate_full(req: GenerateRequest, key: str = "", db: AsyncSession = Depends(get_db)):
    _verify_admin_key(key)
    return await generate_full_lm(db, req.lm_id, req.language)


# ── GET /api/content/library ─────────────────────────────────

@router.get("/library")
async def content_library(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT ca.id, ca.asset_type, ca.title, ca.url, ca.metadata,
               lm.id AS lm_id, lm.code AS lm_code, lm.title AS lm_title,
               t.code AS topic_code
        FROM content_assets ca
        JOIN learning_modules lm ON lm.id = ca.module_id
        JOIN topics t ON t.id = lm.topic_id
        ORDER BY lm.sort_order, ca.asset_type
    """))
    rows = result.mappings().all()

    # Group by LM
    grouped: dict[str, dict] = {}
    for r in rows:
        key = r["lm_code"]
        if key not in grouped:
            grouped[key] = {
                "lm_id": r["lm_id"],
                "lm_code": r["lm_code"],
                "lm_title": r["lm_title"],
                "topic_code": r["topic_code"],
                "assets": [],
            }
        grouped[key]["assets"].append({
            "id": r["id"],
            "type": r["asset_type"],
            "title": r["title"],
            "url": f"/api/content/asset/{r['id']}",
        })

    return list(grouped.values())


# ── GET /api/content/asset/{asset_id} ─────────────────────────

@router.get("/asset/{asset_id}")
async def get_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text(
        "SELECT url, asset_type, title FROM content_assets WHERE id = :id"
    ), {"id": asset_id})
    row = result.mappings().first()
    if not row:
        return {"error": "Asset not found"}

    filepath = Path(row["url"])
    if not filepath.exists():
        return {"error": "File not found on disk"}

    media_type = "application/pdf" if row["asset_type"] == "pdf" else "audio/mpeg"
    return FileResponse(str(filepath), media_type=media_type, filename=filepath.name)


# ── POST /api/content/search ─────────────────────────────────

@router.post("/search")
async def search_content(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    # Stub: In production, embed query via ChromaDB and search content_vectors
    # For now, do a simple text search on content_assets titles
    result = await db.execute(text("""
        SELECT ca.id, ca.title, lm.code AS lm_code, lm.title AS lm_title
        FROM content_assets ca
        JOIN learning_modules lm ON lm.id = ca.module_id
        WHERE ca.title ILIKE :q OR lm.title ILIKE :q
        LIMIT :k
    """), {"q": f"%{req.query}%", "k": req.top_k})
    rows = result.mappings().all()

    return [
        {"asset_id": r["id"], "title": r["title"],
         "lm_code": r["lm_code"], "excerpt": f"Résultat pour '{req.query}' dans {r['lm_title']}"}
        for r in rows
    ]
