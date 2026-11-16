"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Part } from "@/lib/types";
import { Badge } from "./ui";
import { PartImage } from "./PartImage";
import { ShopLinks } from "./ShopLinks";
import { CompatibleCars } from "./CompatibleCars";
import { RelatedParts } from "./RelatedParts";
import { cn } from "@/lib/utils";

// Az alkatrész adatlap közös tartalma – a modálban és a dedikált
// /alkatreszek/[id] oldalon egyaránt ezt használjuk.

export function PartDetailContent({
  part,
  onOpen,
  isFavorite,
  onToggleFavorite,
  headingId,
  showRelated = true,
  className,
}: {
  part: Part;
  onOpen?: (part: Part) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (part: Part) => void;
  headingId?: string;
  showRelated?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      {/* Fejléc: kép + alapadatok */}
      <div className="grid sm:grid-cols-2">
        <PartImage
          part={part}
          size="lg"
          priority
          className="h-64 w-full border-b border-ink-700 sm:h-full sm:border-b-0 sm:border-r"
        />

        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">{part.brand}</span>
          </div>

          <h2
            id={headingId}
            className="mt-2 font-display text-xl font-extrabold leading-tight text-white md:text-2xl"
          >
            {part.name}
          </h2>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="neutral">{part.category}</Badge>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-graphite-300">
            {part.description || "Ehhez az alkatrészhez nincs megadott leírás az adatbázisban."}
          </p>

          <div className="mt-5 flex items-end justify-between gap-3">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(part)}
                className={cn(
                  "btn",
                  isFavorite ? "border border-rose-500/40 bg-rose-500/10 text-rose-300" : "btn-ghost",
                )}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                {isFavorite ? "Kedvenc" : "Kedvencekhez"}
              </button>
            )}
            <a href="#vasarlas" className="btn-primary px-3 py-2 text-xs">
              Hol vásárolható meg?
            </a>
          </div>
        </div>
      </div>

      {/* Azonosítók */}
      <div className="grid gap-6 border-t border-ink-700 p-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-graphite-300">Azonosítók</h3>
          <dl className="space-y-2 text-sm">
            <IdRow label="Gyártó" value={part.brand} />
            <IdRow label="Gyártói cikkszám" value={part.sku} />
            <IdRow label="OE szám" value={part.oeNumber} />
            {part.oeNumbers && part.oeNumbers.length > 1 && (
              <IdRow label="További OE számok" value={part.oeNumbers.slice(1).join(", ")} />
            )}
            <IdRow label="Kategória" value={part.category} />
            <IdRow label="Adatforrás" value="Supabase adatbázis" />
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-graphite-300">Adatminőség</h3>
          <p className="text-sm leading-relaxed text-graphite-300">
            Az alkatrész adatai a Supabase adatbázisból származnak.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-graphite-500">
            A kompatibilitást kizárólag az adatbázis <span className="font-mono">fitments</span> táblája dönti el.
            Pontos, járműre szabott ellenőrzéshez használd a{" "}
            <Link href="/kompatibilitas" className="text-brand-400 underline underline-offset-2">
              kompatibilitás ellenőrzőt
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Kompatibilis autók + vásárlás */}
      <div className="grid gap-6 border-t border-ink-700 p-6 lg:grid-cols-2">
        <CompatibleCars part={part} max={6} />
        <div id="vasarlas" className="scroll-mt-24">
          <ShopLinks part={part} />
        </div>
      </div>
      {showRelated && (
        <div className="border-t border-ink-700 p-6">
          <RelatedParts part={part} onOpen={onOpen} max={3} />
        </div>
      )}
    </div>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-graphite-500">{label}</dt>
      <dd className="text-right font-medium text-graphite-100">{value}</dd>
    </div>
  );
}
