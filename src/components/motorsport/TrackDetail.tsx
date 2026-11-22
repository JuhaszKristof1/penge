"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  Info,
  MapPin,
  Route,
  Ruler,
  Timer,
  Trophy,
} from "lucide-react";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { fetchLapTimes } from "@/lib/supabase/queries";
import { mapLapTime } from "@/lib/supabase/mappers";
import type { LapTime, TrackLayout } from "@/lib/types";
import { DIRECTION_LABELS, formatLapTime, formatLength, TRACK_STATUS_META } from "@/lib/motorsport/format";
import { LapRow, MeasurementBadge, TrackHeroImage, TrackMapImage } from "./LapRow";

interface TrackDetailProps {
  slug: string;
}

/** Pálya részletoldal: adatok, pályarajz, ranglisták, korábbi eredmények. */
export function TrackDetail({ slug }: TrackDetailProps) {
  const { tracks, getTrack, layouts, categories, categoryName, status, message } = useMotorsport();

  const track = useMemo(() => getTrack(slug), [getTrack, slug]);

  const trackLayouts = useMemo(
    () => layouts.filter((l) => l.trackId === track?.id).slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [layouts, track?.id],
  );

  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("all");
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!track) return;
    setSelectedLayoutId(trackLayouts[0]?.id ?? "");
    setSelectedCategory("all");
    setSelectedMeasurement("all");
  }, [track, trackLayouts]);

  useEffect(() => {
    if (!track) return;
    let active = true;
    setLoading(true);
    setLoaded(false);
    fetchLapTimes({
      trackId: track.id,
      layoutId: selectedLayoutId || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      measurementType: selectedMeasurement === "all" ? undefined : (selectedMeasurement as LapTime["measurementType"]),
      limit: 100,
    }).then((res) => {
      if (!active) return;
      setLaps((res.data ?? []).map(mapLapTime));
      setLoading(false);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [track, selectedLayoutId, selectedCategory, selectedMeasurement]);

  if (status === "loading" && !track) {
    return (
      <div className="container-page py-24 text-center text-sm text-graphite-400">Pálya betöltése…</div>
    );
  }

  if (!track) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-lg rounded-sm border border-ink-700 bg-ink-850 p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">A pálya nem található</h1>
          <p className="mt-3 text-sm text-graphite-400">
            {status === "unavailable"
              ? message
              : "Ez a versenypálya nem szerepel az adatbázisban. Válassz a listából."}
          </p>
          <Link href="/versenypalyak" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Vissza a pályákhoz
          </Link>
        </div>
      </div>
    );
  }

  const defaultLayout: TrackLayout | undefined = trackLayouts.find((l) => l.id === selectedLayoutId) ?? trackLayouts[0];
  const mapSrc = defaultLayout?.mapImageUrl ?? track.layoutImageUrl;

  return (
    <>
      {/* HERO -------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-b border-ink-800">
        <TrackHeroImage track={track} className="absolute inset-0 -z-10 [&>img]:h-full" priority />
        <div className="absolute inset-0 -z-10 bg-hero-scrim" />
        <div className="container-page py-12 sm:py-20">
          <Link href="/versenypalyak" className="inline-flex items-center gap-2 text-xs font-semibold text-graphite-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            Versenypályák
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {track.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-graphite-200">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-400" />
              {[track.locality, track.county].filter(Boolean).join(", ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Route className="h-4 w-4 text-brand-400" />
              {formatLength(track.lengthM)}
            </span>
            {track.openedYear != null && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-brand-400" />
                {track.openedYear}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Bal oszlop: leírás, ranglista */}
        <div className="min-w-0">
          {/* Pályaadatok */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Ruler, label: "Hossz", value: formatLength(track.lengthM) },
              { icon: Route, label: "Kanyarok", value: track.corners != null ? String(track.corners) : "—" },
              { icon: Ruler, label: "Szélesség", value: track.width ?? "—" },
              { icon: Info, label: "Állapot", value: TRACK_STATUS_META[track.status].label },
            ].map((s) => (
              <div key={s.label} className="rounded-sm border border-ink-700 bg-ink-850 p-4">
                <s.icon className="h-4 w-4 text-brand-400" />
                <p className="mt-2 font-display text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-graphite-500">{s.label}</p>
              </div>
            ))}
          </div>

          {track.description && (
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-graphite-300 sm:text-base">{track.description}</p>
          )}

          {track.sourceUrl && (
            <p className="mt-4 text-xs text-graphite-500">
              <span className="font-semibold text-graphite-400">Forrás:</span>{" "}
              <a href={track.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">
                {track.sourceNote ?? track.sourceUrl}
              </a>
            </p>
          )}

          {/* Ranglista ------------------------------------------------------ */}
          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-white">
                <Trophy className="mr-2 inline h-5 w-5 text-brand-400" />
                Ranglista
              </h2>
              <Link href="/koridok/feltoltes" className="btn-outline px-4 py-2 text-xs">
                <Timer className="h-3.5 w-3.5" />
                Köridő feltöltése
              </Link>
            </div>

            {/* Szűrők */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="layout-filter">
                  Pályaváltozat
                </label>
                <select
                  id="layout-filter"
                  value={selectedLayoutId}
                  onChange={(e) => setSelectedLayoutId(e.target.value)}
                  className="input"
                >
                  {trackLayouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="category-filter">
                  Autókategória
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  <option value="all">Minden kategória</option>
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="measurement-filter">
                  Mérés módja
                </label>
                <select
                  id="measurement-filter"
                  value={selectedMeasurement}
                  onChange={(e) => setSelectedMeasurement(e.target.value)}
                  className="input"
                >
                  <option value="all">Kézi és GPS</option>
                  <option value="manual">Kézi feltöltés</option>
                  <option value="gps">GPS-mérés</option>
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-sm border border-ink-700 bg-ink-850">
              {loading && !loaded ? (
                <p className="px-6 py-10 text-center text-sm text-graphite-400">Ranglista betöltése…</p>
              ) : laps.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ink-700 text-left text-[11px] font-bold uppercase tracking-wider text-graphite-500">
                      <th className="py-3 pl-4 pr-2">#</th>
                      <th className="py-3 pr-3">Versenyző</th>
                      <th className="hidden py-3 pr-3 sm:table-cell">Autó</th>
                      <th className="py-3 pr-3">Mérés</th>
                      <th className="py-3 pr-4 text-right">Köridő</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laps.map((lap, i) => (
                      <LapRow key={lap.id} rank={i + 1} lap={lap} categoryName={categoryName} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-graphite-400">
                  Ebben a szűrésben még nincs jóváhagyott köridő. A ranglista csak ellenőrzött eredményeket mutat.
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-graphite-500">
              A ranglista kizárólag a jóváhagyott eredményeket tartalmazza. A kézi és a GPS-es mérések külön
              kategóriaként szűrhetők.
            </p>
          </div>
        </div>

        {/* Jobb oszlop: pályarajz, változatok, korábbi eredmények */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          {/* Pályarajz */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">Pályarajz</h2>
            {mapSrc ? (
              <div className="mt-4 grid place-items-center rounded-md bg-ink-900 p-4">
                <TrackMapImage
                  src={mapSrc}
                  alt={`${track.name} pályarajza`}
                  invert={mapSrc.endsWith(".svg") || mapSrc.endsWith(".png")}
                  className="max-h-56 w-full object-contain"
                />
              </div>
            ) : (
              <p className="mt-4 text-xs text-graphite-500">Ehhez a pályához nincs feltöltött pályarajz.</p>
            )}
            {defaultLayout && (
              <p className="mt-3 text-xs text-graphite-400">
                {defaultLayout.name}
                {defaultLayout.direction ? ` · ${DIRECTION_LABELS[defaultLayout.direction] ?? defaultLayout.direction}` : ""}
              </p>
            )}
          </div>

          {/* Pályaváltozatok */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              Pályaváltozatok
            </h2>
            <ul className="mt-4 space-y-3">
              {trackLayouts.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 border-b border-ink-800 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {l.name}
                      {l.isDefault && (
                        <span className="ml-2 rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-400">
                          Alap
                        </span>
                      )}
                    </p>
                    {l.description && <p className="mt-1 text-xs text-graphite-500">{l.description}</p>}
                  </div>
                  <span className="shrink-0 text-right text-xs text-graphite-300">
                    {l.lengthM ? formatLength(l.lengthM) : "—"}
                    {l.corners != null ? <span className="block text-graphite-500">{l.corners} kanyar</span> : null}
                  </span>
                </li>
              ))}
              {trackLayouts.length === 0 && (
                <li className="text-xs text-graphite-500">Nincs rögzített pályaváltozat.</li>
              )}
            </ul>
          </div>

          {/* Korábbi eredmények */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              Korábbi eredmények
            </h2>
            <ul className="mt-4 space-y-3">
              {laps.slice(0, 5).map((lap) => (
                <li key={lap.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-graphite-200">{lap.driverName ?? "Versenyző"}</span>
                    <span className="text-xs text-graphite-500">
                      {lap.layoutName ?? "—"} · {categoryName(lap.vehicleCategory)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <MeasurementBadge type={lap.measurementType} />
                    <span className="font-display font-bold tabular-nums text-white">
                      {lap.lapTimeMs > 0 ? formatLapTime(lap.lapTimeMs) : "—"}
                    </span>
                  </span>
                </li>
              ))}
              {laps.length === 0 && (
                <li className="text-xs text-graphite-500">Még nincs jóváhagyott eredmény ezen a pályán.</li>
              )}
            </ul>
          </div>

          {/* Külső hivatkozás */}
          {track.website && (
            <a
              href={track.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-sm border border-ink-700 bg-ink-850 p-4 text-sm font-semibold text-graphite-200 transition-colors hover:border-ink-600 hover:text-white"
            >
              A pálya hivatalos oldala
              <ArrowUpRight className="h-4 w-4 text-brand-400" />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
