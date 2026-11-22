import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import type { Challenge, ChallengeProgress, ProgressionSummary } from "@/lib/types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Fejlődési rendszer (feladatok, pontok, licencek).
//
//   GET  /api/progression – a feladatlista + a hívó haladása.
//   POST /api/progression – egy feladat jutalmának igénylése.
//
// A pontokat KIZÁRÓLAG az adatbázis `claim_challenge` függvénye ítéli oda, a
// valós adatokon ellenőrzött feltétel alapján. A kliens csak kérni tud, a
// pontértéket nem tudja megadni. A függvény service_role-ra van zárva.
// ---------------------------------------------------------------------------

interface ProgressionPayload {
  challenges: (Challenge & { current: number; completed: boolean; completedAt: string | null })[];
  summary: Omit<ProgressionSummary, "totalChallenges">;
}

export interface PointsEntry {
  id: number;
  delta: number;
  reason: string;
  source: string;
  sourceRef: string | null;
  createdAt: string;
}

function normalize(payload: ProgressionPayload): { challenges: ChallengeProgress[]; summary: ProgressionSummary } {
  const challenges: ChallengeProgress[] = (payload.challenges ?? []).map((c) => {
    const target = Number(c.target ?? 1);
    const current = Number(c.current ?? 0);
    const completed = Boolean(c.completed);
    return {
      code: c.code,
      name: c.name,
      description: c.description,
      icon: c.icon,
      points: Number(c.points ?? 0),
      category: c.category,
      sortOrder: Number(c.sortOrder ?? 0),
      target,
      current,
      completed,
      completedAt: c.completedAt ?? null,
      claimable: !completed && current >= target,
    };
  });

  return {
    challenges,
    summary: { ...payload.summary, totalChallenges: challenges.length },
  };
}

export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);

  const admin = getAdminClient()!;
  const auth = await getAuthContext(request);

  // Bejelentkezés nélkül is látszanak a feladatok (haladás nélkül).
  const { data, error } = await admin.rpc("get_progression", { p_user: auth?.userId ?? null });
  if (error) return json({ data: null, error: error.message }, 500);

  let points: PointsEntry[] = [];
  if (auth) {
    const { data: rows } = await admin
      .from("points_ledger")
      .select("id, delta, reason, source, source_ref, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    points = (rows ?? []).map((r) => ({
      id: Number(r.id),
      delta: Number(r.delta),
      reason: r.reason,
      source: r.source,
      sourceRef: r.source_ref ?? null,
      createdAt: r.created_at,
    }));
  }

  return json({ data: { ...normalize(data as ProgressionPayload), points } });
}

export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ data: null, error: "server-not-configured" }, 503);

  const auth = await getAuthContext(request);
  if (!auth) return json({ data: null, error: "A pontok igényléséhez be kell jelentkezned." }, 401);

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return json({ data: null, error: "Hiányzó feladat-azonosító." }, 400);

  const admin = getAdminClient()!;
  const { data, error } = await admin.rpc("claim_challenge", { p_user: auth.userId, p_code: code });
  if (error) return json({ data: null, error: error.message }, 500);

  const result = data as {
    ok: boolean;
    error?: string;
    points_awarded?: number;
    total_points?: number;
    licence?: string;
  };

  if (!result?.ok) {
    const messages: Record<string, string> = {
      "already-claimed": "Ezt a feladatot már teljesítetted – a jutalom csak egyszer szerezhető meg.",
      "criteria-not-met": "A feladat feltétele még nem teljesült.",
      "unknown-challenge": "Ismeretlen feladat.",
      "not-authenticated": "A pontok igényléséhez be kell jelentkezned.",
    };
    const message = messages[result?.error ?? ""] ?? "A jutalom igénylése nem sikerült.";
    return json({ data: null, error: message, code: result?.error ?? "unknown" }, 400);
  }

  const { data: fresh } = await admin.rpc("get_progression", { p_user: auth.userId });
  return json({
    data: {
      pointsAwarded: result.points_awarded ?? 0,
      totalPoints: result.total_points ?? 0,
      licence: result.licence ?? "rookie",
      progression: fresh ? normalize(fresh as ProgressionPayload) : null,
    },
  });
}
