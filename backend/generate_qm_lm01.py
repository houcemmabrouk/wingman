"""
Generate all 16 content assets for QM-LM01 (Rates and Returns) using Claude API.
Run: python generate_qm_lm01.py
"""

import os
import json
import time
from pathlib import Path
from anthropic import Anthropic

client = Anthropic()
MODEL = "claude-sonnet-4-20250514"
OUTPUT_DIR = Path(__file__).parent / "generated_content" / "QM" / "LM01"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Module context
MODULE = {
    "topic": "Quantitative Methods",
    "code": "QM-LM01",
    "title": "Rates and Returns",
    "los_count": 6,
    "exam_weight": "8-12%",
    "volume": 1,
    "learning_outcomes": [
        "a. interpret interest rates as required rates of return, discount rates, or opportunity costs and explain an interest rate as the sum of a real risk-free rate and premiums that compensate investors for bearing distinct types of risk",
        "b. calculate and interpret different approaches to return measurement over time and describe their appropriate uses",
        "c. compare the money-weighted and time-weighted rates of return and evaluate the performance of portfolios based on these measures",
        "d. calculate and interpret annualized return measures and continuously compounded returns",
        "e. calculate and interpret major return measures and describe their appropriate uses",
        "f. compare the money-weighted and time-weighted rates of return and evaluate the performance of portfolios based on these measures",
    ],
}

# Load actual curriculum text
CURRICULUM_PATH = OUTPUT_DIR / "source_curriculum.txt"
CURRICULUM_TEXT = ""
if CURRICULUM_PATH.exists():
    CURRICULUM_TEXT = CURRICULUM_PATH.read_text(encoding="utf-8")
    # Truncate to ~60K chars to fit in context window
    if len(CURRICULUM_TEXT) > 60000:
        CURRICULUM_TEXT = CURRICULUM_TEXT[:60000] + "\n\n[... curriculum text truncated for context limits ...]"
    print(f"Loaded curriculum source: {len(CURRICULUM_TEXT)} chars")

SYSTEM_PROMPT = """You are a CFA Level I curriculum expert and educational content designer.
You produce study materials that are:
- Precise, exam-focused, and technically accurate
- Aligned with the CFA Institute curriculum
- Formatted in clean Markdown with proper headings, tables, formulas, and bullet points
- Dense but readable — every sentence adds value
- Written for a serious candidate preparing for the CFA Level I exam

Module context:
- Topic: {topic}
- Module: {code} — {title}
- Learning Outcomes: {los_count}
- Exam Weight: {exam_weight}

Learning Outcomes:
{los}

IMPORTANT: You have access to the actual CFA Institute curriculum text for this module below.
Base ALL your content on this source material. Use the exact terminology, formulas, examples,
and concepts from the curriculum. Do not invent content — extract, reorganize, and present
the curriculum content in the requested format.

=== CURRICULUM SOURCE TEXT ===
{curriculum}
=== END CURRICULUM SOURCE TEXT ===
""".format(
    **MODULE,
    los="\n".join(f"  {lo}" for lo in MODULE["learning_outcomes"]),
    curriculum=CURRICULUM_TEXT,
)


ASSETS = [
    {
        "filename": "01_summary_notes.md",
        "title": "Summary Notes",
        "prompt": """Generate comprehensive Summary Notes for this CFA L1 module.

Structure:
1. **Module Overview** — What this module covers and why it matters for the exam
2. **Key Concepts** — Each major concept explained clearly with definitions
3. **Interest Rate Components** — Real risk-free rate, inflation premium, default risk premium, liquidity premium, maturity premium
4. **Return Measures** — Holding period return, arithmetic mean, geometric mean, harmonic mean, money-weighted return, time-weighted return
5. **Annualized Returns** — How to annualize returns for different periods, continuously compounded returns
6. **Key Formulas** — All formulas with variable definitions in a clear format
7. **Practical Examples** — At least 2 worked numerical examples
8. **Exam Tips** — What to watch for on the actual exam

Be thorough. This is the primary study document for this module. 1500-2000 words.""",
    },
    {
        "filename": "02_synthesis.md",
        "title": "Synthesis",
        "prompt": """Generate a Synthesis document for this module. This is a high-level conceptual overview that connects all the ideas.

Structure:
1. **The Big Picture** — How rates and returns fit into the broader CFA curriculum
2. **Concept Map** — How each concept relates to others (describe relationships)
3. **From Simple to Complex** — Build understanding layer by layer: simple interest → compound interest → different return measures → annualization
4. **Cross-Topic Links** — How this module connects to Fixed Income (yields), Equity (required returns), Portfolio Management (performance evaluation)
5. **Mental Models** — Frameworks for thinking about these concepts during the exam
6. **One-Page Summary** — A ultra-condensed version of the entire module

800-1200 words. Focus on understanding, not memorization.""",
    },
    {
        "filename": "03_los_sheet.md",
        "title": "LOS Sheet",
        "prompt": """Generate a LOS (Learning Outcome Statements) Sheet.

For EACH of the 6 LOS in this module, provide:
- **LOS Code & Statement** — The full LOS text
- **Command Word** — (calculate, interpret, compare, describe, explain) and what it means for the exam
- **Key Knowledge** — What you must know to satisfy this LOS (3-5 bullet points)
- **Likely Question Format** — How this LOS typically appears on the exam (multiple choice format)
- **Difficulty** — Low / Medium / High
- **Study Priority** — How much time to spend relative to other LOS

Format as a structured reference sheet. This should be a candidate's checklist.""",
    },
    {
        "filename": "04_exam_traps.md",
        "title": "Exam Traps",
        "prompt": """Generate an Exam Traps document identifying the most common mistakes candidates make on this topic.

For each trap (at least 8 traps):
- **Trap Name** — Short descriptive name
- **The Mistake** — What candidates do wrong
- **Why It Happens** — The cognitive error or misunderstanding
- **The Correct Approach** — How to avoid it
- **Example** — A mini-question that tests this trap

Cover traps for:
- Confusing arithmetic vs geometric mean
- Money-weighted vs time-weighted returns
- Annualization errors
- Continuously compounded vs discrete returns
- Interest rate component decomposition
- Gross vs net returns
- Pre-tax vs after-tax returns
- Real vs nominal returns""",
    },
    {
        "filename": "05_concept_on_concept.md",
        "title": "Concept on Concept",
        "prompt": """Generate a Concept-on-Concept analysis document.

This document layers concepts on top of each other, showing how understanding one concept is required to understand the next.

Structure as a dependency chain:
1. **Layer 1: Time Value of Money basics** → needed for...
2. **Layer 2: Simple vs Compound Interest** → needed for...
3. **Layer 3: Holding Period Return** → needed for...
4. **Layer 4: Arithmetic vs Geometric Mean** → needed for...
5. **Layer 5: Money-Weighted vs Time-Weighted Returns** → needed for...
6. **Layer 6: Annualization and Continuous Compounding** → builds on all above

For each layer:
- Prerequisites (what you must already know)
- Core concept explained
- How it builds on previous layers
- What it enables understanding of next
- Quick check question to test understanding""",
    },
    {
        "filename": "06_decision_tree.md",
        "title": "Decision Tree Sheet",
        "prompt": """Generate a Decision Tree Sheet for exam problem-solving.

Create decision trees (in text format with clear indentation/arrows) for:

1. **"Which return measure to use?"**
   - Given portfolio with external cash flows → Money-weighted
   - Given portfolio without cash flows → Time-weighted or HPR
   - Comparing fund managers → Time-weighted
   - Evaluating individual investor → Money-weighted
   etc.

2. **"Which average to use?"**
   - Forecasting single-period returns → Arithmetic mean
   - Compounded multi-period returns → Geometric mean
   - Dollar-cost averaging → Harmonic mean
   etc.

3. **"How to annualize?"**
   - Discrete compounding from monthly → (1+r_m)^12 - 1
   - Continuous compounding → e^(r×t) - 1
   etc.

4. **"Interest rate decomposition"**
   - Identify each component given a scenario

Make each tree clear enough to use during timed practice.""",
    },
    {
        "filename": "07_essential_sheet.md",
        "title": "Essential Sheet",
        "prompt": """Generate a one-page Essential Sheet — the absolute minimum you need to know walking into the exam.

Format: Ultra-dense, bullet points and formulas only. No explanations.

Sections:
- **Must-Know Formulas** (all formulas with variable names)
- **Key Definitions** (one-line each)
- **Critical Distinctions** (arithmetic vs geometric, MWR vs TWR, real vs nominal, gross vs net)
- **Quick Decision Rules** (when to use what)
- **Numbers to Remember** (any specific values or thresholds)

This should fit on one printed page. Maximum density, minimum words.""",
    },
    {
        "filename": "08_formula_sheet.md",
        "title": "Formula Sheet",
        "prompt": """Generate a complete Formula Sheet for this module.

For EACH formula:
- **Formula Name**
- **Formula** (using clear mathematical notation in LaTeX-style: use $ for inline math)
- **Variable Definitions** — Every variable defined
- **When to Use** — One sentence
- **Units / Output** — What the result represents
- **Calculator Keystrokes** — If applicable (BA II Plus)

Include ALL formulas:
- Holding Period Return (HPR)
- Arithmetic Mean Return
- Geometric Mean Return
- Harmonic Mean Return
- Money-Weighted Return (IRR)
- Time-Weighted Return
- Annualized Return
- Continuously Compounded Return
- Real Rate of Return (Fisher relation)
- Gross vs Net Return
- Pre-tax vs After-tax Return
- Interest Rate = Real risk-free + premiums""",
    },
    {
        "filename": "09_reading_summary.md",
        "title": "Reading Summary",
        "prompt": """Generate a Reading Summary — a structured walkthrough of the module as if summarizing the CFA Institute textbook reading.

Structure:
- **Introduction** — What the reading covers
- **Section-by-Section Summary** — Go through each major section of the reading in order
- **Key Exhibits/Tables** — Describe any important tables or exhibits from the curriculum
- **End-of-Chapter Takeaways** — Main points
- **Practice Problem Themes** — What types of problems appear in the curriculum's practice questions

Write as if the candidate has read the material once and needs a recap. 1000-1500 words.""",
    },
    {
        "filename": "10_tds_sheet.md",
        "title": "TDS Sheet",
        "prompt": """Generate a TDS (Tables, Diagrams, Summaries) Sheet.

Create text-based tables and structured summaries:

1. **Comparison Table: Return Measures**
   | Measure | Formula | When to Use | Advantages | Limitations |

2. **Comparison Table: Arithmetic vs Geometric Mean**
   | Feature | Arithmetic | Geometric |

3. **Comparison Table: MWR vs TWR**
   | Feature | Money-Weighted | Time-Weighted |

4. **Interest Rate Components Table**
   | Component | Description | Example Range |

5. **Annualization Methods Table**
   | Starting Period | To Annual | Formula |

6. **Summary Diagram: Return Calculation Flowchart** (text-based)

Make tables in proper Markdown format, dense and reference-ready.""",
    },
    {
        "filename": "11_blank_recall.md",
        "title": "Blank Recall Sheet",
        "prompt": """Generate a Blank Recall Sheet — an active recall exercise where key information is blanked out.

Format: Statements with _____ blanks that the candidate must fill in from memory.

Sections:
1. **Fill-in-the-Formula** (8-10 formulas with blanks)
   Example: "Geometric Mean Return = [___]^(1/T) - 1"

2. **Complete the Definition** (8-10 definitions with blanks)
   Example: "The money-weighted return is equivalent to the _____ of the portfolio's cash flows."

3. **True or False** (8-10 statements)
   Example: "The geometric mean is always greater than or equal to the arithmetic mean. T/F: _____"

4. **Match the Concept** (left column: concept, right column: scrambled definitions)

5. **Quick Calculations** (5 problems with space for answers)

Include an ANSWER KEY at the end.""",
    },
    {
        "filename": "12_flashcards.json",
        "title": "Flashcards",
        "prompt": """Generate 25 high-quality flashcards for spaced repetition study.

Output as a JSON array. Each flashcard:
{
  "id": 1,
  "front": "question or prompt",
  "back": "answer",
  "difficulty": "easy|medium|hard",
  "los": "a|b|c|d|e|f",
  "tags": ["formula", "definition", "concept", "calculation"]
}

Cover:
- 5 definition cards (key terms)
- 5 formula cards (state the formula)
- 5 concept cards (explain the concept)
- 5 comparison cards (distinguish between two things)
- 5 calculation cards (solve a mini problem)

Output ONLY valid JSON, no markdown code blocks, no explanations before or after.""",
    },
    {
        "filename": "13_mock_pack.md",
        "title": "Mock Pack",
        "prompt": """Generate a Mock Exam Pack with 15 multiple-choice questions in CFA exam format.

Each question must have:
- **Question stem** (scenario + question)
- **Three answer choices** (A, B, C)
- **Correct Answer**
- **Detailed Explanation** — Why the correct answer is right AND why each wrong answer is wrong
- **LOS Reference** — Which LOS this tests

Distribution:
- 3 questions on interest rate components
- 3 questions on HPR and basic return calculations
- 3 questions on arithmetic vs geometric mean
- 3 questions on MWR vs TWR
- 3 questions on annualization and continuous compounding

Make questions realistic exam difficulty — not too easy, not trick questions.""",
    },
    {
        "filename": "14_audio_script.md",
        "title": "Audio Script",
        "prompt": """Generate an audio lecture script (for text-to-speech conversion) covering this entire module.

Structure:
- **Opening** (30 sec) — Module overview, what we'll cover
- **Section 1** (3 min) — Interest rates: components and interpretation
- **Section 2** (3 min) — Basic return measures: HPR, arithmetic mean, geometric mean
- **Section 3** (3 min) — MWR vs TWR: when to use each
- **Section 4** (2 min) — Annualization and continuous compounding
- **Section 5** (2 min) — Gross/net, real/nominal, pre/after-tax returns
- **Closing** (1 min) — Key takeaways, exam tips

Write in a clear, conversational teaching voice. Use "you" and "we".
Include pauses marked as [pause]. Spell out formulas verbally.
~2000 words total for a 12-15 minute audio.""",
    },
    {
        "filename": "15_knowledge_audit.md",
        "title": "Knowledge Audit",
        "prompt": """Generate a Knowledge Audit — a self-assessment tool to identify gaps.

Structure:
For each of the 6 LOS, create:

### LOS [letter]: [statement]
**Self-Assessment Checklist:**
- [ ] I can define [concept] without looking at notes
- [ ] I can calculate [formula] from memory
- [ ] I can explain the difference between [A] and [B]
- [ ] I can solve a problem involving [scenario]
- [ ] I can identify when to use [method A] vs [method B]

**Quick Test** (1-2 questions per LOS to verify understanding)
**Score Guide:**
- All boxes checked + correct answers = Mastered
- 3-4 boxes + mostly correct = Review needed
- <3 boxes = Priority study area

**Gap Analysis Template:**
| LOS | Self-Rating (1-5) | Confidence | Action Needed |

End with a **Study Priority Matrix** based on audit results.""",
    },
    {
        "filename": "16_weakness_pool.md",
        "title": "Weakness Pool",
        "prompt": """Generate a Weakness Pool — targeted practice for the hardest aspects of this module.

This is for candidates who already studied the basics and need to drill their weak points.

**Section 1: Tricky Calculations (5 problems)**
Problems that require careful attention — easy to make arithmetic errors.
Include full solutions.

**Section 2: Conceptual Nuances (5 questions)**
Questions testing subtle distinctions that candidates often miss.
Example: "An investor earned 10% in Year 1 and lost 10% in Year 2. Is the arithmetic mean return 0%? Is the geometric mean 0%? Explain."

**Section 3: Edge Cases (5 scenarios)**
Unusual situations that test deep understanding.
Example: "What happens to MWR vs TWR when a large deposit is made just before a period of poor returns?"

**Section 4: Speed Drill (10 rapid-fire questions)**
Quick questions to test under time pressure. Give 30 seconds per question.
Include answer key.

**Section 5: Common Error Analysis**
Show 3 "student solutions" with errors — candidate must find and correct the mistake.""",
    },
]


def generate_asset(asset: dict) -> str:
    """Call Claude API to generate one asset."""
    print(f"  Generating: {asset['title']}...")
    start = time.time()

    is_json = asset["filename"].endswith(".json")

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": asset["prompt"]}],
    )

    content = response.content[0].text
    elapsed = time.time() - start
    tokens_in = response.usage.input_tokens
    tokens_out = response.usage.output_tokens
    print(f"    Done in {elapsed:.1f}s ({tokens_in}+{tokens_out} tokens)")

    return content


def main():
    print(f"=" * 60)
    print(f"WINGMAN CONTENT GENERATOR")
    print(f"Module: {MODULE['code']} — {MODULE['title']}")
    print(f"Assets to generate: {len(ASSETS)}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"=" * 60)

    results = []
    total_start = time.time()

    for i, asset in enumerate(ASSETS, 1):
        print(f"\n[{i}/{len(ASSETS)}] {asset['title']}")
        try:
            content = generate_asset(asset)
            filepath = OUTPUT_DIR / asset["filename"]
            filepath.write_text(content, encoding="utf-8")
            size_kb = filepath.stat().st_size / 1024
            results.append({
                "title": asset["title"],
                "filename": asset["filename"],
                "size_kb": round(size_kb, 1),
                "status": "success",
            })
            print(f"    Saved: {filepath.name} ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"    ERROR: {e}")
            results.append({
                "title": asset["title"],
                "filename": asset["filename"],
                "status": "error",
                "error": str(e),
            })

    total_elapsed = time.time() - total_start

    # Save manifest
    manifest = {
        "module": MODULE,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_time_sec": round(total_elapsed, 1),
        "assets": results,
    }
    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"\n{'=' * 60}")
    print(f"GENERATION COMPLETE")
    print(f"Time: {total_elapsed:.1f}s")
    success = sum(1 for r in results if r["status"] == "success")
    print(f"Success: {success}/{len(ASSETS)}")
    total_kb = sum(r.get("size_kb", 0) for r in results)
    print(f"Total size: {total_kb:.1f} KB")
    print(f"Manifest: {manifest_path}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
