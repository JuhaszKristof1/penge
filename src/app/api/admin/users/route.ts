import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/admin/users – összes profil listája (csak admin).
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ data: [], error: "forbidden" }, 403);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, avatar_color, created_at")
    .order("created_at", { ascending: false });

  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: data ?? [] });
}
