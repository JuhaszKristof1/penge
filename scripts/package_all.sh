#!/usr/bin/env bash
# GRIDLINE – mindkét letölthető csomag újraépítése.
#
#   public/gridline.zip           teljes forráskód
#   public/gridline-weboldal.zip  a futó oldal statikus példánya
#
# A snapshot a futó szerverről készül, ezért előbb indítsd el:
#   ./scripts/start-public.sh
#
# Használat: ./scripts/package_all.sh [http://localhost:12000]
set -euo pipefail

cd "$(dirname "$0")/.."
BASE="${1:-http://localhost:12000}"

echo "→ statikus példány készítése ($BASE)"
python3 scripts/snapshot_site.py --base "$BASE"

echo "→ weboldal ZIP"
python3 - <<'PY'
import os, zipfile

site = "public/site"
out = "public/gridline-weboldal.zip"
if os.path.exists(out):
    os.remove(out)
count = 0
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, _dirs, files in os.walk(site):
        for name in files:
            full = os.path.join(root, name)
            arc = os.path.join("gridline-weboldal", os.path.relpath(full, site))
            zf.write(full, arc)
            count += 1
print(f"   {count} fájl -> {out} ({os.path.getsize(out)/1024/1024:.2f} MB)")
PY

echo "→ forráskód ZIP"
python3 scripts/make_zip.py

echo "→ kész"
ls -lh public/*.zip
