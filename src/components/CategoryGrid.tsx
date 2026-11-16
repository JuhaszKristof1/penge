"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CircleDot,
  Cog,
  Disc3,
  Droplets,
  Filter,
  Lightbulb,
  Snowflake,
  Wind,
  Wrench,
  Zap,
  Car as CarIcon,
} from "lucide-react";
import { useCatalog } from "@/lib/catalog/CatalogProvider";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Motor & motoralkatrészek": Cog,
  Fékrendszer: Disc3,
  "Futómű & kormányzás": Wrench,
  Szűrők: Filter,
  "Gyújtás & elektronika": Zap,
  Világítás: Lightbulb,
  Elektronika: Zap,
  "Hűtés & klíma": Snowflake,
  Kipufogórendszer: Wind,
  "Váltó & kuplung": CircleDot,
  Karosszéria: CarIcon,
  "Olajok & folyadékok": Droplets,
  "Gumiabroncs & kerék": Disc3,
};

export function CategoryGrid() {
  const { categories, parts } = useCatalog();

  const counts = categories.map((cat) => ({
    cat,
    count: parts.filter((p) => p.category === cat).length,
  }));

  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40 px-4 py-6 text-sm text-graphite-400">
        Nincs betöltött alkatrészkategória az adatbázisban.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {counts.map(({ cat, count }) => {
        const Icon = ICONS[cat] ?? Cog;
        return (
          <Link
            key={cat}
            href={`/alkatreszek?category=${encodeURIComponent(cat)}`}
            className="card card-hover group flex flex-col gap-3 p-4"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 text-brand-400 transition-colors group-hover:bg-brand-500/15 group-hover:text-brand-300">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-graphite-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug text-white">{cat}</p>
              <p className="mt-1 text-xs text-graphite-500">{count} alkatrész</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
