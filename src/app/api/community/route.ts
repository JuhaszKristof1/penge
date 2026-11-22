import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Közösség: versenyzői profilok és bejegyzések (posts).
//
// A profilok nyilvánosak (profiles tábla). A bejegyzések egyszerű szöveges
// posztok; a nagy közösségi hálózat (követés, hírfolyam) egyelőre előkészített,
// nem teljes funkció.
// ---------------------------------------------------------------------------

// GET /api/community – versenyzők és a legfrissebb bejegyzések.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);
  const admin = getAdminClient()!;

  const [profilesRes, postsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, avatar_color, bio, country, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    admin
      .from("posts")
      .select("id, user_id, track_id, body, created_at, profiles!posts_user_id_fkey(full_name, avatar_color), tracks(name, slug)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (profilesRes.error) return json({ data: null, error: profilesRes.error.message }, 500);

  return json({
    drivers: profilesRes.data ?? [],
    posts: postsRes.data ?? [],
  });
}

// POST /api/community – új bejegyzés létrehozása.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { body?: string; trackId?: string | null };
  const text = (body.body ?? "").trim();
  if (!text) return json({ error: "A bejegyzés nem lehet üres." }, 400);
  if (text.length > 2000) return json({ error: "A bejegyzés túl hosszú (max. 2000 karakter)." }, 400);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("posts")
    .insert({ user_id: auth.userId, body: text, track_id: (body.trackId ?? "")?.trim() || null })
    .select("id, created_at")
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
}
