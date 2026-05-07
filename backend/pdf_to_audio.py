"""
PDF -> MD script -> MP3 converter (mode fichier OU dossier).

Pipeline (par PDF) :
    1. Extraction texte du PDF avec pdfplumber (page par page).
    2. Normalisation légère pour l'oral (soft hyphens, numéros de page, ...).
    3. Écriture du .md intermédiaire (supprimé en fin sauf --keep-md).
    4. Réutilisation de generate_audio.generate_mp3_from_md() pour produire le .mp3
       (clean_markdown + chunking + edge-tts + retry x5 + merge déjà gérés).

Usage :
    # Un seul PDF
    python pdf_to_audio.py input.pdf
    python pdf_to_audio.py input.pdf --mp3 out.mp3 --voice fr-FR-DeniseNeural

    # Tous les PDF d'un dossier (récursif par défaut)
    python pdf_to_audio.py ./assets
    python pdf_to_audio.py ./assets --no-recursive       # top-level uniquement
    python pdf_to_audio.py ./assets --force              # régénère même si .mp3 existe
    python pdf_to_audio.py ./assets --keep-md            # conserve les .md intermédiaires

Dépendances (déjà dans backend/requirements.txt) :
    pdfplumber==0.11.4
    edge-tts==7.2.x
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
import time
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_audio import VOICE, generate_mp3_from_md  # noqa: E402


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extrait le texte d'un PDF, page par page, avec pdfplumber."""
    parts: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                parts.append(f"## Page {i}\n\n{text}")
    return "\n\n".join(parts)


def normalize_for_oral(text: str) -> str:
    """Nettoyage léger spécifique aux artefacts PDF.

    clean_markdown() de generate_audio.py finira le travail côté markdown
    (titres, listes, tableaux, ...). Ici on traite uniquement ce que pdfplumber
    laisse passer et que clean_markdown ne sait pas attraper.
    """
    text = text.replace("­", "")                                    # soft hyphens
    text = re.sub(r"-\n(?=\w)", "", text)                            # mots coupés
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"^\s*\d{1,3}\s*$", "", text, flags=re.MULTILINE)  # n° de page isolés
    text = text.replace("—", ", ").replace("–", ", ").replace("…", "...")
    return text.strip()


def pdf_to_md(pdf_path: Path, md_path: Path) -> int:
    raw = extract_text_from_pdf(pdf_path)
    if not raw.strip():
        raise RuntimeError(f"Aucun texte extractible dans {pdf_path}")
    cleaned = normalize_for_oral(raw)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(cleaned, encoding="utf-8")
    return len(cleaned)


async def convert_one(
    pdf_path: Path,
    md_path: Path,
    mp3_path: Path,
    voice: str,
    keep_md: bool,
) -> dict:
    """Convertit un seul PDF -> MP3. Retourne un dict status."""
    print(f"[1/2] Extraction PDF -> MD : {pdf_path.name}")
    try:
        n_chars = pdf_to_md(pdf_path, md_path)
    except Exception as e:
        return {"status": "error", "phase": "extract", "detail": str(e)}
    print(f"      OK ({n_chars:,} chars -> {md_path.name})")

    print(f"[2/2] Synthèse TTS MD -> MP3 (voix : {voice})")
    result = await generate_mp3_from_md(md_path, mp3_path, voice=voice)

    if result.get("status") == "success" and not keep_md and md_path.exists():
        md_path.unlink()
    return result


def collect_pdfs(folder: Path, recursive: bool) -> list[Path]:
    pattern = "**/*.pdf" if recursive else "*.pdf"
    pdfs = sorted(p for p in folder.glob(pattern) if p.is_file())
    # Exclure poubelle Wingman si présente
    return [p for p in pdfs if ".trash" not in p.parts]


async def run_batch(
    folder: Path,
    voice: str,
    keep_md: bool,
    recursive: bool,
    force: bool,
) -> int:
    pdfs = collect_pdfs(folder, recursive)
    if not pdfs:
        print(f"Aucun PDF trouvé dans {folder} (recursive={recursive})")
        return 1

    print(f"=== Batch PDF -> MP3 ===")
    print(f"Dossier : {folder}")
    print(f"PDFs trouvés : {len(pdfs)}")
    print(f"Voix : {voice}  | recursive={recursive}  | force={force}  | keep_md={keep_md}")
    print("-" * 60)

    n_ok = n_fail = n_skip = 0
    fails: list[tuple[Path, str]] = []
    t_start = time.time()

    for i, pdf_path in enumerate(pdfs, start=1):
        mp3_path = pdf_path.with_suffix(".mp3")
        md_path = pdf_path.with_suffix(".md")
        rel = pdf_path.relative_to(folder)

        print(f"\n[{i}/{len(pdfs)}] {rel}")
        if mp3_path.exists() and not force:
            print(f"  SKIP (mp3 existe déjà : {mp3_path.name}) — --force pour régénérer")
            n_skip += 1
            continue

        try:
            result = await convert_one(pdf_path, md_path, mp3_path, voice, keep_md)
        except Exception as e:
            result = {"status": "error", "phase": "unexpected", "detail": str(e)}

        if result.get("status") == "success":
            n_ok += 1
            print(f"  OK -> {mp3_path.name} ({result.get('size_kb', '?')} KB)")
        else:
            n_fail += 1
            detail = result.get("detail", "?")
            fails.append((pdf_path, detail))
            print(f"  FAIL ({result.get('phase', '?')}): {detail}")

    elapsed = time.time() - t_start
    print("\n" + "=" * 60)
    print(f"Total : {len(pdfs)} PDFs traités en {elapsed:.0f}s")
    print(f"  OK    : {n_ok}")
    print(f"  SKIP  : {n_skip}")
    print(f"  FAIL  : {n_fail}")
    if fails:
        print("\nÉchecs :")
        for p, d in fails:
            print(f"  - {p.relative_to(folder)} : {d[:80]}")

    return 0 if n_fail == 0 else 2


def main() -> None:
    p = argparse.ArgumentParser(description="PDF -> MD -> MP3 (edge-tts), mode fichier ou dossier.")
    p.add_argument("path", help="Chemin du PDF, OU dossier contenant des PDFs")
    p.add_argument("--md", help="(mode fichier) chemin du .md intermédiaire")
    p.add_argument("--mp3", help="(mode fichier) chemin du .mp3 de sortie")
    p.add_argument("--voice", default=VOICE, help=f"Voix edge-tts (défaut : {VOICE})")
    p.add_argument("--keep-md", action="store_true", help="Conserver les .md après succès")
    p.add_argument("--no-recursive", action="store_true", help="(mode dossier) ne pas descendre dans les sous-dossiers")
    p.add_argument("--force", action="store_true", help="(mode dossier) régénérer même si le .mp3 existe")
    args = p.parse_args()

    target = Path(args.path).resolve()
    if not target.exists():
        sys.exit(f"Chemin introuvable : {target}")

    # Mode dossier
    if target.is_dir():
        if args.md or args.mp3:
            print("WARN : --md et --mp3 ignorés en mode dossier (sortie côté PDF)")
        rc = asyncio.run(run_batch(
            folder=target,
            voice=args.voice,
            keep_md=args.keep_md,
            recursive=not args.no_recursive,
            force=args.force,
        ))
        sys.exit(rc)

    # Mode fichier
    if target.suffix.lower() != ".pdf":
        sys.exit(f"Pas un PDF : {target}")

    md_path = Path(args.md).resolve() if args.md else target.with_suffix(".md")
    mp3_path = Path(args.mp3).resolve() if args.mp3 else target.with_suffix(".mp3")

    result = asyncio.run(convert_one(target, md_path, mp3_path, args.voice, args.keep_md))
    print(f"\nResult: {result}")
    sys.exit(0 if result.get("status") == "success" else 1)


if __name__ == "__main__":
    main()
