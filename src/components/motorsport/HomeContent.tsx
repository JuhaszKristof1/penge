"use client";

import Link from "next/link";
import { ArrowRight, Flag, Trophy } from "lucide-react";
import { useApp } from "@/context/AppContext";

// ---------------------------------------------------------------------------
// Kezdőlap – minimalista, szimmetrikus nyitófelület.
//
// A középpontban kizárólag a GRIDLINE logó áll: nincs szlogen, nincs
// versenypályás fotó, nincs autó/ember a háttérben és nincs középen navigációs
// blokk. A hátteret fekete/grafit alap, finom geometriai motorsport-minta és
// vékony narancs fénycsíkok adják. A tartalom a logó alatt, visszafogottan
// jelenik meg – a hangsúly a márkajelen van.
// ---------------------------------------------------------------------------

export function HomeContent() {
  const { currentUser, ready } = useApp();

  return (
    <section className="relative isolate flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
      {/* Háttér: grafit alap + geometriai rács + fénycsíkok + kockás sáv */}
      <div className="absolute inset-0 -z-10 bg-ink-950" aria-hidden>
        {/* Finom technikai rács, középről kifakulva. */}
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.5]" />
        {/* Átlós motorsport-csíkozás a két sarokban. */}
        <div className="absolute -left-24 top-0 h-full w-1/3 bg-diag-lines opacity-40 [mask-image:linear-gradient(to_right,black,transparent)]" />
        <div className="absolute -right-24 top-0 h-full w-1/3 bg-diag-lines opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
        {/* Nagy, halvány geometriai ív – versenyvonal-utalás. */}
        <svg
          viewBox="0 0 1200 800"
          className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          fill="none"
        >
          <path d="M-100 700 C 300 620, 420 240, 700 220 S 1100 380, 1300 120" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M-100 760 C 320 690, 460 320, 720 300 S 1120 450, 1300 200" stroke="#ffffff" strokeWidth="1" />
        </svg>
        {/* Vékony narancs fénycsíkok – vízszintes, középre fókuszálva. */}
        <span className="absolute left-0 top-[38%] h-px w-full bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
        <span className="absolute left-0 top-[62%] h-px w-full bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        {/* Sugárirányú sötétítés, hogy a logó kiemelkedjen. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,11,0.35)_0%,rgba(10,10,11,0.92)_62%,#0a0a0b_100%)]" />
        {/* Keskeny kockás zászló sáv a legalján. */}
        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-checker opacity-[0.10]" />
      </div>

      {/* KÖZÉP: a logó, egyedül */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="animate-fade-up text-center">
          <h1 className="sr-only">GRIDLINE</h1>
          {/* Nagy, szimmetrikus szóvédjegy – a kezdőlap egyetlen központi eleme. */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <span className="hidden h-px w-10 bg-gradient-to-r from-transparent to-brand-500/70 sm:block sm:w-16" />
            <span className="font-display text-6xl font-bold uppercase leading-none tracking-[0.2em] text-white sm:text-7xl md:text-8xl lg:text-9xl">
              GRID<span className="text-brand-500">LINE</span>
            </span>
            <span className="hidden h-px w-10 bg-gradient-to-l from-transparent to-brand-500/70 sm:block sm:w-16" />
          </div>
          {/* Nagyon visszafogott, vékony narancs vonal a logó alatt. */}
          <span className="mx-auto mt-6 block h-px w-24 bg-brand-500/60" />
        </div>
      </div>

      {/* Alsó sáv: diszkrét belépési pontok (nem navigációs blokk a középen). */}
      <div className="relative border-t border-ink-900/80">
        <div className="container-page flex items-center justify-center gap-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/versenypalyak"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite-300 transition-colors hover:text-white"
            >
              <Flag className="h-3.5 w-3.5" /> Versenypályák
            </Link>
            <Link
              href="/ranglistak"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite-300 transition-colors hover:text-white"
            >
              <Trophy className="h-3.5 w-3.5" /> Ranglisták
            </Link>
            {ready && currentUser ? (
              <Link
                href="/fejlodes/fejlodesem"
                className="inline-flex items-center gap-1.5 border border-brand-500/50 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] text-brand-400 transition-colors hover:bg-brand-500/10"
              >
                Fejlődésem <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/regisztracio"
                className="inline-flex items-center gap-1.5 bg-brand-500 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-600"
              >
                Csatlakozás <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
