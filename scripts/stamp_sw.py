#!/usr/bin/env python3
"""Stamp sw.js with a version derived from the content of every cached file.

Run after any change to the app (`npm run stamp`, or `npm run release` which also rebuilds the data and runs
the tests). Browsers only fetch a new version of the app when sw.js changes, so a stale stamp would mean
users keep the old files: tests/pwa.test.mjs fails if the stamp doesn't match the files.

Hash = sha1 over "path\\nsha1(file)\\n" for each cached path, sorted by path.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "sw.js"


def shell_paths(sw_text: str):
    block = re.search(r"const SHELL = \[(.*?)\];", sw_text, re.S).group(1)
    return [p for p in re.findall(r"'([^']+)'", block) if p != "./"]


def version_for(paths):
    h = hashlib.sha1()
    for p in sorted(paths):
        file_hash = hashlib.sha1((ROOT / p).read_bytes()).hexdigest()
        h.update(f"{p}\n{file_hash}\n".encode())
    return h.hexdigest()[:12]


def main():
    text = SW.read_text(encoding="utf-8")
    paths = shell_paths(text)
    missing = [p for p in paths if not (ROOT / p).is_file()]
    if missing:
        sys.exit(f"sw.js lists files that don't exist: {missing}")
    version = version_for(paths)
    new = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", text)
    if new != text:
        SW.write_text(new, encoding="utf-8")
    print(f"sw.js stamped: {version} ({len(paths)} files)")


if __name__ == "__main__":
    main()
