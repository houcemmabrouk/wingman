#!/usr/bin/env python3
"""Render an audio-script `00_full_course.md` (plain TTS prose with `[pause Xs]`
markers, no headings) into a Wingman-styled PDF.

This is the **option A** path: no Claude call, no structured input. We strip
the TTS markers, use long pauses as section/subsection cues, and apply the
same `wingman_light.css` design system as the structured builder.

Sections come from `[pause 10s]` markers; subsections from `[pause 5s]`;
paragraphs from `[pause 3s]`; `[pause 1s]` is dropped (intra-paragraph
emphasis only). Section titles default to "Partie {N}" — if the first sentence
after a major break ends with a colon or is short enough, we use it as the
title.

CLI:
    python build_audio_script_pdf.py <md_path> <pdf_path> \\
        --topic "Portfolio Management" --topic-fr-short "Portefeuilles" \\
        --module-num 01 \\
        --title-en "Portfolio Risk and Return: Part I" \\
        --title-fr "Risque et Rendement des Portefeuilles" \\
        --subtitle-fr "Théorie moderne du portefeuille…" \\
        --cfa-level 1
"""
from __future__ import annotations

import argparse
import re
import sys
from html import escape
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
CSS_FILENAME = "wingman_light.css"

# ── Pause markers ────────────────────────────────────────────────────────
_PAUSE_RE = re.compile(r"\[pause\s+(\d+)\s*s\]")
SECTION_BREAK_SEC = 10   # `[pause 10s]` and longer → new section (page break)
SUBSECTION_BREAK_SEC = 5 # `[pause 5s]` → h2 within section
PARAGRAPH_BREAK_SEC = 3  # `[pause 3s]` → paragraph break (already there usually)
# Anything shorter → drop the marker, keep flow.

# ── Title heuristics ─────────────────────────────────────────────────────
SHORT_TITLE_MAX_CHARS = 80
_TITLE_CANDIDATE_RE = re.compile(r"^\s*([^.!?\n]{8,80})\s*[:.]\s")


def parse_audio_script(md_text: str) -> list[dict]:
    """Split the script into a list of `{title, subsections: [{title|None, paragraphs:[str]}]}`.

    Walk the source line-by-line, splitting on pause markers. We track the
    current section and current subsection. Paragraphs are accumulated as
    contiguous non-empty lines between any pause marker.
    """
    sections: list[dict] = [{"title": None, "subsections": [{"title": None, "paragraphs": []}]}]
    para_buf: list[str] = []

    def flush_para():
        nonlocal para_buf
        if not para_buf:
            return
        para = " ".join(line.strip() for line in para_buf if line.strip())
        if para:
            sections[-1]["subsections"][-1]["paragraphs"].append(para)
        para_buf = []

    def start_section():
        flush_para()
        sections.append({"title": None, "subsections": [{"title": None, "paragraphs": []}]})

    def start_subsection():
        flush_para()
        # Don't start an empty subsection if the current one has nothing yet.
        if sections[-1]["subsections"][-1]["paragraphs"] or sections[-1]["subsections"][-1]["title"]:
            sections[-1]["subsections"].append({"title": None, "paragraphs": []})

    for raw in md_text.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush_para()
            continue
        m = _PAUSE_RE.search(line)
        if m:
            sec = int(m.group(1))
            if sec >= SECTION_BREAK_SEC:
                start_section()
            elif sec >= SUBSECTION_BREAK_SEC:
                start_subsection()
            elif sec >= PARAGRAPH_BREAK_SEC:
                flush_para()
            # else: short pause, drop entirely
            continue
        para_buf.append(line)
    flush_para()

    # Drop the first section if it ended up empty (some scripts start with content directly).
    sections = [s for s in sections if any(sub["paragraphs"] for sub in s["subsections"])]
    # Drop empty trailing subsections inside each section.
    for s in sections:
        s["subsections"] = [sub for sub in s["subsections"] if sub["paragraphs"]]

    # Title heuristic: if the first paragraph of a section is short enough or ends
    # with `:` / `.`, use it as the section title. Otherwise leave None → caller
    # falls back to `Partie {N}`.
    for s in sections:
        if not s["subsections"]:
            continue
        first = s["subsections"][0]["paragraphs"][0] if s["subsections"][0]["paragraphs"] else ""
        m = _TITLE_CANDIDATE_RE.match(first)
        if m:
            candidate = m.group(1).strip()
            # Only accept the candidate if it doesn't swallow critical content —
            # i.e., the first paragraph keeps a meaningful tail after the colon.
            tail = first[m.end():].strip()
            if len(tail) > 30:
                s["title"] = candidate
                # Strip the title prefix from the first paragraph
                s["subsections"][0]["paragraphs"][0] = tail
    return sections


# ── HTML rendering ───────────────────────────────────────────────────────

def render_paragraph(text: str) -> str:
    # Light typographic touches. No need for full markdown — these are TTS
    # transcripts and almost never contain markdown beyond the occasional
    # quoted phrase.
    safe = escape(text, quote=False)
    return f"<p>{safe}</p>"


def build_html(meta: dict, sections: list[dict]) -> str:
    topic_en = meta.get("topic_en", "")
    topic_fr_short = meta.get("topic_fr_short", topic_en)
    module_num = str(meta.get("module_num", "01")).zfill(2)
    title_en = meta.get("title_en", "")
    title_fr = meta.get("title_fr", "")
    subtitle_fr = meta.get("subtitle_fr", "")
    cfa_level = meta.get("cfa_level", "1")

    cover = (
        f'<div class="title-page">'
        f'<div class="topic-bar">{escape(topic_en).upper()}</div>'
        f'<div class="module-num">Learning Module {module_num}</div>'
        f'<h1 class="module-title">{escape(title_en)}</h1>'
        f'<div class="accent"></div>'
        f'<div class="module-title-fr">{escape(title_fr)}</div>'
        f'<div class="subtitle">{escape(subtitle_fr)}</div>'
        f'<div class="footer-meta"><span class="brand">Wingman</span> · CFA Level {escape(str(cfa_level))} Curriculum</div>'
        f'</div>'
    )

    # Section titles: use detected, else "Partie {roman or num}"
    def section_title(idx: int, detected: str | None) -> str:
        if detected:
            return detected
        return f"Partie {idx}"

    toc_items = []
    body_chunks = []
    for i, s in enumerate(sections, start=1):
        title = section_title(i, s["title"])
        toc_items.append(
            f'<li><a href="#sec{i}">'
            f'<span class="num">{str(i).zfill(2)}</span>'
            f'<span class="label">{escape(title)}</span></a></li>'
        )
        sub_html_chunks = []
        for sub in s["subsections"]:
            if sub["title"]:
                sub_html_chunks.append(f'<h2>{escape(sub["title"])}</h2>')
            sub_html_chunks.extend(render_paragraph(p) for p in sub["paragraphs"])
        body_chunks.append(
            f'<h1 class="section" id="sec{i}">'
            f'<span class="num">Section {str(i).zfill(2)}</span>'
            f'{escape(title)}</h1>'
            f'<div class="underline"></div>'
            + "".join(sub_html_chunks)
        )

    toc = (
        f'<div class="toc-page">'
        f'<span class="topic-name">{escape(topic_fr_short)}</span>'
        f'<div class="toc-title">Sommaire</div>'
        f'<div class="toc-subtitle">Navigation interactive</div>'
        f'<ul class="toc-list">{"".join(toc_items)}</ul>'
        f'</div>'
    )

    return (
        f'<!DOCTYPE html><html lang="fr"><head>'
        f'<meta charset="utf-8"><title>{escape(title_fr or title_en)}</title>'
        f'</head><body>'
        f'{cover}{toc}{"".join(body_chunks)}'
        f'</body></html>'
    )


def write_pdf(html: str, css_path: Path, output_path: Path) -> None:
    from weasyprint import CSS, HTML
    HTML(string=html, base_url=str(SCRIPT_DIR)).write_pdf(
        str(output_path),
        stylesheets=[CSS(filename=str(css_path))],
    )


# ── CLI ──────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("md_path", help="Source `00_full_course.md` (audio script)")
    parser.add_argument("pdf_path", help="Output PDF path")
    parser.add_argument("--topic", "--topic-en", dest="topic_en", default="", help="Topic (EN), e.g. 'Portfolio Management'")
    parser.add_argument("--topic-fr-short", default="", help="Short FR topic for running header (e.g. 'Portefeuilles')")
    parser.add_argument("--module-num", default="01")
    parser.add_argument("--title-en", default="")
    parser.add_argument("--title-fr", default="")
    parser.add_argument("--subtitle-fr", default="")
    parser.add_argument("--cfa-level", default="1")
    parser.add_argument("--css", default=str(SCRIPT_DIR / CSS_FILENAME))
    args = parser.parse_args()

    md_path = Path(args.md_path).resolve()
    pdf_path = Path(args.pdf_path).resolve()
    css_path = Path(args.css)

    if not md_path.exists():
        print(f"[ERREUR] {md_path} introuvable", file=sys.stderr)
        return 1
    if not css_path.exists():
        print(f"[ERREUR] CSS {css_path} introuvable", file=sys.stderr)
        return 1

    # Tolerant read: a few existing scripts have stray cp1252 bytes (e.g. an
    # unsmart-quoted 0x9c). We don't want one rogue byte to skip the whole LM.
    md_text = md_path.read_text(encoding="utf-8", errors="replace")
    sections = parse_audio_script(md_text)
    if not sections:
        print(f"[ERREUR] Aucun contenu détecté dans {md_path}", file=sys.stderr)
        return 1
    n_paras = sum(len(sub["paragraphs"]) for s in sections for sub in s["subsections"])
    print(f"Parsed {len(sections)} sections, {n_paras} paragraphs")

    meta = {
        "topic_en": args.topic_en,
        "topic_fr_short": args.topic_fr_short or args.topic_en,
        "module_num": args.module_num,
        "title_en": args.title_en,
        "title_fr": args.title_fr,
        "subtitle_fr": args.subtitle_fr,
        "cfa_level": args.cfa_level,
    }
    html = build_html(meta, sections)
    print(f"HTML built ({len(html):,} chars), rendering with WeasyPrint…")
    write_pdf(html, css_path, pdf_path)
    print(f"PDF written: {pdf_path}")

    try:
        from pypdf import PdfReader
        r = PdfReader(str(pdf_path))
        n_pages = len(r.pages)
        n_bookmarks = _count_bookmarks(r.outline) if r.outline else 0
        print(f"QC: {n_pages} pages, {n_bookmarks} bookmarks")
    except Exception as e:
        print(f"[warn] QC skipped: {type(e).__name__}: {e}")
    return 0


def _count_bookmarks(items) -> int:
    n = 0
    for item in items:
        if isinstance(item, list):
            n += _count_bookmarks(item)
        else:
            n += 1
    return n


if __name__ == "__main__":
    sys.exit(main())
