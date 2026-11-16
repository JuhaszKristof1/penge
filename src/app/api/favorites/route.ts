import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/favorites – a bejelentkezett felhasználó kedvenc alkatrészei.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("favorites")
    .select("id, user_id, part_id, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: data ?? [] });
}

// POST /api/favorites – kedvenc hozzáadása/eltávolítása (toggle).
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { partId?: string };
  if (!body.partId) return json({ error: "Hiányzó alkatrész-azonosító." }, 400);

  const admin = getAdminClient()!;
  const { data: existing } = await admin
    .from("favorites")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("part_id", body.partId)
    .maybeSingle();

  if (existing) {
    await admin.from("favorites").delete().eq("id", existing.id).eq("user_id", auth.userId);
    return json({ favorite: false });
  }

  const { error } = await admin.from("favorites").insert({ user_id: auth.userId, part_id: body.partId });
  if (error) return json({ error: error.message }, 500);
  return json({ favorite: true });
}
