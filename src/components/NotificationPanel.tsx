"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Bell, CheckCircle2, Clock, Flag, Trophy } from "lucide-react";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { useApp } from "@/context/AppContext";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { formatLapTime } from "@/lib/motorsport/format";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Értesítések – valós eseményekből: jóváhagyott köridők, ellenőrzés alatt álló
// beküldések és igényelhető feladat-jutalmak. Nincs generált/hamis értesítés.
// ---------------------------------------------------------------------------

interface Notice {
  id: string;
  title: string;
  meta: string;
  href: string;
  icon: "approved" |"pending" |"reward";
  at: string;
}

export function NotificationPanel({
  open,
  onClose,
  laps,
}: {
  open: boolean;
  onClose: () => void;
  laps: { id: string; status: string; lapTimeMs: number; trackName?: string; createdAt: string }[];
}) {
  const { currentUser } = useApp();
  const { challenges } = useProgression();
  const { tracks } = useMotorsport();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key ==="Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const notices = useMemo<Notice[]>(() => {
    if (!currentUser) return [];
    const trackName = (id?: string) => tracks.find((t) => t.id === id)?.name ??"Versenypálya";

    const fromLaps: Notice[] = laps.slice(0, 6).map((l) => ({
      id: `lap-${l.id}`,
      title:
        l.status ==="approved"
          ? `Köridőd jóváhagyva – ${formatLapTime(l.lapTimeMs)}`
          : l.status ==="rejected"
            ? `Köridőd elutasítva – ${formatLapTime(l.lapTimeMs)}`
            : `Köridő ellenőrzés alatt – ${formatLapTime(l.lapTimeMs)}`,
      meta: l.trackName ?? trackName(undefined),
      href: "/koridok/feltoltes",
      icon: l.status ==="approved" ?"approved" : l.status ==="rejected" ?"pending" :"pending",
      at: l.createdAt,
    }));

    const fromChallenges: Notice[] = challenges
      .filter((c) => c.claimable)
      .map((c) => ({
        id: `ch-${c.code}`,
        title: `Jutalom igényelhető: ${c.name}`,
        meta: `+${c.points} pont`,
        href: "/fejlodes/feladatok",
        icon: "reward" as const,
        at: new Date().toISOString(),
      }));

    return [...fromChallenges, ...fromLaps];
  }, [currentUser, laps, challenges, tracks]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,22rem)] animate-fade-up border border-ink-700 bg-ink-900"
    >
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">Értesítések</p>
        <span className="text-[10px] uppercase tracking-wide text-graphite-500">
          {notices.length} új
        </span>
      </div>

      {!currentUser ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-graphite-400">Jelentkezz be az értesítéseid megtekintéséhez.</p>
          <Link href="/bejelentkezes" onClick={onClose} className="btn-primary mt-4 w-full">
            Bejelentkezés
          </Link>
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Bell className="h-5 w-5 text-graphite-600" />
          <p className="text-sm text-graphite-500">Nincs új értesítés.</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          {notices.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={onClose}
              className="flex items-start gap-3 border-b border-ink-800 px-4 py-3 transition-colors last:border-0 hover:bg-ink-850"
            >
              <span
                className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm",
                  n.icon ==="approved" ?"bg-emerald-500/15 text-emerald-400" : n.icon ==="reward" ?"bg-brand-500/15 text-brand-400" :"bg-ink-800 text-graphite-400",
                )}
              >
                {n.icon ==="approved" ? <CheckCircle2 className="h-4 w-4" /> : n.icon ==="reward" ? <Trophy className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug text-graphite-200">{n.title}</span>
                <span className="mt-0.5 block truncate text-xs text-graphite-500">{n.meta}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/fejlodes/fejlodesem"
        onClick={onClose}
        className="block border-t border-ink-800 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-brand-400 transition-colors hover:bg-ink-850 hover:text-brand-300"
      >
        <Flag className="mr-1.5 inline h-3 w-3" />
        Fejlődésem
      </Link>
    </div>
  );
}
