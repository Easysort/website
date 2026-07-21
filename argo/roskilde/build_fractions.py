#!/usr/bin/env python3
"""Convert fractions.md into the worker catalog (fraction_to_items.json).

- Keys are the EXACT fraction names used in roskilde-genbrugsplads.json so the
  guide can slugify a classified fraction straight onto a map container.
- Categories the map has no container for (e.g. chemicals) are kept as
  catalog-only fractions; the guide will route those to "ask the staff".
- A few individual items are re-routed to a more specific map fraction than
  their markdown category (e.g. fridges -> Kølemøbler).

Run:  python3 build_fractions.py
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
MD_FILE = HERE / "fractions.md"
MAP_FILE = HERE / "roskilde-genbrugsplads.json"
OUT_FILE = HERE / "fraction_to_items.json"

# markdown category -> map fraction name (None = no container on the map;
# kept as a catalog-only fraction so the guide shows "ask the staff").
CATEGORY_TO_MAP = {
    "Asbest": "Eternit",
    "Batterier": "Batterier",
    "Beton": "Beton",
    "Blød plast": "Plastflasker, dunke og folie",
    "Bøger": "Bøger",
    "Deponi": "Dæk",
    "El-pærer": "Lysstofrør og sparepærer",
    "Flamingo": "Flamingo",
    "Gips": "Gipsplader",
    "Glas": "Flasker",
    "Haveaffald": "Haveaffald",
    "Hård plast": "Hård plast og PVC",
    "Indendørs træ": "Indendørs træ",
    "Klinisk risikoaffald": None,
    "Ledninger": "El-ledninger og el-kabler",
    "Lysstofrør": "Lysstofrør og sparepærer",
    "Maling, olie og kemikalier": None,
    "Mellemstort elektronik": "Store husholdnings apperater",
    "Metal": "Jern og metal",
    "Mineraluld og glasuld": "Mineral- og Glas",
    "Mursten og tegl": "Mursten, tegl og gasbeton",
    "Pap": "Pap",
    "Papir": "Aviser",
    "Polstrede møbler": "Polstrede møbler",
    "Printerpatroner": "Toner og farvepatroner",
    "Restaffald": "Uegnet til Genbrug",
    "Sanitet": "Sanitet og porcelæn",
    "Småt elektronik": "Små husholdnings apparater",
    "Stort elektronik": "Store husholdnings apperater",
    "Sutter": "Sutter",
    "Tagpap": None,
    "Tekstiler": "Tekstiler",
    "Trykflasker": "Trykbeholdere",
    "TV og skærme": "Skærme og monitorer",
    "Tøj til genbrug": "Tøj til Genbrug",
    "Udendørs træ": "Udendørs Træ",
    "Uegnet til genanvendelse": "Uegnet til Genbrug",
    "Vinduer": "Vinduesglas",
}

# individual item -> map fraction (wins over the category mapping above).
ITEM_OVERRIDES = {
    "Airconditionanlæg": "Kølemøbler",
    "Fryser": "Kølemøbler",
    "Kummefryser": "Kølemøbler",
    "Køle/fryseskab": "Kølemøbler",
    "Køleskab": "Kølemøbler",
    "Køleboks med ledning": "Kølemøbler",
    "Hårde hvidevarer, køleudstyr": "Kølemøbler",
    # Argo's own guide files laptops/computers under småt elektronik, not
    # the mellemstort category they sit in here.
    "Bærbar computer": "Små husholdnings apparater",
    "Computer": "Små husholdnings apparater",
    "PC": "Små husholdnings apparater",
    "Computerudstyr": "Små husholdnings apparater",
    "Jord": "Jord",
    "Blomstermuld": "Jord",
    "Aske": "Aske",
    "Asfalt": "Asfalt",
    "Vindue": "Vinduer i ramme",
}

LINE_RE = re.compile(r"^-\s*\*\*(.+?)\s*\((.*?)\):\*\*\s*(.*)$")


def parse_md(text):
    categories = {}
    for line in text.splitlines():
        m = LINE_RE.match(line.strip())
        if not m:
            continue
        name = m.group(1).strip()
        items = [i.strip() for i in m.group(3).split(";") if i.strip()]
        categories[name] = items
    return categories


def map_fraction_names():
    data = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    return {
        f["name"]["da"].strip()
        for f in data.get("fractions", [])
        if f.get("name", {}).get("da", "").strip()
    }


def main():
    categories = parse_md(MD_FILE.read_text(encoding="utf-8"))
    map_names = map_fraction_names()

    problems = []

    # sanity: every parsed category must be in our mapping table
    for cat in categories:
        if cat not in CATEGORY_TO_MAP:
            problems.append(f"Category not in mapping table: {cat!r}")
    # sanity: every non-None target must exist on the map
    for cat, target in CATEGORY_TO_MAP.items():
        if target is not None and target not in map_names:
            problems.append(f"Mapping target not on map: {cat!r} -> {target!r}")
    for item, target in ITEM_OVERRIDES.items():
        if target not in map_names:
            problems.append(f"Override target not on map: {item!r} -> {target!r}")

    if problems:
        print("MAPPING PROBLEMS (fix build_fractions.py):")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    catalog = {}

    def add(fraction, item):
        catalog.setdefault(fraction, [])
        if item not in catalog[fraction]:
            catalog[fraction].append(item)

    catalog_only = set()
    for cat, items in categories.items():
        target = CATEGORY_TO_MAP[cat]
        if target is None:
            target = cat  # catalog-only fraction -> "ask staff"
            catalog_only.add(cat)
        for item in items:
            add(ITEM_OVERRIDES.get(item, target), item)

    # ensure every map fraction is selectable, even if no items landed on it
    seeded = []
    for name in sorted(map_names):
        if name not in catalog:
            catalog[name] = [name]
            seeded.append(name)

    ordered = {k: catalog[k] for k in sorted(catalog)}
    OUT_FILE.write_text(
        json.dumps({"site": ordered}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total_items = sum(len(v) for v in ordered.values())
    print(f"Wrote {OUT_FILE.name}: {len(ordered)} fractions, {total_items} items.\n")
    print(f"Catalog-only (no map container -> 'ask staff'): {sorted(catalog_only)}")
    print(f"Seeded map fractions (no items from md, using name as placeholder): {seeded}")
    covered = {CATEGORY_TO_MAP[c] for c in categories if CATEGORY_TO_MAP[c]}
    covered |= set(ITEM_OVERRIDES.values())
    uncovered = sorted(map_names - covered)
    print(f"Map fractions with only seeded/placeholder items: {uncovered}")


if __name__ == "__main__":
    main()
