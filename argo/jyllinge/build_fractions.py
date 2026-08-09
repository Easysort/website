#!/usr/bin/env python3
"""Build Jyllinge's worker catalog from Argo's shared fraction list."""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
MD_FILE = HERE.parent / "roskilde" / "fractions.md"
MAP_FILE = HERE / "jyllinge-genbrugsplads.json"
OUT_FILE = HERE / "fraction_to_items.json"

# Source category -> exact Danish name in jyllinge-genbrugsplads.json.
# None keeps a category in the classifier catalog but routes users to staff.
CATEGORY_TO_MAP = {
    "Asbest": "Asbest",
    "Batterier": "Små batterier",
    "Beton": "Beton",
    "Blød plast": "Blød plast og plastikdunke",
    "Bøger": "Bøger",
    "Deponi": "Dæk",
    "El-pærer": "Elpærer",
    "Flamingo": "Flamingo",
    "Gips": "Gips",
    "Glas": "Glas",
    "Haveaffald": "Haveaffald",
    "Hård plast": "Hård plast og PVC",
    "Indendørs træ": "Indendørs træ",
    "Klinisk risikoaffald": None,
    "Ledninger": "Ledning og kabler",
    "Lysstofrør": "Lysstofrør",
    "Maling, olie og kemikalier": "Maling",
    "Mellemstort elektronik": "Mellemstort elektronik",
    "Metal": "Metal",
    "Mineraluld og glasuld": "Mineral- og glasuld",
    "Mursten og tegl": "Mursten og tegl",
    "Pap": "Pap",
    "Papir": "Papir",
    "Polstrede møbler": "Polstrede møbler",
    "Printerpatroner": "Printerpatroner",
    "Restaffald": "Uegnet til genbrug",
    "Sanitet": "Sanitet",
    "Småt elektronik": "Småt elektronik",
    "Stort elektronik": "Stort elektronik",
    "Sutter": None,
    "Tagpap": None,
    "Tekstiler": "Tekstiler",
    "Trykflasker": "Trykflasker",
    "TV og skærme": "Skærme og TV",
    "Tøj til genbrug": None,
    "Udendørs træ": "Udendørs træ",
    "Uegnet til genanvendelse": "Deponi",
    "Vinduer": "Fladt glas",
}

ITEM_OVERRIDES = {
    "Akkumulator": "Bilbatterier",
    "Akkumulator fra biler": "Bilbatterier",
    "Akkumulator fra havetraktor": "Bilbatterier",
    "Akkumulator fra motorcykler": "Bilbatterier",
    "Batteri fra bil": "Bilbatterier",
    "Batteri fra havetraktor": "Bilbatterier",
    "Batteri fra motorcykel": "Bilbatterier",
    "Airconditionanlæg": "Køleudstyr",
    "Fryser": "Køleudstyr",
    "Hårde hvidevarer, køleudstyr": "Køleudstyr",
    "Kummefryser": "Køleudstyr",
    "Køle/fryseskab": "Køleudstyr",
    "Køleboks med ledning": "Køleudstyr",
    "Køleskab": "Køleudstyr",
    "Jord": "Jord",
    "Blomstermuld": "Jord",
    "Aske": "Aske",
    "Asfalt": "Asfalt",
    "Vindue": "Vinduer i ramme",
}

LINE_RE = re.compile(r"^-\s*\*\*(.+?)\s*\((.*?)\):\*\*\s*(.*)$")


def parse_categories(text):
    categories = {}
    for line in text.splitlines():
        match = LINE_RE.match(line.strip())
        if match:
            categories[match.group(1).strip()] = [
                item.strip() for item in match.group(3).split(";") if item.strip()
            ]
    return categories


def main():
    categories = parse_categories(MD_FILE.read_text(encoding="utf-8"))
    map_data = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    map_names = {
        fraction["name"]["da"].strip()
        for fraction in map_data.get("fractions", [])
        if fraction.get("name", {}).get("da", "").strip()
    }

    problems = []
    problems.extend(
        f"Category not mapped: {name!r}"
        for name in categories
        if name not in CATEGORY_TO_MAP
    )
    targets = {target for target in CATEGORY_TO_MAP.values() if target}
    targets.update(ITEM_OVERRIDES.values())
    problems.extend(
        f"Target is not on the map: {target!r}"
        for target in sorted(targets - map_names)
    )
    if problems:
        print("\n".join(problems))
        sys.exit(1)

    catalog = {}

    def add(fraction, item):
        items = catalog.setdefault(fraction, [])
        if item not in items:
            items.append(item)

    for category, items in categories.items():
        target = CATEGORY_TO_MAP[category] or category
        for item in items:
            add(ITEM_OVERRIDES.get(item, target), item)

    # Every visible map fraction must remain selectable by the classifier.
    for name in map_names:
        if name not in catalog:
            catalog[name] = [name]

    ordered = {name: catalog[name] for name in sorted(catalog)}
    OUT_FILE.write_text(
        json.dumps({"site": ordered}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUT_FILE.name}: {len(ordered)} fractions, "
        f"{sum(len(items) for items in ordered.values())} items."
    )


if __name__ == "__main__":
    main()
