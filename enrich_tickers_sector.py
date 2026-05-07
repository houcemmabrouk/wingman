"""
Enrich us_tickers.json with SEC SIC code + sector for entries that have a CIK.

- Reads & writes the same JSON file in place.
- Idempotent: skips rows that already have a `sector` field, so re-running
  resumes where it left off.
- Saves every 200 rows, so Ctrl+C loses at most ~200 lookups of work.
- Stays under SEC's 10 req/s fair-access limit (8.3 req/s here).
- ~12 min runtime for a fresh enrichment of ~7000 CIKs.
"""

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

TICKERS_FILE = Path(r"C:\Users\houce.000\OneDrive\Apps\Quantum Max\Data\Tickers\us_tickers.json")
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"

# SEC requires a User-Agent identifying you. Edit before running.
SEC_USER_AGENT = "Quantum Max Research contact@example.com"

REQUEST_DELAY_S = 0.12   # ~8.3 req/s, under SEC's 10/s limit
SAVE_EVERY = 200


def sic_to_sector(sic: int) -> str:
    """Map SIC code to one of SEC's 11 SIC divisions."""
    if 100 <= sic <= 999:    return "Agriculture, Forestry, Fishing"
    if 1000 <= sic <= 1499:  return "Mining"
    if 1500 <= sic <= 1799:  return "Construction"
    if 2000 <= sic <= 3999:  return "Manufacturing"
    if 4000 <= sic <= 4999:  return "Transportation, Communications, Utilities"
    if 5000 <= sic <= 5199:  return "Wholesale Trade"
    if 5200 <= sic <= 5999:  return "Retail Trade"
    if 6000 <= sic <= 6799:  return "Finance, Insurance, Real Estate"
    if 7000 <= sic <= 8999:  return "Services"
    if 9100 <= sic <= 9729:  return "Public Administration"
    return "Nonclassifiable"


def fetch_sic(cik: str) -> tuple[int, str] | None:
    """Return (sic, sic_description) for a CIK, or None if SEC has no match."""
    url = SUBMISSIONS_URL.format(cik=cik)
    req = urllib.request.Request(url, headers={"User-Agent": SEC_USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    sic_raw = data.get("sic")
    sic_desc = data.get("sicDescription") or ""
    if not sic_raw:
        return None
    return int(sic_raw), sic_desc


def main() -> None:
    payload = json.loads(TICKERS_FILE.read_text(encoding="utf-8"))
    results = payload["results"]

    todo = [r for r in results if r.get("cik") and "sector" not in r]
    skipped_no_cik = sum(1 for r in results if not r.get("cik"))
    skipped_done = len(results) - len(todo) - skipped_no_cik
    print(f"to enrich : {len(todo)}")
    print(f"  skipped : {skipped_done} already enriched, {skipped_no_cik} no CIK")

    if not todo:
        print("nothing to do.")
        return

    eta_min = len(todo) * REQUEST_DELAY_S / 60
    print(f"estimated runtime: ~{eta_min:.1f} min\n")

    enriched = 0
    not_found = 0
    failed = 0

    for i, row in enumerate(todo, 1):
        try:
            result = fetch_sic(row["cik"])
        except Exception as e:
            failed += 1
            print(f"  [{i}/{len(todo)}] {row['ticker']} (CIK {row['cik']}) failed: {e}")
            time.sleep(REQUEST_DELAY_S)
            continue

        if result is None:
            not_found += 1
        else:
            sic, sic_desc = result
            row["sic"] = sic
            row["sic_description"] = sic_desc
            row["sector"] = sic_to_sector(sic)
            enriched += 1

        if i % 100 == 0:
            print(f"  [{i}/{len(todo)}] enriched={enriched} not_found={not_found} failed={failed}")

        if i % SAVE_EVERY == 0:
            TICKERS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        time.sleep(REQUEST_DELAY_S)

    TICKERS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\nfinal: enriched={enriched} not_found={not_found} failed={failed}")
    print(f"wrote -> {TICKERS_FILE}")


if __name__ == "__main__":
    main()
