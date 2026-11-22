"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, MapPin, Flag, Wrench, Loader2 } from "lucide-react";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Keresés – valós adatbázis-találatok: versenypályák, autókategóriák és
// alkatrészek. Nincs kitalált találat: ha nincs egyezés, azt írjuk ki.
// ---------------------------------------------------------------------------

interface Result {
  key: string;
  href: string;
  title: string;
  meta: string;
  kind: "track" |"category" |"part";
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tracks, categories } = useMotorsport();
  const { searchParts } = useCatalog();
  const [term, setTerm] = useState("");
  const [partResults, setPartResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTerm("");
      setPartResults([]);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key ==="Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow ="hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow ="";
    };
  }, [open, onClose]);

  // Alkatrész-keresés késleltetve, hogy ne fusson minden leütésre.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setPartResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(() => {
      searchParts(q)
        .then((parts) => {
          if (!active) return;
          setPartResults(
            parts.slice(0, 5).map((p) => ({
              key: `part-${p.id}`,
              href: `/alkatreszek/${p.id}`,
              title: p.name,
              meta: `${p.brand} · ${p.oeNumber}`,
              kind: "part" as const,
            })),
          );
        })
        .catch(() => active && setPartResults([]))
        .finally(() => active && setSearching(false));
    }, 260);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term, searchParts]);

  const q = term.trim().toLowerCase();

  const trackResults = useMemo<Result[]>(() => {
    if (!q) return [];
    return tracks
      .filter((t) => `${t.name} ${t.locality ??""} ${t.county ??""}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({
        key: `track-${t.id}`,
        href: `/versenypalyak/${t.slug}`,
        title: t.name,
        meta: [t.locality, t.county].filter(Boolean).join(",") ||"Versenypálya",
        kind: "track" as const,
      }));
  }, [tracks, q]);

  const categoryResults = useMemo<Result[]>(() => {
    if (!q) return [];
    return categories
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 4)
      .map((c) => ({
        key: `cat-${c.code}`,
        href: `/ranglistak?category=${c.code}`,
        title: c.name,
        meta: "Autókategória · ranglista",
        kind: "category" as const,
      }));
  }, [categories, q]);

  const total = trackResults.length + categoryResults.length + partResults.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Keresés">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="container-page relative pt-[12vh]">
        <div className="mx-auto w-full max-w-2xl animate-fade-up">
          <div className="flex items-center gap-3 border-b border-brand-500/40 bg-ink-900 px-4">
            <Search className="h-5 w-5 shrink-0 text-brand-500" />
            <input
              ref={inputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Pálya, kategória vagy alkatrész keresése…"
              className="h-14 w-full bg-transparent text-base text-white placeholder:text-graphite-500 focus:outline-none"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-graphite-500" />}
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-graphite-400 transition-colors hover:bg-ink-800 hover:text-white"
              aria-label="Keresés bezárása"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[58vh] overflow-y-auto border border-t-0 border-ink-800 bg-ink-900/95">
            {!q ? (
              <p className="px-5 py-8 text-sm text-graphite-500">
                Írj be legalább két karaktert a kereséshez. Az eredmények a valós adatbázisból jönnek.
              </p>
            ) : total === 0 ? (
              <p className="px-5 py-8 text-sm text-graphite-500">
                Nincs találat a(z) „{term.trim()}” keresésre.
              </p>
            ) : (
              <div className="py-1.5">
                {trackResults.length > 0 && <Group label="Versenypályák" items={trackResults} onPick={onClose} />}
                {categoryResults.length > 0 && (
                  <Group label="Kategóriák" items={categoryResults} onPick={onClose} />
                )}
                {partResults.length > 0 && <Group label="Alkatrészek" items={partResults} onPick={onClose} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ label, items, onPick }: { label: string; items: Result[]; onPick: () => void }) {
  return (
    <div className="pb-1">
      <p className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-graphite-500">{label}</p>
      {items.map((r) => (
        <Link
          key={r.key}
          href={r.href}
          onClick={onPick}
          className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-ink-850"
        >
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-ink-800", kindColor(r.kind))}>
            {r.kind ==="track" ? <MapPin className="h-4 w-4" /> : r.kind ==="category" ? <Flag className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{r.title}</span>
            <span className="block truncate text-xs text-graphite-500">{r.meta}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function kindColor(kind: Result["kind"]) {
  return kind ==="track" ?"text-brand-400" : kind ==="category" ?"text-sky-300" :"text-emerald-300";
}
