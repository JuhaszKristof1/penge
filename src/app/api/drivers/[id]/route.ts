import { getAdminClient, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Nyilvános versenyzői profil (profiles + statisztikák a lap_times alapján).
//
// A statisztikák kizárólag a jóváhagyott (approved) köridőkből számolódnak.
// A licence-szint a user_licences táblából származik (alapértelmezés: rookie).
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);
  const { id } = await params;

  const admin = getAdminClient()!;
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, full_name, avatar_color, bio, country, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return json({ data: null, error: error.message }, 500);
  if (!profile) return json({ data: null, error: "not-found" }, 404);

  const { data: laps } = await admin
    .from("lap_times")
    .select("id, track_id, vehicle_category, lap_time_ms, measured_at, tracks(name, slug)")
    .eq("user_id", id)
    .eq("status", "approved")
    .order("measured_at", { ascending: false })
    .limit(500);

  const { data: licence } = await admin
    .from("user_licences")
    .select("level_code, points, licence_levels(name, sort_order)")
    .eq("user_id", id)
    .maybeSingle();

  const approvedLaps = laps ?? [];
  const trackIds = new Set(approvedLaps.map((l) => l.track_id));

  const licenceEmbedded = (licence as { licence_levels?: { name?: string } | { name?: string }[] } | null) ?? null;
  const lvl = licenceEmbedded?.licence_levels;
  const licenceName = Array.isArray(lvl) ? lvl[0]?.name : lvl?.name;

  return json({
    data: {
      profile,
      laps: approvedLaps,
      stats: {
        approvedLaps: approvedLaps.length,
        tracks: trackIds.size,
        licenceCode: licence?.level_code ?? "rookie",
        licenceName: licenceName ?? "Rookie",
      },
    },
  });
}
