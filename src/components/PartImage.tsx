"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import type { Part, PartCategory } from "@/lib/types";
import { partImage } from "@/lib/part-images";
import { cn } from "@/lib/utils";

// Alkatrész-kép. Ha az adatbázisban van termékkép URL, azt jeleníti meg; ha a
// kép nem tölthető be, semleges helyettesítő grafikára váltunk. A "nincs kép"
// esetet a kategória-alapú illusztráció fedi le (lásd lib/part-images).

export function PartImage({
  part,
  category,
  image,
  alt,
  className,
  imgClassName,
  size = "md",
  priority = false,
}: {
  part?: Pick<Part, "name" | "category" | "image">;
  /** Visszafelé kompatibilitás: kategória megadása `part` nélkül. */
  category?: PartCategory;
  image?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const src = part ? partImage(part) : image;
  const label = alt ?? part?.name ?? category ?? "Alkatrész";

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showFallback = !src || failed;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-100 to-slate-200",
        className,
      )}
    >
      {showFallback ? (
        <FallbackGraphic label={label} size={size} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06]",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}

function FallbackGraphic({ label, size }: { label: string; size: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-7 w-7" : "h-10 w-10";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-ink-850">
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" aria-hidden />
      <ImageOff className={cn(iconSize, "relative text-brand-500/70")} />
      <span className="relative max-w-[80%] truncate text-[10px] font-semibold uppercase tracking-wider text-graphite-400">
        {label}
      </span>
    </div>
  );
}
