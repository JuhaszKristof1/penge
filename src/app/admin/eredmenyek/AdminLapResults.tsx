"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { formatDate, formatLapTime, LAP_STATUS_META, MEASUREMENT_META } from "@/lib/motorsport/format";
import type { LapStatus, LapTime } from "@/lib/types";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/utils";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Ellenőrzés alatt" },
  { key: "approved", label: "Elfogadva" },
  { key: "rejected", label: "Elutasítva" },
  { key: "all", label: "Összes" },
];

export function AdminLapResults() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await apiFetch<{ data: LapTime[] }>(`/api/admin/lap-times${qs}`);
      setLaps(res.data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const l of laps) c[l.status] += 1;
    return c;
  }, [laps]);

  const review = async (lap: LapTime, status: LapStatus) => {
    setBusyId(lap.id);
    try {
      await apiFetch("/api/admin/lap-times", {
        method: "PATCH",
        body: JSON.stringify({ id: lap.id, status, reviewNote: notes[lap.id] ?? "" }),
      });
      toast.success(status === "approved" ? "Az eredményt elfogadtuk – felkerül a ranglistára." : "Az eredményt elutasítottuk.");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Eredmények ellenőrzése"
        sub="A beküldött köridők áttekintése. Csak az elfogadott eredmények kerülnek a nyilvános ranglistára."
        className="mb-6"
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors",
              filter === f.key
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink-600 bg-ink-900 text-graphite-300 hover:border-ink-500 hover:text-white",
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={load}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-ink-600 px-3.5 py-2 text-sm text-graphite-300 hover:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Frissítés
        </button>
      </div>

      {filter === "all" && (
        <p className="mb-4 text-xs text-graphite-500">
          Ellenőrzés alatt: {counts.pending} · Elfogadva: {counts.approved} · Elutasítva: {counts.rejected}
        </p>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Eredmények betöltése…
        </p>
      ) : laps.length === 0 ? (
        <p className="rounded-sm border border-dashed border-ink-600 px-6 py-12 text-center text-sm text-graphite-400">
          Nincs ebben az állapotban eredmény.
        </p>
      ) : (
        <div className="space-y-4">
          {laps.map((lap) => {
            const meta = LAP_STATUS_META[lap.status];
            return (
              <div key={lap.id} className="rounded-sm border border-ink-700 bg-ink-850 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", meta.bg, meta.border, meta.color)}>
                        {meta.label}
                      </span>
                      <span className="rounded border border-ink-600 bg-ink-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-graphite-300">
                        {MEASUREMENT_META[lap.measurementType].label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-white">
                      {lap.driverName ?? "Versenyző"} · {lap.trackName ?? "—"}
                    </h3>
                    <p className="text-xs text-graphite-500">
                      {lap.layoutName ?? "—"} · {lap.vehicleLabel ?? "—"} · {lap.vehicleCategory}
                    </p>
                    <p className="mt-1 text-xs text-graphite-500">Mérés dátuma: {formatDate(lap.measuredAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-extrabold tabular-nums text-white">
                      {formatLapTime(lap.lapTimeMs)}
                    </p>
                    {lap.evidenceUrl && (
                      <a
                        href={lap.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Bizonyíték megnyitása
                      </a>
                    )}
                  </div>
                </div>

                {lap.note && (
                  <p className="mt-3 rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-graphite-300">
                    Beküldő megjegyzése: {lap.note}
                  </p>
                )}

                {lap.reviewNote && (
                  <p className="mt-2 text-xs text-graphite-500">Ellenőrzési megjegyzés: {lap.reviewNote}</p>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={notes[lap.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [lap.id]: e.target.value }))}
                    placeholder="Ellenőrzési megjegyzés (opcionális)…"
                    className="input flex-1"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === lap.id || lap.status === "approved"}
                      onClick={() => review(lap, "approved")}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      {busyId === lap.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Elfogadás
                    </button>
                    <button
                      type="button"
                      disabled={busyId === lap.id || lap.status === "rejected"}
                      onClick={() => review(lap, "rejected")}
                      className="btn-danger px-4 py-2 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Elutasítás
                    </button>
                    {lap.status !== "pending" && (
                      <button
                        type="button"
                        disabled={busyId === lap.id}
                        onClick={() => review(lap, "pending")}
                        className="btn-ghost px-4 py-2 text-xs"
                      >
                        Vissza ellenőrzésre
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
