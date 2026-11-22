"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, LogIn, Trophy } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { ChallengeBadge, ChallengeTooltip, ChallengeDetail } from "@/components/progression/ChallengeBadge";
import { LicenceBadge, rankStyle } from "@/components/progression/LicenceBadge";
import { PageHeader, Progress } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Feladatok (badge-ek) – játékos kihívásjelvény-rács.
//
// Ez az EGYETLEN oldal, amely videojátékos kihívásérzetet kap; a többi oldal a
// visszafogott GRIDLINE-arculatot követi. A jutalmat a szerver ítéli oda a valós
// adatokon ellenőrzött feltétel alapján (/api/progression POST → claim_challenge).
//
// A mintafeladatok száma szándékosan korlátozott: a részletes feladatrendszert
// későbbi szakaszban határozzuk meg.
// ---------------------------------------------------------------------------

const SAMPLE_LIMIT = 5;

export function ChallengesContent() {
  const { currentUser, ready } = useApp();
  const { challenges, summary, loading, error, claim } = useProgression();
  const [selected, setSelected] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [tip, setTip] = useState<{ code: string; x: number; y: number } | null>(null);
  const tipRef = useRef<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Csak az első néhány aktív feladat jelenik meg (mintafeladatok).
  const visible = useMemo(() => challenges.slice(0, SAMPLE_LIMIT), [challenges]);

  const active = useMemo(() => {
    if (!visible.length) return null;
    return visible.find((c) => c.code === selected) ?? visible[0];
  }, [visible, selected]);

  const tipChallenge = useMemo(
    () => (tip ? visible.find((c) => c.code === tip.code) ?? null : null),
    [tip, visible],
  );

  const completedCount = visible.filter((c) => c.completed).length;

  const handleClaim = async (code: string) => {
    setClaiming(code);
    const res = await claim(code);
    setClaiming(null);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  const openTip = (code: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    tipRef.current = code;
    setTip({ code, x: r.left + r.width / 2, y: r.top });
  };

  const handleHover = (code: string, el: HTMLElement) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => openTip(code, el), 120);
  };

  const handleLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    tipRef.current = null;
    setTip(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Fejlődés"
        title="Feladatok"
        sub="Teljesíts kihívásokat a magyar versenypályákon, és gyűjts pontokat a következő licenc-szinthez. A jutalmat minden esetben a szerver ellenőrzi a valós adataid alapján."
      >
        {currentUser && summary && (
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
            <span className="inline-flex items-center gap-1.5 border border-ink-600 px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.1em] text-graphite-300">
              <Trophy className="h-3.5 w-3.5" />
              {completedCount} / {visible.length} feladat
            </span>
          </div>
        )}
      </PageHeader>

      <section className="container-page py-10 sm:py-14">
        {loading ? (
          <div className="flex items-center gap-3 py-16 text-sm text-graphite-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Feladatok betöltése…
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-200">A feladatok nem érhetők el</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/80">{error}</p>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-sm text-graphite-400">Jelenleg nincs elérhető feladat.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
            <div>
              {/* Jelvényrács – a kihívásrendszer fő felülete. */}
              <div className="relative border border-ink-800 bg-ink-900/50 px-4 py-10 sm:px-8">
                {/* Halvány kockás sáv a panel tetején és alján. */}
                <span className="absolute inset-x-0 top-0 h-1.5 bg-checker opacity-[0.10]" />
                <span className="absolute inset-x-0 bottom-0 h-1.5 bg-checker opacity-[0.10]" />
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

                <div className="flex flex-wrap justify-center gap-x-3 gap-y-9 sm:gap-x-7">
                  {visible.map((c) => (
                    <div
                      key={c.code}
                      onMouseEnter={(e) => handleHover(c.code, e.currentTarget)}
                      onMouseLeave={handleLeave}
                      className="flex justify-center"
                    >
                      <ChallengeBadge
                        challenge={c}
                        active={active?.code === c.code}
                        onSelect={(el) => {
                          setSelected(c.code);
                          // Érintőeszközön (nincs hover) koppintásra is megnyílik
                          // az információs panel – mobilon így érhető el a leírás.
                          if (!el || !window.matchMedia("(hover: none)").matches) return;
                          const isOpen = tipRef.current === c.code;
                          if (isOpen) {
                            setTip(null);
                            tipRef.current = null;
                          } else {
                            openTip(c.code, el);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {active && (
                <div className="mt-5">
                  <ChallengeDetail
                    challenge={active}
                    claimState={claiming === active.code ?"loading" :"idle"}
                    onClaim={() => handleClaim(active.code)}
                  />
                </div>
              )}

              {!currentUser && ready && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border border-ink-700 bg-ink-850 px-4 py-4">
                  <LogIn className="h-5 w-5 shrink-0 text-brand-400" />
                  <p className="flex-1 text-sm text-graphite-300">
                    A haladásod és a pontjaid mentéséhez jelentkezz be.
                  </p>
                  <Link href="/bejelentkezes" className="btn-primary">
                    Bejelentkezés
                  </Link>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="surface-raised p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">Hogyan működik?</h2>
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-graphite-400">
                  <li className="flex gap-3">
                    <span className="font-display text-xs font-bold text-brand-400">01</span>
                    Teljesíts egy feltételt a valós eredményeiddel (jóváhagyott kör, GPS-mérés).
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-xs font-bold text-brand-400">02</span>
                    A jelvény narancsra vált, amint a szerver igazolja a feltételt.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-xs font-bold text-brand-400">03</span>
                    Igényeld a jutalmat – a pontok jóváírása után a rangod automatikusan léphet.
                  </li>
                </ol>
                <p className="mt-4 border-t border-ink-800 pt-4 text-xs leading-relaxed text-graphite-500">
                  A pontokat kizárólag a szerver ítéli oda; a kliens nem tud pontot adni. Egy feladat jutalma
                  felhasználónként csak egyszer szerezhető meg.
                </p>
              </div>

              <div className="surface-raised p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">Ranglétra</h2>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {[
                    { code: "rookie", label: "Rookie" },
                    { code: "d", label: "D" },
                    { code: "c", label: "C" },
                    { code: "b", label: "B" },
                    { code: "a", label: "A" },
                  ].map((lvl) => {
                    const isCurrent = summary?.licenceCode === lvl.code;
                    const st = rankStyle(lvl.code);
                    return (
                      <li
                        key={lvl.code}
                        className={cn("flex items-center justify-between border border-ink-800 px-3 py-2 transition-colors",
                          isCurrent &&"bg-brand-500/[0.06]",
                        )}
                        style={isCurrent ? { borderColor: st.ring } : undefined}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2" style={{ backgroundColor: st.accent }} />
                          <span
                            className="font-display font-bold uppercase tracking-[0.1em]"
                            style={{ color: isCurrent ? st.accent :"#a9b0ba" }}
                          >
                            {lvl.label}
                          </span>
                        </span>
                        {isCurrent && (
                          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: st.accent }}>
                            Jelenlegi
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href="/fejlodes/licencrendszer"
                  className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide text-brand-400 hover:text-brand-300"
                >
                  Licencrendszer részletei →
                </Link>
              </div>

              <p className="text-xs leading-relaxed text-graphite-600">
                A részletes feladatrendszert (további kihívások, pontozás) későbbi szakaszban bővítjük. Az itt látható
                jelvények a jelenleg aktív feladatokat mutatják a valós adataid alapján.
              </p>
            </aside>
          </div>
        )}
      </section>

      {tipChallenge && (
        <ChallengeTooltip
          challenge={tipChallenge}
          anchor={tip ? { x: tip.x, y: tip.y } : null}
          onClose={handleLeave}
        />
      )}
    </>
  );
}
