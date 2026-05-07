"""
Wingman Audio Generator — Converts audio script .md to .mp3 via Edge TTS.

Usage:
    # Legacy mode (writes 14_audio_synthesis.mp3 from 14_audio_script.md):
    python generate_audio.py TOPIC LM_CODE [TITLE]

    # Generic mode (any .md to any .mp3):
    python generate_audio.py --input PATH/TO/script.md --output PATH/TO/out.mp3 [--voice fr-FR-HenriNeural]

Uses edge-tts (free, no API key needed).
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

import edge_tts

# Allow importing from app/
sys.path.insert(0, str(Path(__file__).parent))
os.environ["WINGMAN_NO_DB"] = "1"

# GENERATED_ROOT : repo Postgres-aware en mode legacy, fallback path en local
try:
    from app.routers.content import GENERATED_ROOT  # type: ignore
except ImportError:
    # FastAPI / app non installé en local → fallback déterministe
    GENERATED_ROOT = Path(__file__).resolve().parent / "generated_content"

# ── Config ──
VOICE = "fr-FR-HenriNeural"
RATE = "+0%"
VOLUME = "+0%"
PITCH = "+0Hz"
CHUNK_SIZE = 3000


def clean_markdown(text: str) -> str:
    """Clean markdown to pure oral text for TTS."""
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if re.match(r'^#\s*(SCRIPT|Format|Voix|Durée|FIN DU|Compatibilité|Usage|LM\s*\d)', line):
            continue
        cleaned.append(line)
    text = "\n".join(cleaned)

    text = re.sub(r'^---+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*{1,3}(.+?)\*{1,3}', r'\1', text)
    text = re.sub(r'`[^`]+`', '', text)
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'^\|.*\|$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[-|: ]+$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = unicodedata.normalize('NFC', text)
    text = ''.join(c for c in text if unicodedata.category(c)[0] != 'C' or c in '\n\t')
    text = text.replace('—', ', ').replace('–', ', ').replace('...', '.')
    # Convert [pause] / [pause Xs] markers to sentence breaks (durée perdue,
    # mais edge-tts génère une pause naturelle à chaque point).
    text = re.sub(r'\[pause(?:\s+\d+\s*s)?\]', '.', text, flags=re.IGNORECASE)
    text = '\n'.join(line.strip() for line in text.splitlines())
    return text.strip()


def split_into_chunks(text: str, max_chars: int = CHUNK_SIZE) -> list:
    """Split text into chunks respecting sentence boundaries."""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        if len(para) > max_chars:
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                if len(current) + len(sentence) + 2 <= max_chars:
                    current += (" " if current else "") + sentence
                else:
                    if current:
                        chunks.append(current.strip())
                    if len(sentence) > max_chars:
                        for i in range(0, len(sentence), max_chars):
                            chunks.append(sentence[i:i + max_chars].strip())
                        current = ""
                    else:
                        current = sentence
        else:
            if len(current) + len(para) + 2 <= max_chars:
                current += ("\n\n" if current else "") + para
            else:
                if current:
                    chunks.append(current.strip())
                current = para

    if current:
        chunks.append(current.strip())

    return [c for c in chunks if c.strip()]


async def generate_chunk(text: str, output_path: Path, retries: int = 5, voice: str = VOICE) -> bool:
    """Generate MP3 for a single chunk via Edge TTS.

    Backoff exponentiel : 3s, 6s, 12s, 24s, 48s — traite les flaps transient
    de speech.platform.bing.com (SSL drops sous charge).

    `edge_tts.Communicate.save()` peut retourner sans exception alors que
    AUCUN fichier n'a été écrit (Bing renvoie un stream vide). On vérifie
    explicitement la présence + taille > 0 pour traiter ce cas comme un échec.
    """
    backoffs = [3, 6, 12, 24, 48]
    # Make sure stale output from a previous attempt doesn't lie about success.
    try:
        if output_path.exists():
            output_path.unlink()
    except OSError:
        pass

    for attempt in range(1, retries + 1):
        try:
            communicate = edge_tts.Communicate(
                text=text, voice=voice, rate=RATE, volume=VOLUME, pitch=PITCH
            )
            await communicate.save(str(output_path))
            if output_path.exists() and output_path.stat().st_size > 0:
                return True
            # Silent failure: save returned but no file produced.
            print(f"    [!] Attempt {attempt}/{retries}: empty output (no chunk written)")
            try:
                if output_path.exists():
                    output_path.unlink()
            except OSError:
                pass
        except Exception as e:
            short_err = str(e)[:80]
            print(f"    [!] Attempt {attempt}/{retries}: {short_err}")
        if attempt < retries:
            wait = backoffs[min(attempt - 1, len(backoffs) - 1)]
            await asyncio.sleep(wait)
    return False


async def generate_mp3_from_md(md_path: Path, mp3_path: Path, voice: str = VOICE) -> dict:
    """Mode générique : lit un .md, produit un .mp3 via Edge TTS.

    Réutilisable pour n'importe quel script (cours complet, synthèse, etc.).
    """
    if not md_path.exists():
        return {"status": "error", "detail": f"Input introuvable : {md_path}"}

    text_raw = md_path.read_text(encoding="utf-8")
    text_clean = clean_markdown(text_raw)
    if not text_clean:
        return {"status": "error", "detail": "Texte vide après nettoyage"}

    print(f"  Text: {len(text_raw):,} chars raw -> {len(text_clean):,} chars clean")

    chunks = split_into_chunks(text_clean)
    print(f"  Chunks: {len(chunks)}")

    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_dir = mp3_path.parent / f"_tmp_{mp3_path.stem}"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # Pass 1 : tentative initiale par chunk
    results: list[tuple[int, str, Path, bool]] = []  # (idx, text, path, ok)
    for i, chunk_text in enumerate(chunks):
        chunk_path = tmp_dir / f"chunk_{i:04d}.mp3"
        print(f"  [TTS] Chunk {i + 1}/{len(chunks)} ({len(chunk_text):,} chars)...", end=" ", flush=True)
        t0 = time.time()
        ok = await generate_chunk(chunk_text, chunk_path, voice=voice)
        if ok:
            try:
                size_kb = chunk_path.stat().st_size // 1024
                print(f"OK ({time.time() - t0:.1f}s, {size_kb} KB)")
            except FileNotFoundError:
                # generate_chunk now guards against this, but stay defensive
                # so a missing file never crashes the whole run.
                print(f"OK (no file? — flagging for retry)")
                ok = False
        else:
            print("FAILED (sera retenté en pass 2)")
        results.append((i, chunk_text, chunk_path, ok))
        if i < len(chunks) - 1:
            await asyncio.sleep(1.5)  # ralentir pour ménager Edge TTS

    # Pass 2 : retry les chunks ratés avec wait long entre
    failed = [(i, t, p) for i, t, p, ok in results if not ok]
    if failed:
        print(f"\n  Pass 2 : retry de {len(failed)} chunk(s) raté(s) après wait 30s...")
        await asyncio.sleep(30)
        for i, chunk_text, chunk_path in failed:
            print(f"  [Retry] Chunk {i + 1}/{len(chunks)} ({len(chunk_text):,} chars)...", end=" ", flush=True)
            t0 = time.time()
            ok = await generate_chunk(chunk_text, chunk_path, voice=voice)
            if ok:
                print(f"OK ({time.time() - t0:.1f}s)")
                # Met à jour le statut dans results
                results[i] = (i, chunk_text, chunk_path, True)
            else:
                print("FAILED définitivement")
            await asyncio.sleep(5)

    chunk_paths = [p for _, _, p, ok in results if ok]
    if not chunk_paths:
        return {"status": "error", "detail": "Tous les chunks TTS ont échoué"}

    if len(chunk_paths) < len(chunks):
        print(f"\n  ⚠️  ATTENTION : {len(chunks) - len(chunk_paths)} chunk(s) manquant(s) — l'audio aura des trous narratifs.")

    success = merge_mp3_chunks(chunk_paths, mp3_path)
    if not success:
        return {"status": "error", "detail": "Échec de la fusion MP3"}

    # Nettoyage
    for p in chunk_paths:
        p.unlink(missing_ok=True)
    try:
        tmp_dir.rmdir()
    except OSError:
        pass

    size_kb = round(mp3_path.stat().st_size / 1024, 1)
    size_mb = round(size_kb / 1024, 2)
    # Estimation durée : 1 Mo de MP3 mono ~64 kbps ≈ 2 min audio
    duration_estimate_min = round(size_kb / 480, 1)
    print(f"  Audio: {mp3_path.name} ({size_mb} MB, ~{duration_estimate_min} min)")

    return {
        "status": "success",
        "filename": mp3_path.name,
        "size_kb": size_kb,
        "duration_estimate_min": duration_estimate_min,
        "chunk_count": len(chunks),
    }


def merge_mp3_chunks(chunk_paths: list, output_path: Path) -> bool:
    """Merge MP3 chunks into a single file using binary concatenation.
    MP3 is a frame-based format so simple concat works for all players."""
    try:
        print(f"  Merging {len(chunk_paths)} chunks...", end=" ", flush=True)
        with open(str(output_path), 'wb') as out:
            for path in chunk_paths:
                with open(str(path), 'rb') as inp:
                    out.write(inp.read())
        print("OK")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False


async def generate_audio_for_lm(topic: str, lm_code: str, lm_title: str = "") -> dict:
    """
    Generate MP3 audio synthesis for a specific LM.
    Looks for the audio script (new naming first, legacy fallback) and falls
    back to generating content inline if neither exists.
    Returns dict with status info.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from asset_naming import asset_filename, find_asset_path

    module_dir = GENERATED_ROOT / topic / lm_code
    module_dir.mkdir(parents=True, exist_ok=True)

    # Find audio script source — try new naming, then legacy.
    md_path = find_asset_path(module_dir, topic, lm_code, "14_audio_script", [".md"])
    if md_path is None:
        # Try to generate the .md from the generator (new naming convention).
        try:
            from generate_all_assets import gen_audio_script
            content = gen_audio_script(topic, lm_code, lm_title or f"{topic}-{lm_code}")
            md_path = module_dir / asset_filename(topic, lm_code, "14_audio_script", ".md")
            md_path.write_text(content, encoding="utf-8")
            print(f"  Generated audio script .md for {topic}/{lm_code} -> {md_path.name}")
        except Exception as e:
            return {"status": "error", "detail": f"No audio script found and could not generate: {e}"}

    # Read and clean
    text_raw = md_path.read_text(encoding="utf-8")
    text_clean = clean_markdown(text_raw)
    if not text_clean:
        return {"status": "error", "detail": "Audio script is empty after cleaning"}

    print(f"  Text: {len(text_raw)} chars raw -> {len(text_clean)} chars clean")

    # Split into chunks
    chunks = split_into_chunks(text_clean)
    print(f"  Chunks: {len(chunks)}")

    # Generate chunks
    tmp_dir = module_dir / "_tmp_audio"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    chunk_paths = []

    for i, chunk_text in enumerate(chunks):
        chunk_path = tmp_dir / f"chunk_{i:04d}.mp3"
        print(f"  [TTS] Chunk {i + 1}/{len(chunks)} ({len(chunk_text)} chars)...", end=" ", flush=True)
        t0 = time.time()
        success = await generate_chunk(chunk_text, chunk_path)
        if success:
            elapsed = time.time() - t0
            size_kb = chunk_path.stat().st_size // 1024
            print(f"OK ({elapsed:.1f}s, {size_kb} KB)")
            chunk_paths.append(chunk_path)
        else:
            print("FAILED")

        if i < len(chunks) - 1:
            await asyncio.sleep(0.3)

    if not chunk_paths:
        return {"status": "error", "detail": "All TTS chunks failed"}

    # Merge — output uses the new naming convention.
    final_filename = asset_filename(topic, lm_code, "14_audio_synthesis", ".mp3")
    final_mp3 = module_dir / final_filename
    success = merge_mp3_chunks(chunk_paths, final_mp3)

    # Cleanup temp files
    if success:
        for p in chunk_paths:
            p.unlink(missing_ok=True)
        try:
            tmp_dir.rmdir()
        except OSError:
            pass

        size_kb = round(final_mp3.stat().st_size / 1024, 1)
        size_mb = round(size_kb / 1024, 2)
        print(f"  Audio: {final_mp3.name} ({size_mb} MB)")

        # Update manifest. Drop any prior entry referencing this asset under
        # either naming (legacy bare or new prefixed).
        legacy_filename = "14_audio_synthesis.mp3"
        manifest_path = module_dir / "manifest.json"
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["assets"] = [
                a for a in manifest["assets"]
                if a["filename"] not in (legacy_filename, final_filename)
            ]
            manifest["assets"].append({
                "title": "Audio Synthesis",
                "filename": final_filename,
                "size_kb": size_kb,
                "status": "success",
            })
            manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

        return {"status": "success", "filename": final_filename, "size_kb": size_kb}
    else:
        return {"status": "error", "detail": "MP3 merge failed"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wingman Audio Generator (Edge TTS).")
    parser.add_argument("--input", help="Chemin du .md d'entrée (mode générique)")
    parser.add_argument("--output", help="Chemin du .mp3 de sortie (mode générique)")
    parser.add_argument("--voice", default=VOICE, help=f"Voix Edge TTS (défaut : {VOICE})")
    parser.add_argument("topic", nargs="?", help="(legacy) Topic code, ex: ETH")
    parser.add_argument("lm_code", nargs="?", help="(legacy) LM code, ex: LM01")
    parser.add_argument("title", nargs="?", default="", help="(legacy) Titre humain")
    args = parser.parse_args()

    if args.input and args.output:
        # Mode générique : .md quelconque -> .mp3 quelconque
        md = Path(args.input).resolve()
        mp3 = Path(args.output).resolve()
        print(f"Generating audio: {md.name} -> {mp3.name} (voice: {args.voice})")
        result = asyncio.run(generate_mp3_from_md(md, mp3, voice=args.voice))
        print(f"\nResult: {result}")
        sys.exit(0 if result.get("status") == "success" else 1)
    elif args.topic and args.lm_code:
        # Mode legacy : 14_audio_script.md -> 14_audio_synthesis.mp3
        topic = args.topic.upper()
        lm = args.lm_code.upper()
        title = args.title or f"{topic}-{lm}"
        print(f"Generating audio (legacy) for {topic}/{lm} — {title}")
        result = asyncio.run(generate_audio_for_lm(topic, lm, title))
        print(f"\nResult: {result}")
        sys.exit(0 if result.get("status") == "success" else 1)
    else:
        parser.error("Spécifier --input + --output OU positional TOPIC LM_CODE")
