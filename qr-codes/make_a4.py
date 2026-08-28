#!/usr/bin/env python3
"""Build a print-ready A4 QR sticker from a URL.

Usage:
    python3 qr-codes/make_a4.py https://easysort.org/argo/jyllinge
    python3 qr-codes/make_a4.py https://easysort.org/provas/vojens --brand "Provas · Easysort"

Writes to files/{organisation}_{location}/:
    qr.svg
    sticker.html
    sticker_{location}.pdf     CMYK, 216 × 303 mm (A4 + 3 mm bleed)
    preview.png                finished 210 × 297 mm, for review
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

import qrcode
import qrcode.image.svg
from qrcode.constants import ERROR_CORRECT_H

HERE = Path(__file__).resolve().parent
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

# Finished sticker is A4. File includes 3 mm bleed on every side (Lasertryk).
BLEED_MM = 3
FINISHED_W_MM = 210
FINISHED_H_MM = 297
DOC_W_MM = FINISHED_W_MM + BLEED_MM * 2
DOC_H_MM = FINISHED_H_MM + BLEED_MM * 2
DOC_W_PT = DOC_W_MM * 72 / 25.4
DOC_H_PT = DOC_H_MM * 72 / 25.4

TEMPLATE = """<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<title>A4 QR – {display_url}</title>
<style>
    @page {{ size: {doc_w}mm {doc_h}mm; margin: 0; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html, body {{ width: {doc_w}mm; height: {doc_h}mm; }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
        color: #111111;
        background: #fff;
        -webkit-font-smoothing: antialiased;
    }}
    .page {{
        width: {doc_w}mm;
        height: {doc_h}mm;
        /* 3 mm bleed + 6 mm from the finished edge to the frame. */
        padding: 9mm;
    }}
    .frame {{
        width: 100%;
        height: 100%;
        border: 2.2mm solid #16a34a;
        border-radius: 6mm;
        padding: 32mm 24.3mm 10mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }}
    h1 {{
        font-size: 12mm;
        font-weight: 800;
        letter-spacing: -0.045em;
        line-height: 1.12;
        width: 145mm;
    }}
    .qr {{
        width: 145mm;
        height: 145mm;
        margin: 9mm 0 10mm;
        display: block;
        object-fit: fill;
    }}
    .how {{
        font-size: 7mm;
        font-weight: 500;
        line-height: 1.3;
        color: #3f3f46;
        width: 145mm;
    }}
    .url {{
        margin-top: 12mm;
        font-size: 5.8mm;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: #15803d;
        width: 145mm;
    }}
    .brand {{
        margin-top: auto;
        font-size: 4mm;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #a1a1aa;
    }}
</style>
</head>
<body>
<div class="page">
    <div class="frame">
        <h1>Tag billede af dit affald<br>og få den rigtige container.</h1>
        <img class="qr" src="{qr_name}" alt="QR-kode til sorteringsguiden">
        <p class="how">Scan koden og tag et billede af dit affald,<br>så viser guiden den rigtige container.</p>
        <p class="url">{display_url}</p>
        <p class="brand">{brand}</p>
    </div>
</div>
</body>
</html>
"""


def slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        host = urlparse(url).netloc.replace("www.", "")
        return host.replace(".", "-")
    return path.replace("/", "_")


def display_url(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.replace("www.", "")
    path = parsed.path.rstrip("/")
    return f"{host}{path}"


def infer_brand(url: str, brand: str | None) -> str:
    if brand:
        return brand
    path = urlparse(url).path.lower()
    if "/argo/" in path or path.startswith("argo/"):
        return "Argo · Easysort"
    if "/provas/" in path or path.startswith("provas/"):
        return "Provas · Easysort"
    return "Easysort"


def write_qr(url: str, dest: Path) -> None:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(dest)
    # qrcode writes width="37mm", which Chrome print keeps. Drop it so CSS can scale.
    svg = dest.read_text(encoding="utf-8")
    svg = re.sub(r'\s(width|height)="[^"]+"', "", svg, count=2)
    dest.write_text(svg, encoding="utf-8")


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit(f"Command failed: {' '.join(cmd)}")


def chrome_pdf(html: Path, pdf: Path) -> None:
    if not CHROME.exists():
        raise SystemExit(f"Google Chrome not found at {CHROME}")
    run([
        str(CHROME),
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf}",
        html.resolve().as_uri(),
    ])


def to_cmyk(src: Path, dest: Path) -> None:
    gs = shutil.which("gs")
    if not gs:
        raise SystemExit("Ghostscript (gs) is required for the CMYK print PDF")
    run([
        gs,
        "-dSAFER", "-dBATCH", "-dNOPAUSE",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/prepress",
        "-dEmbedAllFonts=true",
        "-dSubsetFonts=true",
        "-sColorConversionStrategy=CMYK",
        "-dProcessColorModel=/DeviceCMYK",
        "-dOverrideICC",
        "-dFIXEDMEDIA",
        "-dPDFFitPage",
        f"-dDEVICEWIDTHPOINTS={DOC_W_PT:.6f}",
        f"-dDEVICEHEIGHTPOINTS={DOC_H_PT:.6f}",
        f"-sOutputFile={dest}",
        str(src),
    ])


def preview_png(pdf: Path, dest: Path) -> None:
    pdftocairo = shutil.which("pdftocairo")
    if not pdftocairo:
        raise SystemExit("pdftocairo is required for the review preview")
    stem = dest.with_suffix("")
    run([pdftocairo, "-png", "-singlefile", "-r", "144", str(pdf), str(stem)])
    raw = dest
    from PIL import Image
    image = Image.open(raw).convert("RGB")
    bleed_px = round(BLEED_MM / 25.4 * 144)
    trimmed = image.crop((bleed_px, bleed_px, image.width - bleed_px, image.height - bleed_px))
    trimmed.save(dest)


def build(url: str, brand: str | None, slug: str | None) -> Path:
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    location = urlparse(url).path.rstrip("/").split("/")[-1]
    slug = slug or slug_from_url(url)
    brand = infer_brand(url, brand)
    shown = display_url(url)

    out_dir = HERE / "files" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    qr_path = out_dir / "qr.svg"
    html_path = out_dir / "sticker.html"
    rgb_pdf = out_dir / "sticker-rgb.pdf"
    cmyk_pdf = out_dir / f"sticker_{location}.pdf"
    preview = out_dir / "preview.png"
    (out_dir / "sticker.pdf").unlink(missing_ok=True)

    write_qr(url, qr_path)
    html_path.write_text(
        TEMPLATE.format(
            display_url=shown,
            brand=brand,
            qr_name=qr_path.name,
            doc_w=DOC_W_MM,
            doc_h=DOC_H_MM,
        ),
        encoding="utf-8",
    )
    chrome_pdf(html_path, rgb_pdf)
    to_cmyk(rgb_pdf, cmyk_pdf)
    preview_png(cmyk_pdf, preview)
    rgb_pdf.unlink(missing_ok=True)
    print(f"QR       {qr_path}")
    print(f"HTML     {html_path}")
    print(f"PDF      {cmyk_pdf}  ({DOC_W_MM:.0f} × {DOC_H_MM:.0f} mm, CMYK)")
    print(f"Preview  {preview}")
    return preview


def main() -> None:
    parser = argparse.ArgumentParser(description="Make an A4 QR sticker from a URL")
    parser.add_argument("url", nargs="?", help="Full site URL, e.g. https://easysort.org/argo/jyllinge")
    parser.add_argument("--brand", help='Footer, e.g. "Argo · Easysort"')
    parser.add_argument("--slug", help="Filename stem. Default is taken from the URL path.")
    parser.add_argument("--known", action="store_true", help="Build Roskilde, Jyllinge and Vojens")
    args = parser.parse_args()
    known = [
        "https://easysort.org/argo/roskilde",
        "https://easysort.org/argo/jyllinge",
        "https://easysort.org/provas/vojens",
    ]
    if args.known:
        for url in known:
            print(f"\n=== {url} ===")
            build(url, None, None)
        return
    if not args.url:
        parser.error("url is required unless you pass --known")
    build(args.url, args.brand, args.slug)


if __name__ == "__main__":
    main()
