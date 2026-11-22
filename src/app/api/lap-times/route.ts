import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import { normalizeLapPayload, LAP_EMBED_COLUMNS, type LapPayload } from "@/lib/motorsport/lap-payload";
import { mapLapTime, type LapTimeRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Köridők (lap_times) – kézi feltöltés és GPS-eredmény beküldése.
//
// Minden beküldött eredmény 'pending' (ellenőrzés alatt) állapotban kerül be.
// A ranglistára kizárólag az admin által 'approved' állapotúra állított sorok
// kerülnek (lásd /api/admin/lap-times). A GPS-eredmények sem automatikusan
// hitelesek: ugyanígy ellenőrzésre várnak.
// ---------------------------------------------------------------------------

// GET /api/lap-times – a bejelentkezett felhasználó saját eredményei.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("lap_times")
    .select(LAP_EMBED_COLUMNS)
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: (data ?? []).map((r) => mapLapTime(r as unknown as LapTimeRow)) });
}

// POST /api/lap-times – új köridő beküldése (kézi vagy GPS).
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as LapPayload;
  const parsed = normalizeLapPayload(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const admin = getAdminClient()!;

  // A pálya és a pályaváltozat létezésének ellenőrzése (ne lehessen idegen
  // pályára vagy más pályához tartozó változatra eredményt beküldeni).
  const { data: track } = await admin.from("tracks").select("id").eq("id", parsed.value.track_id).maybeSingle();
  if (!track) return json({ error: "Ismeretlen versenypálya." }, 400);

  if (parsed.value.layout_id) {
    const { data: layout } = await admin
      .from("track_layouts")
      .select("id, track_id")
      .eq("id", parsed.value.layout_id)
      .maybeSingle();
    if (!layout || layout.track_id !== parsed.value.track_id) {
      return json({ error: "A pályaváltozat nem ehhez a pályához tartozik." }, 400);
    }
  }

  const { data, error } = await admin
    .from("lap_times")
    .insert({ user_id: auth.userId, ...parsed.value, status: "pending" })
    .select(LAP_EMBED_COLUMNS)
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ data: mapLapTime(data as unknown as LapTimeRow) }, 201);
}

// DELETE /api/lap-times?id=... – a saját, még nem jóváhagyott eredmény visszavonása.
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;
  const { data: existing } = await admin
    .from("lap_times")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!existing) return json({ error: "Az eredmény nem található." }, 404);
  if (existing.status === "approved") {
    return json({ error: "A jóváhagyott eredmény nem vonható vissza." }, 409);
  }

  const { error } = await admin.from("lap_times").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
