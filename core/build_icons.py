"""Build the home-screen icons for the sorting guides from logo.png.

The logo is a black wordmark on transparency, so we use its alpha as a stencil
and paint it white on the brand green. Run from the repo root after changing
the logo:

    uv run --with pillow --no-project python core/build_icons.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "logo.png"
OUT_DIR = ROOT / "icons"

BRAND_GREEN = (22, 163, 74)
WORDMARK_WIDTH_RATIO = 0.70
# Android crops maskable icons to a shape inside the central 80%, so that
# variant gets a smaller wordmark and keeps the corners as bleed.
MASKABLE_WIDTH_RATIO = 0.55

# iOS refuses icons with an alpha channel and falls back to a generated
# monogram, so every icon here is written as opaque RGB.
SIZES = {
    "icon-192.png": (192, WORDMARK_WIDTH_RATIO),
    "icon-512.png": (512, WORDMARK_WIDTH_RATIO),
    "icon-maskable-512.png": (512, MASKABLE_WIDTH_RATIO),
    "apple-touch-icon.png": (180, WORDMARK_WIDTH_RATIO),
}


def build(size: int, width_ratio: float) -> Image.Image:
    logo = Image.open(SOURCE).convert("RGBA")
    logo = logo.crop(logo.getbbox())

    width = round(size * width_ratio)
    height = round(width * logo.height / logo.width)
    logo = logo.resize((width, height), Image.LANCZOS)

    wordmark = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    wordmark.putalpha(logo.getchannel("A"))

    icon = Image.new("RGB", (size, size), BRAND_GREEN)
    icon.paste(wordmark, ((size - width) // 2, (size - height) // 2), wordmark)
    return icon


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for name, (size, width_ratio) in SIZES.items():
        build(size, width_ratio).save(OUT_DIR / name, optimize=True)
        print(f"wrote {OUT_DIR.relative_to(ROOT) / name} ({size}x{size})")


if __name__ == "__main__":
    main()
