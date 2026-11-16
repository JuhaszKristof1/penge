"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PartCard } from "@/components/PartCard";
import { PartDetailModal } from "@/components/PartDetailModal";
import { DbNotice, EmptyState } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { useApp } from "@/context/AppContext";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import type { Part } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "name-asc" | "name-desc" | "brand-asc" | "newest";

export function PartsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { parts, categories, ready, status, message } = useCatalog();
  const { isFavorite, toggleFavorite, logSearch } = useApp();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Part | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(() => Array.from(new Set(parts.map((p) => p.brand))).sort(), [parts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = parts.filter((p) => {
      if (category && p.category !== category) return false;
      if (brand && p.brand !== brand) return false;
      if (!q) return true;
      const haystack = [p.name, p.sku, p.oeNumber, p.brand, p.description, ...(p.oeNumbers ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name, "hu");
        case "brand-asc":
          return a.brand.localeCompare(b.brand, "hu") || a.name.localeCompare(b.name, "hu");
        case "newest":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        default:
          return a.name.localeCompare(b.name, "hu");
      }
    });

    return list;
  }, [parts, query, category, brand, sort]);

  // A keresési kifejezés naplózása (késleltetve), ha be van jelentkezve.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      void logSearch({ type: "search", label: q });
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeFilters = (category ? 1 : 0) + (brand ? 1 : 0);

  const clearFilters = () => {
    setCategory("");
    setBrand("");
    setQuery("");
    router.replace("/alkatreszek");
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">Alkatrészkereső</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
          Keress alkatrészt az adatbázisból
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-400">
          Keresés név, gyártói cikkszám vagy OE szám alapján. Az adatok a csatlakoztatott adatbázisból származnak.
        </p>
      </header>

      {status === "unavailable" && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Keresősáv */}
      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
            <input
              className="input pl-10 pr-10"
              placeholder="Pl. fékbetét, 1K0698151, Bosch…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-500 hover:text-white"
                aria-label="Keresés törlése"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn("btn-outline relative", showFilters && "border-brand-500/50 text-brand-300")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Szűrők
              {activeFilters > 0 && (
                <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
              <select className="input pl-9 pr-8" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="name-asc">Név (A–Z)</option>
                <option value="name-desc">Név (Z–A)</option>
                <option value="brand-asc">Gyártó szerint</option>
                <option value="newest">Legújabb</option>
              </select>
            </div>
            <div className="hidden items-center gap-1 rounded-xl border border-ink-600 p-1 sm:flex">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "grid" ? "bg-brand-500 text-white" : "text-graphite-400")}
                aria-label="Rács nézet"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "list" ? "bg-brand-500 text-white" : "text-graphite-400")}
                aria-label="Lista nézet"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-ink-700 pt-4 sm:grid-cols-2">
            <div>
              <label className="label">Kategória</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Minden kategória</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gyártó</label>
              <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">Minden gyártó</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-graphite-400">
          {ready ? (
            <>
              <span className="font-semibold text-white">{results.length}</span> találat
              {query && <> a „{query}” keresésre</>}
            </>
          ) : (
            "Betöltés…"
          )}
        </p>
        {activeFilters > 0 && (
          <button type="button" onClick={clearFilters} className="text-xs text-brand-400 hover:text-brand-300">
            Szűrők törlése
          </button>
        )}
      </div>

      {!ready ? (
        <p className="py-16 text-center text-graphite-400">Alkatrészek betöltése…</p>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Nincs találat"
          description={
            parts.length === 0
              ? "Az adatbázisban jelenleg nincs alkatrész."
              : "Próbálj más kulcsszót, cikkszámot vagy OE számot, illetve töröld a szűrőket."
          }
          action={
            <button type="button" onClick={clearFilters} className="btn-outline">
              <Filter className="h-4 w-4" />
              Szűrők törlése
            </button>
          }
        />
      ) : (
        <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4")}>
          {results.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onOpen={setSelected}
              isFavorite={isFavorite(part.id)}
              onToggleFavorite={(p) => {
                void toggleFavorite(p.id).then(() =>
                  toast.success(isFavorite(p.id) ? "Eltávolítva a kedvencek közül." : "Hozzáadva a kedvencekhez."),
                );
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <DbNotice />
      </div>

      {selected && (
        <PartDetailModal
          part={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite(selected.id)}
          onToggleFavorite={(p) => void toggleFavorite(p.id)}
        />
      )}
    </div>
  );
}
