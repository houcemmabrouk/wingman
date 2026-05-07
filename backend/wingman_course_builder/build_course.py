#!/usr/bin/env python3
"""Wingman Full Course PDF builder.

Reads:
  - course_config.json  : metadata (topic, LM, titles, output filename)
  - course_content.md   : structured content with `:::` directives (see manifest §7.3)

Produces a print-ready, e-reader friendly PDF using WeasyPrint, conforming to
`wingman_full_course_manifest.md` (§4 structure, §5 components, §6 layout rules).

CLI:
    python build_course.py <module_dir>
    python build_course.py <module_dir> --content custom_content.md --config custom_config.json

The script is intentionally a single file, ~400 lines. The parser handles only
the markdown subset listed in manifest §7.5 — anything else is passed through
or silently dropped.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from html import escape
from pathlib import Path
from typing import Optional


CSS_FILENAME = "wingman_light.css"
SCRIPT_DIR = Path(__file__).resolve().parent


# ── Math notation helpers (manifest §7.4) ─────────────────────────────────
# These run on the inner text of paragraphs / list items / scenario data /
# resolution / question / answer — anywhere prose lives. Order matters: more
# specific patterns first so they don't get eaten by simpler ones.
_MATH_RULES: list[tuple[re.Pattern, str]] = [
    # Greek + sub with braces:  ρ_{i,j} → ρ<sub>i,j</sub>
    (re.compile(r"([A-Za-zρσμνπθβαγδλΣΩ])(²|³)?_\{([^{}]+)\}"),
     lambda m: f"{m.group(1)}{m.group(2) or ''}<sub>{m.group(3)}</sub>"),
    # Letter + sub single token:  σ_p → σ<sub>p</sub> ; w_1² → w<sub>1</sub>²
    # We accept letter | digit | super² | super³ before the underscore.
    (re.compile(r"([A-Za-zρσμνπθβαγδλΣΩ])(²|³)?_([A-Za-zÀ-ÿ0-9*]+)"),
     lambda m: f"{m.group(1)}{m.group(2) or ''}<sub>{m.group(3)}</sub>"),
    # Caret superscript (2^n → 2<sup>n</sup>) — kept simple: token after ^.
    (re.compile(r"(\b\w)\^([A-Za-z0-9]+)"),
     lambda m: f"{m.group(1)}<sup>{m.group(2)}</sup>"),
]


def apply_math(text: str) -> str:
    """Apply the §7.4 sub/sup substitutions to a chunk of text. Idempotent
    enough: rules look for `_` or `^` next to a token, which doesn't survive
    the substitution. Don't run on already-HTML."""
    for pat, repl in _MATH_RULES:
        text = pat.sub(repl, text)
    return text


# ── Inline markdown (run AFTER apply_math, on prose-only segments) ────────
_INLINE_BOLD = re.compile(r"\*\*(.+?)\*\*")
_INLINE_ITALIC = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")
_INLINE_CODE = re.compile(r"`([^`]+)`")
_INLINE_LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def render_inline(text: str) -> str:
    """Convert inline markdown to HTML on a single line. Order: code first
    (so its content is not eaten by bold/italic), then bold, italic, links.
    Math conversions are applied to the prose between code spans."""
    # Split out code spans, process the rest, then reassemble.
    parts: list[str] = []
    last = 0
    for m in _INLINE_CODE.finditer(text):
        if m.start() > last:
            parts.append(_render_prose(text[last:m.start()]))
        parts.append(f'<span class="math">{escape(m.group(1))}</span>')
        last = m.end()
    if last < len(text):
        parts.append(_render_prose(text[last:]))
    return "".join(parts)


def _render_prose(text: str) -> str:
    text = escape(text, quote=False)
    text = apply_math(text)
    text = _INLINE_BOLD.sub(r"<strong>\1</strong>", text)
    text = _INLINE_ITALIC.sub(r"<em>\1</em>", text)
    text = _INLINE_LINK.sub(r'<a href="\2">\1</a>', text)
    return text


# ── Block-level helpers ───────────────────────────────────────────────────

_BULLET_RE = re.compile(r"^(\s*)([-*])\s+(.*)$")
_OL_RE = re.compile(r"^(\s*)(\d+)\.\s+(.*)$")


def render_prose_block(lines: list[str]) -> str:
    """Render a sequence of plain markdown lines (inside a block or top-level)
    into HTML paragraphs / lists. No directives here — those are handled
    by the directive parser."""
    out: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        # Heading inside block? Only ## and ### (h1.section is top-level only)
        if stripped.startswith("### "):
            out.append(f"<h3>{render_inline(stripped[4:])}</h3>")
            i += 1
            continue
        if stripped.startswith("## "):
            out.append(f"<h2>{render_inline(stripped[3:])}</h2>")
            i += 1
            continue
        # Bullet list — collect consecutive bullets
        if _BULLET_RE.match(line):
            items, j = _collect_list(lines, i, _BULLET_RE)
            out.append("<ul>" + "".join(f"<li>{render_inline(t)}</li>" for t in items) + "</ul>")
            i = j
            continue
        if _OL_RE.match(line):
            items, j = _collect_list(lines, i, _OL_RE)
            out.append("<ol>" + "".join(f"<li>{render_inline(t)}</li>" for t in items) + "</ol>")
            i = j
            continue
        # Paragraph — collect contiguous non-empty lines that aren't list / heading
        para: list[str] = []
        while i < n:
            s = lines[i].strip()
            if not s or s.startswith("###") or s.startswith("##") or _BULLET_RE.match(lines[i]) or _OL_RE.match(lines[i]):
                break
            para.append(s)
            i += 1
        if para:
            out.append(f"<p>{render_inline(' '.join(para))}</p>")
    return "\n".join(out)


def _collect_list(lines: list[str], start: int, pat: re.Pattern) -> tuple[list[str], int]:
    items: list[str] = []
    i = start
    while i < len(lines):
        m = pat.match(lines[i])
        if not m:
            break
        items.append(m.group(3))
        i += 1
    return items, i


# ── Directive parser (`::: kind "title"` … `:::`) ─────────────────────────

# A directive opener: `::: KIND` optionally `::: KIND "TITLE"` or `::: KIND TAG "TITLE"`.
# Examples:
#   ::: lead
#   ::: callout intuition "Intuition centrale"
#   ::: formula "Coefficient de corrélation"
#   ::: formula F1 "Rendement espéré"
#   ::: scenario "Comparaison de deux portefeuilles"
#   ::: data
#   ::: resolution
#   ::: qcm "Question 1"
#   ::: flashcard
#   ::: formula-index
_DIRECTIVE_OPEN_RE = re.compile(
    r'^:::\s*(?P<kind>[a-z][a-z-]*)'
    r'(?:\s+(?P<tag>[A-Z]\w*))?'
    r'(?:\s+(?P<variant>intuition|warning|success|example))?'
    r'(?:\s+"(?P<title>[^"]*)")?'
    r'\s*$'
)
# Some directives put the variant before the title (e.g. callout intuition "Title").
# The regex above accepts variant either as a fixed-set word or as the bare second token.
# To keep things simple we have a separate try below if the regex fails.
_DIRECTIVE_OPEN_FALLBACK = re.compile(r'^:::\s*(?P<kind>[a-z][a-z-]*)\s+(?P<rest>.+)$')
_DIRECTIVE_CLOSE_RE = re.compile(r'^:::\s*$')


def parse_directive_open(line: str) -> Optional[dict]:
    """Return a dict {kind, tag, variant, title} or None if not a directive opener."""
    s = line.rstrip()
    if not s.startswith(":::"):
        return None
    m = _DIRECTIVE_OPEN_RE.match(s)
    if m:
        return {
            "kind": m.group("kind"),
            "tag": m.group("tag"),
            "variant": m.group("variant"),
            "title": m.group("title"),
        }
    m = _DIRECTIVE_OPEN_FALLBACK.match(s)
    if m:
        kind = m.group("kind")
        rest = m.group("rest").strip()
        # Try to peel off `<variant> "<title>"` or just `"<title>"` or just `<tag>`.
        title = None
        variant = None
        tag = None
        m2 = re.match(r'^(intuition|warning|success|example)\s+"([^"]*)"\s*$', rest)
        if m2:
            variant = m2.group(1)
            title = m2.group(2)
        else:
            m3 = re.match(r'^"([^"]*)"\s*$', rest)
            if m3:
                title = m3.group(1)
            else:
                m4 = re.match(r'^([A-Z]\w*)(?:\s+"([^"]*)")?\s*$', rest)
                if m4:
                    tag = m4.group(1)
                    title = m4.group(2)
        return {"kind": kind, "tag": tag, "variant": variant, "title": title}
    return None


def render_directive(opener: dict, body_lines: list[str]) -> str:
    """Render one directive block to HTML based on its kind."""
    kind = opener["kind"]
    title = opener.get("title") or ""
    variant = opener.get("variant")
    tag = opener.get("tag")

    # Some directives have a `---` splitter (e.g. formula's eq vs where).
    def split_on_hr(lines: list[str]) -> tuple[list[str], list[str]]:
        for i, ln in enumerate(lines):
            if ln.strip() == "---":
                return lines[:i], lines[i + 1:]
        return lines, []

    if kind == "lead":
        body = render_prose_block(body_lines)
        # Unwrap a single <p> so the lead style applies on the paragraph itself.
        if body.startswith("<p>") and body.endswith("</p>"):
            body = body[3:-4]
        return f'<p class="lead">{body}</p>'

    if kind == "callout":
        v = variant or "intuition"
        body = render_prose_block(body_lines)
        return (f'<div class="callout {v}">'
                f'<div class="callout-title"><span class="dot"></span>{escape(title)}</div>'
                f'{body}</div>')

    if kind == "formula":
        eq_lines, where_lines = split_on_hr(body_lines)
        eq = " ".join(s.strip() for s in eq_lines if s.strip())
        eq_html = apply_math(escape(eq, quote=False))
        # Bold ** survives apply_math. Render inline so we get bold in `where`.
        where_html = render_prose_block(where_lines) if where_lines else ""
        if where_html.startswith("<p>") and where_html.endswith("</p>"):
            where_html = where_html[3:-4]
        label_html = (f'<span class="num-tag">{escape(tag)}</span>{escape(title)}'
                      if tag else escape(title))
        return (f'<div class="formula">'
                f'<div class="label">{label_html}</div>'
                f'<div class="eq">{eq_html}</div>'
                + (f'<div class="where">{where_html}</div>' if where_html else "")
                + '</div>')

    if kind == "formula-index":
        # Body contains nested formula directives. Re-parse them.
        inner_html = parse_blocks(body_lines)
        return f'<div class="formula-index">{inner_html}</div>'

    if kind == "scenario":
        # The body itself contains nested ::: data and ::: resolution blocks.
        inner_html = parse_blocks(body_lines)
        return (f'<div class="scenario">'
                f'<span class="tag">{escape(title)}</span>'
                f'{inner_html}</div>')

    if kind == "data":
        # Plain prose lines, rendered with line breaks preserved (one fact per line).
        rendered = []
        for ln in body_lines:
            s = ln.strip()
            if s:
                rendered.append(render_inline(s))
        return f'<div class="data">{"<br>".join(rendered)}</div>'

    if kind == "resolution":
        body = render_prose_block(body_lines)
        return f'<div class="resolution">{body}</div>'

    if kind == "qcm":
        # Body has: question paragraph(s) → choice list `A. ... B. ... C. ...`
        # → answer line starting with `>`.
        question_lines: list[str] = []
        choices: list[tuple[str, str]] = []
        answer_lines: list[str] = []
        in_answer = False
        for ln in body_lines:
            s = ln.strip()
            if not s:
                continue
            if in_answer:
                answer_lines.append(s.lstrip("> ").strip() if s.startswith(">") else s)
                continue
            if s.startswith(">"):
                in_answer = True
                answer_lines.append(s.lstrip("> ").strip())
                continue
            m = re.match(r"^([A-D])[.)]\s+(.*)$", s)
            if m:
                choices.append((m.group(1), m.group(2)))
                continue
            question_lines.append(s)
        question_html = render_inline(" ".join(question_lines))
        choices_html = "".join(
            f'<li data-letter="{letter}">{render_inline(text)}</li>'
            for letter, text in choices
        )
        answer_html = render_inline(" ".join(answer_lines))
        return (f'<div class="qcm">'
                f'<div class="q-num">{escape(title)}</div>'
                f'<div class="question">{question_html}</div>'
                f'<ul class="choices">{choices_html}</ul>'
                f'<div class="answer">{answer_html}</div></div>')

    if kind == "flashcard":
        # Body: lines starting with `Q:` and `R:` (or `A:`).
        q_lines: list[str] = []
        a_lines: list[str] = []
        bucket = None
        for ln in body_lines:
            s = ln.strip()
            if not s:
                continue
            if s.startswith("Q:"):
                bucket = "q"
                q_lines.append(s[2:].strip())
            elif s.startswith(("R:", "A:")):
                bucket = "a"
                a_lines.append(s[2:].strip())
            elif bucket == "q":
                q_lines.append(s)
            elif bucket == "a":
                a_lines.append(s)
        return (f'<div class="flashcard">'
                f'<div class="q">{render_inline(" ".join(q_lines))}</div>'
                f'<div class="a">{render_inline(" ".join(a_lines))}</div></div>')

    if kind == "key-grid":
        # Body has nested `::: key-row` blocks, each containing `::: key-card` items.
        return f'<div class="key-grid">{parse_blocks(body_lines)}</div>'

    if kind == "key-row":
        return f'<div class="key-row">{parse_blocks(body_lines)}</div>'

    if kind == "key-card":
        eq_lines, where_lines = split_on_hr(body_lines)
        k_text = " ".join(s.strip() for s in eq_lines if s.strip())
        v_html = render_prose_block(where_lines) if where_lines else ""
        if v_html.startswith("<p>") and v_html.endswith("</p>"):
            v_html = v_html[3:-4]
        return (f'<div class="key-card">'
                f'<div class="k">{escape(title or k_text)}</div>'
                f'<div class="v">{v_html or render_inline(k_text)}</div></div>')

    # Unknown directive — render as a plain paragraph block so we don't lose content.
    body = render_prose_block(body_lines)
    return f'<div class="unknown-block">{body}</div>'


def parse_blocks(lines: list[str]) -> str:
    """Top-level (or nested) block parser: walks lines, finds `:::` directive
    openers, collects until matching `:::` (with proper nesting), recurses,
    and renders prose between directives via `render_prose_block`."""
    out: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        opener = parse_directive_open(lines[i])
        if opener is None:
            buf.append(lines[i])
            i += 1
            continue
        # Flush prose accumulated so far.
        if buf:
            out.append(render_prose_block(buf))
            buf = []
        # Find matching close, handling nested directives.
        depth = 1
        j = i + 1
        body: list[str] = []
        while j < n and depth > 0:
            sub_opener = parse_directive_open(lines[j])
            if sub_opener is not None:
                depth += 1
                body.append(lines[j])
                j += 1
                continue
            if _DIRECTIVE_CLOSE_RE.match(lines[j]):
                depth -= 1
                if depth == 0:
                    break
                body.append(lines[j])
                j += 1
                continue
            body.append(lines[j])
            j += 1
        out.append(render_directive(opener, body))
        i = j + 1  # skip past closing :::
    if buf:
        out.append(render_prose_block(buf))
    return "\n".join(out)


# ── Section parser (top-level structure) ──────────────────────────────────

_SECTION_RE = re.compile(r"^#\s+Section\s+(\d+)\s*[·:.\-]\s*(.+?)\s*$")


def parse_sections(content: str) -> list[dict]:
    """Split the markdown into sections delimited by `# Section N · Title`.
    Returns a list of {num, title, body_lines}. Anything before the first
    section header is dropped."""
    sections: list[dict] = []
    current: Optional[dict] = None
    for line in content.splitlines():
        m = _SECTION_RE.match(line)
        if m:
            if current is not None:
                sections.append(current)
            current = {"num": int(m.group(1)), "title": m.group(2), "lines": []}
            continue
        if current is not None:
            current["lines"].append(line)
    if current is not None:
        sections.append(current)
    return sections


# ── Document assembler ────────────────────────────────────────────────────

def build_html(config: dict, content_md: str) -> str:
    sections = parse_sections(content_md)
    if not sections:
        raise SystemExit("No `# Section N · Title` headers found in content.")

    # Cover page
    topic_en = config.get("topic_en", "")
    topic_fr_short = config.get("topic_fr_short", topic_en)
    module_num = str(config.get("module_num", "01")).zfill(2)
    title_en = config.get("title_en", "")
    title_fr = config.get("title_fr", "")
    subtitle_fr = config.get("subtitle_fr", "")
    cfa_level = config.get("cfa_level", "1")

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

    # TOC (the topic-name span sets the running header for body pages)
    toc_items = "".join(
        f'<li><a href="#sec{s["num"]}">'
        f'<span class="num">{str(s["num"]).zfill(2)}</span>'
        f'<span class="label">{escape(s["title"])}</span>'
        f'</a></li>'
        for s in sections
    )
    toc = (
        f'<div class="toc-page">'
        f'<span class="topic-name">{escape(topic_fr_short)}</span>'
        f'<div class="toc-title">Sommaire</div>'
        f'<div class="toc-subtitle">Navigation interactive</div>'
        f'<ul class="toc-list">{toc_items}</ul>'
        f'</div>'
    )

    # Body sections
    body_chunks: list[str] = []
    for s in sections:
        section_html = (
            f'<h1 class="section" id="sec{s["num"]}">'
            f'<span class="num">Section {str(s["num"]).zfill(2)}</span>'
            f'{escape(s["title"])}</h1>'
            f'<div class="underline"></div>'
            f'{parse_blocks(s["lines"])}'
        )
        body_chunks.append(section_html)
    body = "\n".join(body_chunks)

    return (
        f'<!DOCTYPE html><html lang="fr"><head>'
        f'<meta charset="utf-8"><title>{escape(title_fr or title_en)}</title>'
        f'</head><body>'
        f'{cover}{toc}{body}'
        f'</body></html>'
    )


def write_pdf(html: str, css_path: Path, output_path: Path) -> None:
    from weasyprint import CSS, HTML
    HTML(string=html, base_url=str(SCRIPT_DIR)).write_pdf(
        str(output_path),
        stylesheets=[CSS(filename=str(css_path))],
    )


# ── CLI ───────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("module_dir", help="Directory holding course_config.json + course_content.md")
    parser.add_argument("--config", default="course_config.json", help="Config filename inside module_dir")
    parser.add_argument("--content", default="course_content.md", help="Content filename inside module_dir")
    parser.add_argument("--output", default=None, help="Output PDF path (default: <module_dir>/<output_filename from config>)")
    parser.add_argument("--css", default=str(SCRIPT_DIR / CSS_FILENAME), help="Path to wingman_light.css")
    args = parser.parse_args()

    module_dir = Path(args.module_dir).resolve()
    config_path = module_dir / args.config
    content_path = module_dir / args.content
    css_path = Path(args.css)

    if not config_path.exists():
        print(f"[ERREUR] {config_path} introuvable", file=sys.stderr)
        return 1
    if not content_path.exists():
        print(f"[ERREUR] {content_path} introuvable", file=sys.stderr)
        return 1
    if not css_path.exists():
        print(f"[ERREUR] CSS {css_path} introuvable", file=sys.stderr)
        return 1

    config = json.loads(config_path.read_text(encoding="utf-8"))
    content_md = content_path.read_text(encoding="utf-8")

    output_path = (Path(args.output).resolve()
                   if args.output
                   else module_dir / config.get("output_filename", "course.pdf"))

    print(f"Reading {content_path}")
    print(f"Building HTML ({len(content_md):,} chars source)")
    html = build_html(config, content_md)
    print(f"HTML built ({len(html):,} chars), rendering with WeasyPrint...")
    write_pdf(html, css_path, output_path)
    print(f"PDF written: {output_path}")

    # Quick QC
    try:
        from pypdf import PdfReader
        r = PdfReader(str(output_path))
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
