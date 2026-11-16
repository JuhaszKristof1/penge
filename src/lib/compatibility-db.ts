// ---------------------------------------------------------------------------
// Adatbázis-alapú kompatibilitás-ellenőrzés (Supabase `fitments`).
//
// Ez a modul SOHA nem talál ki kompatibilitási adatot:
//   - Az alkatrészt az OE szám (part_oe_numbers), a gyártói cikkszám vagy a név
//     alapján azonosítja.
//   - A kompatibilitást kizárólag a `fitments` tábla sorai döntik el.
//   - Ha nincs fitment sor, az eredmény "uncertain" (nem biztos), nem "compatible".
//   - Ha az adatbázis nincs beállítva, null-t ad vissza, és a hívó hibát jelez.
//
// A `verified` mező a fitment sor ellenőrzöttségét tükrözi: ha a sor nincs
// ellenőrizve, az eredmény ettől függetlenül a katalógus szerinti státuszt
// mutatja, de figyelmeztetés jelzi, hogy kézi ellenőrzés javasolt.
// ---------------------------------------------------------------------------

import { getSupabaseClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import {
  fetchFitmentsForPart,
  fetchPartById,
  findPartIdsByOeNumber,
  findPartsByName,
  findPartsBySku,
  normalizeOeNumber,
} from "./supabase/queries";
import type { FitmentRow, PartRow } from "./supabase/mappers";
import type { CompatibilityCheckInput, CompatibilityResult } from "./types";

/** Egyszerű determinisztikus azonosító a DB eredményekhez. */
function makeId(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `chk-${Date.now().toString(36)}-${Math.abs(h).toString(36)}`;
}

/** A kiválasztott évjárat beleesik-e a fitment sor érvényességi tartományába? */
function yearMatches(row: FitmentRow, year: number): boolean {
  if (!year) return true;
  const from = row.production_year_start;
  const to = row.production_year_end;
  if (from == null && to == null) return true;
  if (from != null && year < from) return false;
  if (to != null && year > to) return false;
  return true;
}

/** Rangsor a legjobb fitment sor kiválasztásához (kisebb = jobb). */
function rowRank(row: FitmentRow): number {
  const status = row.compatibility_status === "compatible" ? 0 : row.compatibility_status === "incompatible" ? 1 : 2;
  const engine = row.engine_id ? 0 : 1;
  const trusted = row.verified ? 0 : 1;
  return status * 100 + engine * 10 + trusted;
}

async function resolvePart(input: CompatibilityCheckInput): Promise<PartRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  // 1) OE szám (normalizált) → part_id → part sor.
  const oe = normalizeOeNumber(input.oeNumber);
  if (oe) {
    const oeRes = await findPartIdsByOeNumber(input.oeNumber);
    const partId = oeRes.data?.[0]?.part_id;
    if (partId) {
      const { data } = await fetchPartById(partId);
      if (data) return data;
    }
  }

  // 2) Gyártói cikkszám.
  if (input.manufacturerSku.trim()) {
    const skuRes = await findPartsBySku(input.manufacturerSku.trim());
    if (skuRes.data && skuRes.data.length > 0) return skuRes.data[0];
  }

  // 3) Név szerinti egyezés (utolsó lehetőség).
  if (input.partName.trim()) {
    const nameRes = await findPartsByName(input.partName.trim());
    if (nameRes.data && nameRes.data.length > 0) return nameRes.data[0];
  }

  return null;
}

/**
 * Adatbázis-alapú kompatibilitás-ellenőrzés.
 * Visszatérés: `CompatibilityResult`, vagy `null`, ha a Supabase nincs beállítva.
 */
export async function runDatabaseCompatibilityCheck(
  input: CompatibilityCheckInput,
): Promise<CompatibilityResult | null> {
  if (!isSupabaseConfigured() || !getSupabaseClient()) return null;

  const part = await resolvePart(input);

  if (!part) {
    return {
      id: makeId(`${input.partName}|${input.oeNumber}|${input.manufacturerSku}`),
      status: "uncertain",
      confidence: 0,
      score: 0,
      reasons: ["A megadott adatokkal nem található alkatrész az adatbázisban (OE szám / cikkszám / név alapján)."],
      warnings: [
        "Az eredmény nem ellenőrzött: az alkatrész nem azonosítható a kompatibilitási adatbázisban.",
        "Adj meg pontos OE számot vagy gyártói cikkszámot a megbízhatóbb eredményhez.",
      ],
      input,
      createdAt: new Date().toISOString(),
      source: "database",
      verified: false,
    };
  }

  const partRef = {
    id: part.id,
    name: part.name,
    sku: part.manufacturer_part_number ?? "-",
    brand: part.manufacturer ?? "Ismeretlen gyártó",
    category: input.category || "-",
  };

  const fitRes = await fetchFitmentsForPart(part.id);
  if (fitRes.error) {
    return {
      id: makeId(`${part.id}|error`),
      status: "uncertain",
      confidence: 0,
      score: 0,
      reasons: [`Az adatbázis-lekérdezés hibát adott: ${fitRes.error}.`],
      warnings: ["Az eredmény nem ellenőrzött – az adatbázis nem volt elérhető a kompatibilitási sorokhoz."],
      matchedPart: partRef,
      input,
      createdAt: new Date().toISOString(),
      source: "database",
      verified: false,
    };
  }
  const fitments: FitmentRow[] = fitRes.data ?? [];

  const modelMatches = fitments.filter((f) => f.model_id === input.generationId || f.model_id === input.modelId);
  const engineMatches = modelMatches.filter((f) => !f.engine_id || f.engine_id === input.engineId);
  const vehicleMatches = engineMatches.length > 0 ? engineMatches : modelMatches;

  if (vehicleMatches.length === 0) {
    return {
      id: makeId(`${part.id}|${input.generationId}|${input.engineId}`),
      status: "uncertain",
      confidence: 0,
      score: 0,
      reasons: [
        `A(z) „${part.name}” alkatrész azonosítható az adatbázisban, de a kiválasztott járműhöz (${input.makeName} ${input.modelName} ${input.generationName}) nincs kompatibilitási rekord.`,
      ],
      warnings: [
        "Nincs kompatibilitási (fitment) rekord erre a járműre – az eredmény nem biztos, nem tekinthető jóváhagyásnak.",
      ],
      matchedPart: partRef,
      input,
      createdAt: new Date().toISOString(),
      source: "database",
      verified: false,
    };
  }

  const yearFiltered = vehicleMatches.filter((f) => yearMatches(f, input.year));
  if (yearFiltered.length === 0) {
    return {
      id: makeId(`${part.id}|${input.year}|year`),
      status: "uncertain",
      confidence: 0,
      score: 0,
      reasons: [
        `Van kompatibilitási rekord a(z) „${part.name}” alkatrészhez, de a kiválasztott évjárat (${input.year}) nem esik a rekord érvényességi tartományába.`,
      ],
      warnings: ["Az évjárat nem egyezik a rekord érvényességi tartományával – az eredmény nem biztos."],
      matchedPart: partRef,
      input,
      createdAt: new Date().toISOString(),
      source: "database",
      verified: false,
    };
  }

  const best = yearFiltered.slice().sort((a, b) => rowRank(a) - rowRank(b))[0];
  const reasons: string[] = [];
  const warnings: string[] = [];

  reasons.push(`Az alkatrész azonosítva az adatbázisban: „${part.name}” (${part.manufacturer ?? "ismeretlen gyártó"}).`);
  if (best.source) reasons.push(`Kompatibilitási forrás: ${best.source}.`);
  if (best.restrictions) reasons.push(`Megkötés: ${best.restrictions}.`);
  if (best.production_year_start || best.production_year_end) {
    reasons.push(`Érvényes évjárat: ${best.production_year_start ?? "?"}–${best.production_year_end ?? "?"}.`);
  }

  const status: CompatibilityResult["status"] = best.compatibility_status;

  if (status === "compatible") {
    reasons.push("Az adatbázis kompatibilisként jelöli ezt az alkatrészt a kiválasztott járműhöz.");
  } else if (status === "incompatible") {
    reasons.push("Az adatbázis nem kompatibilisként jelöli ezt az alkatrészt a kiválasztott járműhöz.");
  } else {
    warnings.push("Az adatbázis bizonytalanként jelöli ezt a kompatibilitást – nem tekinthető biztos találatnak.");
  }

  if (!best.verified) {
    warnings.push("A rekord nincs függetlenül ellenőrizve (verified = false). Kézi ellenőrzés javasolt.");
  }

  const confidence = status === "uncertain" ? 0 : best.verified ? (status === "compatible" ? 100 : 95) : 80;

  return {
    id: makeId(`${part.id}|${best.id}`),
    status,
    confidence,
    score: confidence,
    reasons,
    warnings,
    matchedPart: partRef,
    input,
    createdAt: new Date().toISOString(),
    source: "database",
    verified: best.verified,
  };
}
