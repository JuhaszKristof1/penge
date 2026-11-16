import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Download, FileArchive, FolderTree, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Projekt letöltése",
  description: "Az AutoFit AI projekt teljes forráskódjának letöltése ZIP archívumban.",
};

const ZIP_NAME = "autofit-ai.zip";

// A ZIP metaadatait build időben olvassuk ki, hogy a méret és a fájlszám mindig
// pontosan a csomagolt archívumot tükrözze.
function readZipMeta(): { bytes: number; files: number } {
  try {
    const buf = readFileSync(path.join(process.cwd(), "public", ZIP_NAME));
    // Az End of Central Directory rekord (EOCD) az utolsó 22..65557 bájtban van.
    for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65557; i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) {
        return { bytes: buf.length, files: buf.readUInt16LE(i + 10) };
      }
    }
    return { bytes: buf.length, files: 0 };
  } catch {
    return { bytes: 0, files: 0 };
  }
}

const { bytes: ZIP_BYTES, files: ZIP_FILES } = readZipMeta();
const ZIP_SIZE_LABEL = `${Math.round(ZIP_BYTES / 1024)} KB`;

const INCLUDED = [
  "src/ – a teljes forráskód (Next.js App Router oldalak + komponensek)",
  "src/lib/catalog/ + src/lib/supabase/ – katalógus-szolgáltató és Supabase adatréteg",
  "src/app/api/ – szerveroldali API route-ok (felhasználói adatok + admin)",
  "public/parts/ – 34 saját SVG alkatrészillusztráció (offline elérhető)",
  "scripts/ – SVG generátor, ZIP csomagoló és Supabase-ellenőrző segédszkriptek",
  "package.json + package-lock.json",
  "tailwind.config.ts, tsconfig.json",
  "next.config.mjs, postcss.config.mjs",
  "README.md – futtatási útmutató",
  "AGENTS.md – fejlesztői jegyzetek",
  ".env.example – Supabase környezeti változók mintája (opcionális)",
  ".gitignore",
];

const EXCLUDED = [
  "node_modules/ – npm install pótolja",
  ".next/ – npm run build pótolja",
  ".git/ – verziókezelési előzmények",
  "*.tsbuildinfo – gyorsítótár",
];

export default function DownloadPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
          <FileArchive className="h-3.5 w-3.5" />
          ZIP archívum
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Projekt letöltése
        </h1>
        <p className="mt-3 text-graphite-300">
          Töltsd le az AutoFit AI teljes forráskódját egy ZIP fájlban, majd telepítés után
          futtatható lokálisan.
        </p>

        <div className="mt-8 card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
              <FileArchive className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-white">{ZIP_NAME}</p>
              <p className="text-sm text-graphite-400">
                Next.js + TypeScript + Tailwind · {ZIP_SIZE_LABEL}
                {ZIP_FILES > 0 ? ` · ${ZIP_FILES} fájl` : ""}
              </p>
            </div>
          </div>

          <a href={`/${ZIP_NAME}`} download className="btn btn-primary mt-6 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            ZIP letöltése
          </a>

          <p className="mt-3 text-xs text-graphite-500">
            Ha a gomb nem indítja a letöltést, nyisd meg közvetlenül:{" "}
            <a href={`/${ZIP_NAME}`} download className="text-brand-400 underline underline-offset-2">
              /{ZIP_NAME}
            </a>
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
              <FolderTree className="h-4 w-4 text-brand-400" />
              A csomag tartalma
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-graphite-300">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
              <Terminal className="h-4 w-4 text-brand-400" />
              Futtatás
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 p-3 text-xs leading-relaxed text-graphite-200">
{`unzip autofit-ai.zip
cd autofit-ai
npm install
npm run dev`}
            </pre>
            <p className="mt-3 text-xs text-graphite-500">→ http://localhost:3000</p>
          </div>
        </div>

        <div className="mt-6 card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Nincs a csomagban
          </h2>
          <ul className="mt-3 grid gap-1.5 text-sm text-graphite-400 sm:grid-cols-2">
            {EXCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-graphite-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] px-4 py-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-300">
            i
          </span>
          <p className="text-xs leading-relaxed text-brand-100/90 sm:text-sm">
            A letöltött projekt a valós Supabase adatbázisra épül: a jármű- és alkatrészadatok,
            valamint a felhasználói mentések (garázs, kedvencek, ellenőrzések) az adatbázisban
            tárolódnak. A kapcsolatot a .env.example alapján kell beállítani (külső AI nélkül).
          </p>
        </div>
      </div>
    </div>
  );
}
