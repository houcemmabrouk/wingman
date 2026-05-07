"""Convention de nommage des assets générés.

**2026-05-06 — REVERT** : la disposition `<TOPIC>-<LM>-<key>.<ext>` introduite
plus tôt dans la journée a été annulée. Les nouveaux fichiers reprennent le
nommage simple `<key>.<ext>` à la racine du dossier
`generated_content/<TOPIC>/<LM>/`.

Exemple : `generated_content/ALT/LM01/01_summary_notes.pdf`

Les fichiers générés AVANT le revert (qui portent le préfixe `<TOPIC>-<LM>-`)
restent lisibles via `find_asset_path()` qui essaye le nommage legacy puis le
préfixé en fallback. Pas de mass-rename.
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable


def asset_filename(topic: str, lm_code: str, asset_key: str, ext: str) -> str:
    """Build the filename for a generated asset.

    Args:
        topic:     topic code (kept in signature for backward compatibility,
                   but no longer used since the revert of 2026-05-06).
        lm_code:   LM code (idem).
        asset_key: asset stem, e.g. "01_summary_notes" or "00_full_course".
        ext:       file extension WITH the leading dot, e.g. ".pdf", ".mp3".

    Returns:
        e.g. "01_summary_notes.pdf"
    """
    if not ext.startswith("."):
        ext = "." + ext
    return f"{asset_key}{ext}"


def find_asset_path(
    module_dir: Path,
    topic: str,
    lm_code: str,
    asset_key: str,
    extensions: Iterable[str],
) -> Path | None:
    """Find an asset file in `module_dir`. Tries the canonical (legacy) name
    first, then the prefixed `<TOPIC>-<LM>-<key>.<ext>` name as a fallback to
    keep already-generated files (from the brief 2026-05-06 prefix experiment)
    discoverable.

    The first existing path wins. `extensions` is iterated in order — pass the
    most-preferred extension first (e.g. ".mp3" before ".md" for full course).

    Returns the resolved Path or None.
    """
    for ext in extensions:
        if not ext.startswith("."):
            ext = "." + ext
        # 1) Canonical (legacy + post-revert) naming
        legacy_p = module_dir / f"{asset_key}{ext}"
        if legacy_p.exists():
            return legacy_p
        # 2) Backward compat: prefixed files generated during the experiment
        prefixed_p = module_dir / f"{topic}-{lm_code}-{asset_key}{ext}"
        if prefixed_p.exists():
            return prefixed_p
    return None
