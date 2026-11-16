// ---------------------------------------------------------------------------
// AutoFit AI – domain types.
//
// Minden típus az adatbázis-sémát tükrözi (Supabase / PostgreSQL). Az
// alkalmazás kizárólag az adatbázisból dolgozik; nincs beépített demó adat és
// nincs kitalált tartalék. Ha az adatbázis nem elérhető, a felület egyértelmű
// hibát jelez, nem pedig kitalált tartalmat.
// ---------------------------------------------------------------------------

export type FuelType = "Benzin" | "Dízel" | "Hibrid" | "Elektromos" | "LPG";

export interface Engine {
  id: string;
  name: string; // "2.0 TDI"
  code: string; // motorkód, pl. "CBAB"
  fuel: FuelType;
  power: number; // LE
  displacement: number; // cm³
}

export interface Generation {
  id: string;
  name: string; // "Mk7 (2012–2019)"
  yearFrom: number;
  yearTo: number;
  bodies: string[];
  engines: Engine[];
}

export interface CarModel {
  id: string;
  name: string;
  generations: Generation[];
}

export interface CarMake {
  id: string;
  name: string;
  country: string;
  models: CarModel[];
}

/**
 * Alkatrészkategória. Az adatbázisból (part_categories) származó nevek szabad
 * szövegként jelennek meg; a szűkített unió csak a beépített ikon-térképhez kell.
 */
export type PartCategory = string;

export interface Part {
  id: string;
  name: string;
  sku: string; // gyártói cikkszám
  oeNumber: string; // elsődleges OE szám
  oeNumbers?: string[]; // az összes OE szám
  category: PartCategory;
  brand: string;
  description: string;
  /** Termékkép URL (parts.image_url). Ha üres, kategória-alapú grafika. */
  image?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Kompatibilitási eredmény
// ---------------------------------------------------------------------------

export type CompatibilityStatus = "compatible" | "incompatible" | "uncertain";

export interface CompatibilityCheckInput {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  year: number;
  body: string;
  engineId: string;
  engineName: string;
  engineCode: string;
  partName: string;
  oeNumber: string;
  manufacturerSku: string;
  category: string;
  imageName?: string;
}

export interface CompatibilityResult {
  id: string;
  status: CompatibilityStatus;
  confidence: number; // 0-100
  score: number;
  reasons: string[];
  warnings: string[];
  matchedPart?: { id: string; name: string; sku: string; brand: string; category: string };
  input: CompatibilityCheckInput;
  createdAt: string;
  /** Az eredmény forrása. Mindig "database": kizárólag a fitments táblából. */
  source?: "database";
  /** Igaz, ha az eredmény ellenőrzött (verified) rekordon alapul. */
  verified?: boolean;
}

export type SavedCheck = CompatibilityResult;

// ---------------------------------------------------------------------------
// Felhasználó (Supabase Auth + profiles tábla)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  avatarColor: string;
}

export interface GarageCar {
  id: string;
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  year: number;
  body: string;
  engineId: string;
  engineName: string;
  engineCode: string;
  nickname?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SearchLogEntry {
  id: string;
  type: "search" | "compatibility";
  label: string;
  at: string;
}
