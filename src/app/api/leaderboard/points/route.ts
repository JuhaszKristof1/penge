import { getAdminClient, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/leaderboard/points – a pontverseny ranglistája.
//
// A `points_ledger` és a `user_licences` RLS-sel védett (csak a tulajdonos
// olvashatja), ezért a nyilvános pontversenyt service_role-lal, szerveroldalon
// állítjuk össze. A válasz kizárólag nyilvános adatot tartalmaz: név,
// profilkép-szín, összpontszám és licencszint. E-mail vagy user_id nem megy ki.
//
// A pontokat KIZÁRÓLAG a `points_ledger` napló összege adja – ugyanaz az érték,
// amit a `recompute_licence` használ, így a ranglista és a licencek nem
// csúsznak el egymástól.
// ---------------------------------------------------------------------------

export interface PointsLeaderRow {
  rank: number;
  name: string;
  avatarColor: string;
  points: number;
  licenceCode: string;
  licenceName: string;
  approvedLaps: number;
}

interface LicenceLevel {
  code: string;
  name: string;
  minPoints: number;
}

export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);

  const admin = getAdminClient()!;
  const period = new URL(request.url).searchParams.get("period") ?? "all";

  let ledgerQuery = admin.from("points_ledger").select("user_id, delta").limit(20000);
  if (period === "90d" || period === "year") {
    const since = new Date();
    if (period === "90d") since.setDate(since.getDate() - 90);
    else since.setMonth(0, 1);
    ledgerQuery = ledgerQuery.gte("created_at", since.toISOString());
  }

  const [ledger, profiles, levels, laps] = await Promise.all([
    ledgerQuery,
    admin.from("profiles").select("id, full_name, username, avatar_color").limit(2000),
    admin.from("licence_levels").select("code, name, min_points").order("min_points", { ascending: true }),
    admin.from("lap_times").select("user_id").eq("status", "approved").limit(20000),
  ]);

  if (ledger.error) return json({ data: null, error: ledger.error.message }, 500);

  const totals = new Map<string, number>();
  for (const row of ledger.data ?? []) {
    const id = String(row.user_id);
    totals.set(id, (totals.get(id) ?? 0) + Number(row.delta ?? 0));
  }

  const approvedLaps = new Map<string, number>();
  for (const row of laps.data ?? []) {
    const id = String(row.user_id);
    approvedLaps.set(id, (approvedLaps.get(id) ?? 0) + 1);
  }

  const levelList: LicenceLevel[] = (levels.data ?? []).map((l) => ({
    code: String(l.code),
    name: String(l.name),
    minPoints: Number(l.min_points ?? 0),
  }));

  const levelFor = (points: number): LicenceLevel | undefined => {
    let found: LicenceLevel | undefined;
    for (const level of levelList) if (points >= level.minPoints) found = level;
    return found ?? levelList[0];
  };

  const profileById = new Map<string, { name: string; color: string }>();
  for (const p of profiles.data ?? []) {
    const name = String(p.username ?? p.full_name ?? "Névtelen versenyző");
    profileById.set(String(p.id), { name, color: String(p.avatar_color ?? "#f97316") });
  }

  const rows: PointsLeaderRow[] = [];
  for (const [userId, points] of totals) {
    const profile = profileById.get(userId);
    if (!profile) continue;
    const level = levelFor(points);
    rows.push({
      rank: 0,
      name: profile.name,
      avatarColor: profile.color,
      points,
      licenceCode: level?.code ?? "rookie",
      licenceName: level?.name ?? "Rookie",
      approvedLaps: approvedLaps.get(userId) ?? 0,
    });
  }

  rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "hu"));
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return json({ data: { rows, total: rows.length }, error: null });
}
