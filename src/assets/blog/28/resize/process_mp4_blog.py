#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable

VALID_EXTS = {".mp4"}


def iter_videos(root: Path, recursive: bool) -> Iterable[Path]:
    pattern = "**/*" if recursive else "*"
    for path in root.glob(pattern):
        if path.is_file() and path.suffix.lower() in VALID_EXTS:
            yield path


def require_binary(name: str) -> None:
    if shutil.which(name) is None:
        print(f"Missing dependency: {name}. Install FFmpeg so both ffmpeg and ffprobe are available.", file=sys.stderr)
        sys.exit(1)


def probe_width(path: Path) -> int:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width",
        "-of", "json",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)
    return int(data["streams"][0]["width"])


def make_output_path(src: Path, overwrite: bool) -> Path:
    return src if overwrite else src.with_name(f"{src.stem}_clean{src.suffix.lower()}")


def transcode(src: Path, dst: Path, max_width: int, crf: int, preset: str, dry_run: bool) -> str:
    width = probe_width(src)
    needs_resize = width > max_width
    resize_expr = f"scale='min({max_width},iw)':-2:flags=lanczos"
    action = f"{src} -> {dst}"

    if dry_run:
        status = "resize to HD width" if needs_resize else "keep size"
        return f"[DRY-RUN] {action} | width {width} -> {min(width, max_width)} ({status}, metadata stripped)"

    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        "-map", "0:v:0?",
        "-map", "0:a?",
        "-map", "0:s?",
        "-map_metadata", "-1",
        "-movflags", "+faststart",
        "-vf", resize_expr,
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-c:s", "copy",
        str(dst),
    ]
    subprocess.run(cmd, check=True)
    status = "resized" if needs_resize else "kept"
    return f"[OK] {action} | width {width} -> {min(width, max_width)} ({status}, metadata removed)"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Remove metadata from MP4 files and resize videos wider than a limit."
    )
    parser.add_argument("path", nargs="?", default=".", help="Folder to scan, default is current directory")
    parser.add_argument("--max-width", type=int, default=1280, help="Resize only if video width is greater than this")
    parser.add_argument("--crf", type=int, default=23, help="x264 quality factor, lower is higher quality")
    parser.add_argument("--preset", default="medium", help="x264 preset, e.g. veryfast, medium, slow")
    parser.add_argument("--recursive", action="store_true", help="Scan subfolders recursively")
    parser.add_argument("--overwrite", action="store_true", help="Replace original files in place")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing files")
    args = parser.parse_args()

    require_binary("ffmpeg")
    require_binary("ffprobe")

    root = Path(args.path).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"Invalid folder: {root}", file=sys.stderr)
        return 1

    files = sorted(iter_videos(root, args.recursive))
    if not files:
        print("No MP4 files found.")
        return 0

    for src in files:
        dst = make_output_path(src, args.overwrite)
        temp_dst = dst if not args.overwrite else src.with_name(f"{src.stem}.__tmp_clean__.mp4")
        try:
            message = transcode(src, temp_dst, args.max_width, args.crf, args.preset, args.dry_run)
            if args.overwrite and not args.dry_run:
                temp_dst.replace(src)
            print(message)
        except Exception as exc:
            if args.overwrite and temp_dst.exists() and temp_dst != src:
                temp_dst.unlink(missing_ok=True)
            print(f"[ERROR] {src} | {exc}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
