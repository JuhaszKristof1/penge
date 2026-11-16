import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/search-history – keresési / ellenőrzési esemény naplózása.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ ok: false, error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ ok: false, error: "unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as { type?: string; label?: string; query?: string };
  const type = body.type === "compatibility" ? "compatibility" : "search";
  const label = (body.label ?? "").trim();
  if (!label) return json({ error: "Hiányzó címke." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("search_history").insert({
    user_id: auth.userId,
    type,
    label,
    query: body.query ?? null,
  });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

// DELETE /api/search-history – a felhasználó saját naplójának törlése.
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { error } = await admin.from("search_history").delete().eq("user_id", auth.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
