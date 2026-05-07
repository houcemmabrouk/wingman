import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

ASSETS_DIR = Path("/app/assets")
ASSETS_DIR.mkdir(parents=True, exist_ok=True)


async def generate_pdf_content(db: AsyncSession, lm_id: int, language: str = "fr") -> dict:
    """Generate a PDF study sheet for a learning module.
    In production, calls Claude API for content generation + ReportLab for PDF.
    Stub version creates a text-based summary file."""

    row = await db.execute(text(
        "SELECT lm.code, lm.title, t.name AS topic_name "
        "FROM learning_modules lm JOIN topics t ON t.id = lm.topic_id WHERE lm.id = :id"
    ), {"id": lm_id})
    lm = row.mappings().first()
    if not lm:
        return {"error": "Module not found"}

    # Generate content (stub - in production use Claude API)
    content = f"""FICHE DE RÉVISION — {lm['code']} : {lm['title']}
Topic: {lm['topic_name']} | CFA Level I | Langue: {language}
{'=' * 60}

1. CONCEPTS CLÉS
   - [En production : contenu généré par Claude API]
   - Concept principal du module {lm['code']}

2. FORMULES ESSENTIELLES
   - [Formules générées dynamiquement]

3. PIÈGES FRÉQUENTS
   - [Erreurs courantes identifiées]

4. POINTS MÉMOIRE
   - [Mnémoniques et astuces]

5. EXEMPLE CHIFFRÉ
   - [Exercice pratique avec solution]

---
Généré par Wingman Learning OS
"""

    # Save file
    filename = f"{lm['code'].lower().replace('-', '_')}_{language}.txt"
    filepath = ASSETS_DIR / filename
    filepath.write_text(content, encoding="utf-8")
    file_size = filepath.stat().st_size // 1024

    # Insert into content_assets
    result = await db.execute(text("""
        INSERT INTO content_assets (module_id, asset_type, title, url, metadata)
        VALUES (:mid, 'pdf', :title, :url, :meta)
        RETURNING id
    """), {
        "mid": lm_id,
        "title": f"Fiche {lm['code']} ({language})",
        "url": str(filepath),
        "meta": f'{{"language": "{language}", "file_size_kb": {file_size}}}',
    })
    asset_id = result.scalar()
    await db.commit()

    return {"asset_id": asset_id, "storage_key": str(filepath), "file_size_kb": file_size}


async def generate_audio_content(db: AsyncSession, lm_id: int, language: str = "fr") -> dict:
    """Generate an audio study file for a learning module.
    In production, calls Claude API for script + edge-tts for MP3.
    Stub version creates a placeholder."""

    row = await db.execute(text(
        "SELECT code, title FROM learning_modules WHERE id = :id"
    ), {"id": lm_id})
    lm = row.mappings().first()
    if not lm:
        return {"error": "Module not found"}

    # Stub audio file
    filename = f"{lm['code'].lower().replace('-', '_')}_{language}.mp3"
    filepath = ASSETS_DIR / filename

    # In production: use edge-tts to generate real audio
    # For now, create a placeholder
    filepath.write_text(f"[Audio placeholder for {lm['code']}]", encoding="utf-8")
    file_size = filepath.stat().st_size // 1024

    result = await db.execute(text("""
        INSERT INTO content_assets (module_id, asset_type, title, url, metadata)
        VALUES (:mid, 'summary', :title, :url, :meta)
        RETURNING id
    """), {
        "mid": lm_id,
        "title": f"Audio {lm['code']} ({language})",
        "url": str(filepath),
        "meta": f'{{"language": "{language}", "duration_sec": 360}}',
    })
    asset_id = result.scalar()
    await db.commit()

    return {"asset_id": asset_id, "storage_key": str(filepath), "duration_sec": 360}


async def generate_full_lm(db: AsyncSession, lm_id: int, language: str = "fr") -> dict:
    """Full pipeline: PDF + audio + chunk indexing."""
    pdf_result = await generate_pdf_content(db, lm_id, language)
    audio_result = await generate_audio_content(db, lm_id, language)

    # In production: chunk content and insert into ChromaDB + content_vectors
    chunks_indexed = 0

    return {
        "pdf_id": pdf_result.get("asset_id"),
        "audio_id": audio_result.get("asset_id"),
        "chunks_indexed": chunks_indexed,
    }
