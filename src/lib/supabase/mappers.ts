// ---------------------------------------------------------------------------
// Adatbázis-sor típusok és leképezésük a UI domain típusaira.
//
// A táblák a Supabase PostgreSQL sémából származnak (profiles, vehicle_brands,
// vehicle_models, vehicle_engines, user_vehicles, part_categories, parts,
// part_oe_numbers, fitments, search_history, favorites, compatibility_reports).
// Itt csak az olvasáshoz szükséges oszlopokat írjuk le.
// ---------------------------------------------------------------------------

import type { CarMake, Engine, FuelType, Generation, Part, User } from "@/lib/types";

export interface BrandRow {
  id: string;
  name: string;
  slug: string | null;
  country: string | null;
  logo_url: string | null;
}

export interface ModelRow {
  id: string;
  brand_id: string;
  name: string;
  generation: string | null;
  production_start: number | null;
  production_end: number | null;
  body_type: string | null;
}

export interface EngineRow {
  id: string;
  model_id: string;
  engine_name: string;
  engine_code: string | null;
  fuel_type: string | null;
  displacement: number | null;
  power_kw: number | null;
  power_hp: number | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  description: string | null;
}

export interface PartRow {
  id: string;
  category_id: string | null;
  name: string;
  manufacturer: string | null;
  manufacturer_part_number: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
}

export interface OeNumberRow {
  id: string;
  part_id: string;
  oe_number: string;
  oe_number_normalized: string;
}

export interface FitmentRow {
  id: string;
  part_id: string;
  brand_id: string;
  model_id: string;
  engine_id: string | null;
  production_year_start: number | null;
  production_year_end: number | null;
  restrictions: string | null;
  compatibility_status: "compatible" | "incompatible" | "uncertain";
  source: string | null;
  verified: boolean;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  avatar_color: string | null;
  created_at: string;
}

export interface UserVehicleRow {
  id: string;
  user_id: string;
  brand_id: string | null;
  model_id: string | null;
  engine_id: string | null;
  nickname: string | null;
  year: number | null;
  body: string | null;
  is_default: boolean;
  created_at: string;
  /** A GET /api/garage válaszban feloldott nevek (a katalógusból). */
  brand_name?: string | null;
  model_name?: string | null;
  generation_name?: string | null;
  engine_name?: string | null;
  engine_code?: string | null;
}

export interface SearchHistoryRow {
  id: string;
  user_id: string | null;
  type: "search" | "compatibility";
  label: string;
  query: string | null;
  created_at: string;
}

export interface FavoriteRow {
  id: string;
  user_id: string;
  part_id: string;
  created_at: string;
}

export interface CompatibilityReportRow {
  id: string;
  user_id: string | null;
  part_name: string | null;
  oe_number: string | null;
  manufacturer_part_number: string | null;
  category: string | null;
  brand_id: string | null;
  model_id: string | null;
  engine_id: string | null;
  year: number | null;
  status: "compatible" | "incompatible" | "uncertain";
  confidence: number;
  verified: boolean;
  reasons: string[] | null;
  warnings: string[] | null;
  matched_part_id: string | null;
  created_at: string;
}

/**
 * Beágyazott kapcsolódó sor típusa. A PostgREST a to-one (many-to-one)
 * kapcsolatokat OBJEKTUMKÉNT, a to-many kapcsolatokat TÖMBKÉNT adja vissza,
 * ezért mindkét alakot kezeljük.
 */
export type Embedded<T> = T | T[] | null;

export interface FitmentDetailedRow extends FitmentRow {
  vehicle_brands: Embedded<{ name: string }>;
  vehicle_models: Embedded<{
    name: string;
    generation: string | null;
    production_start: number | null;
    production_end: number | null;
  }>;
}

/** Beágyazott (objektum vagy tömb) érték első elemének kinyerése. */
export function firstEmbedded<T>(value: Embedded<T>): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ---------------------------------------------------------------------------
// Normalizálás / leképezés
// ---------------------------------------------------------------------------

/** A DB fuel_type értékeit a UI FuelType-jára képezi. */
export function mapFuelType(value: string | null): FuelType {
  switch ((value ?? "").toLowerCase()) {
    case "benzin":
    case "petrol":
    case "gasoline":
      return "Benzin";
    case "dizel":
    case "dízel":
    case "diesel":
      return "Dízel";
    case "hibrid":
    case "plugin_hibrid":
    case "plug-in":
    case "hybrid":
      return "Hibrid";
    case "elektromos":
    case "electric":
      return "Elektromos";
    case "lpg":
      return "LPG";
    default:
      return "Benzin";
  }
}

/** Motor kW → LE átváltás, ha a HP nincs megadva. (1 kW ≈ 1.35962 LE) */
function hpFromKw(kw: number | null): number | null {
  if (kw == null) return null;
  return Math.round(kw * 1.35962);
}

export function mapEngine(row: EngineRow): Engine {
  return {
    id: row.id,
    name: row.engine_name,
    code: row.engine_code ?? "",
    fuel: mapFuelType(row.fuel_type),
    power: row.power_hp ?? hpFromKw(row.power_kw) ?? 0,
    displacement: row.displacement ?? 0,
  };
}

/**
 * Modell-sor → Generation.
 * A `generation` oszlop a generáció megnevezése; ha üres, a modell nevével és az
 * évjárat-tartománnyal címezzük a legördülő elemet.
 */
export function mapModelToGeneration(row: ModelRow): Generation {
  const from = row.production_start ?? 0;
  const to = row.production_end ?? new Date().getFullYear();
  const label = row.generation?.trim() ? row.generation.trim() : row.name;
  const hasYears = from ? label.includes(String(from)) : false;
  const range = from && !hasYears ? `${from}–${row.production_end ?? ""}` : "";
  const name = range ? `${label} (${range})` : label;
  return {
    id: row.id,
    name,
    yearFrom: from,
    yearTo: to,
    bodies: row.body_type ? [row.body_type] : [],
    engines: [],
  };
}

/** Márka-sor → CarMake (modellek nélkül; azokat külön töltjük). */
export function mapBrand(row: BrandRow): CarMake {
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? "",
    models: [],
  };
}

/**
 * parts + part_categories + part_oe_numbers sorok → UI `Part`.
 * A megjelenítés kizárólag az adatbázis mezőit használja (nincs kitalált ár,
 * készlet vagy értékelés).
 */
export function mapPart(row: PartRow, categoryName: string, oeNumbers: string[]): Part {
  const cleaned = oeNumbers.filter((n) => n && n.trim() && n !== "-");
  const oe = cleaned[0] ?? "-";
  return {
    id: row.id,
    name: row.name,
    sku: row.manufacturer_part_number ?? "-",
    oeNumber: oe,
    oeNumbers: cleaned.length > 0 ? cleaned : undefined,
    category: categoryName,
    brand: row.manufacturer ?? "Ismeretlen gyártó",
    description: row.description ?? "",
    image: row.image_url ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

const AVATAR_PALETTE = ["#ff6a00", "#3b82f6", "#10b981", "#a855f7", "#ef4444", "#eab308"];

/** profiles sor → UI `User`. A jelszót soha nem tároljuk/olvassuk itt. */
export function mapProfile(row: ProfileRow): User {
  const name = row.full_name?.trim() || row.email.split("@")[0];
  const idx = Math.abs(
    Array.from(row.email).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7),
  );
  return {
    id: row.id,
    name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    avatarColor: row.avatar_color ?? AVATAR_PALETTE[idx % AVATAR_PALETTE.length],
  };
}
