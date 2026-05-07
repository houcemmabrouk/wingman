"""Extract Learning Outcome Statements from the 10 CFA L1 curriculum PDFs.

Outputs /tmp/cfa_los_extracted.json with one entry per LO:
  { topic_code, module_code, module_title, lo_letter, lo_text, bloom_verb }
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

PDF_DIR = Path("C:/Users/houce.000/Documents/Audiobooks")

# Volume number -> (topic_code, expected module count)
VOLUMES = [
    (1,  "QM",   "2025 CFA Program Curriculum Level I-Vol 1. Quantitative Methods 2024.pdf"),
    (2,  "ECO",  "2025 CFA Program Curriculum Level I-Vol 2. Economics 2024.pdf"),
    (3,  "CORP", "2025 CFA Program Curriculum Level I-Vol 3. Corporate Issuers 2024.pdf"),
    (4,  "FSA",  "2025 CFA Program Curriculum Level I-Vol 4. Financial Statement Analysis 2024.pdf"),
    (5,  "EQU",  "2025 CFA Program Curriculum Level I-Vol 5. Equity Investments 2024.pdf"),
    (6,  "FI",   "2025 CFA Program Curriculum Level I-Vol 6. Fixed Income 2024.pdf"),
    (7,  "DER",  "2025 CFA Program Curriculum Level I-Vol 7. Derivatives 2024.pdf"),
    (8,  "ALT",  "2025 CFA Program Curriculum Level I-Vol 8. Alternative Investments 2024.pdf"),
    (9,  "PM",   "2025 CFA Program Curriculum Level I-Vol 9. Portfolio Management 2024.pdf"),
    (10, "ETH",  "2025 CFA Program Curriculum Level I-Vol 10. Ethical & Professional Standards 2024.pdf"),
]

# CFA Bloom command words. Each LO begins with one of these (lowercase, at line start).
# Source: CFA Institute "LOS Command Words" reference doc.
BLOOM_VERBS = sorted({
    "analyze", "apply", "appraise", "assess",
    "calculate", "categorize", "characterize", "classify", "compare", "compute",
    "construct", "contrast", "convert", "criticize", "critique",
    "define", "demonstrate", "derive", "describe", "design", "determine",
    "develop", "diagram", "differentiate", "discuss", "distinguish",
    "estimate", "evaluate", "examine", "explain",
    "forecast", "formulate",
    "generate",
    "identify", "illustrate", "indicate", "infer", "interpret",
    "judge", "justify",
    "list",
    "match", "measure",
    "name",
    "outline",
    "predict", "prepare", "present", "prove",
    "recall", "recognize", "recommend", "reconcile", "relate", "report", "represent", "review",
    "select", "show", "solve", "specify", "state", "structure", "summarize", "synthesize",
    "translate",
    "validate", "verify",
    "weigh",
}, key=lambda v: -len(v))  # longest first to avoid prefix collisions

VERB_REGEX = re.compile(
    r"^\s*(?P<verb>" + "|".join(BLOOM_VERBS) + r")\b",
    re.IGNORECASE | re.MULTILINE,
)

# Stop markers that signal end of LO block
STOP_MARKERS = re.compile(
    r"\b(INTRODUCTION|SUMMARY|REFERENCES|EXAMPLE\s+\d|EXERCISES|PRACTICE\s+PROBLEMS)\b",
    re.IGNORECASE,
)


def find_lo_sections(reader: PdfReader) -> list[tuple[int, str]]:
    """Return list of (page_idx, raw_text) for every LEARNING OUTCOMES block.

    Skips the front-matter mention by requiring the phrase
    'The candidate should be able to' on the same or next page.
    """
    sections: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if not re.search(r"LEARNING\s+OUTCOMES?\b", text, re.IGNORECASE):
            continue
        # Capture this page + next page (LOs sometimes spill over)
        combined = text
        if i + 1 < len(reader.pages):
            combined += "\n" + (reader.pages[i + 1].extract_text() or "")
        if "candidate should be able to" not in combined.lower():
            continue
        sections.append((i, combined))
    return sections


def _split_lo_block(block_text: str) -> list[str]:
    """Split a block of concatenated LOs into individual statements.

    Each LO begins with a Bloom verb at the start of a line. Continuation
    lines are joined into the previous LO.
    """
    lines = [ln.rstrip() for ln in block_text.splitlines()]
    los: list[str] = []
    current: list[str] = []
    for ln in lines:
        if not ln.strip():
            continue
        if VERB_REGEX.match(ln):
            if current:
                los.append(" ".join(current).strip())
            current = [ln.strip()]
        else:
            if current:
                current.append(ln.strip())
            # else: line before any verb — drop (header noise)
    if current:
        los.append(" ".join(current).strip())
    # Cleanup: drop entries that are too short (likely garbage)
    return [lo for lo in los if len(lo) >= 30]


def extract_los_from_section(combined_text: str) -> tuple[str, list[str]]:
    """From one LEARNING OUTCOMES section, return (module_title, [lo_texts])."""
    # Module title is usually 1-2 lines above 'LEARNING OUTCOMES'
    lo_match = re.search(r"LEARNING\s+OUTCOMES?\b", combined_text, re.IGNORECASE)
    if not lo_match:
        return "", []

    # Title: grab the last non-empty meaningful line before LEARNING OUTCOMES
    head = combined_text[:lo_match.start()]
    head_lines = [ln.strip() for ln in head.splitlines() if ln.strip()]
    title = ""
    # Walk backwards skipping author/affiliation noise
    for ln in reversed(head_lines):
        # Skip author bylines & affiliations
        if any(x in ln for x in ("PhD", "CFA,", "USA)", "University", "Institute", "by ")):
            continue
        # Skip "LEARNING MODULE" header & lone numbers
        if re.match(r"^(LEARNING\s+MODULE|MODULE|\d+|by\b)$", ln, re.IGNORECASE):
            continue
        title = ln
        break
    title = title.strip().strip(".")

    # Body: from after 'The candidate should be able to:' up to the first stop marker
    body = combined_text[lo_match.end():]
    intro = re.search(r"candidate\s+should\s+be\s+able\s+to[:\.]", body, re.IGNORECASE)
    if intro:
        body = body[intro.end():]
    stop = STOP_MARKERS.search(body)
    if stop:
        body = body[:stop.start()]

    # Drop trailing 'Mastery' tags & footnote markers
    body = re.sub(r"\bMastery\b", "", body)
    los = _split_lo_block(body)
    return title, los


def extract_volume(topic_code: str, pdf_path: Path) -> list[dict]:
    print(f"-- {topic_code}: opening {pdf_path.name}")
    reader = PdfReader(str(pdf_path))
    sections = find_lo_sections(reader)
    print(f"   found {len(sections)} LEARNING OUTCOMES sections")

    out: list[dict] = []
    module_idx = 0
    for page_idx, combined in sections:
        title, los = extract_los_from_section(combined)
        if not los:
            print(f"   WARN: page {page_idx + 1} — no LOs parsed (title='{title[:60]}')")
            continue
        module_idx += 1
        module_code = f"{topic_code}-{module_idx:02d}"
        for letter_idx, lo_text in enumerate(los):
            verb_match = VERB_REGEX.match(lo_text)
            verb = (verb_match.group("verb").lower() if verb_match else "")
            out.append({
                "topic_code": topic_code,
                "module_code": module_code,
                "module_title": title,
                "lo_letter": chr(ord("a") + letter_idx),
                "lo_text": lo_text,
                "bloom_verb": verb,
                "_source_page": page_idx + 1,
            })
        print(f"   {module_code}: {len(los)} LOs — '{title[:60]}'")
    return out


def main():
    all_los: list[dict] = []
    for vol_num, topic_code, filename in VOLUMES:
        pdf_path = PDF_DIR / filename
        if not pdf_path.exists():
            print(f"!! Vol {vol_num} ({topic_code}) NOT FOUND: {pdf_path}")
            continue
        try:
            all_los.extend(extract_volume(topic_code, pdf_path))
        except Exception as e:
            print(f"!! Vol {vol_num} ({topic_code}) EXTRACTION FAILED: {e}")

    out_path = Path("/tmp/cfa_los_extracted.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(all_los, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n=> Wrote {len(all_los)} LOs to {out_path}")

    # Quick coverage report
    by_topic: dict[str, dict] = {}
    for lo in all_los:
        d = by_topic.setdefault(lo["topic_code"], {"modules": set(), "los": 0})
        d["modules"].add(lo["module_code"])
        d["los"] += 1
    print("\nCoverage:")
    for code in ["ETH", "QM", "ECO", "FSA", "CORP", "EQU", "FI", "DER", "ALT", "PM"]:
        if code in by_topic:
            d = by_topic[code]
            print(f"  {code:5} {len(d['modules']):2d} modules · {d['los']:3d} LOs")
        else:
            print(f"  {code:5}  (no data)")


if __name__ == "__main__":
    main()
