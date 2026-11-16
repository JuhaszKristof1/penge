"use client";

import { Heart } from "lucide-react";
import type { Part } from "@/lib/types";
import { PartImage } from "./PartImage";
import { Badge } from "./ui";
import { cn } from "@/lib/utils";

export function PartCard({
  part,
  onOpen,
  isFavorite,
  onToggleFavorite,
  className,
}: {
  part: Part;
  onOpen?: (part: Part) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (part: Part) => void;
  className?: string;
}) {
  return (
    <article className={cn("card card-hover group flex flex-col overflow-hidden", className)}>
      <div className="relative">
        <PartImage part={part} className="h-44 w-full border-b border-ink-700" />
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(part);
            }}
            aria-label={isFavorite ? "Eltávolítás a kedvencek közül" : "Hozzáadás a kedvencekhez"}
            className={cn(
              "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border backdrop-blur transition-all",
              isFavorite
                ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                : "border-ink-600 bg-ink-950/70 text-graphite-300 hover:border-rose-500/50 hover:text-rose-300",
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">{part.brand}</span>
          <Badge tone="neutral" className="text-[10px]">
            {part.category}
          </Badge>
        </div>

        <h3 className="font-display text-sm font-bold leading-snug text-white transition-colors group-hover:text-brand-300">
          {part.name}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-graphite-400">
          {part.description || "Nincs megadott leírás."}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {part.sku !== "-" && <span className="chip font-mono text-[10px]">Cikkszám: {part.sku}</span>}
          {part.oeNumber !== "-" && <span className="chip font-mono text-[10px]">OE: {part.oeNumber}</span>}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {onOpen && (
            <button type="button" onClick={() => onOpen(part)} className="btn-outline flex-1 px-3 py-2 text-xs">
              Részletek
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
