#!/usr/bin/env bash
# GRIDLINE – publikus build.
#
# A NEXT_PUBLIC_* változók BUILD időben beégetődnek a kliens bundle-be, ezért a
# buildet is a .env.local értékeivel kell futtatni. A sandbox ugyanis a saját
# (helytelen) NEXT_PUBLIC_SUPABASE_* értékeit injektálja, és a Next.js a folyamat
# környezetét előbbre veszi, mint a .env.local-t.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Hiányzó .env.local – másold le a .env.example-t." >&2
  exit 1
fi

cd "$ROOT"
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  export "$key=$value"
done < <(grep -E '^[A-Z_]+=' "$ENV_FILE")

echo "Build Supabase: $NEXT_PUBLIC_SUPABASE_URL"
exec npx next build
