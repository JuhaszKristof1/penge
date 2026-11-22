import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Admin versenypálya-kezelés (tracks, track_layouts).
//
// A pályák bővíthetők: új pálya és pályaváltozat vehető fel, a meglévők
// módosíthatók. Az adatbázis a "tracks" és "track_layouts" táblákból áll; a
// pályahossz és a konfiguráció megadása az admin felelőssége (ellenőrzött
// forrásból).
// ---------------------------------------------------------------------------

const TRACK_FIELDS = [
  "slug",
  "name",
  "locality",
  "county",
  "country",
  "latitude",
  "longitude",
  "description",
  "image_url",
  "layout_image_url",
  "length_m",
  "width",
  "corners",
  "opened_year",
  "status",
  "website",
  "source_url",
  "source_note",
] as const;

const NUMERIC_FIELDS = new Set(["latitude", "longitude", "length_m", "corners", "opened_year"]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTrackPatch(body: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of TRACK_FIELDS) {
    if (!(field in body)) continue;
    const raw = body[field];
    if (NUMERIC_FIELDS.has(field)) {
      if (raw === "" || raw === null || raw === undefined) {
        patch[field] = null;
      } else {
        const num = Number(raw);
        patch[field] = Number.isFinite(num) ? num : null;
      }
    } else if (typeof raw === "string") {
      patch[field] = raw.trim() || null;
    }
  }
  return patch;
}

// GET /api/admin/tracks – az összes pálya (a nem aktívak is).
export async function GET(request: Request) {
  if (!isServerConfigured()) return json({ data: [], error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ data: [], error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ data: [], error: "forbidden" }, 403);

  const admin = getAdminClient()!;
  const { data, error } = await admin
    .from("tracks")
    .select(
      "id, slug, name, locality, county, country, latitude, longitude, description, image_url, layout_image_url, length_m, width, corners, opened_year, status, website, source_url, source_note, created_at",
    )
    .order("name", { ascending: true });
  if (error) return json({ data: [], error: error.message }, 500);

  const { data: layouts } = await admin
    .from("track_layouts")
    .select("id, track_id, slug, name, length_m, corners, direction, description, map_image_url, is_default")
    .order("is_default", { ascending: false });

  return json({ data: data ?? [], layouts: layouts ?? [] });
}

// POST /api/admin/tracks – új pálya felvétele.
export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch = buildTrackPatch(body);
  const name = typeof patch.name === "string" ? patch.name : "";
  if (!name) return json({ error: "A pálya neve kötelező." }, 400);
  if (!patch.slug) patch.slug = slugify(name);
  if (!patch.country) patch.country = "Magyarország";

  const admin = getAdminClient()!;
  const { data, error } = await admin.from("tracks").insert(patch).select("id, slug").single();
  if (error) return json({ error: error.message }, 500);
  return json({ data }, 201);
}

// PATCH /api/admin/tracks – pálya módosítása.
export async function PATCH(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown> & { id?: string };
  if (!body.id) return json({ error: "Hiányzó azonosító." }, 400);
  const patch = buildTrackPatch(body);
  if (Object.keys(patch).length === 0) return json({ error: "Nincs módosítandó adat." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("tracks").update(patch).eq("id", body.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

// DELETE /api/admin/tracks?id=... – pálya törlése (a változatok is törlődnek).
export async function DELETE(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Hiányzó azonosító." }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from("tracks").delete().eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
