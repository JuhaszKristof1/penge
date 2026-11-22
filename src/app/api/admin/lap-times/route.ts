import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import { LAP_EMBED_COLUMNS } from "@/lib/motorsport/lap-payload";
import { mapLapTime, type LapTimeRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Admin köridő-ellenőrzés (lap_times).
//
// Az admin listázhatja a beküldött eredményeket (státusz szerint), majd
// elfogadhatja (approved) vagy elutasíthatja (rejected). Csak az approved
// eredmények kerülnek a nyilvános ranglistára.
// ---------------------------------------------------------------------------

// GET /api/admin/lap-times?status=pending|approved|rejected
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ data: [], error: "forbidden" }, 403);

  const status = new URL(request.url).searchParams.get("status");
  const admin = getAdminClient()!;

  let q = admin.from("lap_times").select(LAP_EMBED_COLUMNS).order("created_at", { ascending: false }).limit(200);
  if (status === "pending" || status === "approved" || status === "rejected") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return json({ data: [], error: error.message }, 500);
  return json({ data: (data ?? []).map((r) => mapLapTime(r as unknown as LapTimeRow)) });
}

// PATCH /api/admin/lap-times – eredmény elfogadása/elutasítása.
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: "pending" | "approved" | "rejected";
    reviewNote?: string;
  };
  if (!body.id) return json({ error: "Hiányzó azonosító." }, 400);
  if (body.status !== "pending" && body.status !== "approved" && body.status !== "rejected") {
    return json({ error: "Érvénytelen státusz." }, 400);
  }

  const admin = getAdminClient()!;
  const { error } = await admin
    .from("lap_times")
    .update({
      status: body.status,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
      review_note: (body.reviewNote ?? "").trim() || null,
    })
    .eq("id", body.id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
