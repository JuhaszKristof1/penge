"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, Loader2, Lock } from "lucide-react";
import { fetchLicenceLevels } from "@/lib/supabase/queries";
import { mapLicenceLevel } from "@/lib/supabase/mappers";
import type { LicenceLevel } from "@/lib/types";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { LicenceBadge, rankStyle, sortLicences, RankGlyph } from "@/components/progression/LicenceBadge";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Licencrendszer – a ranglétra (Rookie → A) és a pontküszöbök.
//
// A küszöbök a licence_levels.min_points oszlopból jönnek. Ezek IDEIGLENES
// értékek: a végleges licencfeltételeket (feladatok, pontozás) későbbi
// szakaszban határozzuk meg, ezért a felület ezt egyértelműen jelzi.
// ---------------------------------------------------------------------------

export function LicenceSystemContent() {
  const { summary } = useProgression();
  const [levels, setLevels] = useState<LicenceLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchLicenceLevels().then((res) => {
      if (!active) return;
      if (res.error) {
        setError(res.error);
      } else {
        setLevels(sortLicences((res.data ?? []).map(mapLicenceLevel)));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const currentIndex = useMemo(
    () => levels.findIndex((l) => l.code === summary?.licenceCode),
    [levels, summary?.licenceCode],
  );

  return (
    <>
      <PageHeader
        eyebrow="Fejlődés"
        title="Licencrendszer"
        sub="A GRIDLINE ranglétrája öt szintből áll: Rookie, D, C, B és A. A szinteket a jóváhagyott eredményeiddel szerzett pontok nyitják meg – a rangot mindig a szerver számolja."
      >
        {summary && (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative grid h-16 w-16 place-items-center">
                <RankGlyph code={summary.licenceCode} className="h-16 w-16" />
                <span
                  className="absolute font-display text-lg font-bold uppercase"
                  style={{ color: rankStyle(summary.licenceCode).accent }}
                >
                  {summary.licenceCode.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-display text-xl font-bold uppercase tracking-[0.06em] text-white">
                  {summary.licenceName}
                </p>
                <p className="text-xs text-graphite-400">
                  {summary.totalPoints} pont
                  {summary.pointsToNext != null && ` · ${summary.pointsToNext} pont a következőig`}
                </p>
              </div>
            </div>

            <div className="min-w-[220px] flex-1 sm:max-w-sm">
              <div className="mb-1.5 flex items-baseline justify-between text-[11px] uppercase tracking-wide text-graphite-500">
                <span>{summary.licenceName}</span>
                <span>{summary.nextLicenceName ??"Legmagasabb szint"}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-ink-800">
                <div
                  className="h-full bg-brand-500 transition-all duration-700"
                  style={{ width: `${summary.progressPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-right font-mono text-[11px] text-graphite-400">
                {summary.progressPercent}%
              </p>
            </div>
          </div>
        )}
      </PageHeader>

      <section className="container-page py-10 sm:py-14">
        {loading ? (
          <div className="flex items-center gap-3 py-16 text-sm text-graphite-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Licencek betöltése…
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-200">A licencek nem érhetők el</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Ranglétra – nagy, egyedi emblémákkal. */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {levels.map((level, i) => {
                const st = rankStyle(level.code);
                const isCurrent = level.code === summary?.licenceCode;
                const reached = currentIndex >= 0 && i <= currentIndex;
                return (
                  <div
                    key={level.code}
                    className={cn("relative overflow-hidden border px-4 pb-5 pt-6 text-center transition-colors",
                      isCurrent ?"bg-ink-900" : reached ?"bg-ink-900/60" :"bg-ink-950/40",
                    )}
                    style={{ borderColor: isCurrent ? st.ring :"#23272e" }}
                  >
                    {isCurrent && (
                      <span
                        className="pointer-events-none absolute inset-x-0 top-0 h-px"
                        style={{ background: `linear-gradient(to right, transparent, ${st.accent}, transparent)` }}
                      />
                    )}
                    <div className="relative mx-auto grid h-20 w-20 place-items-center">
                      <RankGlyph code={level.code} className={cn("h-20 w-20", !reached &&"opacity-40")} />
                      <span
                        className={cn("absolute font-display text-2xl font-bold uppercase",
                          !reached &&"opacity-50",
                        )}
                        style={{ color: st.accent }}
                      >
                        {level.code.toUpperCase()}
                      </span>
                    </div>

                    <p
                      className="mt-3 font-display text-base font-bold uppercase tracking-[0.08em]"
                      style={{ color: isCurrent ? st.accent :"#cfd3d9" }}
                    >
                      {level.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-graphite-400">{level.minPoints} pont</p>

                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {isCurrent ? (
                        <span
                          className="inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{ color: st.accent }}
                        >
                          <Check className="h-3 w-3" /> Jelenlegi
                        </span>
                      ) : reached ? (
                        <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                          <Check className="h-3 w-3" /> Elérve
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-graphite-600">
                          <Lock className="h-3 w-3" /> Zárolva
                        </span>
                      )}
                    </div>

                    {level.description && (
                      <p className="mt-2.5 text-[11px] leading-relaxed text-graphite-500">{level.description}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="surface-raised p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">Hogyan lépsz szintet?</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-graphite-400">
                  <li className="flex gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    A pontokat jóváhagyott köridőkkel és teljesített feladatokkal szerzed.
                  </li>
                  <li className="flex gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    A pontösszeg a pontnaplóból (points_ledger) számolódik, kézzel nem állítható.
                  </li>
                  <li className="flex gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    A küszöb átlépésekor a rang automatikusan lép – külön kérelem nem kell.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="surface p-5">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-graphite-300">Fejlesztés alatt</h2>
                  <p className="mt-2 text-xs leading-relaxed text-graphite-500">
                    A jelenlegi pontküszöbök ideiglenesek. A végleges licencfeltételek – kötelező feladatok, pontozás
                    és szintek – későbbi fejlesztési szakaszban készülnek el.
                  </p>
                </div>
                <Link href="/fejlodes/feladatok" className="btn-outline w-full">
                  Feladatok megtekintése
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
