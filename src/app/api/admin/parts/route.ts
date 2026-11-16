import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import { normalizeOeNumber } from "@/lib/supabase/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Admin alkatrész-kezelés (parts + part_oe_numbers).
// Csak admin jogosultsággal hívható; a szerver ellenőrzi a szerepkört.
// ---------------------------------------------------------------------------

interface PartPayload {
  id?: string;
  name?: string;
  manufacturer?: string;
  manufacturerPartNumber?: string;
  description?: string;
  categoryId?: string;
  imageUrl?: string;
  oeNumbers?: string[];
}

function buildPartRow(p: PartPayload) {
  return {
    category_id: p.categoryId || null,
    name: p.name?.trim() ?? "",
    manufacturer: p.manufacturer?.trim() || null,
    manufacturer_part_number: p.manufacturerPartNumber?.trim() || null,
    description: p.description?.trim() || null,
    image_url: p.imageUrl?.trim() || null,
  };
}

async function replaceOeNumbers(partId: string, oeNumbers: string[] | undefined) {
  if (!Array.isArray(oeNumbers)) return;
  const admin = getAdminClient()!;
  await admin.from("part_oe_numbers").delete().eq("part_id", partId);
  const rows = oeNumbers
    .map((n) => n.trim())
    .filter(Boolean)
    .map((oe, i) => ({
      id: `${partId}-oe${i + 1}-${Date.now().toString(36)}`,
      part_id: partId,
      oe_number: oe,
      oe_number_normalized: normalizeOeNumber(oe),
    }));
  if (rows.length) await admin.from("part_oe_numbers").insert(rows);
}

// GET /api/admin/parts – teljes alkatrészlista (admin).
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ data: [], error: "forbidden" }, 403);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("parts")
    .select("id, category_id, name, manufacturer, manufacturer_part_number, description, image_url, created_at")
    .order("created_at", { ascending: false });
  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: data ?? [] });
}

// POST /api/admin/parts – új alkatrész.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const payload = (await request.json().catch(() => ({}))) as PartPayload;
  if (!payload.name?.trim()) return json({ error: "Az alkatrész neve kötelező." }, 400);

  const admin = getAdminClient()!;
  const id = payload.id?.trim() || `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await admin.from("parts").insert({ id, ...buildPartRow(payload) });
  if (error) return json({ error: error.message }, 500);
  await replaceOeNumbers(id, payload.oeNumbers);
  return json({ data: { id } }, 201);
}

// PATCH /api/admin/parts – alkatrész módosítása.
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const payload = (await request.json().catch(() => ({}))) as PartPayload;
  if (!payload.id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("parts").update(buildPartRow(payload)).eq("id", payload.id);
  if (error) return json({ error: error.message }, 500);
  await replaceOeNumbers(payload.id, payload.oeNumbers);
  return json({ ok: true });
}

// DELETE /api/admin/parts?id=... – alkatrész törlése (fitmentek és OE számok is).
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;
  await admin.from("part_oe_numbers").delete().eq("part_id", id);
  await admin.from("fitments").delete().eq("part_id", id);
  const { error } = await admin.from("parts").delete().eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
