"""Side-by-side comparison of A vs B LOS."""
import json
from pathlib import Path

A_TSV = Path("/tmp/los_compare/A.tsv")
B_JSON = Path("/tmp/los_compare/B.json")
OUT = Path("/tmp/los_compare/REPORT.md")

# Module title from current DB (queried separately, hardcoded for the report)
TITLES: dict[str, str] = {}
with open("/tmp/los_compare/titles.tsv") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) >= 2:
            TITLES[parts[0]] = parts[1]


def load_a() -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for line in A_TSV.read_text().splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 5:
            continue
        mod, _code, bloom, sort_order, desc = parts[0], parts[1], int(parts[2]), int(parts[3]), parts[4]
        out.setdefault(mod, []).append({"description": desc, "bloom_level": bloom, "sort_order": sort_order})
    return out


def load_b() -> dict[str, list[dict]]:
    raw = json.loads(B_JSON.read_text())
    out: dict[str, list[dict]] = {}
    for r in raw["results"]:
        if "los" in r:
            out[r["module_code"]] = r["los"]
        else:
            out[r["module_code"]] = [{"description": f"[ERROR] {r.get('error','no los key')}", "bloom_level": 0}]
    return out


def main() -> None:
    a = load_a()
    b = load_b()
    modules = sorted(set(list(a.keys()) + list(b.keys())))

    lines: list[str] = []
    lines.append("# LOS Comparison — A (existing seed) vs B (Claude-generated)\n")
    lines.append(f"**A**: 27 modules, mean {sum(len(v) for v in a.values())/27:.1f} LOS/module  \n")
    lines.append(f"**B**: 27 modules, mean {sum(len(v) for v in b.values())/27:.1f} LOS/module  \n\n")

    for mod in modules:
        title = TITLES.get(mod, "?")
        a_los = a.get(mod, [])
        b_los = b.get(mod, [])
        lines.append(f"## {mod} — {title}\n")
        lines.append(f"_A: {len(a_los)} LOS · B: {len(b_los)} LOS_\n\n")

        lines.append("### A (current DB)\n")
        for i, lo in enumerate(a_los, 1):
            lines.append(f"{i}. (B{lo['bloom_level']}) {lo['description']}\n")

        lines.append("\n### B (Claude Sonnet 4.6)\n")
        for i, lo in enumerate(b_los, 1):
            lines.append(f"{i}. (B{lo['bloom_level']}) {lo['description']}\n")
        lines.append("\n---\n\n")

    OUT.write_text("".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}, {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
