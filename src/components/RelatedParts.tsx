"use client";

import { ArrowRight } from "lucide-react";
import type { Part } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { PartCard } from "./PartCard";
import { cn } from "@/lib/utils";

// Kapcsolódó alkatrészek – azonos kategóriából, az aktuális alkatrész kihagyásával.

export function RelatedParts({
  part,
  onOpen,
  max = 3,
  className,
}: {
  part: Part;
  onOpen?: (part: Part) => void;
  max?: number;
  className?: string;
}) {
  const { allParts, isFavorite, toggleFavorite } = useApp();

  const related = allParts.filter((p) => p.id !== part.id && p.category === part.category).slice(0, max);

  if (related.length === 0) return null;

  return (
    <section className={cn("", className)}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
        <ArrowRight className="h-4 w-4 text-brand-400" />
        Kapcsolódó alkatrészek
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((p) => (
          <PartCard
            key={p.id}
            part={p}
            onOpen={onOpen}
            isFavorite={isFavorite(p.id)}
            onToggleFavorite={(item) => void toggleFavorite(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
