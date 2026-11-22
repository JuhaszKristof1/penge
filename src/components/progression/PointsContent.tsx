"use client";

import Link from "next/link";
import { AlertTriangle, Coins, Loader2, LogIn, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { LicenceBadge } from "@/components/progression/LicenceBadge";
import { PageHeader, Progress } from "@/components/ui";

// ---------------------------------------------------------------------------
// Pontok – a pontnapló (points_ledger) és a következő szintig hátralévő pontok.
//
// A napló írásvédett: a pontok kizárólag szerveroldali jóváírással keletkeznek,
// így a felület csak olvas. A pontösszeget a szerver számolja.
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return"—";
  return d.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function PointsContent() {
  const { currentUser, ready } = useApp();
  const { points, summary, loading, error } = useProgression();

  return (
    <>
      <PageHeader
        eyebrow="Fejlődés"
        title="Pontok"
        sub="A pontjaid kizárólag jóváhagyott eredményekből és teljesített feladatokból származnak. A napló írásvédett: minden pontmozgás a szerveren keletkezik."
      >
        {summary && (
          <div className="flex flex-wrap items-center gap-4">
            <LicenceBadge code={summary.licenceCode} name={summary.licenceName} size="md" href={null} />
            <div className="min-w-[200px] flex-1 sm:max-w-sm">
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-graphite-400">
                <span>
                  {summary.licenceName}
                  {summary.nextLicenceName ? ` → ${summary.nextLicenceName}` :" – legmagasabb szint"}
                </span>
                <span className="font-mono text-graphite-200">{summary.totalPoints} pont</span>
              </div>
              <Progress value={summary.progressPercent} />
            </div>
          </div>
        )}
      </PageHeader>

      <section className="container-page py-10 sm:py-14">
        {loading ? (
          <div className="flex items-center gap-3 py-16 text-sm text-graphite-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pontok betöltése…
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-200">A pontok nem érhetők el</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{error}</p>
            </div>
          </div>
        ) : !currentUser ? (
          <div className="flex flex-wrap items-center gap-3 border border-ink-700 bg-ink-850 px-4 py-5">
            <LogIn className="h-5 w-5 shrink-0 text-brand-400" />
            <p className="flex-1 text-sm text-graphite-300">
              A pontjaid és a pontnaplód megtekintéséhez jelentkezz be.
            </p>
            <Link href="/bejelentkezes" className="btn-primary">
              Bejelentkezés
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
            <div>
              {summary && (
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  <Stat label="Összes pont" value={summary.totalPoints} icon={<Coins className="h-4 w-4" />} />
                  <Stat label="Teljesített feladat" value={`${summary.completedChallenges} / ${summary.totalChallenges}`} icon={<TrendingUp className="h-4 w-4" />} />
                  <Stat
                    label={summary.nextLicenceName ? `Következő: ${summary.nextLicenceName}` :"Legmagasabb szint"}
                    value={summary.pointsToNext != null ? `${summary.pointsToNext} pont` :"—"}
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </div>
              )}

              <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">Pontnapló</h2>
              {points.length === 0 ? (
                <p className="mt-4 border border-dashed border-ink-700 bg-ink-900/40 px-4 py-10 text-center text-sm text-graphite-400">
                  Még nincs pontmozgás. Teljesíts egy feladatot a{""}
                  <Link href="/fejlodes/feladatok" className="font-semibold text-brand-400 hover:text-brand-300">
                    Feladatok
                  </Link>{""}
                  oldalon.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden border border-ink-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-800 bg-ink-900 text-left text-[10px] uppercase tracking-[0.12em] text-graphite-500">
                        <th className="px-4 py-2.5 font-semibold">Dátum</th>
                        <th className="px-4 py-2.5 font-semibold">Jogcím</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Pont</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((entry) => (
                        <tr key={entry.id} className="border-b border-ink-800 transition-colors last:border-0 hover:bg-ink-850/60">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-graphite-400">
                            {formatDate(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-graphite-200">{entry.reason}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-brand-300">
                            {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="surface-raised p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">Miből jön a pont?</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-graphite-400">
                  <li>Jóváhagyott köridő-feltöltés a ranglistára.</li>
                  <li>Teljesített feladat (badge) jutalma.</li>
                  <li>Későbbi szakaszban: licencekhez kapcsolódó feladatok.</li>
                </ul>
                <p className="mt-4 border-t border-ink-700 pt-4 text-xs leading-relaxed text-graphite-500">
                  A pontokat a kliens nem tudja módosítani: a pontnaplóba kizárólag a szerveroldali, ellenőrzött
                  műveletek írnak.
                </p>
              </div>
              <Link href="/fejlodes/feladatok" className="btn-primary w-full">
                Feladatok
              </Link>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="surface-raised px-4 py-3.5">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-graphite-500">
        <span className="text-brand-400">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold uppercase tracking-[0.02em] text-white">{value}</p>
    </div>
  );
}
