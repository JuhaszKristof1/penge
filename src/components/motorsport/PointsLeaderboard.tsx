"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Flag, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LicenceBadge } from "@/components/progression/LicenceBadge";

// ---------------------------------------------------------------------------
// Pontverseny ranglista.
//
// A Ranglisták oldal fő tartalma a pontverseny: ki hány ponttal áll. A köridős
// ranglisták pályánként, a pálya adatlapján érhetők el – innen is odavezetünk.
// A pontokat a szerveroldali /api/leaderboard/points adja (a points_ledger
// napló összege), a kliens csak megjeleníti.
// ---------------------------------------------------------------------------

interface PointsRow {
  rank: number;
  name: string;
  avatarColor: string;
  points: number;
  licenceCode: string;
  licenceName: string;
  approvedLaps: number;
}

type Period = "all" | "year" | "90d";

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "Összes" },
  { key: "year", label: "Idei év" },
  { key: "90d", label: "Elmúlt 90 nap" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PointsLeaderboard() {
  const [rows, setRows] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<{ data: { rows: PointsRow[]; total: number } | null; error: string | null }>(
      `/api/leaderboard/points?period=${period}`,
    )
      .then((res) => {
        if (!active) return;
        setRows(res.data?.rows ?? []);
        setError(res.error);
        setLoading(false);
      })
      .catch((e: { message?: string }) => {
        if (!active) return;
        setError(e?.message ?? "A ranglista nem érhető el.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <>
      <section className="page-header">
        <div className="container-page py-12 sm:py-16">
          <span className="eyebrow">
            <span className="h-px w-6 bg-brand-500" />
            Ranglisták
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <Trophy className="mr-3 inline h-8 w-8 text-brand-400" />
            Pontverseny
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite-400 sm:text-base">
            A GRIDLINE pontversenye: ki hány pontot gyűjtött a feladatok teljesítésével. A pontokat a rendszer
            ítéli oda ellenőrzött teljesítmény alapján, kézzel nem lehet beírni.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-graphite-500">
            A köridős ranglisták pályánként, a pálya adatlapján érhetők el.
          </p>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="label mb-0" htmlFor="pts-period">
              Időszak
            </label>
            <select
              id="pts-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="input w-auto"
              aria-label="Időszak"
            >
              {PERIODS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <Link href="/versenypalyak" className="btn-ghost">
            <Flag className="h-4 w-4" />
            Köridő-ranglisták pályánként
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 rounded-sm border border-ink-700 bg-ink-850 px-6 py-12 text-center text-sm text-graphite-400">
            Ranglista betöltése…
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-8 rounded-sm border border-dashed border-ink-600 px-6 py-12 text-center text-sm text-graphite-400">
            Még nincs pontot szerzett versenyző. Teljesíts egy feladatot a Fejlődés menüben, és itt fogsz szerepelni.
          </p>
        ) : (
          <>
            {/* Dobogó */}
            {podium.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {podium.map((row) => (
                  <div
                    key={row.rank}
                    className="rounded-sm border border-ink-700 bg-ink-850 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-extrabold text-brand-400">#{row.rank}</span>
                      <LicenceBadge code={row.licenceCode} name={row.licenceName} href={null} />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-sm font-bold text-ink-950"
                        style={{ backgroundColor: row.avatarColor }}
                      >
                        {initials(row.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{row.name}</p>
                        <p className="text-xs text-graphite-500">{row.approvedLaps} jóváhagyott köridő</p>
                      </div>
                    </div>
                    <p className="mt-4 font-display text-3xl font-extrabold text-white">
                      {row.points.toLocaleString("hu-HU")}
                      <span className="ml-1 text-sm font-semibold text-graphite-500">pont</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Teljes táblázat */}
            <div className="mt-6 overflow-x-auto rounded-sm border border-ink-700 bg-ink-850">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-ink-700 text-left text-[11px] font-bold uppercase tracking-wider text-graphite-500">
                    <th className="py-3 pl-4 pr-2">#</th>
                    <th className="py-3 pr-3">Versenyző</th>
                    <th className="py-3 pr-3">Licenc</th>
                    <th className="hidden py-3 pr-3 sm:table-cell">Köridők</th>
                    <th className="py-3 pr-4 text-right">Pont</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rank} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/60">
                      <td className="py-3 pl-4 pr-2 font-display text-sm font-bold text-graphite-400">{row.rank}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-ink-950"
                            style={{ backgroundColor: row.avatarColor }}
                          >
                            {initials(row.name)}
                          </span>
                          <span className="truncate text-sm font-semibold text-white">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <LicenceBadge code={row.licenceCode} name={row.licenceName} href={null} />
                      </td>
                      <td className="hidden py-3 pr-3 text-sm text-graphite-400 sm:table-cell">
                        {row.approvedLaps}
                      </td>
                      <td className="py-3 pr-4 text-right font-display text-sm font-bold text-white">
                        {row.points.toLocaleString("hu-HU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/fejlodes/feladatok" className="btn-primary">
            Feladatok és pontok
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/versenypalyak" className="btn-ghost">
            Versenypályák
          </Link>
        </div>
      </section>
    </>
  );
}
