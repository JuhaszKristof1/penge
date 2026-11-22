"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Car, Flag, MapPin, Trophy } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { apiFetch } from "@/lib/api";
import { formatDate, formatLapTime } from "@/lib/motorsport/format";
import { MeasurementBadge } from "./LapRow";

interface DriverLap {
  id: string;
  track_id: string;
  vehicle_category: string;
  lap_time_ms: number;
  measured_at: string;
  tracks?: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

interface DriverResponse {
  data: {
    profile: {
      id: string;
      full_name: string | null;
      avatar_color: string | null;
      bio: string | null;
      country: string | null;
      created_at: string;
    };
    laps: DriverLap[];
    stats: { approvedLaps: number; tracks: number; licenceCode: string; licenceName: string };
  } | null;
  error?: string;
}

function embed<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export function DriverProfile({ id }: { id: string }) {
  const { categoryName } = useMotorsport();
  const { currentUser } = useApp();
  const [res, setRes] = useState<DriverResponse["data"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<DriverResponse>(`/api/drivers/${encodeURIComponent(id)}`)
      .then((r) => {
        if (active) setRes(r.data);
      })
      .catch((err) => {
        if (active) setError(err?.message ?? "Hiba a profil betöltésekor.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="container-page py-24 text-center text-sm text-graphite-400">Profil betöltése…</div>;
  }

  if (error || !res) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-lg rounded-sm border border-ink-700 bg-ink-850 p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">A profil nem található</h1>
          <p className="mt-3 text-sm text-graphite-400">{error ?? "Ez a versenyzői profil nem érhető el."}</p>
          <Link href="/kozosseg" className="btn-primary mt-6">
            <ArrowLeft className="h-4 w-4" />
            Vissza a közösséghez
          </Link>
        </div>
      </div>
    );
  }

  const { profile, laps, stats } = res;
  const name = profile.full_name ?? "Névtelen versenyző";
  const isSelf = currentUser?.id === profile.id;

  // Pályánként a legjobb kör.
  const bestByTrack = new Map<string, DriverLap>();
  for (const lap of laps) {
    const existing = bestByTrack.get(lap.track_id);
    if (!existing || lap.lap_time_ms < existing.lap_time_ms) bestByTrack.set(lap.track_id, lap);
  }
  const bestLaps = Array.from(bestByTrack.values()).sort((a, b) => a.lap_time_ms - b.lap_time_ms);

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/kozosseg" className="inline-flex items-center gap-2 text-xs font-semibold text-graphite-300 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" />
        Közösség
      </Link>

      {/* Fejléc */}
      <div className="mt-5 flex flex-col gap-6 rounded-sm border border-ink-700 bg-ink-850 p-6 sm:flex-row sm:items-center sm:p-8">
        <span
          className="grid h-20 w-20 shrink-0 place-items-center rounded-sm text-3xl font-extrabold text-white"
          style={{ backgroundColor: profile.avatar_color ?? "#363b43" }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded border border-brand-500/40 bg-brand-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-300">
              <Award className="h-3.5 w-3.5" />
              {stats.licenceName}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-graphite-400">
            {profile.country && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.country}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" />
              Csatlakozott: {formatDate(profile.created_at)}
            </span>
          </div>
          {profile.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-graphite-300">{profile.bio}</p>}
          {isSelf && (
            <Link href="/fiok" className="btn-ghost mt-4 px-4 py-2 text-xs">
              Profil szerkesztése
            </Link>
          )}
        </div>
      </div>

      {/* Statisztikák */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Trophy, label: "Elfogadott köridő", value: stats.approvedLaps },
          { icon: MapPin, label: "Pálya", value: stats.tracks },
          { icon: Car, label: "Legjobb helyezések", value: bestLaps.length },
          { icon: Award, label: "Licencszint", value: stats.licenceName },
        ].map((s) => (
          <div key={s.label} className="rounded-sm border border-ink-700 bg-ink-850 p-4">
            <s.icon className="h-4 w-4 text-brand-400" />
            <p className="mt-2 font-display text-xl font-extrabold text-white">{s.value}</p>
            <p className="text-xs text-graphite-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Elfogadott köridők */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Elfogadott köridők</h2>
          <div className="mt-4 overflow-hidden rounded-sm border border-ink-700 bg-ink-850">
            {laps.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700 text-left text-[11px] font-bold uppercase tracking-wider text-graphite-500">
                    <th className="py-3 pl-4 pr-3">Pálya</th>
                    <th className="hidden py-3 pr-3 sm:table-cell">Kategória</th>
                    <th className="py-3 pr-3">Dátum</th>
                    <th className="py-3 pr-4 text-right">Köridő</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lap) => {
                    const track = embed(lap.tracks);
                    return (
                      <tr key={lap.id} className="border-b border-ink-800 last:border-0">
                        <td className="py-3 pl-4 pr-3">
                          <Link
                            href={`/versenypalyak/${track?.slug ?? ""}`}
                            className="text-sm font-semibold text-white hover:text-brand-400"
                          >
                            {track?.name ?? "—"}
                          </Link>
                        </td>
                        <td className="hidden py-3 pr-3 text-sm text-graphite-300 sm:table-cell">
                          {categoryName(lap.vehicle_category)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-graphite-500">{formatDate(lap.measured_at)}</td>
                        <td className="py-3 pr-4 text-right font-display text-base font-bold tabular-nums text-white">
                          {formatLapTime(lap.lap_time_ms)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-6 py-10 text-center text-sm text-graphite-400">
                Ennek a versenyzőnek még nincs jóváhagyott köridője.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              Pályánkénti legjobbak
            </h2>
            <ul className="mt-4 space-y-3">
              {bestLaps.slice(0, 8).map((lap) => {
                const track = embed(lap.tracks);
                return (
                  <li key={lap.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-graphite-200">{track?.name ?? "—"}</span>
                      <span className="text-xs text-graphite-500">{categoryName(lap.vehicle_category)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <MeasurementBadge type="manual" />
                      <span className="font-display font-bold tabular-nums text-white">
                        {formatLapTime(lap.lap_time_ms)}
                      </span>
                    </span>
                  </li>
                );
              })}
              {bestLaps.length === 0 && <li className="text-xs text-graphite-500">Még nincs eredmény.</li>}
            </ul>
          </div>

          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5 text-xs leading-relaxed text-graphite-400">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-white">
              <Award className="h-4 w-4 text-brand-400" />
              Licencek
            </h3>
            A licence-szintek (Rookie, D, C, B, A) adatmodellje elő van készítve. A feladatok, pontozás és a
            szintek megszerzésének feltételei a következő fejlesztési szakaszban érkeznek.
          </div>
        </aside>
      </div>
    </div>
  );
}
