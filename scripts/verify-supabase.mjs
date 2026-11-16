#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Supabase kapcsolat-ellenőrzés (önálló Node szkript).
//
// Használat:
//   1) Állítsd be a környezeti változókat (pl. .env.local, vagy exporttal):
//        NEXT_PUBLIC_SUPABASE_URL=...
//        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
//   2) node scripts/verify-supabase.mjs
//
// A szkript csak OLVAS: minden táblából megszámolja a sorokat, és jelzi, ha egy
// tábla hiányzik vagy az RLS miatt nem elérhető. Nem módosít adatot.
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// .env.local egyszerű betöltése (hogy ne kelljen külön csomag).
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TABLES = [
  "profiles",
  "vehicle_brands",
  "vehicle_models",
  "vehicle_engines",
  "user_vehicles",
  "part_categories",
  "parts",
  "part_oe_numbers",
  "fitments",
  "search_history",
  "favorites",
  "compatibility_reports",
];

function line(label, value) {
  console.log(`  ${label.padEnd(22)} ${value}`);
}

async function main() {
  console.log("\n=== AutoFit AI · Supabase kapcsolat-ellenőrzés ===\n");

  if (!url || !anon) {
    console.log("✗ A környezeti változók hiányoznak.");
    line("NEXT_PUBLIC_SUPABASE_URL", url ? "beállítva" : "HIÁNYZIK");
    line("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon ? "beállítva" : "HIÁNYZIK");
    console.log("\nTipp: hozz létre .env.local fájlt a .env.example alapján.\n");
    process.exitCode = 1;
    return;
  }

  line("NEXT_PUBLIC_SUPABASE_URL", url);
  line("NEXT_PUBLIC_SUPABASE_ANON_KEY", `${anon.slice(0, 8)}… (${anon.length} karakter)`);

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  console.log("\n--- Táblák elérhetősége (sorszám) ---\n");
  let anyError = false;

  for (const table of TABLES) {
    try {
      // GET + count (nem head:true): a supabase-js a `head: true` kérést hiányzó
      // táblánál is sikeresnek (204) jelentené, így a hiányzó tábla rejtve maradna.
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(1);
      if (error) {
        anyError = true;
        const hint =
          error.code === "42P01"
            ? "tábla nem létezik (futtasd a séma SQL-t)"
            : error.code === "42501"
              ? "RLS megtagadta (ez normális a felhasználói tábláknál anon kulccsal)"
              : error.code || "";
        console.log(`  ✗ ${table.padEnd(24)} hiba: ${error.message} ${hint ? `(${hint})` : ""}`);
      } else {
        console.log(`  ✓ ${table.padEnd(24)} ${count ?? 0} sor`);
      }
    } catch (err) {
      anyError = true;
      console.log(`  ✗ ${table.padEnd(24)} kivétel: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("\n--- Összegzés ---\n");
  if (anyError) {
    console.log("  Néhány tábla nem volt elérhető. A felhasználói adatokat védő RLS-policyk");
    console.log("  miatt ez anon kulccsal elvárt lehet (profiles, user_vehicles, ...).");
    console.log("  A katalógus tábláknak (vehicle_brands, parts, ...) viszont olvashatónak kell lenniük.\n");
  } else {
    console.log("  Minden tábla elérhető és olvasható. A kapcsolat rendben.\n");
  }
}

main().catch((err) => {
  console.error("\nVáratlan hiba:", err);
  process.exitCode = 1;
});
