#!/usr/bin/env python3
"""Split each source JSON in ./Sources into one JSON file per section.

Each file in Sources/ is a dict of {section header: section dict}. For every
such file, e.g. ``Sources/American History Connecting with the Past.json``,
this script creates a folder with the same name (minus ``.json``) containing
one file per section, e.g. ``Deﬁ ning American War Aims.json``, then removes
the original file. The original is only removed after every section has been
written successfully, and a file that is not valid JSON is left untouched.

Usage:
    python split_sources.py                 # splits ./Sources next to this script
    python split_sources.py path/to/Sources
    python split_sources.py --dry-run       # show what would happen, change nothing
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

# Characters that are illegal in Windows filenames (and control characters).
ILLEGAL_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}
MAX_NAME_LENGTH = 120
# Windows rejects paths over 260 characters, so keep full paths comfortably under that.
MAX_PATH_LENGTH = 240
TMP_NAME = "_tmp_split"
FALLBACK_NAME = "untitled"


def safe_filename(header: str, max_length: int = MAX_NAME_LENGTH) -> str:
    """Turn a section header into a filename stem that is valid on Windows/macOS/Linux."""
    name = ILLEGAL_CHARS.sub("", header)
    name = re.sub(r"\s+", " ", name).strip().rstrip(". ")
    name = name[:max_length].rstrip(". ")
    if not name:
        return FALLBACK_NAME
    if name.split(".")[0].upper() in RESERVED_NAMES:
        name = f"_{name}"
    return name


def unique_name(stem: str, used: set) -> str:
    """Return a stem not yet in `used` (case-insensitive), adding ' (2)', ' (3)'... if needed."""
    candidate, n = stem, 2
    while candidate.lower() in used:
        candidate = f"{stem} ({n})"
        n += 1
    used.add(candidate.lower())
    return candidate


def split_file(path: Path, dry_run: bool) -> bool:
    """Split one source file. Returns True on success, False if it was skipped."""
    try:
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"SKIP  {path.name}: not valid JSON ({e})")
        return False

    if not isinstance(data, dict):
        print(f"SKIP  {path.name}: top level is {type(data).__name__}, expected an object")
        return False

    target = path.with_suffix("")
    if target.exists():
        print(f"SKIP  {path.name}: '{target.name}' already exists")
        return False

    # Leave room for the folder path, ".json", and a possible " (NN)" suffix.
    # (use whichever is longer: the temp folder or the final folder it is renamed to).
    resolved = path.resolve()
    folder_len = max(len(str(resolved.with_name(TMP_NAME))), len(str(resolved.with_suffix(""))))
    max_stem = max(20, min(MAX_NAME_LENGTH, MAX_PATH_LENGTH - folder_len - len(".json") - len(" (99)") - 1))

    used: set = set()
    sections = [
        (unique_name(safe_filename(header, max_stem), used), section) for header, section in data.items()
    ]

    print(f"SPLIT {path.name} -> {target.name}/ ({len(sections)} files)")
    if dry_run:
        for stem, _ in sections:
            print(f"        {stem}.json")
        return True

    # Write everything to a temp folder first so a failure never loses the original.
    tmp = path.with_name(TMP_NAME)
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir()
    try:
        for stem, section in sections:
            with (tmp / f"{stem}.json").open("w", encoding="utf-8", newline="\n") as out:
                json.dump(section, out, ensure_ascii=False, indent=4)
                out.write("\n")
        tmp.rename(target)
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise
    path.unlink()
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Split each Sources/*.json into a folder of per-section JSON files.")
    parser.add_argument(
        "sources_dir",
        nargs="?",
        default=Path(__file__).resolve().parent / "Sources",
        type=Path,
        help="folder containing the source JSON files (default: Sources next to this script)",
    )
    parser.add_argument("--dry-run", action="store_true", help="print what would happen without changing anything")
    args = parser.parse_args()

    if not args.sources_dir.is_dir():
        print(f"Sources folder not found: {args.sources_dir}", file=sys.stderr)
        return 2

    files = sorted(p for p in args.sources_dir.glob("*.json") if p.is_file())
    if not files:
        print(f"No .json files found in {args.sources_dir}")
        return 0

    # Remove leftovers from an earlier failed run (including the older temp-folder name).
    if not args.dry_run:
        for leftover in [args.sources_dir / TMP_NAME, *args.sources_dir.glob("*.tmp_split")]:
            if leftover.is_dir():
                shutil.rmtree(leftover, ignore_errors=True)

    results = []
    for p in files:
        try:
            results.append(split_file(p, args.dry_run))
        except OSError as e:
            print(f"FAIL  {p.name}: {e} (original left untouched)")
            results.append(False)
    done, skipped = results.count(True), results.count(False)
    print(f"\n{'Would split' if args.dry_run else 'Split'} {done} file(s); skipped {skipped}.")
    return 1 if skipped else 0


if __name__ == "__main__":
    sys.exit(main())
