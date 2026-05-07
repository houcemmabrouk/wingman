#!/usr/bin/env python3
"""
Bootstrap des `00_manifest.md` par Learning Module.

Lit chaque `manifest.json` existant dans `generated_content/{TOPIC}/{LM_CODE}/`
et écrit un `00_manifest.md` à côté.

- Déterministe, zéro API call, zéro coût.
- Idempotent : skip si `00_manifest.md` existe déjà (sauf --force).
- Le mapping role/audio est dans ROLE_MAP — modifiable une fois pour tous.

Le `00_manifest.md` produit a :
- frontmatter YAML (parsable) : topic, code, title, audio settings, liste des
  assets avec audio:bool + role:str
- body markdown (humain) : notes pédagogiques + tableau des assets

Run:
    python backend/bootstrap_manifests.py
    python backend/bootstrap_manifests.py --force        # écrase
    python backend/bootstrap_manifests.py --dry-run      # affiche sans écrire
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent / "generated_content"
DEFAULT_VOICE = "fr-FR-HenriNeural"
DEFAULT_TARGET_MIN = 90  # cours complet (synthèse + drills + cas pratiques)

# Filename stem (sans extension) → (audio?, role, note)
ROLE_MAP: dict[str, tuple[bool, str, str]] = {
    "01_summary_notes":      (True,  "quick_intro",            "Mise en bouche compacte"),
    "02_synthesis":          (True,  "core_teaching",          "Narration enseignante (cœur du cours)"),
    "03_los_sheet":          (True,  "intro_objectives",       "Annonce des LOS au début"),
    "04_exam_traps":         (True,  "warnings",               "Avertissements ponctuels disséminés"),
    "05_concept_on_concept": (True,  "deep_dive",              "Approfondissement narré avec exemples"),
    "06_decision_tree":      (True,  "scenarios_narrated",     "Convertir en 'Si A alors B…'"),
    "07_essential_sheet":    (True,  "recap_essentials",       "Récap final avant les drills"),
    "08_formula_sheet":      (True,  "formulas_spelled",       "Formules épelées en français"),
    "09_reading_summary":    (False, "redundant_with_synthesis","Doublon avec 02_synthesis — fusionné"),
    "10_tds_sheet":          (True,  "practice_cases_narrated","Cas pratique : énoncé → pause → solution"),
    "11_blank_recall":       (True,  "drill_recall",           "Pause 30s puis révèle la liste"),
    "12_flashcards":         (True,  "drill_flashcards",       "Quiz court : Question / pause 3s / Réponse"),
    "13_mock_pack":          (True,  "drill_mock",             "Format quiz CFA : énoncé / 3 choix / pause / réponse expliquée"),
    "14_audio_script":       (False, "legacy_short_audio",     "Ancien format court — remplacé par 00_full_course"),
    "14_audio_synthesis":    (False, "legacy_short_audio",     "Ancien MP3 court — remplacé par 00_full_course.mp3"),
    "15_knowledge_audit":    (True,  "self_assessment_drill",  "Self-assessment drill (format quiz)"),
    "16_weakness_pool":      (True,  "drill_weakness",         "Drill ciblé sur faiblesses connues"),
    "17_learning_map":       (False, "visual_only",            "SVG/DOT — visuel uniquement, pas en audio"),
}


# ── Helpers ─────────────────────────────────────────────────────────────

def role_for(filename: str) -> tuple[bool, str, str]:
    """Retourne (audio:bool, role:str, note:str) pour un filename."""
    stem = re.sub(r'\.[^.]+$', '', filename)
    return ROLE_MAP.get(stem, (False, "unknown", "À classer manuellement"))


def yaml_str(s: str) -> str:
    """Quote pour YAML si caractères spéciaux."""
    if not s:
        return '""'
    if any(c in s for c in [':', '#', "'", '"', '\n', '[', ']', '{', '}', '&', '*', '!', '|', '>', '%', '@', '`']):
        escaped = s.replace('\\', '\\\\').replace('"', '\\"')
        return f'"{escaped}"'
    if s != s.strip() or re.match(r'^[\s\d-]', s):
        return f'"{s}"'
    return s


def render_manifest(meta: dict) -> str:
    """Génère le contenu du 00_manifest.md à partir d'un manifest.json."""
    module = meta.get("module", {})
    topic = module.get("topic", "?")
    code = module.get("code", "?")
    title = module.get("title", "Untitled")

    lines: list[str] = []

    # ── frontmatter YAML ──────────────────────────────
    lines.append("---")
    lines.append(f"topic: {topic}")
    lines.append(f"code: {code}")
    lines.append(f"title: {yaml_str(title)}")
    lines.append("priority: medium  # critical | high | medium | low — à ajuster manuellement")
    lines.append("")
    lines.append("audio:")
    lines.append(f"  voice: {DEFAULT_VOICE}")
    lines.append(f"  target_min: {DEFAULT_TARGET_MIN}")
    lines.append("  output_md: 00_full_course.md")
    lines.append("  output_mp3: 00_full_course.mp3")
    lines.append("")
    lines.append("assets:")

    for asset in meta.get("assets", []):
        filename = asset.get("filename", "")
        title_a = asset.get("title", "")
        audio, role, note = role_for(filename)
        lines.append(f"  - file: {filename}")
        lines.append(f"    title: {yaml_str(title_a)}")
        lines.append(f"    audio: {str(audio).lower()}")
        lines.append(f"    role: {role}")

    lines.append("")
    lines.append("build:")
    lines.append("  last_run: null")
    lines.append("  status: never")
    lines.append("  word_count: null")
    lines.append("  duration_sec: null")
    lines.append("  cost_usd: null")
    lines.append("---")
    lines.append("")

    # ── body markdown (humain) ────────────────────────
    lines.append(f"# {code} — {title}")
    lines.append("")
    lines.append("## Notes pédagogiques")
    lines.append("")
    lines.append("> _À compléter manuellement : ton souhaité, analogies, particularités du module._")
    lines.append("")
    lines.append("## Particularités audio")
    lines.append("")
    lines.append("> _Conventions de lecture spécifiques à ce LM (acronymes, prononciations, longueurs de pauses, exemples chiffrés à privilégier)._")
    lines.append("")
    lines.append("## Vue humaine des assets")
    lines.append("")
    lines.append("| # | Fichier | Audio | Rôle | Note |")
    lines.append("|---|---------|:-----:|------|------|")

    for asset in meta.get("assets", []):
        filename = asset.get("filename", "")
        audio, role, note = role_for(filename)
        m = re.match(r'^(\d+)_', filename)
        num = m.group(1) if m else "—"
        check = "✅" if audio else "❌"
        lines.append(f"| {num} | `{filename}` | {check} | `{role}` | {note} |")

    lines.append("")
    return "\n".join(lines) + "\n"


# ── Main ────────────────────────────────────────────────────────────────

def bootstrap_one(lm_dir: Path, force: bool = False) -> bool:
    """Generate 00_manifest.md from manifest.json for a single LM dir.

    Returns True if a file was written, False if skipped (already exists or
    no manifest.json). Raises on parse / write errors so callers can decide
    how to surface them.

    Used both by the standalone CLI (`main()`) and by the generate-all
    pipeline (called automatically before the course-md step so missing
    manifests don't fail the whole run).
    """
    json_path = lm_dir / "manifest.json"
    md_path = lm_dir / "00_manifest.md"
    if not json_path.exists():
        return False
    if md_path.exists() and not force:
        return False
    meta = json.loads(json_path.read_text(encoding="utf-8"))
    content = render_manifest(meta)
    md_path.write_text(content, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="Écrase les 00_manifest.md existants")
    parser.add_argument("--dry-run", action="store_true", help="Affiche sans écrire")
    parser.add_argument("--only", help="Filtre TOPIC ou TOPIC/LM_CODE (ex: ETH ou ETH/LM01)")
    args = parser.parse_args()

    if not ROOT.exists():
        print(f"X {ROOT} introuvable", file=sys.stderr)
        return 1

    only_topic = None
    only_lm = None
    if args.only:
        parts = args.only.split("/")
        only_topic = parts[0]
        only_lm = parts[1] if len(parts) > 1 else None

    written = 0
    skipped = 0
    errors = 0

    for topic_dir in sorted(ROOT.iterdir()):
        if not topic_dir.is_dir():
            continue
        if only_topic and topic_dir.name != only_topic:
            continue

        for lm_dir in sorted(topic_dir.iterdir()):
            if not lm_dir.is_dir():
                continue
            if only_lm and lm_dir.name != only_lm:
                continue

            rel = f"{topic_dir.name}/{lm_dir.name}"
            json_path = lm_dir / "manifest.json"
            md_path = lm_dir / "00_manifest.md"

            if not json_path.exists():
                print(f"!  {rel}: pas de manifest.json")
                continue

            if md_path.exists() and not args.force:
                print(f">  {rel}: 00_manifest.md déjà présent (skip — utiliser --force)")
                skipped += 1
                continue

            try:
                meta = json.loads(json_path.read_text(encoding="utf-8"))
                content = render_manifest(meta)

                if args.dry_run:
                    print(f"=  {rel}: {len(content):,} bytes (dry-run)")
                else:
                    md_path.write_text(content, encoding="utf-8")
                    print(f"+  {rel} -> 00_manifest.md ({len(content):,} bytes)")
                written += 1
            except Exception as e:
                print(f"X  {rel}: {type(e).__name__}: {e}", file=sys.stderr)
                errors += 1

    print()
    print(f"Bilan : {written} {'auraient été créés' if args.dry_run else 'créés'}, "
          f"{skipped} skipped, {errors} erreurs")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
