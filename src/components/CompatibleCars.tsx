"use client";

import { useEffect, useState } from "react";
import { Car, Loader2 } from "lucide-react";
import type { Part } from "@/lib/types";
import { fetchFitmentsDetailed } from "@/lib/supabase/queries";
import { firstEmbedded } from "@/lib/supabase/mappers";
import { Badge } from "./ui";
import { cn } from "@/lib/utils";

// Kompatibilis autók szekció.
// A valós `fitments` táblából töltjük be a "compatible" sorokat (beágyazott
// márka/modell nevekkel). Nincs kitalált adat: ha nincs rekord, üres listát
// jelenítünk meg.

interface FittedCarView {
  key: string;
  makeName: string;
  modelName: string;
  generationName: string;
  yearFrom: number;
  yearTo: number;
  verified: boolean;
}

export function CompatibleCars({ part, max, className }: { part: Part; max?: number; className?: string }) {
  const [cars, setCars] = useState<FittedCarView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFitmentsDetailed(part.id)
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
          setCars([]);
          return;
        }
        const rows = res.data ?? [];
        const seen = new Set<string>();
        const out: FittedCarView[] = [];
        for (const row of rows) {
          const brand = firstEmbedded(row.vehicle_brands);
          const model = firstEmbedded(row.vehicle_models);
          const key = `${row.brand_id}:${row.model_id}:${row.engine_id ?? "*"}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            key,
            makeName: brand?.name ?? "Ismeretlen márka",
            modelName: model?.name ?? "Ismeretlen modell",
            generationName: model?.generation ?? model?.name ?? "",
            yearFrom: row.production_year_start ?? model?.production_start ?? 0,
            yearTo: row.production_year_end ?? model?.production_end ?? 0,
            verified: row.verified,
          });
        }
        setCars(out);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [part.id]);

  const shown = typeof max === "number" ? cars.slice(0, max) : cars;
  const hidden = cars.length - shown.length;

  return (
    <section className={cn("rounded-sm border border-ink-700 bg-ink-900/50 p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
          <Car className="h-4 w-4 text-brand-400" />
          Kompatibilis autók
        </h3>
        <Badge tone="neutral">{loading ? "Betöltés…" : `${cars.length} illeszkedés`}</Badge>
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Kompatibilitási rekordok betöltése…
        </p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-300">Hiba a kompatibilitási rekordok betöltésekor: {error}</p>
      ) : cars.length === 0 ? (
        <p className="mt-3 text-sm text-graphite-400">
          Ehhez az alkatrészhez nincs „kompatibilis” fitment rekord az adatbázisban.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {shown.map((car) => (
            <li
              key={car.key}
              className="flex items-center gap-3 rounded-sm border border-ink-700 bg-ink-850/70 px-3 py-2.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-ink-800 text-brand-400">
                <Car className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {car.makeName} {car.modelName}
                </span>
                <span className="block truncate text-[11px] text-graphite-400">
                  {car.generationName} · {car.yearFrom}–{car.yearTo}
                </span>
              </span>
              {car.verified && <Badge tone="success" className="shrink-0 text-[10px]">Ellenőrzött</Badge>}
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <p className="mt-3 text-xs text-graphite-500">+ további {hidden} illeszkedő generáció az adatbázisban.</p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-graphite-500">
        Az adatbázis fitments táblájából betöltött, „kompatibilis” jelölésű rekordok.
      </p>
    </section>
  );
}
