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

BRAND_GREEN = (22, 163, 74, 255)
# Keep the wordmark inside the central 80% circle that Android crops maskable
# icons to; 70% width leaves room to spare for this 5:1 wordmark.
WORDMARK_WIDTH_RATIO = 0.70
SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}


def build(size: int) -> Image.Image:
    logo = Image.open(SOURCE).convert("RGBA")
    logo = logo.crop(logo.getbbox())

    width = round(size * WORDMARK_WIDTH_RATIO)
    height = round(width * logo.height / logo.width)
    logo = logo.resize((width, height), Image.LANCZOS)

    wordmark = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    wordmark.putalpha(logo.getchannel("A"))

    icon = Image.new("RGBA", (size, size), BRAND_GREEN)
    icon.alpha_composite(wordmark, ((size - width) // 2, (size - height) // 2))
    return icon


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for name, size in SIZES.items():
        build(size).save(OUT_DIR / name, optimize=True)
        print(f"wrote {OUT_DIR.relative_to(ROOT) / name} ({size}x{size})")


if __name__ == "__main__":
    main()
