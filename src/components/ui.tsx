"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { CompatibilityStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/status";

// ---------------------------------------------------------------------------
// Kis újrahasznosítható UI elemek
// ---------------------------------------------------------------------------

export function Badge({
  children,
  tone ="neutral",
  className,
}: {
  children: React.ReactNode;
  tone?:"neutral" |"brand" |"success" |"danger" |"warn";
  className?: string;
}) {
  const tones = {
    neutral: "border-ink-600 bg-ink-800/70 text-graphite-300",
    brand: "border-brand-500/40 bg-brand-500/10 text-brand-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: CompatibilityStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
        meta.bg,
        meta.border,
        meta.color,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function DbNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn("flex items-start gap-3 border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3",
        className,
      )}
      role="note"
    >
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300">
        i
      </span>
      <p className="text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
        {compact ? (
          <>Az adatok és az eredmények a csatlakoztatott Supabase adatbázisból származnak.</>
        ) : (
          <>
            <strong className="font-semibold text-emerald-200">Valós adatbázis.</strong> Az alkatrész-, jármű- és
            kompatibilitási adatok a csatlakoztatott Supabase (PostgreSQL) adatbázisból származnak. A kompatibilitást
            kizárólag a <span className="font-mono">fitments</span> tábla rekordjai döntik el – a rendszer nem talál ki
            adatot.
          </>
        )}
      </p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align ="left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?:"left" |"center";
  className?: string;
}) {
  return (
    <div className={cn(align ==="center" &&"text-center", className)}>
      {eyebrow && (
        <div
          className={cn("mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-400",
            align ==="center" &&"justify-center",
          )}
        >
          <span className="h-px w-6 bg-brand-500/60" />
          {eyebrow}
          {align ==="center" && <span className="h-px w-6 bg-brand-500/60" />}
        </div>
      )}
      <h2 className="section-title">{title}</h2>
      {sub && <p className={cn("section-sub", align ==="center" &&"mx-auto")}>{sub}</p>}
    </div>
  );
}

/** Egységes GRIDLINE oldalfejléc a belső oldalakhoz.
 *  Lapos, alkalmazásszerű sáv: hajszálvonal, finom átlós textúra, narancs
 *  fénycsík – lekerekítés és árnyék nélkül. */
export function PageHeader({
  eyebrow,
  title,
  sub,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-ink-800 bg-ink-900/30", className)}>
      <div className="pointer-events-none absolute inset-0 bg-diag-lines opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <div className="container-page relative py-10 sm:py-14">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-400">
            <span className="h-px w-6 bg-brand-500" />
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-none tracking-[0.03em] text-white text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {sub && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite-400 sm:text-[15px]">{sub}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-ink-700 bg-ink-900/40 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center bg-ink-800 text-brand-400">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-graphite-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-amber-400", className)} title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
          <path
            fill={i <= Math.round(rating) ?"currentColor" :"none"}
            stroke="currentColor"
            strokeWidth="1.4"
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z"
          />
        </svg>
      ))}
    </span>
  );
}
