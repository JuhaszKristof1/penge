// ---------------------------------------------------------------------------
// GRIDLINE – domain types.
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
  bio?: string | null;
  country?: string | null;
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

// ---------------------------------------------------------------------------
// Motorsport domain (versenypályák, köridők, ranglisták, GPS-mérés)
//
// Az adatok a Supabase adatbázisból (tracks, track_layouts, lap_times,
// gps_sessions, gps_laps, vehicle_categories, licence_levels) származnak.
// ---------------------------------------------------------------------------

/** Köridő eredmény státusza. Csak az "approved" kerül a hivatalos ranglistára. */
export type LapStatus = "pending" | "approved" | "rejected";

/** Mérés módja: kézi feltöltés vagy GPS-alapú mérés. */
export type MeasurementType = "manual" | "gps";

/** Bizonyíték típusa. */
export type EvidenceType = "image" | "video" | "none";

/** Pálya állapota. */
export type TrackStatus = "active" | "inactive" | "planned";

export interface VehicleCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface Track {
  id: string;
  slug: string;
  name: string;
  locality?: string | null;
  county?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  layoutImageUrl?: string | null;
  lengthM?: number | null;
  width?: string | null;
  corners?: number | null;
  openedYear?: number | null;
  status: TrackStatus;
  website?: string | null;
  sourceUrl?: string | null;
  sourceNote?: string | null;
  createdAt: string;
}

export interface TrackLayout {
  id: string;
  trackId: string;
  slug: string;
  name: string;
  lengthM?: number | null;
  corners?: number | null;
  direction?: string | null;
  description?: string | null;
  mapImageUrl?: string | null;
  isDefault: boolean;
}

export interface LapTime {
  id: string;
  userId: string;
  trackId: string;
  layoutId?: string | null;
  vehicleId?: string | null;
  vehicleLabel?: string | null;
  vehicleCategory: string;
  lapTimeMs: number;
  measuredAt: string;
  measurementType: MeasurementType;
  status: LapStatus;
  evidenceUrl?: string | null;
  evidenceType: EvidenceType;
  note?: string | null;
  gpsSessionId?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  // Feloldott megnevezések (a ranglistához / profilhoz).
  trackName?: string | null;
  trackSlug?: string | null;
  layoutName?: string | null;
  driverName?: string | null;
  driverAvatarColor?: string | null;
}

export interface GpsSession {
  id: string;
  userId: string;
  trackId: string;
  layoutId?: string | null;
  status: "recording" | "completed" | "aborted";
  startedAt: string;
  endedAt?: string | null;
  sampleCount: number;
  accuracyMinM?: number | null;
  accuracyMaxM?: number | null;
  quality?: "good" | "fair" | "poor" | "unknown" | null;
  notes?: string | null;
  createdAt: string;
}

export interface GpsLap {
  id: string;
  sessionId: string;
  lapNumber: number;
  lapTimeMs?: number | null;
  confidence?: number | null;
  flagged: boolean;
  flagReason?: string | null;
}

export interface LicenceLevel {
  code: string;
  name: string;
  sortOrder: number;
  description?: string | null;
  /** A rang eléréséhez szükséges összes pont (ideiglenes, módosítható). */
  minPoints: number;
}

// ---------------------------------------------------------------------------
// Fejlődési rendszer (feladatok, pontok, licencek)
// ---------------------------------------------------------------------------

/** A feladat (badge) ikonkulcsa – a kliens oldali ikonkészlethez. */
export type ChallengeIcon = "flag" | "gauge" | "map" | "satellite" | "timer" | "trophy";

export interface Challenge {
  code: string;
  name: string;
  /** Magyar nyelvű feladatleírás (tooltip / érintésre megjelenő szöveg). */
  description: string;
  icon: ChallengeIcon;
  points: number;
  category: string;
  sortOrder: number;
  /** A teljesítéshez szükséges célérték. */
  target: number;
}

/** Egy felhasználó feladat-állapota (a szerveroldali kiértékelés alapján). */
export interface ChallengeProgress extends Challenge {
  completed: boolean;
  completedAt?: string | null;
  /** A felhasználó jelenlegi értéke a feladat feltételére. */
  current: number;
  /** Igényelhető-e most a jutalom (a feltétel teljesült, de még nincs elbírálva). */
  claimable: boolean;
}

export interface ProgressionSummary {
  licenceCode: string;
  licenceName: string;
  totalPoints: number;
  nextLicenceCode: string | null;
  nextLicenceName: string | null;
  nextThreshold: number | null;
  pointsToNext: number | null;
  /** 0–100 közötti haladás a következő rang felé. */
  progressPercent: number;
  completedChallenges: number;
  totalChallenges: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  avatarColor: string;
  bio?: string | null;
  country?: string | null;
  createdAt: string;
  stats?: DriverStats;
}

export interface DriverStats {
  approvedLaps: number;
  tracks: number;
  bestPositions: number;
  licenceCode: string;
  licenceName: string;
}
