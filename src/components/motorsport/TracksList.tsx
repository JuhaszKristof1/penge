"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { TrackCard } from "@/components/motorsport/TrackCard";
import { formatLength } from "@/lib/motorsport/format";
import { TRACK_STATUS_META } from "@/lib/motorsport/format";

export function TracksList() {
  const { tracks, layouts, status, message } = useMotorsport();
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState("all");

  const counties = useMemo(() => {
    const set = new Set<string>();
    for (const t of tracks) if (t.county) set.add(t.county);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, [tracks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t) => {
      if (county !== "all" && t.county !== county) return false;
      if (!q) return true;
      return [t.name, t.locality, t.county, t.description].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [tracks, query, county]);

  const layoutCount = (trackId: string) => layouts.filter((l) => l.trackId === trackId).length;

  return (
    <>
      <section className="page-header">
        <div className="container-page py-12 sm:py-16">
          <span className="eyebrow">
            <span className="h-px w-6 bg-brand-500" />
            Pályaadatbázis
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Magyarországi versenypályák
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite-400 sm:text-base">
            A hazai állandó versenypályák adatai ellenőrzött forrásból: helyszín, hossz, kanyarok, pályaváltozatok.
            Válassz pályát a részletekhez és a ranglistákhoz.
          </p>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés név vagy helyszín szerint…"
              className="input pl-9"
              aria-label="Pálya keresése"
            />
          </div>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="input sm:w-64"
            aria-label="Szűrés vármegye szerint"
          >
            <option value="all">Minden vármegye</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-xs text-graphite-500">
          {filtered.length} pálya
          {county !== "all" ? ` · ${county}` : ""}
        </p>

        {status === "unavailable" && (
          <div className="mt-6 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {status === "loading" ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-sm border border-ink-700 bg-ink-850" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((t) => (
              <div key={t.id}>
                <TrackCard track={t} />
                <p className="mt-2 px-1 text-xs text-graphite-500">
                  {formatLength(t.lengthM)}
                  {t.corners != null ? ` · ${t.corners} kanyar` : ""}
                  {layoutCount(t.id) > 0 ? ` · ${layoutCount(t.id)} változat` : ""}
                  {" · "}
                  <span className={TRACK_STATUS_META[t.status].tone === "success" ? "text-emerald-400" : "text-graphite-500"}>
                    {TRACK_STATUS_META[t.status].label}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="col-span-full rounded-sm border border-dashed border-ink-600 px-6 py-12 text-center text-sm text-graphite-400">
              {tracks.length === 0
                ? "Nincs megjeleníthető versenypálya az adatbázisban."
                : "Nincs a keresésnek megfelelő pálya."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
