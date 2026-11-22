"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Flag, Gauge, Lock, Map, Satellite, Timer, Trophy } from "lucide-react";
import type { ChallengeIcon, ChallengeProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Feladat-jelvény (badge) – játékos kihívásjelvény.
//
// A teljes oldal visszafogott GRIDLINE-arculatú; KIZÁRÓLAG ez a jelvényrendszer
// idézi a videojátékos kihívásokat: hatszögletű embléma, saját szegélyfény,
// teljesítéskor visszafogott fénygyűrű. A leírás hoverre (egér) és érintésre
// (mobil) is megnyílik – a részleteket külön információs panel mutatja.
// ---------------------------------------------------------------------------

const ICONS: Record<ChallengeIcon, typeof Flag> = {
  flag: Flag,
  gauge: Gauge,
  map: Map,
  satellite: Satellite,
  timer: Timer,
  trophy: Trophy,
};

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function ChallengeBadge({
  challenge,
  active,
  onSelect,
  className,
}: {
  challenge: ChallengeProgress;
  active?: boolean;
  onSelect?: (el: HTMLElement | null) => void;
  className?: string;
}) {
  const Icon = ICONS[challenge.icon] ?? Flag;
  const { name, points } = challenge;
  const done = challenge.completed;
  const claimable = challenge.claimable;
  const locked = !done && !claimable && challenge.current === 0;

  return (
    <button
      type="button"
      onClick={(e) => onSelect?.(e.currentTarget)}
      onFocus={(e) => onSelect?.(e.currentTarget)}
      aria-pressed={active}
      aria-label={`${name} – ${challenge.description}`}
      className={cn("group relative flex flex-col items-center gap-3 outline-none", className)}
    >
      <span
        className={cn(
          "relative block h-[88px] w-[88px] transition-transform duration-300 group-hover:-translate-y-1 sm:h-24 sm:w-24",
          done && "animate-badge-pop",
        )}
        style={{ clipPath: HEX }}
      >
        {/* Külső szegélyfény: teljesítve narancs, igényelhető halvány narancs. */}
        <span
          className={cn(
            "absolute inset-0 transition-colors duration-300",
            done ? "bg-brand-500" : claimable ? "bg-brand-500/60" : "bg-ink-600 group-hover:bg-ink-500",
          )}
          style={{ clipPath: HEX }}
        />
        {/* Belső felület: sötét grafit, enyhe felső fénnyel. */}
        <span
          className={cn(
            "absolute inset-[2.5px] grid place-items-center overflow-hidden",
            done ? "bg-[#1a1206]" : claimable ? "bg-ink-850" : "bg-ink-900",
          )}
          style={{ clipPath: HEX }}
        >
          {/* Belső radiális fény a jelvény tetején. */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background: done
                ? "radial-gradient(ellipse at 50% 18%, rgba(255,106,0,0.42), transparent 62%)"
                : claimable
                  ? "radial-gradient(ellipse at 50% 18%, rgba(255,106,0,0.18), transparent 60%)"
                  : "radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.06), transparent 60%)",
            }}
          />
          {/* Teljesített jelvényen lassú fénypásztázás. */}
          {done && (
            <span className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute -inset-y-4 left-0 w-1/3 animate-badge-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </span>
          )}
          <Icon
            className={cn(
              "relative h-8 w-8 transition-colors duration-300 sm:h-9 sm:w-9",
              done ? "text-brand-400 drop-shadow-[0_0_6px_rgba(255,106,0,0.5)]" : claimable ? "text-brand-400" : "text-graphite-400 group-hover:text-graphite-200",
            )}
            strokeWidth={1.7}
          />
        </span>

        {/* Teljesítés: fénygyűrű egyszeri lefutása. */}
        {done && (
          <span
            className="pointer-events-none absolute inset-0 animate-badge-ring bg-brand-500/40"
            style={{ clipPath: HEX }}
          />
        )}

        {/* Állapotjelző pecsét. */}
        {done ? (
          <span className="absolute -bottom-0.5 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-ink-950 bg-emerald-500">
            <Check className="h-3 w-3 text-ink-950" strokeWidth={3.5} />
          </span>
        ) : claimable ? (
          <span className="absolute -bottom-0.5 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-ink-950 bg-brand-500">
            <Trophy className="h-2.5 w-2.5 text-ink-950" strokeWidth={2.6} />
          </span>
        ) : locked ? (
          <span className="absolute -bottom-0.5 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-ink-950 bg-ink-700">
            <Lock className="h-2.5 w-2.5 text-graphite-400" strokeWidth={3} />
          </span>
        ) : null}
      </span>

      <span className="w-[96px] text-center sm:w-28">
        <span
          className={cn(
            "flex min-h-[2.2em] items-start justify-center text-[11px] font-bold uppercase leading-tight tracking-[0.04em]",
            done ? "text-brand-300" : "text-graphite-300",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-[0.12em]",
            done ? "text-emerald-400" : claimable ? "text-brand-400" : "text-graphite-500",
          )}
        >
          {done ? "Teljesítve" : claimable ? "Jutalom" : `${challenge.current}/${challenge.target}`}
          <span className="text-graphite-600">·</span>
          <span className={done ? "text-brand-400" : "text-graphite-500"}>{points} P</span>
        </span>
      </span>
    </button>
  );
}

/**
 * A jelvény fölött megjelenő információs panel (hover / érintés).
 * Magyar nyelvű leírás, haladás és a jutalom állapota.
 */
export function ChallengeTooltip({
  challenge,
  anchor,
  onClose,
}: {
  challenge: ChallengeProgress;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!anchor) return;
    const el = ref.current;
    const w = el?.offsetWidth ?? 280;
    const h = el?.offsetHeight ?? 150;
    const margin = 12;
    let left = anchor.x - w / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    let top = anchor.y - h - 14;
    if (top < margin) top = anchor.y + 14;
    setPos({ left, top });
  }, [anchor]);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anchor, onClose]);

  if (!anchor) return null;

  const percent =
    challenge.target > 0 ? Math.min(100, Math.round((challenge.current / challenge.target) * 100)) : 0;

  return (
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-[80] w-[280px] animate-fade-in border border-ink-700 bg-ink-900/98 p-4 shadow-lift backdrop-blur"
      style={{ left: pos.left, top: pos.top }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-sm font-bold uppercase tracking-[0.06em] text-white">{challenge.name}</p>
        <span
          className={cn(
            "shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.14em]",
            challenge.completed ? "text-emerald-400" : challenge.claimable ? "text-brand-400" : "text-graphite-500",
          )}
        >
          {challenge.completed ? "Teljesítve" : challenge.claimable ? "Jutalom" : "Folyamatban"}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-graphite-300">{challenge.description}</p>

      <div className="mt-3 flex items-baseline justify-between text-[10px] uppercase tracking-wide text-graphite-500">
        <span>Haladás</span>
        <span className="font-mono text-graphite-300">
          {challenge.current} / {challenge.target}
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden bg-ink-700">
        <div
          className={cn("h-full transition-all duration-700", challenge.completed ? "bg-emerald-500" : "bg-brand-500")}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-2.5">
        <span className="text-[10px] uppercase tracking-wide text-graphite-500">Jutalom</span>
        <span className="font-display text-xs font-bold uppercase tracking-[0.1em] text-brand-400">
          {challenge.points} pont
        </span>
      </div>
    </div>
  );
}

/** Kiválasztott feladat részletei – állandó panel (asztali nézetben). */
export function ChallengeDetail({
  challenge,
  onClaim,
  claimState,
}: {
  challenge: ChallengeProgress;
  onClaim: () => void;
  claimState: "idle" | "loading" | "done";
}) {
  const { name, description, points } = challenge;
  const percent =
    challenge.target > 0 ? Math.min(100, Math.round((challenge.current / challenge.target) * 100)) : 0;

  return (
    <div className="surface-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-white">{name}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-graphite-500">
            {challenge.completed ? "Teljesítve" : challenge.claimable ? "Jutalom igényelhető" : "Folyamatban"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 border px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.1em]",
            challenge.completed ? "border-brand-500/40 text-brand-300" : "border-ink-600 text-graphite-400",
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          {points} pont
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-graphite-300">{description}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-graphite-400">
          <span>Haladás</span>
          <span className="font-mono text-graphite-200">
            {challenge.current} / {challenge.target}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-ink-700">
          <div
            className={cn("h-full transition-all duration-700", challenge.completed ? "bg-emerald-500" : "bg-brand-500")}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        {challenge.completed ? (
          <p className="text-sm font-medium text-emerald-300">
            <Check className="mr-1.5 inline h-4 w-4" />
            Teljesítve – a pont jóváírva.
          </p>
        ) : challenge.claimable ? (
          <button type="button" onClick={onClaim} disabled={claimState === "loading"} className="btn-primary w-full sm:w-auto">
            {claimState === "loading" ? "Igénylés…" : `Jutalom igénylése (+${points} pont)`}
          </button>
        ) : (
          <p className="text-sm text-graphite-500">A feltétel teljesülése után itt igényelheted a jutalmat.</p>
        )}
      </div>
    </div>
  );
}
