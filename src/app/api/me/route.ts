import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/me – a bejelentkezett felhasználó profilja (profiles tábla).
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: null, error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, avatar_color, bio, country, created_at")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) return json({ data: null, error: error.message }, 500);
  return json({ data: data ?? null });
}

// PATCH /api/me – profil módosítása (név, avatar szín).
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    avatarColor?: string;
    bio?: string;
    country?: string;
  };
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return json({ error: "A név nem lehet üres." }, 400);
    patch.full_name = name;
  }
  if (typeof body.avatarColor === "string") patch.avatar_color = body.avatarColor;
  if (typeof body.bio === "string") patch.bio = body.bio.trim().slice(0, 500) || null;
  if (typeof body.country === "string") patch.country = body.country.trim() || null;

  if (Object.keys(patch).length === 0) return json({ error: "Nincs módosítandó adat." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("profiles").update(patch).eq("id", auth.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
