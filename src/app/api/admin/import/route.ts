import { getAdminClient, getAuthContext, isServerConfigured, json } from "@/lib/supabase/server";
import { normalizeOeNumber } from "@/lib/supabase/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Admin adatimport (CSV vagy JSON).
//
// Támogatott típusok: brands, models, engines, categories, parts, oe_numbers,
// fitments. A sorok az `id` mező szerint kerülnek be (upsert). A bemenet lehet
// JSON tömb vagy CSV szöveg (fejlécsorral). Csak admin hívhatja.
// ---------------------------------------------------------------------------

type ImportType = "brands" | "models" | "engines" | "categories" | "parts" | "oe_numbers" | "fitments";

const TABLE: Record<ImportType, string> = {
  brands: "vehicle_brands",
  models: "vehicle_models",
  engines: "vehicle_engines",
  categories: "part_categories",
  parts: "parts",
  oe_numbers: "part_oe_numbers",
  fitments: "fitments",
};

const REQUIRED: Record<ImportType, string[]> = {
  brands: ["id", "name"],
  models: ["id", "brand_id", "name"],
  engines: ["id", "model_id", "engine_name"],
  categories: ["id", "name"],
  parts: ["id", "name"],
  oe_numbers: ["part_id", "oe_number"],
  fitments: ["id", "part_id", "brand_id", "model_id", "compatibility_status"],
};

const NUMERIC = new Set([
  "production_start",
  "production_end",
  "displacement",
  "power_kw",
  "power_hp",
  "production_year_start",
  "production_year_end",
]);

const BOOLEAN = new Set(["verified", "is_default"]);

/** Egyszerű CSV-parser (idézőjelekkel), a fejlécsorból kulcsokat képez. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

function coerce(type: ImportType, raw: Record<string, unknown>): Record<string, unknown> | { error: string } {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === "" || value == null) {
      out[key] = null;
      continue;
    }
    if (NUMERIC.has(key)) {
      const n = Number(value);
      out[key] = Number.isFinite(n) ? n : null;
    } else if (BOOLEAN.has(key)) {
      out[key] = value === true || value === "true" || value === "1" || value === "igen";
    } else {
      out[key] = String(value);
    }
  }

  // OE szám normalizálás automatikusan.
  if (type === "oe_numbers" && out.oe_number) {
    out.oe_number_normalized = normalizeOeNumber(String(out.oe_number));
    if (!out.id) out.id = `oe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  for (const field of REQUIRED[type]) {
    if (out[field] == null || out[field] === "") {
      return { error: `Hiányzó kötelező mező: ${field}` };
    }
  }
  return out;
}

export async function POST(request: Request) {
  if (!isServerConfigured()) return json({ error: "server-not-configured" }, 503);
  const auth = await getAuthContext(request);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.role !== "admin") return json({ error: "forbidden" }, 403);

  const body = (await request.json().catch(() => null)) as
    | { type?: ImportType; rows?: Record<string, unknown>[]; csv?: string }
    | null;
  if (!body?.type || !TABLE[body.type]) return json({ error: "Ismeretlen vagy hiányzó import-típus." }, 400);

  const type = body.type;
  const rawRows = Array.isArray(body.rows) ? body.rows : body.csv ? parseCsv(body.csv) : [];
  if (rawRows.length === 0) return json({ error: "Nincs importálható sor." }, 400);

  const rows: Record<string, unknown>[] = [];
  const errors: string[] = [];
  rawRows.forEach((raw, i) => {
    const coerced = coerce(type, raw);
    if ("error" in coerced) errors.push(`${i + 2}. sor: ${coerced.error}`);
    else rows.push(coerced);
  });

  if (rows.length === 0) return json({ error: "Egy sor sem importálható.", errors }, 400);

  const admin = getAdminClient()!;
  const { error } = await admin.from(TABLE[type]).upsert(rows, { onConflict: "id" });
  if (error) return json({ error: error.message, errors }, 500);

  return json({ imported: rows.length, skipped: errors.length, errors });
}
