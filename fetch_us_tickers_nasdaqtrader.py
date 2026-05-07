"""
Fetch all active US-listed tickers from the official Nasdaq Trader symbol
directory and join CIKs from SEC EDGAR. No API key, no rate limit, ~2s runtime.

Source files (updated nightly):
    https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt
    https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt
    https://www.sec.gov/files/company_tickers.json

Output: JSON file in a Polygon-like shape (CIK added where SEC has a match;
no FIGI — that needs OpenFIGI or Polygon).
"""

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

NASDAQ_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt"
OTHER_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt"
SEC_URL = "https://www.sec.gov/files/company_tickers.json"

# SEC requires a User-Agent identifying you (name + email). Edit before sharing
# this script publicly. Failure to set a real contact may get you rate-limited.
SEC_USER_AGENT = "Quantum Max Research contact@example.com"

OUT_FILE = Path(r"C:\Users\houce.000\OneDrive\Apps\Quantum Max\Data\Tickers\us_tickers.json")

# Exchange code -> MIC (matches Polygon's primary_exchange field)
EXCHANGE_MIC = {
    "A": "XASE",  # NYSE American
    "N": "XNYS",  # NYSE
    "P": "ARCX",  # NYSE Arca
    "Z": "BATS",  # Cboe BZX
    "V": "IEXG",  # IEX
}


def fetch(url: str) -> list[str]:
    with urllib.request.urlopen(url, timeout=30) as resp:
        text = resp.read().decode("utf-8")
    lines = [ln for ln in text.splitlines() if ln and not ln.startswith("File Creation Time")]
    return lines


def fetch_cik_map() -> dict[str, str]:
    """Return {ticker: 10-digit zero-padded CIK} from SEC EDGAR."""
    req = urllib.request.Request(SEC_URL, headers={"User-Agent": SEC_USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return {row["ticker"]: f"{int(row['cik_str']):010d}" for row in data.values()}


def parse_nasdaq(lines: list[str]) -> list[dict]:
    header = lines[0].split("|")
    out = []
    for ln in lines[1:]:
        row = dict(zip(header, ln.split("|")))
        if row.get("Test Issue") == "Y":
            continue
        symbol = row["Symbol"]
        is_etf = row.get("ETF") == "Y"
        out.append({
            "ticker": symbol,
            "name": row["Security Name"],
            "market": "stocks",
            "locale": "us",
            "primary_exchange": "XNAS",
            "type": "ETF" if is_etf else "CS",
            "active": True,
            "currency_name": "usd",
        })
    return out


def parse_other(lines: list[str]) -> list[dict]:
    header = lines[0].split("|")
    out = []
    for ln in lines[1:]:
        row = dict(zip(header, ln.split("|")))
        if row.get("Test Issue") == "Y":
            continue
        symbol = row["ACT Symbol"]
        mic = EXCHANGE_MIC.get(row.get("Exchange", ""), row.get("Exchange", ""))
        is_etf = row.get("ETF") == "Y"
        out.append({
            "ticker": symbol,
            "name": row["Security Name"],
            "market": "stocks",
            "locale": "us",
            "primary_exchange": mic,
            "type": "ETF" if is_etf else "CS",
            "active": True,
            "currency_name": "usd",
        })
    return out


def main() -> None:
    print("downloading nasdaqlisted.txt...")
    nasdaq = parse_nasdaq(fetch(NASDAQ_URL))
    print(f"  {len(nasdaq)} symbols")

    print("downloading otherlisted.txt...")
    other = parse_other(fetch(OTHER_URL))
    print(f"  {len(other)} symbols")

    print("downloading SEC company_tickers.json...")
    cik_map = fetch_cik_map()
    print(f"  {len(cik_map)} ticker->CIK mappings")

    results = sorted(nasdaq + other, key=lambda r: r["ticker"])
    matched = 0
    for row in results:
        cik = cik_map.get(row["ticker"])
        if cik:
            row["cik"] = cik
            matched += 1
    print(f"  matched CIK on {matched}/{len(results)} symbols")

    payload = {
        "results": results,
        "status": "OK",
        "count": len(results),
        "source": "nasdaqtrader.com + sec.gov",
        "fetched_utc": datetime.now(timezone.utc).isoformat(),
    }

    OUT_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\nwrote {len(results)} tickers -> {OUT_FILE.resolve()}")


if __name__ == "__main__":
    main()
