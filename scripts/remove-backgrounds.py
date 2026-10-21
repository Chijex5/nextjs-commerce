#!/usr/bin/env python3
"""
Remove the background from a folder of product photos, locally and for free.

Dev only: this runs the open-source rembg model on your own machine, so it
has no usage limit but is too heavy for the server. In production the admin
"Remove background" toggle uses Cloudinary instead (see
lib/admin/background-removal.ts).

Setup (once):
    python3 -m venv .venv-images
    .venv-images/bin/pip install -r scripts/requirements-images.txt

Usage:
    .venv-images/bin/python scripts/remove-backgrounds.py [INPUT_DIR] [OUTPUT_DIR]

Defaults to product-photos/raw -> product-photos/processed. Each photo gives
    processed/white/<name>.jpg        1200x1600 on white, ready for the admin
    processed/transparent/<name>.png  1200x1600 cut-out, for banners and posts
Photos work best with one pair per photo on a plain surface. Set
REMBG_MODEL to try another rembg model if a photo comes out wrong.
"""

import os
import sys
from collections import deque
from pathlib import Path

# Same canvas as lib/image-constants.ts, so outputs drop straight into products.
WIDTH, HEIGHT = 1200, 1600
PADDING = 0.08
# Islands smaller than this share of the biggest one are specks, not product.
SPECK_RATIO = 0.04
MAX_WORKING_EDGE = 1600
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def refuse_in_production() -> None:
    if os.environ.get("NODE_ENV") == "production" or os.environ.get(
        "VERCEL_ENV"
    ) == "production":
        sys.exit("remove-backgrounds is a dev tool and won't run in production.")


def drop_specks(cutout):
    """Make small detached islands transparent and crop to what's left."""
    alpha = cutout.getchannel("A")
    w, h = cutout.size
    px = alpha.load()
    label = [[0] * w for _ in range(h)]
    areas = [0]
    for sy in range(h):
        for sx in range(w):
            if label[sy][sx] or px[sx, sy] <= 40:
                continue
            ident = len(areas)
            label[sy][sx] = ident
            queue, area = deque([(sx, sy)]), 0
            while queue:
                x, y = queue.popleft()
                area += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if (
                        0 <= nx < w
                        and 0 <= ny < h
                        and not label[ny][nx]
                        and px[nx, ny] > 40
                    ):
                        label[ny][nx] = ident
                        queue.append((nx, ny))
            areas.append(area)
    if len(areas) == 1:
        raise ValueError("no product found")

    keep = max(areas) * SPECK_RATIO
    box = [w, h, -1, -1]
    for y in range(h):
        row = label[y]
        for x in range(w):
            ident = row[x]
            if not ident:
                continue
            if areas[ident] < keep:
                px[x, y] = 0
            else:
                box = [min(box[0], x), min(box[1], y), max(box[2], x), max(box[3], y)]
    cutout.putalpha(alpha)
    return cutout.crop((box[0], box[1], box[2] + 1, box[3] + 1))


def on_canvas(product):
    from PIL import Image

    inner_w = round(WIDTH * (1 - 2 * PADDING))
    inner_h = round(HEIGHT * (1 - 2 * PADDING))
    scale = min(inner_w / product.width, inner_h / product.height)
    product = product.resize(
        (round(product.width * scale), round(product.height * scale)),
        Image.LANCZOS,
    )
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    canvas.alpha_composite(
        product, ((WIDTH - product.width) // 2, (HEIGHT - product.height) // 2)
    )
    return canvas


def main() -> None:
    refuse_in_production()
    try:
        from PIL import Image, ImageOps
        from rembg import new_session, remove
    except ImportError:
        sys.exit(
            "Missing packages. Run:\n"
            "  python3 -m venv .venv-images\n"
            "  .venv-images/bin/pip install -r scripts/requirements-images.txt"
        )

    src = Path(sys.argv[1] if len(sys.argv) > 1 else "product-photos/raw")
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "product-photos/processed")
    photos = sorted(p for p in src.glob("*") if p.suffix.lower() in EXTENSIONS)
    if not photos:
        sys.exit(f"No photos found in {src}/")
    (out / "white").mkdir(parents=True, exist_ok=True)
    (out / "transparent").mkdir(parents=True, exist_ok=True)

    # u2net did best on our photos (props like boxes in shot); override with
    # REMBG_MODEL=isnet-general-use etc. First run downloads it into ~/.rembg.
    session = new_session(os.environ.get("REMBG_MODEL", "u2net"))
    failed = 0
    for i, photo in enumerate(photos, 1):
        print(f"[{i}/{len(photos)}] {photo.name}", flush=True)
        try:
            image = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
            image.thumbnail((MAX_WORKING_EDGE, MAX_WORKING_EDGE))
            cutout = remove(image, session=session, post_process_mask=True)
            canvas = on_canvas(drop_specks(cutout.convert("RGBA")))
            canvas.save(out / "transparent" / f"{photo.stem}.png")
            white = Image.new("RGB", canvas.size, (255, 255, 255))
            white.paste(canvas, mask=canvas.getchannel("A"))
            white.save(out / "white" / f"{photo.stem}.jpg", quality=92)
        except Exception as error:  # keep going so one bad photo doesn't stop the batch
            failed += 1
            print(f"  skipped: {error}", file=sys.stderr)

    print(f"Done: {len(photos) - failed} saved to {out}/, {failed} skipped.")


if __name__ == "__main__":
    main()
