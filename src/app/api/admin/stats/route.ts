import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/admin/stats – összesített statisztikák az adatbázisból (csak admin).
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const admin = getAdminClient()!;

  const [users, vehicles, favorites, reports, searchCount, checkCount] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("user_vehicles").select("id", { count: "exact", head: true }),
    admin.from("favorites").select("id", { count: "exact", head: true }),
    admin.from("compatibility_reports").select("status, confidence").limit(1000),
    admin.from("search_history").select("id", { count: "exact", head: true }).eq("type", "search"),
    admin.from("search_history").select("id", { count: "exact", head: true }).eq("type", "compatibility"),
  ]);

  return json({
    users: users.count ?? 0,
    vehicles: vehicles.count ?? 0,
    favorites: favorites.count ?? 0,
    searches: searchCount.count ?? 0,
    checks: checkCount.count ?? 0,
    reports: reports.data ?? [],
  });
}
