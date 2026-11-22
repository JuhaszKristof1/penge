import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Kedvenc versenypályák (track_favorites).
// ---------------------------------------------------------------------------

// GET /api/track-favorites – a bejelentkezett felhasználó kedvenc pályái.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("track_favorites")
    .select("id, track_id, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });
  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: data ?? [] });
}

// POST /api/track-favorites – kedvenc hozzáadása/eltávolítása (toggle).
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { trackId?: string };
  if (!body.trackId) return json({ error: "Hiányzó pálya-azonosító." }, 400);

  const admin = getAdminClient()!;
  const { data: existing } = await admin
    .from("track_favorites")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("track_id", body.trackId)
    .maybeSingle();

  if (existing) {
    await admin.from("track_favorites").delete().eq("id", existing.id).eq("user_id", auth.userId);
    return json({ favorite: false });
  }

  const { error } = await admin.from("track_favorites").insert({ user_id: auth.userId, track_id: body.trackId });
  if (error) return json({ error: error.message }, 500);
  return json({ favorite: true });
}
