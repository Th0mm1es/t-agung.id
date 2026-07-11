#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image, ImageOps
except ImportError:
    print("This script requires Pillow. Install it with: pip install pillow", file=sys.stderr)
    sys.exit(1)

VALID_EXTS = {".jpg", ".jpeg"}


def iter_images(root: Path, recursive: bool) -> Iterable[Path]:
    pattern = "**/*" if recursive else "*"
    for path in root.glob(pattern):
        if path.is_file() and path.suffix.lower() in VALID_EXTS:
            yield path


def clean_image(src: Path, max_width: int, quality: int, overwrite: bool, dry_run: bool) -> str:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        original_size = im.size
        icc_profile = im.info.get("icc_profile")

        if im.width > max_width:
            new_height = round(im.height * (max_width / im.width))
            im = im.resize((max_width, new_height), Image.Resampling.LANCZOS)

        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")

        target = src if overwrite else src.with_name(f"{src.stem}_clean{src.suffix.lower()}")
        action = f"{src} -> {target}"

        if dry_run:
            resized = "resized" if original_size != im.size else "kept"
            return f"[DRY-RUN] {action} | {original_size[0]}x{original_size[1]} -> {im.size[0]}x{im.size[1]} ({resized})"

        save_kwargs = {
            "format": "JPEG",
            "quality": quality,
            "optimize": True,
            "progressive": True,
        }
        if icc_profile:
            save_kwargs["icc_profile"] = icc_profile

        im.save(target, **save_kwargs)
        resized = "resized" if original_size != im.size else "kept"
        return f"[OK] {action} | {original_size[0]}x{original_size[1]} -> {im.size[0]}x{im.size[1]} ({resized}, metadata removed)"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Remove personal metadata from JPG/JPEG files and resize images wider than a limit."
    )
    parser.add_argument("path", nargs="?", default=".", help="Folder to scan, default is current directory")
    parser.add_argument("--max-width", type=int, default=1920, help="Resize only if image width is greater than this")
    parser.add_argument("--quality", type=int, default=90, help="JPEG quality for saved files")
    parser.add_argument("--recursive", action="store_true", help="Scan subfolders recursively")
    parser.add_argument("--overwrite", action="store_true", help="Replace original files in place")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing files")
    args = parser.parse_args()

    root = Path(args.path).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"Invalid folder: {root}", file=sys.stderr)
        return 1

    files = sorted(iter_images(root, args.recursive))
    if not files:
        print("No JPG/JPEG files found.")
        return 0

    for file in files:
        try:
            print(clean_image(file, args.max_width, args.quality, args.overwrite, args.dry_run))
        except Exception as exc:
            print(f"[ERROR] {file} | {exc}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
