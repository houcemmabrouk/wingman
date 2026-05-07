---
name: wingman-course-pdf
description: "Convert a Wingman CFA Edge TTS audio script (Markdown with [pause Xs] markers) into an interactive print-friendly bilingual study PDF using the Wingman light-theme design system. Use this skill whenever the user uploads a 00_full_course.md (or any Markdown CFA Level 1 audio script) and asks to convert it to a PDF, or mentions building/generating a Wingman course PDF, an LM PDF, or 'pareil' / 'fais comme avant' after having seen previous Wingman course PDFs. Triggers also on phrases like 'genere le pdf', 'fais le pdf de ce cours', 'convertis ce module en pdf', 'pareil que le précédent module'. Produces a bilingual title page, single-page interactive TOC, structured pedagogical sections (formulas index, scenarios, exam pitfalls, recap, flashcards, MCQs), with strict no-block-cuts rules and consistent Wingman branding (#4361ee blue + #06b6a4 teal accents, white background, Inter typography). Output naming convention: {TOPIC}-LM{NN}_{Titre_FR_avec_underscores}_CFA_L1.pdf"
---

# Wingman Course PDF Generator

Converts a Wingman CFA Level 1 **Edge TTS audio script** (Markdown narrative with `[pause Xs]` markers) into an **interactive bilingual study PDF** following the Wingman design system.

## When to trigger this skill

Whenever any of these conditions are met:

- User uploads a file named `00_full_course.md` (the canonical Wingman audio script output)
- User uploads any Markdown file containing CFA Level 1 course narrative with `[pause Xs]` markers
- User says "génère le PDF", "fais le PDF de ce cours", "convertis ce module en PDF", "pareil que le module précédent", "même chose"
- User mentions generating a "Wingman course PDF", "LM XX PDF", "fiche cours CFA"
- Continuing a sequence where previous turns built CFA module PDFs the same way

## What this skill produces

A single PDF in `/mnt/user-data/outputs/` with the strict naming convention:

```
{TOPIC}-LM{NN}_{Titre_FR_avec_underscores}_CFA_L1.pdf
```

Topic codes: **FSA** (Financial Statement Analysis), **PM** (Portfolio Management), **QM** (Quantitative Methods), **FI** (Fixed Income), **EQ** (Equity), **ECON** (Economics), **ETH** (Ethics), **CI** (Corporate Issuers), **DER** (Derivatives), **AI** (Alternative Investments).

Example: `FSA-LM04_Analyse_Tableau_Flux_Tresorerie_CFA_L1.pdf`

## High-level workflow

```
1. Read uploaded /mnt/user-data/uploads/00_full_course.md (verify MD5 vs cache if relevant)
2. Identify topic + LM number + EN title from content (or ask user)
3. Map narrative content to Wingman pedagogical structure (see references/pedagogical_structure.md)
4. Build Python script using the canonical builder template
5. Render PDF with WeasyPrint
6. QC visually via pdf2image grids (6 pages per grid)
7. Call present_files with the final PDF path
```

## Step 1 — Read the source file

```bash
md5sum /mnt/user-data/uploads/00_full_course.md
wc -l /mnt/user-data/uploads/00_full_course.md
head -10 /mnt/user-data/uploads/00_full_course.md
```

The file is always named `00_full_course.md` because the Wingman backend writes always to the same path. **Always verify the MD5** to detect cache vs new content.

The first line typically starts with "Dans ce module, tu vas apprendre à..." which lists the learning objectives — use it to identify the module.

## Step 2 — Identify metadata

From the content, identify:

- **Topic** (FSA, PM, QM, FI, EQ, ECON, ETH, CI, DER, AI)
- **LM number** (LM01, LM02, ...)
- **EN title** (official CFA Institute curriculum title)
- **FR title** (Wingman French translation)

If unclear, ask the user with `ask_user_input_v0`. If the user has been working on a sequence (e.g., "the next FSA module"), infer from context.

## Step 3 — Map narrative to pedagogical structure

The audio script's narrative content must be reorganized into the **Wingman pedagogical structure** (see `references/pedagogical_structure.md`). The standard sections are:

1. Objectives and stakes
2. ... N theory sections (with formulas, callouts, key-grids, compare-grids)
3. **Index of key formulas** (F1, F2, ... numbered)
4. Practical scenarios (2-4 cases)
5. Classic exam pitfalls (6-12 warning callouts)
6. Recap (success callout, 7-10 numbered ideas)
7. Solved practice cases (2-5 MCQs with detailed calculations)
8. Memorization (2-5 lists to recite)
9. Flashcards (9-12 Q/R pairs)
10. Exam-type MCQs (3-5 questions)
11. Self-evaluation (2-5 questions)
12. Targeted pitfalls (2-5 questions on subtle errors)
13. End-of-module callout success

**Ignore the `[pause Xs]` markers** — they're for TTS audio synthesis only.

## Step 4 — Build the PDF

Use the canonical builder template at `scripts/builder_template.py` as the starting point.

The full Wingman CSS design system is in `assets/wingman_design.css` — load it as the stylesheet for WeasyPrint.

The HTML structure follows strict patterns documented in `references/html_components.md` (formulas, callouts, key-grids, compare-grids, flashcards, MCQs, scenarios, cascade visualizer).

```bash
python3 build_lm{NN}_{topic}.py
```

Output goes to `/mnt/user-data/outputs/{TOPIC}-LM{NN}_*.pdf`.

## Step 5 — QC the result

Always verify:

```python
from pypdf import PdfReader
from pdf2image import convert_from_path
from PIL import Image

r = PdfReader(PDF_PATH)
print(f"Pages: {len(r.pages)}")  # typically 22-32

def walk(items, d=0):
    out = []
    for item in items:
        if isinstance(item, list):
            out.extend(walk(item, d+1))
        else:
            out.append(("  "*d) + item.title)
    return out
print(f"Bookmarks: {len(walk(r.outline))}")  # typically 30-46

# Render 6-page grids for visual inspection
imgs = convert_from_path(PDF_PATH, dpi=70)
# ... (see scripts/qc_grids.py)
```

Then **inspect visually** with the `view` tool on each grid. Check:

- Title page is bilingual (EN + FR with accent bar)
- TOC fits on a single page
- No box is cut between pages
- All formula boxes are intact
- All MCQ blocks are intact
- Cascade viz (if present) is properly rendered

## Step 6 — Present the file

```python
# Use the present_files tool with the absolute PDF path
present_files(filepaths=["/mnt/user-data/outputs/{TOPIC}-LM{NN}_*.pdf"])
```

Then write a concise summary listing pages, bookmarks count, and a section-by-section table.

## Reference files

For details, consult:

- **`references/pedagogical_structure.md`** — The 13-section pattern with examples of how to map narrative content to each section
- **`references/html_components.md`** — Full HTML syntax for each Wingman component (formula, callout, qcm, flashcard, scenario, key-grid, compare-grid, cascade)
- **`references/css_rules.md`** — Non-negotiable CSS rules (no-cut classes, page-breaks, single-page TOC enforcement)
- **`references/topic_codes.md`** — Topic codes mapping and naming convention
- **`assets/wingman_design.css`** — The complete Wingman light-theme stylesheet (copy-paste into the builder)
- **`scripts/builder_template.py`** — Canonical Python builder skeleton
- **`scripts/qc_grids.py`** — Standard QC verification script

## Critical rules — do NOT violate

1. **Always preserve the bilingual title page** (EN title 26pt + accent bar + FR title 17pt italic)
2. **TOC must fit on a single page** — if it overflows, reduce `padding` on `.toc-list li` to 6px and `font-size` to 10pt
3. **All structural blocks must have `page-break-inside: avoid`** — formula, callout, qcm, flashcard, scenario, key-row, compare-grid, cascade
4. **Naming convention is non-negotiable**: `{TOPIC}-LM{NN}_{Titre_FR}_CFA_L1.pdf`
5. **White background** (`#ffffff`) for print/e-reader friendliness — never dark theme
6. **Inter font for body**, **Cambria Math for formulas**
7. **Accent colors**: `#4361ee` (blue) + `#06b6a4` (teal) — never alter the palette
8. **One quote per audio script**: ignore `[pause Xs]` markers and audio-specific phrasing like "essaie de citer", "[pause 30s] Voici la liste" — but preserve the pedagogical content of these sections (memorization lists, flashcards)

## User communication style

The user (Houcem) prefers:

- **French** responses, sometimes in UPPERCASE
- **Direct, complete answers** — no placeholders, no "real implementation goes here"
- **Concise summaries** after each PDF generation (page count, bookmarks, structure table)
- **No excessive emojis**
- **No reformulation of obvious requests** — when a `.md` is uploaded with "pareil" or "même chose", just build the PDF
