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
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "danger" | "warn";
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
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
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
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
      className={cn(
        "flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3",
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
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <div
          className={cn(
            "mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-400",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-px w-6 bg-brand-500/60" />
          {eyebrow}
          {align === "center" && <span className="h-px w-6 bg-brand-500/60" />}
        </div>
      )}
      <h2 className="section-title">{title}</h2>
      {sub && <p className={cn("section-sub", align === "center" && "mx-auto")}>{sub}</p>}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-14 text-center">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-800 text-brand-400">{icon}</div>}
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
            fill={i <= Math.round(rating) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z"
          />
        </svg>
      ))}
    </span>
  );
}
