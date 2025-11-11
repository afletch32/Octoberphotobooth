#!/usr/bin/env python3
"""
Add a local overlay image to the Halloween theme manifest so it appears in the booth.

Usage:
  python tools/add-overlay.py path/to/image.png

The script copies the file into assets/holidays/fall/halloween/overlays,
updates overlays.json, and reminds you to push the change.
"""

import json
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "assets/holidays/fall/halloween/overlays"
MANIFEST = FOLDER / "overlays.json"


def main(src: str) -> None:
    source = Path(src).expanduser().resolve()
    if not source.exists():
        print(f"✖ Source file not found: {source}", file=sys.stderr)
        sys.exit(1)
    if source.suffix.lower() not in {".png"}:
        print(f"✖ Only PNG overlays are supported (got {source.suffix})", file=sys.stderr)
        sys.exit(1)

    dest = FOLDER / source.name
    if dest.exists():
        print(f"⚠ Overlay {dest.name} already exists; overwriting.")
    shutil.copy2(source, dest)
    print(f"✓ Copied {source.name} to {dest}")

    existing = []
    if MANIFEST.exists():
        existing = json.loads(MANIFEST.read_text())
    if source.name not in existing:
        existing.append(source.name)
        existing = sorted(existing, key=str.lower)
        MANIFEST.write_text(json.dumps(existing, indent=2) + "\n")
        print(f"✓ Updated {MANIFEST.relative_to(ROOT)} with {source.name}")
    else:
        print("ℹ Manifest already listed this filename, leaving as-is.")

    print("👉 Run `git add` and commit the changes, then push to deploy.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python tools/add-overlay.py path/to/image.png", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
