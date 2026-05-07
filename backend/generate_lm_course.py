"""
Génère un cours audio complet en markdown pour un Learning Module.

Lit le `00_manifest.md` (frontmatter YAML), extrait le contenu de chaque
asset où `audio: true`, construit un prompt structuré par rôle, appelle
Claude Sonnet 4 pour produire `00_full_course.md` (TTS-ready).

Optionnel (--with-audio) : enchaîne avec edge-tts pour produire le MP3.

Usage:
    python generate_lm_course.py TOPIC LM_CODE
    python generate_lm_course.py ETH LM01
    python generate_lm_course.py ETH LM01 --with-audio
    python generate_lm_course.py ETH LM01 --dry-run    # juste l'extraction + count tokens
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber
import yaml

# ── Chargement manuel .env (robuste vs BOM/encoding OneDrive) ──
ROOT_DIR = Path(__file__).resolve().parent

def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    try:
        text = path.read_text(encoding="utf-8-sig")  # tolère BOM
    except Exception:
        return
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Override : .env du projet fait foi
        os.environ[key] = value

_load_env_file(ROOT_DIR.parent / ".env")
_load_env_file(ROOT_DIR / ".env")

if "ANTHROPIC_API_KEY" not in os.environ or not os.environ["ANTHROPIC_API_KEY"]:
    # Diagnostic visible
    _root_env = ROOT_DIR.parent / ".env"
    print(f"[env-debug] ANTHROPIC_API_KEY absent. .env at {_root_env} exists={_root_env.exists()}", file=sys.stderr)
    if _root_env.exists():
        try:
            for ln in _root_env.read_text(encoding="utf-8-sig").splitlines():
                if ln.strip().startswith("ANTHROPIC_API_KEY"):
                    print(f"[env-debug] line found: {ln[:30]}...", file=sys.stderr)
        except Exception as e:
            print(f"[env-debug] read error: {e}", file=sys.stderr)

CONTENT_ROOT = ROOT_DIR / "generated_content"

# Modèle Anthropic — latest Sonnet
CLAUDE_MODEL = "claude-sonnet-4-6"  # latest
WORDS_PER_MIN_FR = 150  # vitesse moyenne edge-tts FR
MAX_OUTPUT_TOKENS = 32000  # 90 min ~18k tokens, marge de sécurité

# Ordre narratif canonique des rôles
NARRATIVE_ORDER = [
    "intro_objectives",
    "quick_intro",
    "core_teaching",
    "deep_dive",
    "formulas_spelled",
    "scenarios_narrated",
    "warnings",
    "recap_essentials",
    "practice_cases_narrated",
    "drill_recall",
    "drill_flashcards",
    "drill_mock",
    "self_assessment_drill",
    "drill_weakness",
]


# ── Parsing manifest ──────────────────────────────────────────────────────

def parse_manifest(md_path: Path) -> tuple[dict, str]:
    """Retourne (frontmatter_dict, body_markdown)."""
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{md_path}: pas de frontmatter YAML")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"{md_path}: frontmatter mal terminé")
    fm = yaml.safe_load(parts[1])
    body = parts[2].lstrip("\n")
    return fm, body


def extract_pedagogical_notes(body: str) -> str:
    """Extrait les sections 'Notes pédagogiques' et 'Particularités audio' du body."""
    notes = []
    for section_title in ["Notes pédagogiques", "Particularités audio"]:
        m = re.search(
            rf"##\s*{re.escape(section_title)}\s*\n(.+?)(?=\n##\s|\Z)",
            body, re.DOTALL,
        )
        if m:
            content = m.group(1).strip()
            # Skip placeholder italic lines
            content = re.sub(r"^>\s*_.*?_\s*$", "", content, flags=re.MULTILINE).strip()
            if content:
                notes.append(f"### {section_title}\n{content}")
    return "\n\n".join(notes)


# ── Extraction des contenus ───────────────────────────────────────────────

def extract_pdf_text(pdf_path: Path) -> str:
    """Extrait le texte d'un PDF via pdfplumber, nettoie un peu."""
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
        text = "\n\n".join(pages)
        # Nettoyage léger : multiples espaces, lignes vides excessives
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()
    except Exception as e:
        return f"[ERREUR EXTRACTION PDF : {e}]"


def extract_json_flashcards(json_path: Path) -> str:
    """Convertit les flashcards JSON en texte lisible."""
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        cards = data.get("cards", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        out = []
        for i, c in enumerate(cards, 1):
            front = c.get("front", c.get("question", ""))
            back = c.get("back", c.get("answer", ""))
            out.append(f"Q{i}. {front}\nR{i}. {back}")
        return "\n\n".join(out)
    except Exception as e:
        return f"[ERREUR EXTRACTION JSON : {e}]"


def extract_md(md_path: Path) -> str:
    return md_path.read_text(encoding="utf-8").strip()


def extract_asset_content(lm_dir: Path, filename: str) -> str:
    path = lm_dir / filename
    if not path.exists():
        return f"[FICHIER ABSENT : {filename}]"
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_pdf_text(path)
    elif suffix == ".json":
        return extract_json_flashcards(path)
    elif suffix == ".md":
        return extract_md(path)
    else:
        return f"[FORMAT NON SUPPORTÉ : {filename}]"


# ── Construction du prompt ────────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es un professeur expérimenté du CFA Level I qui rédige des cours audio en français pour des candidats francophones.

Tu reçois les contenus pédagogiques d'un Learning Module (LM) sous forme structurée par rôle (intro, enseignement, formules, drill, etc.). Tu produis un script TTS-ready en markdown qui sera lu par une voix de synthèse Edge TTS.

## Ordre narratif canonique
Tu dois respecter l'ordre suivant pour les sections présentes (saute les rôles absents) :
intro_objectives → quick_intro → core_teaching → deep_dive → formulas_spelled → scenarios_narrated → warnings → recap_essentials → practice_cases_narrated → drill_recall → drill_flashcards → drill_mock → self_assessment_drill → drill_weakness

## Style par rôle
- **intro_objectives** : "Dans ce module, tu vas apprendre à...". Liste les LOS reformulés en compétences acquises.
- **quick_intro** : 1-2 paragraphes accrocheurs qui posent l'enjeu du module.
- **core_teaching** : narration enseignante naturelle, ton accessible, exemples concrets, transitions fluides.
- **deep_dive** : connexions entre concepts, analogies, points subtils.
- **formulas_spelled** : épelle TOUTES les formules à voix haute. Voir règles ci-dessous.
- **scenarios_narrated** : convertis les decision trees en "Imagine que tu es analyste et qu'on te demande X. Tu dois d'abord vérifier Y. Si Y est vrai, alors Z. Sinon..."
- **warnings** : commence chaque piège par "Attention," puis [pause 1s].
- **recap_essentials** : récap rapide en 1-2 minutes max, les points à retenir.
- **practice_cases_narrated** : énoncé du cas → "[pause 10s] Prends quelques secondes pour réfléchir. [pause 10s]" → solution + raisonnement.
- **drill_recall** : "Maintenant, sans regarder, essaie de citer les X éléments. [pause 30s] Voici la liste : ..."
- **drill_flashcards** : "Question : [énoncé]. [pause 3s] Réponse : [réponse]." Enchaîne les cartes.
- **drill_mock** : "Voici une question type examen. [énoncé]. Choix A : ... Choix B : ... Choix C : ... [pause 5s] La bonne réponse est X parce que [explication]."
- **self_assessment_drill** : même format que drill_mock mais ciblé sur l'auto-évaluation.
- **drill_weakness** : même format que drill_mock, ciblé sur les pièges fréquents.

## Règles de lecture obligatoires
- **Formules** : épelle entièrement. Ex : `β = cov(R_a, R_m) / var(R_m)` → "Le bêta est égal à la covariance entre les rendements de l'actif a et du marché m, divisée par la variance des rendements du marché m."
- **Symboles** : `×` → "fois" ; `/` → "divisé par" ; `²` → "au carré" ; `√` → "racine carrée de" ; `Σ` → "somme de" ; `%` → "pour cent".
- **Acronymes ambigus** : "CFA Institute" toujours en entier (pas "CFA"). "ROE" → "le R-O-E". "EPS" → "le E-P-S".
- **Pauses** : utilise `[pause Xs]` où X est un entier en secondes (1, 3, 5, 10, 30). Elles seront converties en breaks SSML.
- **Pas de titres lus** : pas de "# Section X" ni "## Sous-titre" dans le rendu final. Utilise des transitions parlées : "Passons maintenant aux pièges classiques d'examen.", "Voyons les formules clés.", "Place aux exercices."
- **Pas de codes** : ne lis pas "LM01", "ETH", etc. Utilise les titres parlés ("ce module sur l'éthique").
- **Style oral français naturel** : phrases courtes, tutoiement, comme un cours en personne.

## Cible
Le cours doit faire environ {target_min} minutes en lecture audio Edge TTS française (≈150 mots/min), donc viser environ {target_words} mots au total. Si la matière est dense, privilégie la profondeur sur la longueur — ne fais pas de remplissage.

## Format de sortie
Markdown brut, sans préambule, sans méta-commentaire, sans bloc de code englobant. Commence directement par le premier paragraphe parlé.
"""


def build_user_prompt(
    fm: dict,
    pedagogical_notes: str,
    sections: list[tuple[str, str, str]],  # (role, title, content)
) -> str:
    """Construit le prompt user avec les sections taggées."""
    module = fm
    title = module.get("title", "?")
    code = module.get("code", "?")
    topic = module.get("topic", "?")

    parts = [
        f"<lm topic=\"{topic}\" code=\"{code}\" title=\"{title}\">",
        ""
    ]

    for role, asset_title, content in sections:
        parts.append(f"<section role=\"{role}\" source_title=\"{asset_title}\">")
        parts.append(content)
        parts.append("</section>")
        parts.append("")

    if pedagogical_notes:
        parts.append("<lm_notes>")
        parts.append(pedagogical_notes)
        parts.append("</lm_notes>")
        parts.append("")

    parts.append("</lm>")
    parts.append("")
    parts.append("Génère maintenant le script complet du cours audio en respectant les règles du system prompt. Format : markdown TTS-ready uniquement.")

    return "\n".join(parts)


# ── Pipeline principal ────────────────────────────────────────────────────

def call_claude(system: str, user: str) -> tuple[str, dict]:
    """Appelle Claude en streaming (requis pour générations longues).
    Retourne (texte, usage_dict)."""
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY absent (vérifier .env)")

    client = anthropic.Anthropic(api_key=api_key)

    text_parts: list[str] = []
    last_progress = 0

    with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=MAX_OUTPUT_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        for text_chunk in stream.text_stream:
            text_parts.append(text_chunk)
            # Progression visuelle toutes les ~1000 chars
            total = sum(len(p) for p in text_parts)
            if total - last_progress > 1000:
                print(f"  ... {total:,} chars streamed", flush=True)
                last_progress = total

        final = stream.get_final_message()

    text = "".join(text_parts)
    usage = {
        "input_tokens": final.usage.input_tokens,
        "output_tokens": final.usage.output_tokens,
    }
    return text, usage


def estimate_cost_usd(usage: dict) -> float:
    """Estimation cost Sonnet 4.5 (input $3/MTok, output $15/MTok)."""
    return (usage["input_tokens"] * 3 + usage["output_tokens"] * 15) / 1_000_000


def update_manifest_build(manifest_path: Path, fm: dict, body: str, build_info: dict) -> None:
    """Réécrit le manifest avec une section build mise à jour."""
    fm["build"] = build_info
    yaml_str = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    new_content = f"---\n{yaml_str}---\n\n{body}"
    manifest_path.write_text(new_content, encoding="utf-8")


def generate_course(topic: str, lm_code: str, dry_run: bool = False) -> dict:
    lm_dir = CONTENT_ROOT / topic / lm_code
    if not lm_dir.exists():
        raise FileNotFoundError(f"LM directory introuvable : {lm_dir}")

    manifest_path = lm_dir / "00_manifest.md"
    if not manifest_path.exists():
        # Self-heal: a freshly-generated LM has manifest.json but no markdown
        # manifest yet. Try to build it on-the-fly so the course step doesn't
        # fail just because bootstrap_manifests.py wasn't called.
        try:
            from bootstrap_manifests import bootstrap_one
            if bootstrap_one(lm_dir):
                print(f"[bootstrap] 00_manifest.md généré pour {topic}/{lm_code}")
        except Exception as e:
            print(f"[bootstrap] échec auto-bootstrap : {type(e).__name__}: {e}", file=sys.stderr)
    if not manifest_path.exists():
        raise FileNotFoundError(f"00_manifest.md introuvable : {manifest_path}")

    fm, body = parse_manifest(manifest_path)
    audio_cfg = fm.get("audio", {}) or {}
    target_min = audio_cfg.get("target_min", 90)
    target_words = target_min * WORDS_PER_MIN_FR

    print(f"\n=== {topic}/{lm_code} ===")
    print(f"Title: {fm.get('title')}")
    print(f"Target: {target_min} min ({target_words:,} mots)")

    # Filtre + tri par rôle canonique. `fm.get("assets")` peut renvoyer None
    # quand le YAML a `assets:` sans valeur — d'où le `or []`, comme pour audio.
    audio_assets = [a for a in (fm.get("assets") or []) if a.get("audio")]
    print(f"Assets audio: {len(audio_assets)}")

    by_role: dict[str, list[dict]] = {}
    for a in audio_assets:
        by_role.setdefault(a.get("role", "unknown"), []).append(a)

    sections: list[tuple[str, str, str]] = []
    total_chars = 0

    for role in NARRATIVE_ORDER:
        for a in by_role.get(role, []):
            title = a.get("title", "")
            filename = a.get("file", "")
            print(f"  [{role}] {filename} ...", end=" ", flush=True)
            content = extract_asset_content(lm_dir, filename)
            print(f"{len(content):,} chars")
            sections.append((role, title, content))
            total_chars += len(content)

    # Roles non listés dans NARRATIVE_ORDER : on les ajoute en queue
    for role, items in by_role.items():
        if role not in NARRATIVE_ORDER:
            for a in items:
                title = a.get("title", "")
                filename = a.get("file", "")
                print(f"  [unknown:{role}] {filename} ...", end=" ", flush=True)
                content = extract_asset_content(lm_dir, filename)
                print(f"{len(content):,} chars")
                sections.append((role, title, content))
                total_chars += len(content)

    print(f"Total source: {total_chars:,} chars (~{total_chars // 4:,} tokens)")

    pedagogical_notes = extract_pedagogical_notes(body)
    if pedagogical_notes:
        print(f"Notes pédagogiques: {len(pedagogical_notes)} chars")

    system = SYSTEM_PROMPT.format(target_min=target_min, target_words=target_words)
    user = build_user_prompt(fm, pedagogical_notes, sections)

    if dry_run:
        print(f"\n[DRY-RUN] System prompt: {len(system)} chars, user prompt: {len(user)} chars")
        print(f"[DRY-RUN] Estimated input ~{(len(system) + len(user)) // 4:,} tokens")
        return {"status": "dry-run"}

    print(f"\nCall Claude {CLAUDE_MODEL}...")
    t0 = datetime.now(timezone.utc)
    text, usage = call_claude(system, user)
    elapsed = (datetime.now(timezone.utc) - t0).total_seconds()

    word_count = len(text.split())
    duration_sec = round(word_count / WORDS_PER_MIN_FR * 60)
    cost = estimate_cost_usd(usage)

    print(f"OK in {elapsed:.1f}s")
    print(f"Output: {len(text):,} chars, {word_count:,} words, ~{duration_sec // 60} min audio")
    print(f"Tokens: in={usage['input_tokens']:,} out={usage['output_tokens']:,}")
    print(f"Cost: ${cost:.4f}")

    # Écrit le course .md (convention 2026-05-06 : <TOPIC>-<LM>-<key>.<ext>)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from asset_naming import asset_filename
    course_path = lm_dir / asset_filename(topic, lm_code, "00_full_course", ".md")
    course_path.write_text(text, encoding="utf-8")
    print(f"Wrote {course_path}")

    # Met à jour le build dans le manifest
    build_info = {
        "last_run": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "success",
        "word_count": word_count,
        "duration_sec": duration_sec,
        "cost_usd": round(cost, 4),
        "model": CLAUDE_MODEL,
    }
    update_manifest_build(manifest_path, fm, body, build_info)
    print("Manifest build section updated.")

    return {
        "status": "success",
        "course_md": str(course_path),
        "word_count": word_count,
        "duration_sec": duration_sec,
        "cost_usd": cost,
    }


# ── CLI ───────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("topic", help="Code topic (ex: ETH)")
    parser.add_argument("lm_code", help="Code LM (ex: LM01)")
    parser.add_argument("--dry-run", action="store_true", help="Pas d'appel Claude — just estimate")
    parser.add_argument("--with-audio", action="store_true", help="Enchaîne edge-tts pour produire le MP3")
    args = parser.parse_args()

    try:
        result = generate_course(args.topic.upper(), args.lm_code.upper(), dry_run=args.dry_run)
    except Exception as e:
        print(f"\n[ERREUR] {type(e).__name__}: {e}", file=sys.stderr)
        return 1

    if args.with_audio and result.get("status") == "success":
        print("\n--- Audio TTS ---")
        # On délègue à la fonction existante de generate_audio.py adaptée.
        # Pour cette V1, on ré-appelle generate_audio.py en pointant vers le nouveau .md.
        # Implémentation complète à faire si besoin.
        print("(--with-audio à implémenter — pour l'instant, lance manuellement edge-tts)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
