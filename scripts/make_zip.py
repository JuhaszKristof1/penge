#!/usr/bin/env python3
"""AutoFit AI – letölthető ZIP archívum készítése.

A projekt gyökérkönyvtárából összegyűjti a forrásfájlokat (src, public, scripts,
konfigurációk), kihagyja a generált és nagy könyvtárakat (node_modules, .next,
.git), majd kiírja a public/autofit-ai.zip fájlt.

Használat:  python3 scripts/make_zip.py
"""

import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "autofit-ai.zip")
PREFIX = "autofit-ai"

# Egész könyvtárak, amelyeket beleteszünk a csomagba.
INCLUDE_DIRS = ["src", "public", "scripts"]

# Gyökér szintű fájlok, amelyeket beleteszünk.
INCLUDE_FILES = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.mjs",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "next-env.d.ts",
    "README.md",
    "AGENTS.md",
    ".env.example",
    ".gitignore",
]

# Kizárt minták (bármelyik részt String tartalmazza az útvonal).
EXCLUDE_PARTS = {
    "node_modules",
    ".next",
    ".git",
    ".turbo",
    ".vercel",
    "__pycache__",
    ".DS_Store",
}
EXCLUDE_EXT = {".tsbuildinfo"}
EXCLUDE_NAMES = {"autofit-ai.zip"}


def is_excluded(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    if any(p in EXCLUDE_PARTS for p in parts):
        return True
    if any(path.endswith(ext) for ext in EXCLUDE_EXT):
        return True
    if os.path.basename(path) in EXCLUDE_NAMES:
        return True
    return False


def collect() -> list[str]:
    files: list[str] = []

    for name in INCLUDE_FILES:
        full = os.path.join(ROOT, name)
        if os.path.isfile(full):
            files.append(full)

    for d in INCLUDE_DIRS:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [x for x in dirnames if x not in EXCLUDE_PARTS]
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, ROOT)
                if not is_excluded(rel):
                    files.append(full)

    return files


def main() -> None:
    files = sorted(set(collect()))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for full in files:
            rel = os.path.relpath(full, ROOT)
            z.write(full, os.path.join(PREFIX, rel))

    size = os.path.getsize(OUT)
    print(f"wrote {len(files)} files to {OUT} ({size} bytes)")


if __name__ == "__main__":
    main()
