"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  Clock,
  HelpCircle,
  Package,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { CompatibilityResult, PartCategory } from "@/lib/types";
import { STATUS_META } from "@/lib/status";
import { Badge, Progress, StatusBadge } from "./ui";
import { PartImage } from "./PartImage";
import { cn, formatDate } from "@/lib/utils";

const STATUS_ICON = {
  compatible: CheckCircle2,
  incompatible: XCircle,
  uncertain: HelpCircle,
};

export function ResultCard({ result, className }: { result: CompatibilityResult; className?: string }) {
  const meta = STATUS_META[result.status];
  const Icon = STATUS_ICON[result.status];
  const { input } = result;

  return (
    <div
      className={cn("card animate-fade-up overflow-hidden", meta.border, className)}
      role="status"
      aria-live="polite"
    >
      {/* Fejléc */}
      <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6", meta.bg, meta.border)}>
        <div className="flex items-center gap-3">
          <span className={cn("grid h-11 w-11 place-items-center rounded-xl border", meta.border, meta.bg, meta.color)}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-graphite-400">Kompatibilitási eredmény</p>
            <p className={cn("font-display text-lg font-extrabold", meta.color)}>{meta.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite-400">Bizonyosság</p>
            <p className="font-display text-lg font-bold text-white">{result.confidence}%</p>
          </div>
          <StatusBadge status={result.status} />
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <Progress value={result.confidence} className="mb-5" />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Autó */}
          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-400">
              <Car className="h-4 w-4" />
              Jármű
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Márka / modell" value={`${input.makeName} ${input.modelName}`} />
              <Row label="Generáció" value={input.generationName} />
              <Row label="Évjárat" value={String(input.year)} />
              <Row label="Karosszéria" value={input.body} />
              <Row label="Motor" value={input.engineName} />
              <Row label="Motorkód" value={input.engineCode} mono />
            </dl>
          </div>

          {/* Alkatrész */}
          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-400">
              <Package className="h-4 w-4" />
              Alkatrész
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Megnevezés" value={input.partName || "—"} />
              <Row label="OE szám" value={input.oeNumber || "—"} mono />
              <Row label="Gyártói cikkszám" value={input.manufacturerSku || "—"} mono />
              <Row label="Kategória" value={input.category || "—"} />
              {input.imageName && <Row label="Csatolt kép" value={input.imageName} />}
            </dl>
          </div>
        </div>

        {/* Illeszkedő katalógus-elem */}
        {result.matchedPart && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-white">
              <PartImage
                part={{ name: result.matchedPart.name, category: (result.matchedPart.category as PartCategory) }}
                className="h-full w-full"
                size="sm"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-300">
                <BadgeCheck className="h-4 w-4" />
                Adatbázis találat
              </div>
              <p className="truncate text-sm text-white">
                {result.matchedPart.name}{" "}
                <span className="text-graphite-400">· {result.matchedPart.brand}</span>
              </p>
              <p className="mt-0.5 font-mono text-xs text-graphite-400">SKU: {result.matchedPart.sku}</p>
            </div>
            <Link
              href={`/alkatreszek/${result.matchedPart.id}`}
              className="btn-ghost hidden shrink-0 px-3 py-2 text-xs sm:inline-flex"
            >
              Adatlap
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Indoklás */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-graphite-300">
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
            Indoklás
          </div>
          <ul className="space-y-2">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-graphite-300">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Figyelmeztetések */}
        {result.warnings.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              Figyelmeztetések
            </div>
            <ul className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-amber-100/80">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-graphite-500">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(result.createdAt)}
          </span>
          {result.verified ? (
            <Badge tone="success">Adatbázis · ellenőrzött rekord</Badge>
          ) : (
            <Badge tone="warn">Adatbázis · nem ellenőrzött rekord</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-graphite-500">{label}</dt>
      <dd className={cn("text-right font-medium text-graphite-100", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}
