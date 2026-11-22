"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import type { Part } from "@/lib/types";
import { SHOP_LINK_NOTE, buildShopLinks } from "@/lib/shop-links";
import { Badge } from "./ui";
import { cn } from "@/lib/utils";

// "Hol vásárolható meg?" szekció.
//
// FONTOS: a megjelenített linkek keresési linkek – az adott alkatrész
// cikkszámára keresnek rá a webshopban. Nem konkrét termékajánlatok, és nem
// állítjuk, hogy az alkatrész ténylegesen megvásárolható.

export function ShopLinks({
  part,
  compact = false,
  className,
}: {
  part: Part;
  compact?: boolean;
  className?: string;
}) {
  const links = buildShopLinks(part);

  return (
    <section className={cn("rounded-sm border border-ink-700 bg-ink-900/50 p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-white">
          <ShoppingCart className="h-4 w-4 text-brand-400" />
          Hol vásárolható meg?
        </h3>
        <Badge tone="brand">Keresési linkek</Badge>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-graphite-400">
        Az alábbi webshopokban az alkatrész cikkszáma alapján indíthatsz keresést. A linkek új
        böngészőfülön nyílnak meg.
      </p>

      <div className={cn("mt-4 grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-1")}>
        {links.map((shop) => (
          <a
            key={shop.id}
            href={shop.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-sm border border-ink-700 bg-ink-850/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-800"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-sm text-xs font-extrabold text-white shadow-inner"
              style={{ backgroundColor: shop.accent }}
              aria-hidden
            >
              {shop.monogram}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">{shop.name}</span>
              <span className="block truncate text-[11px] text-graphite-400">{shop.tagline}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-brand-500/40 px-2.5 py-1.5 text-[11px] font-semibold text-brand-300 transition-colors group-hover:bg-brand-500/10 group-hover:text-brand-200">
              Megtekintés
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-graphite-500">{SHOP_LINK_NOTE}</p>
    </section>
  );
}
