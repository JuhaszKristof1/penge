import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/download/weboldal – a weboldal offline példányának kiszolgálása.
//
// A public/site/ alatti statikus példány ZIP-be csomagolva (ezt a
// scripts/snapshot_site.py és a hozzá tartozó csomagolás állítja elő).
// `Content-Disposition: attachment`, hogy a böngésző mentse, ne nyissa meg.
// ---------------------------------------------------------------------------

const ZIP_FILE = "gridline-weboldal.zip";

export async function GET() {
  const file = path.join(process.cwd(), "public", ZIP_FILE);

  let size: number;
  try {
    size = statSync(file).size;
  } catch {
    return new Response(JSON.stringify({ error: "not-found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "content-type": "application/zip",
      "content-length": String(size),
      "content-disposition": `attachment; filename="${ZIP_FILE}"`,
      "cache-control": "no-store",
    },
  });
}
