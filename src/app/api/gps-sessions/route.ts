import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import { mapGpsSession, type GpsSessionRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GPS-mérési munkamenetek (gps_sessions, gps_laps, gps_samples).
//
// A GPS-mérés KIZÁRÓLAG zárt versenypályához készül – közúti időmérés nincs.
// A helyadatokat csak a felhasználó által elindított mérés alatt gyűjtjük.
//
// A munkamenet életciklusa:
//   recording → (feltöltés) → completed
// A feltöltött GPS-eredmény NEM automatikusan hiteles: a belőle készített
// köridő mindig 'pending' állapotban kerül ellenőrzésre.
// ---------------------------------------------------------------------------

interface SessionPayload {
  trackId?: string;
  layoutId?: string | null;
  sampleCount?: number;
  accuracyMinM?: number | null;
  accuracyMaxM?: number | null;
  quality?: string | null;
  notes?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  finishLat?: number | null;
  finishLng?: number | null;
  samples?: { t: number; lat: number; lng: number; speed?: number | null; acc?: number | null }[];
  laps?: { lapNumber: number; lapTimeMs?: number | null; confidence?: number | null; flagged?: boolean; flagReason?: string | null }[];
}

// GET /api/gps-sessions – a felhasználó munkamenetei és a hozzájuk tartozó körök.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("gps_sessions")
    .select(
      "id, user_id, track_id, layout_id, status, started_at, ended_at, sample_count, accuracy_min_m, accuracy_max_m, quality, notes, created_at",
    )
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return json({ data: [], error: error.message }, 500);

  const sessions = (data ?? []).map((r) => mapGpsSession(r as unknown as GpsSessionRow));
  const sessionIds = sessions.map((s) => s.id);

  let laps: unknown[] = [];
  if (sessionIds.length) {
    const { data: lapRows } = await admin
      .from("gps_laps")
      .select("id, session_id, lap_number, lap_time_ms, confidence, flagged, flag_reason")
      .in("session_id", sessionIds)
      .order("lap_number", { ascending: true });
    laps = lapRows ?? [];
  }

  return json({ data: sessions, laps });
}

// POST /api/gps-sessions – mérés indítása (status: recording).
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as SessionPayload;
  const trackId = (body.trackId ?? "").trim();
  if (!trackId) return json({ error: "Válaszd ki a versenypályát." }, 400);

  const admin = getAdminClient()!;
  const { data: track } = await admin.from("tracks").select("id").eq("id", trackId).maybeSingle();
  if (!track) return json({ error: "Ismeretlen versenypálya." }, 400);

  const { data, error } = await admin
    .from("gps_sessions")
    .insert({
      user_id: auth.userId,
      track_id: trackId,
      layout_id: (body.layoutId ?? "")?.trim() || null,
      status: "recording",
      started_at: new Date().toISOString(),
    })
    .select("id, status, started_at")
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
}

// PATCH /api/gps-sessions – mérés lezárása: összegzés, körök és nyerspontok mentése.
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as SessionPayload & { id?: string; status?: string };
  if (!body.id) return json({ error: "Hiányzó munkamenet-azonosító." }, 400);

  const admin = getAdminClient()!;
  const { data: session } = await admin
    .from("gps_sessions")
    .select("id, user_id, status")
    .eq("id", body.id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!session) return json({ error: "A mérési munkamenet nem található." }, 404);

  const status = body.status === "aborted" ? "aborted" : "completed";
  const { error: updErr } = await admin
    .from("gps_sessions")
    .update({
      status,
      ended_at: new Date().toISOString(),
      sample_count: Math.max(0, Math.round(body.sampleCount ?? 0)),
      accuracy_min_m: body.accuracyMinM ?? null,
      accuracy_max_m: body.accuracyMaxM ?? null,
      quality: body.quality ?? "unknown",
      notes: (body.notes ?? "").trim() || null,
      start_lat: body.startLat ?? null,
      start_lng: body.startLng ?? null,
      finish_lat: body.finishLat ?? null,
      finish_lng: body.finishLng ?? null,
    })
    .eq("id", body.id)
    .eq("user_id", auth.userId);
  if (updErr) return json({ error: updErr.message }, 500);

  // A körök mentése (a korábbiakat lecseréljük erre a munkamenetre).
  await admin.from("gps_laps").delete().eq("session_id", body.id);
  if (body.laps?.length) {
    const rows = body.laps.slice(0, 500).map((l) => ({
      session_id: body.id,
      lap_number: l.lapNumber,
      lap_time_ms: l.lapTimeMs ?? null,
      confidence: l.confidence ?? null,
      flagged: Boolean(l.flagged),
      flag_reason: l.flagReason ?? null,
    }));
    const { error: lapErr } = await admin.from("gps_laps").insert(rows);
    if (lapErr) return json({ error: lapErr.message }, 500);
  }

  // A nyerspontok mentése (max. 5000 pont, hogy ne legyen túl nagy).
  if (body.samples?.length) {
    const rows = body.samples.slice(0, 5000).map((s) => ({
      session_id: body.id,
      recorded_at: new Date(s.t).toISOString(),
      latitude: s.lat,
      longitude: s.lng,
      speed_mps: s.speed ?? null,
      accuracy_m: s.acc ?? null,
    }));
    const { error: sampleErr } = await admin.from("gps_samples").insert(rows);
    if (sampleErr) return json({ error: sampleErr.message }, 500);
  }

  return json({ ok: true });
}
