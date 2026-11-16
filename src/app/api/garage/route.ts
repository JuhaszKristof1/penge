import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import type { UserVehicleRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// GET /api/garage – a bejelentkezett felhasználó mentett autói.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("user_vehicles")
    .select("id, user_id, brand_id, model_id, engine_id, nickname, year, body, is_default, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: true });

  if (error) return json({ data: [], error: error.message }, 500);
  const rows = (data ?? []) as UserVehicleRow[];

  // A járműneveket a katalógusból oldjuk fel, hogy a UI ne kelljen külön
  // betöltenie a modelleket/motorokat.
  const brandIds = uniq(rows.map((r) => r.brand_id));
  const modelIds = uniq(rows.map((r) => r.model_id));
  const engineIds = uniq(rows.map((r) => r.engine_id));

  const brands = new Map<string, string>();
  const models = new Map<string, { name: string; generation: string | null }>();
  const engines = new Map<string, { name: string; code: string | null }>();

  if (brandIds.length) {
    const { data: b } = await admin.from("vehicle_brands").select("id, name").in("id", brandIds);
    (b ?? []).forEach((r) => brands.set(r.id, r.name));
  }
  if (modelIds.length) {
    const { data: m } = await admin.from("vehicle_models").select("id, name, generation").in("id", modelIds);
    (m ?? []).forEach((r) => models.set(r.id, { name: r.name, generation: r.generation }));
  }
  if (engineIds.length) {
    const { data: e } = await admin.from("vehicle_engines").select("id, engine_name, engine_code").in("id", engineIds);
    (e ?? []).forEach((r) => engines.set(r.id, { name: r.engine_name, code: r.engine_code }));
  }

  const enriched = rows.map((r) => ({
    ...r,
    brand_name: r.brand_id ? brands.get(r.brand_id) ?? null : null,
    model_name: r.model_id ? models.get(r.model_id)?.name ?? null : null,
    generation_name: r.model_id ? models.get(r.model_id)?.generation ?? null : null,
    engine_name: r.engine_id ? engines.get(r.engine_id)?.name ?? null : null,
    engine_code: r.engine_id ? engines.get(r.engine_id)?.code ?? null : null,
  }));

  return json({ data: enriched });
}

interface CarPayload {
  makeId?: string;
  modelId?: string;
  generationId?: string;
  engineId?: string;
  year?: number;
  body?: string;
  nickname?: string;
}

function toRow(payload: CarPayload) {
  return {
    brand_id: payload.makeId ?? null,
    // Az adatbázisban a vehicle_models.id a valódi modell/generáció azonosító,
    // amit a kliens generationId-ként küld (a modelId a UI csoportosítása).
    model_id: payload.generationId ?? payload.modelId ?? null,
    engine_id: payload.engineId ?? null,
    year: typeof payload.year === "number" ? payload.year : null,
    body: payload.body ?? null,
    nickname: payload.nickname ?? null,
  };
}

// POST /api/garage – új autó mentése.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const payload = (await request.json().catch(() => ({}))) as CarPayload;
  if (!payload.makeId || !payload.modelId) return json({ error: "Hiányos járműadatok." }, 400);

  const admin = getAdminClient()!;
  const { count } = await admin
    .from("user_vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId);

  const { data, error } = await admin
    .from("user_vehicles")
    .insert({
      id: `car-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: auth.userId,
      is_default: (count ?? 0) === 0,
      ...toRow(payload),
    })
    .select("id")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
}

// PATCH /api/garage – autó módosítása vagy alapértelmezetté tétele.
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const payload = (await request.json().catch(() => ({}))) as CarPayload & { id?: string; isDefault?: boolean };
  if (!payload.id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;

  if (payload.isDefault === true) {
    // Csak egy autó lehet alapértelmezett: előbb mindent nullázunk.
    await admin.from("user_vehicles").update({ is_default: false }).eq("user_id", auth.userId);
    const { error } = await admin
      .from("user_vehicles")
      .update({ is_default: true })
      .eq("id", payload.id)
      .eq("user_id", auth.userId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  const patch: Record<string, unknown> = toRow(payload);
  Object.keys(patch).forEach((k) => patch[k] === null && delete patch[k]);
  if (Object.keys(patch).length === 0) return json({ error: "Nincs módosítandó adat." }, 400);

  const { error } = await admin.from("user_vehicles").update(patch).eq("id", payload.id).eq("user_id", auth.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

// DELETE /api/garage?id=... – autó törlése.
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("user_vehicles").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

function uniq(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}
