#!/usr/bin/env bash
# GRIDLINE – publikus (work host) indítás.
#
# A sandbox felülírja a NEXT_PUBLIC_SUPABASE_* változókat a saját, valós
# Supabase-projektjével. A Next.js a folyamat környezetét előbbre veszi, mint a
# .env.local-t, ezért a build/start a rossz adatbázisra állna (ott nincsenek
# motorsport táblák → PGRST205). Ez a szkript ezért kifejezetten a .env.local
# értékeit exportálja, majd a 12000-es porton indít (work-1 host).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
PORT="${PORT:-12000}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Hiányzó .env.local – másold le a .env.example-t." >&2
  exit 1
fi

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  export "$key=$value"
done < <(grep -E '^[A-Z_]+=' "$ENV_FILE")

echo "Supabase: $NEXT_PUBLIC_SUPABASE_URL"
exec npx next start -p "$PORT"
