import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { Download } from "lucide-react";

// Egyetlen feladat: a teljes projekt ZIP-jének letöltése. A metaadatokat build
// időben olvassuk ki, hogy a kiírt méret és ellenőrzőösszeg a tényleges fájlt
// tükrözze.
const ZIP_NAME = "gridline.zip";

function readZipMeta(name: string) {
  const file = path.join(process.cwd(), "public", name);
  try {
    const buf = readFileSync(file);
    let files = 0;
    for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65557; i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) {
        files = buf.readUInt16LE(i + 10);
        break;
      }
    }
    const builtAt = statSync(file).mtime.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { bytes: buf.length, files, sha256: createHash("sha256").update(buf).digest("hex"), builtAt };
  } catch {
    return { bytes: 0, files: 0, sha256: "", builtAt: "—" };
  }
}

const META = readZipMeta(ZIP_NAME);

export default function DownloadPage() {
  return (
    <main className="w-full max-w-md text-center">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-[0.15em] text-white">
        GRID<span className="text-brand-500">LINE</span>
      </h1>

      <a
        href="/api/download/gridline"
        download
        className="btn-primary mt-8 w-full px-6 py-3.5 text-sm uppercase tracking-[0.1em]"
      >
        <Download className="h-4 w-4" />
        Letöltés
      </a>

      <p className="mt-4 text-xs text-graphite-500">
        {ZIP_NAME} · {(META.bytes / 1024 / 1024).toFixed(2)} MB · {META.files} fájl
        <br />
        {META.builtAt}
      </p>

      {META.sha256 && (
        <code className="mt-4 block break-all font-mono text-[10px] leading-relaxed text-graphite-600">
          {META.sha256}
        </code>
      )}
    </main>
  );
}
