// ---------------------------------------------------------------------------
// Supabase olvasó/író lekérdezések.
//
// Minden függvény `null`-t ad vissza, ha a Supabase nincs beállítva vagy a
// lekérdezés hibázik – a hívók egyértelmű hibát jeleznek, NEM esnek vissza
// kitalált adatra.
// ---------------------------------------------------------------------------

import { getSupabaseClient } from "./client";
import type { LapStatus, MeasurementType } from "@/lib/types";
import type {
  BrandRow,
  ChallengeDefinitionRow,
  LapTimeRow,
  LicenceLevelRow,
  TrackLayoutRow,
  TrackRow,
  UserChallengeRow,
  VehicleCategoryRow,
  CategoryRow,
  CompatibilityReportRow,
  EngineRow,
  FavoriteRow,
  FitmentDetailedRow,
  FitmentRow,
  ModelRow,
  OeNumberRow,
  PartRow,
  ProfileRow,
  SearchHistoryRow,
  UserVehicleRow,
} from "./mappers";

/** OE szám normalizálása – ugyanaz a logika, mint az adatbázisban. */
export function normalizeOeNumber(value: string): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

async function run<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>): Promise<QueryResult<T>> {
  if (!getSupabaseClient()) return { data: null, error: "not-configured" };
  try {
    const { data, error } = await fn();
    if (error) {
      const e = error as { code?: string; message?: string };
      return { data: null, error: `${e.code ?? ""} ${e.message ?? ""}`.trim() };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

const PART_COLUMNS =
  "id, category_id, name, manufacturer, manufacturer_part_number, description, image_url, created_at";

// --- Jármű-katalógus -------------------------------------------------------

export function fetchBrands(): Promise<QueryResult<BrandRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!.from("vehicle_brands").select("id, name, slug, country, logo_url").order("name", { ascending: true }),
  );
}

export function fetchModelsByBrand(brandId: string): Promise<QueryResult<ModelRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("vehicle_models")
      .select("id, brand_id, name, generation, production_start, production_end, body_type")
      .eq("brand_id", brandId)
      .order("name", { ascending: true })
      .order("production_start", { ascending: true }),
  );
}

export function fetchEnginesByModel(modelId: string): Promise<QueryResult<EngineRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("vehicle_engines")
      .select("id, model_id, engine_name, engine_code, fuel_type, displacement, power_kw, power_hp")
      .eq("model_id", modelId)
      .order("power_hp", { ascending: true }),
  );
}

export function fetchModelById(modelId: string): Promise<QueryResult<ModelRow>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("vehicle_models")
      .select("id, brand_id, name, generation, production_start, production_end, body_type")
      .eq("id", modelId)
      .maybeSingle(),
  );
}

// --- Alkatrész-katalógus ---------------------------------------------------

export function fetchCategories(): Promise<QueryResult<CategoryRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!.from("part_categories").select("id, name, slug, parent_id, description").order("name", { ascending: true }),
  );
}

export function fetchParts(categoryId?: string): Promise<QueryResult<PartRow[]>> {
  const supabase = getSupabaseClient();
  return run(() => {
    let q = supabase!.from("parts").select(PART_COLUMNS).order("name", { ascending: true });
    if (categoryId) q = q.eq("category_id", categoryId);
    return q;
  });
}

export function fetchPartById(partId: string): Promise<QueryResult<PartRow>> {
  const supabase = getSupabaseClient();
  return run(() => supabase!.from("parts").select(PART_COLUMNS).eq("id", partId).maybeSingle());
}

export function fetchOeNumbersForParts(partIds: string[]): Promise<QueryResult<OeNumberRow[]>> {
  const supabase = getSupabaseClient();
  if (partIds.length === 0) return Promise.resolve({ data: [], error: null });
  return run(() =>
    supabase!
      .from("part_oe_numbers")
      .select("id, part_id, oe_number, oe_number_normalized")
      .in("part_id", partIds),
  );
}

export function findPartIdsByOeNumber(oeNumber: string): Promise<QueryResult<OeNumberRow[]>> {
  const supabase = getSupabaseClient();
  const normalized = normalizeOeNumber(oeNumber);
  if (!normalized) return Promise.resolve({ data: [], error: null });
  return run(() =>
    supabase!
      .from("part_oe_numbers")
      .select("id, part_id, oe_number, oe_number_normalized")
      .eq("oe_number_normalized", normalized),
  );
}

export function findPartsBySku(sku: string): Promise<QueryResult<PartRow[]>> {
  const supabase = getSupabaseClient();
  const value = (sku ?? "").trim();
  if (!value) return Promise.resolve({ data: [], error: null });
  return run(() => supabase!.from("parts").select(PART_COLUMNS).ilike("manufacturer_part_number", value));
}

export function findPartsByName(term: string): Promise<QueryResult<PartRow[]>> {
  const supabase = getSupabaseClient();
  // A PostgREST `.or()` szűrőben a vessző, zárójel és csillag szintaktikai
  // jelentéssel bír, ezért eltávolítjuk őket a keresőkifejezésből.
  const value = (term ?? "").trim().replace(/[(),*%]/g, " ").replace(/\s+/g, " ").trim();
  if (!value) return Promise.resolve({ data: [], error: null });
  const like = `%${value}%`;
  return run(() =>
    supabase!
      .from("parts")
      .select(PART_COLUMNS)
      .or(
        `name.ilike.${like},manufacturer.ilike.${like},manufacturer_part_number.ilike.${like},description.ilike.${like}`,
      ),
  );
}

// --- Fitment (kompatibilitás) ---------------------------------------------

export function fetchFitmentsForPart(partId: string): Promise<QueryResult<FitmentRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("fitments")
      .select(
        "id, part_id, brand_id, model_id, engine_id, production_year_start, production_year_end, restrictions, compatibility_status, source, verified",
      )
      .eq("part_id", partId),
  );
}

export function fetchFitmentsDetailed(partId: string): Promise<QueryResult<FitmentDetailedRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("fitments")
      .select(
        "id, part_id, brand_id, model_id, engine_id, production_year_start, production_year_end, restrictions, compatibility_status, source, verified, vehicle_brands(name), vehicle_models(name, generation, production_start, production_end)",
      )
      .eq("part_id", partId)
      .eq("compatibility_status", "compatible"),
  );
}

// --- Felhasználói adatok ---------------------------------------------------

export function fetchProfile(userId: string): Promise<QueryResult<ProfileRow>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!.from("profiles").select("id, email, full_name, role, avatar_color, bio, country, created_at").eq("id", userId).maybeSingle(),
  );
}

export function fetchProfiles(): Promise<QueryResult<ProfileRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("profiles")
      .select("id, email, full_name, role, avatar_color, bio, country, created_at")
      .order("created_at", { ascending: false }),
  );
}

export function fetchUserVehicles(userId: string): Promise<QueryResult<UserVehicleRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("user_vehicles")
      .select("id, user_id, brand_id, model_id, engine_id, nickname, year, body, is_default, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  );
}

export function fetchFavorites(userId: string): Promise<QueryResult<FavoriteRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("favorites")
      .select("id, user_id, part_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export function fetchSearchHistory(limit = 200): Promise<QueryResult<SearchHistoryRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("search_history")
      .select("id, user_id, type, label, query, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export function fetchCompatibilityReports(
  userId?: string,
  limit = 50,
): Promise<QueryResult<CompatibilityReportRow[]>> {
  const supabase = getSupabaseClient();
  return run(() => {
    let q = supabase!
      .from("compatibility_reports")
      .select(
        "id, user_id, part_name, oe_number, manufacturer_part_number, category, brand_id, model_id, engine_id, year, status, confidence, verified, reasons, warnings, matched_part_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (userId) q = q.eq("user_id", userId);
    return q;
  });
}

// --- Motorsport: pályák, változatok, kategóriák -----------------------------

const TRACK_COLUMNS =
  "id, slug, name, locality, county, country, latitude, longitude, description, image_url, layout_image_url, length_m, width, corners, opened_year, status, website, source_url, source_note, created_at";

export function fetchTracks(): Promise<QueryResult<TrackRow[]>> {
  const supabase = getSupabaseClient();
  return run(() => supabase!.from("tracks").select(TRACK_COLUMNS).order("name", { ascending: true }));
}

export function fetchTrackBySlug(slug: string): Promise<QueryResult<TrackRow>> {
  const supabase = getSupabaseClient();
  return run(() => supabase!.from("tracks").select(TRACK_COLUMNS).eq("slug", slug).maybeSingle());
}

export function fetchTrackById(id: string): Promise<QueryResult<TrackRow>> {
  const supabase = getSupabaseClient();
  return run(() => supabase!.from("tracks").select(TRACK_COLUMNS).eq("id", id).maybeSingle());
}

export function fetchLayoutsForTracks(trackIds: string[]): Promise<QueryResult<TrackLayoutRow[]>> {
  const supabase = getSupabaseClient();
  if (trackIds.length === 0) return Promise.resolve({ data: [], error: null });
  return run(() =>
    supabase!
      .from("track_layouts")
      .select("id, track_id, slug, name, length_m, corners, direction, description, map_image_url, is_default")
      .in("track_id", trackIds)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
  );
}

export function fetchVehicleCategories(): Promise<QueryResult<VehicleCategoryRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("vehicle_categories")
      .select("id, code, name, description, sort_order")
      .order("sort_order", { ascending: true }),
  );
}

export function fetchLicenceLevels(): Promise<QueryResult<LicenceLevelRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("licence_levels")
      .select("code, name, sort_order, description, min_points")
      .order("sort_order", { ascending: true }),
  );
}

// --- Fejlődés: feladatok ---------------------------------------------------

export function fetchChallenges(): Promise<QueryResult<ChallengeDefinitionRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("challenge_definitions")
      .select("code, name, description, icon, points, category, criteria, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  );
}

export function fetchUserChallenges(userId: string): Promise<QueryResult<UserChallengeRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("user_challenges")
      .select("user_id, challenge_code, points_awarded, completed_at")
      .eq("user_id", userId),
  );
}

// --- Motorsport: köridők (ranglista) ---------------------------------------

const LAP_EMBED =
  "id, user_id, track_id, layout_id, vehicle_id, vehicle_label, vehicle_category, lap_time_ms, measured_at, measurement_type, status, evidence_url, evidence_type, note, gps_session_id, reviewed_by, reviewed_at, review_note, created_at, tracks(name, slug), track_layouts(name), profiles!lap_times_user_id_fkey(full_name, avatar_color)";

export interface LapQueryFilters {
  trackId?: string;
  layoutId?: string;
  category?: string;
  measurementType?: MeasurementType;
  /** ISO dátum (YYYY-MM-DD) – az ennél nem régebbi eredmények. */
  since?: string;
  status?: LapStatus;
  limit?: number;
}

/**
 * Köridők lekérdezése. Ranglistához mindig `status: "approved"`, hogy csak a
 * hitelesített eredmények jelenjenek meg. A pályaváltozat és a mérési kategória
 * szerinti szűrés elkülöníti a különböző dimenziókat.
 */
export function fetchLapTimes(filters: LapQueryFilters = {}): Promise<QueryResult<LapTimeRow[]>> {
  const supabase = getSupabaseClient();
  return run(() => {
    let q = supabase!.from("lap_times").select(LAP_EMBED).eq("status", filters.status ?? "approved");
    if (filters.trackId) q = q.eq("track_id", filters.trackId);
    if (filters.layoutId) q = q.eq("layout_id", filters.layoutId);
    if (filters.category) q = q.eq("vehicle_category", filters.category);
    if (filters.measurementType) q = q.eq("measurement_type", filters.measurementType);
    if (filters.since) q = q.gte("measured_at", filters.since);
    return q
      .order("lap_time_ms", { ascending: true })
      .order("measured_at", { ascending: false })
      .limit(filters.limit ?? 100);
  });
}

export function fetchLapTimesForUser(userId: string, limit = 100): Promise<QueryResult<LapTimeRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("lap_times")
      .select(LAP_EMBED)
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(limit),
  );
}

/** A legfrissebb jóváhagyott eredmények (időrendben, a ranglista helyezés nélkül). */
export function fetchRecentApprovedLaps(limit = 8): Promise<QueryResult<LapTimeRow[]>> {
  const supabase = getSupabaseClient();
  return run(() =>
    supabase!
      .from("lap_times")
      .select(LAP_EMBED)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}
