"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Loader2, LogIn, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { ChallengeBadge } from "@/components/progression/ChallengeBadge";
import { LicenceBadge, sortLicences } from "@/components/progression/LicenceBadge";
import { PageHeader, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { fetchLicenceLevels } from "@/lib/supabase/queries";
import { mapLicenceLevel } from "@/lib/supabase/mappers";
import type { LicenceLevel } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fejlődésem – a saját haladás: jelenlegi licenc, pontok, következő szint,
// teljesített feladatok. Minden adat a szerveroldali /api/progression-ból jön.
// ---------------------------------------------------------------------------

export function MyProgressionContent() {
  const { currentUser, ready } = useApp();
  const { challenges, summary, points, loading, error } = useProgression();
  const { tracks } = useMotorsport();
  const [levels, setLevels] = useState<LicenceLevel[]>([]);

  useEffect(() => {
    let active = true;
    fetchLicenceLevels().then((res) => {
      if (active && !res.error) setLevels(sortLicences((res.data ?? []).map(mapLicenceLevel)));
    });
    return () => {
      active = false;
    };
  }, []);

  const done = useMemo(() => challenges.filter((c) => c.completed), [challenges]);
  const open = useMemo(() => challenges.filter((c) => !c.completed), [challenges]);
  const currentIndex = levels.findIndex((l) => l.code === summary?.licenceCode);

  if (loading || !ready) {
    return (
      <div className="container-page flex items-center gap-3 py-24 text-sm text-graphite-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Fejlődésed betöltése…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <PageHeader
          eyebrow="Fejlődés"
          title="Fejlődésem"
          sub="A saját licenced, pontjaid és teljesített feladataid. Jelentkezz be a haladásod megtekintéséhez."
        />
        <section className="container-page py-14">
          <div className="flex flex-wrap items-center gap-3 rounded-sm border border-ink-700 bg-ink-850 px-4 py-5">
            <LogIn className="h-5 w-5 shrink-0 text-brand-400" />
            <p className="flex-1 text-sm text-graphite-300">
              A fejlődésed követéséhez jelentkezz be vagy regisztrálj.
            </p>
            <Link href="/bejelentkezes" className="btn-ghost">
              Bejelentkezés
            </Link>
            <Link href="/regisztracio" className="btn-primary">
              Csatlakozás
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Fejlődés"
        title="Fejlődésem"
        sub={`${currentUser.name} – a licenced, pontjaid és a következő szinted.`}
      >
        {summary && (
          <div className="flex flex-wrap items-center gap-4">
            <LicenceBadge code={summary.licenceCode} name={summary.licenceName} size="lg" href={null} />
            <div className="min-w-[220px] flex-1 sm:max-w-md">
              <p className="font-display text-lg font-bold text-white">{summary.licenceName} licenc</p>
              <div className="mt-2 mb-1.5 flex items-baseline justify-between text-xs text-graphite-400">
                <span>
                  {summary.nextLicenceName
                    ? `${summary.nextLicenceName} szintig ${summary.pointsToNext} pont`
                    : "Elérted a legmagasabb szintet"}
                </span>
                <span className="font-mono text-graphite-200">
                  {summary.totalPoints}
                  {summary.nextThreshold != null && ` / ${summary.nextThreshold}`}
                </span>
              </div>
              <Progress value={summary.progressPercent} />
            </div>
          </div>
        )}
      </PageHeader>

      <section className="container-page py-10 sm:py-14">
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-100/80">{error}</p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">Teljesített feladatok</h2>
              <span className="text-xs text-graphite-500">
                {done.length} / {challenges.length}
              </span>
            </div>

            {done.length === 0 ? (
              <p className="mt-4 rounded-sm border border-dashed border-ink-600 bg-ink-900/40 px-4 py-10 text-center text-sm text-graphite-400">
                Még nincs teljesített feladatod.{" "}
                <Link href="/fejlodes/feladatok" className="font-semibold text-brand-400 hover:text-brand-300">
                  Nézd meg a feladatokat
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-x-2 gap-y-6 rounded-sm border border-ink-700 bg-ink-900/40 px-4 py-6 sm:gap-x-6">
                {done.map((c) => (
                  <ChallengeBadge key={c.code} challenge={c} />
                ))}
              </div>
            )}

            {open.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-white">Következő feladatok</h2>
                <div className="mt-4 space-y-2">
                  {open.map((c) => {
                    const percent = c.target > 0 ? Math.min(100, Math.round((c.current / c.target) * 100)) : 0;
                    return (
                      <div key={c.code} className="rounded-sm border border-ink-700 bg-ink-850 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-graphite-100">{c.name}</span>
                          <span className="chip ml-auto">
                            <Lock className="h-3 w-3" />
                            {c.points} pont
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-graphite-400">
                            {c.current} / {c.target}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Link href="/fejlodes/feladatok" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300">
              Összes feladat
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <aside className="space-y-6">
            <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">Licenc-szintek</h2>
              <ul className="mt-4 space-y-2">
                {levels.map((level, i) => {
                  const isCurrent = level.code === summary?.licenceCode;
                  const reached = currentIndex >= 0 && i <= currentIndex;
                  return (
                    <li
                      key={level.code}
                      className={cn(
                        "flex items-center gap-2.5 rounded border px-3 py-2 text-sm",
                        isCurrent
                          ? "border-brand-500/50 bg-brand-500/10"
                          : reached
                            ? "border-ink-700 bg-ink-900"
                            : "border-ink-800 bg-ink-900/40",
                      )}
                    >
                      <LicenceBadge code={level.code} name={level.name} href={null} className={cn(!reached && "opacity-50")} />
                      <span className={cn("font-medium", reached ? "text-graphite-200" : "text-graphite-500")}>
                        {level.name}
                      </span>
                      <span className="ml-auto font-mono text-[11px] text-graphite-500">{level.minPoints}</span>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-brand-400" />}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">Statisztika</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Összes pont" value={summary?.totalPoints ?? 0} />
                <Row label="Pontmozgás" value={points.length} />
                <Row label="Teljesített feladat" value={done.length} />
                <Row label="Pálya az adatbázisban" value={tracks.length} />
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-graphite-400">{label}</dt>
      <dd className="font-mono font-semibold text-graphite-100">{value}</dd>
    </div>
  );
}
