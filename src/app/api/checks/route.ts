import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import type { CompatibilityResult } from "@/lib/types";
import type { CompatibilityReportRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Kompatibilitási jegyzőkönyvek (compatibility_reports).
//
// A kliens a teljes eredményt küldi (beleértve a jármű megnevezéseit is). A
// tárolás normalizáltan történik (brand_id/model_id/engine_id), a visszaolvasott
// jegyzőkönyvekhez pedig a járműneveket a katalógusból oldjuk fel.
// ---------------------------------------------------------------------------

interface Names {
  brand: Map<string, string>;
  model: Map<string, { name: string; generation: string | null }>;
  engine: Map<string, { name: string; code: string | null }>;
}

async function loadNames(brandIds: string[], modelIds: string[], engineIds: string[]): Promise<Names> {
  const admin = getAdminClient()!;
  const names: Names = { brand: new Map(), model: new Map(), engine: new Map() };

  if (brandIds.length) {
    const { data } = await admin.from("vehicle_brands").select("id, name").in("id", brandIds);
    (data ?? []).forEach((r) => names.brand.set(r.id, r.name));
  }
  if (modelIds.length) {
    const { data } = await admin.from("vehicle_models").select("id, name, generation").in("id", modelIds);
    (data ?? []).forEach((r) => names.model.set(r.id, { name: r.name, generation: r.generation }));
  }
  if (engineIds.length) {
    const { data } = await admin.from("vehicle_engines").select("id, engine_name, engine_code").in("id", engineIds);
    (data ?? []).forEach((r) => names.engine.set(r.id, { name: r.engine_name, code: r.engine_code }));
  }
  return names;
}

function toResult(row: CompatibilityReportRow, names: Names): CompatibilityResult {
  const brandId = row.brand_id ?? "";
  const modelId = row.model_id ?? "";
  const engineId = row.engine_id ?? "";
  const model = names.model.get(modelId);
  const engine = names.engine.get(engineId);

  return {
    id: row.id,
    status: row.status,
    confidence: row.confidence,
    score: row.confidence,
    reasons: row.reasons ?? [],
    warnings: row.warnings ?? [],
    matchedPart: row.matched_part_id
      ? { id: row.matched_part_id, name: row.part_name ?? "", sku: row.manufacturer_part_number ?? "-", brand: "", category: row.category ?? "" }
      : undefined,
    input: {
      makeId: brandId,
      makeName: names.brand.get(brandId) ?? "",
      modelId,
      modelName: model?.name ?? "",
      generationId: modelId,
      generationName: model?.generation ?? model?.name ?? "",
      year: row.year ?? 0,
      body: "",
      engineId,
      engineName: engine?.name ?? "",
      engineCode: engine?.code ?? "",
      partName: row.part_name ?? "",
      oeNumber: row.oe_number ?? "",
      manufacturerSku: row.manufacturer_part_number ?? "",
      category: row.category ?? "",
    },
    createdAt: row.created_at,
    source: "database",
    verified: row.verified,
  };
}

// GET /api/checks – a felhasználó mentett ellenőrzései.
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("compatibility_reports")
    .select(
      "id, user_id, part_name, oe_number, manufacturer_part_number, category, brand_id, model_id, engine_id, year, status, confidence, verified, reasons, warnings, matched_part_id, created_at",
    )
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return json({ data: [], error: error.message }, 500);
  const rows = (data ?? []) as CompatibilityReportRow[];

  const names = await loadNames(
    uniq(rows.map((r) => r.brand_id)),
    uniq(rows.map((r) => r.model_id)),
    uniq(rows.map((r) => r.engine_id)),
  );

  return json({ data: rows.map((r) => toResult(r, names)) });
}

// POST /api/checks – új ellenőrzés mentése.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const result = (await request.json().catch(() => null)) as CompatibilityResult | null;
  if (!result || !result.input || !result.status) return json({ error: "Hiányos eredmény." }, 400);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("compatibility_reports")
    .insert({
      user_id: auth.userId,
      part_name: result.input.partName,
      oe_number: result.input.oeNumber || null,
      manufacturer_part_number: result.input.manufacturerSku || null,
      category: result.input.category || null,
      brand_id: result.input.makeId || null,
      model_id: result.input.generationId || result.input.modelId || null,
      engine_id: result.input.engineId || null,
      year: result.input.year || null,
      status: result.status,
      confidence: result.confidence,
      verified: result.verified ?? false,
      reasons: result.reasons,
      warnings: result.warnings,
      matched_part_id: result.matchedPart?.id ?? null,
    })
    .select("id, created_at")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ data: { ...result, id: data.id, createdAt: data.created_at } }, 201);
}

// DELETE /api/checks – egy ellenőrzés (?id=) vagy az összes törlése.
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const id = new URL(request.url).searchParams.get("id");
  const admin = getAdminClient()!;
  let q = admin.from("compatibility_reports").delete().eq("user_id", auth.userId);
  if (id) q = q.eq("id", id);
  const { error } = await q;
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

function uniq(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}
