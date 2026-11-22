"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Loader2, Search, ShieldCheck } from "lucide-react";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// Admin statisztikák: valós számok az adatbázisból.
//  - Keresési és kompatibilitási események (search_history)
//  - Ellenőrzési státuszok megoszlása (compatibility_reports)
//  - Felhasználók, mentett autók, kedvencek (profiles, user_vehicles, favorites)

interface ReportRow {
  status: "compatible" | "incompatible" | "uncertain";
  confidence: number;
}

export function AdminStats() {
  const { searchLog, allUsers, refreshAdminData, adminLoading } = useApp();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await refreshAdminData();
        const body = await apiFetch<{ reports?: ReportRow[] }>("/api/admin/stats");
        if (!cancelled) setReports(body.reports ?? []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshAdminData]);

  const searches = useMemo(() => searchLog.filter((s) => s.type === "search"), [searchLog]);
  const checks = useMemo(() => searchLog.filter((s) => s.type === "compatibility"), [searchLog]);

  const statusCounts = useMemo(() => {
    const counts = { compatible: 0, incompatible: 0, uncertain: 0 };
    reports.forEach((r) => (counts[r.status] += 1));
    return counts;
  }, [reports]);

  const total = reports.length || 1;

  const topTerms = useMemo(() => {
    const map = new Map<string, number>();
    searches.forEach((s) => map.set(s.label, (map.get(s.label) ?? 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [searches]);

  if (loading || adminLoading) {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-graphite-400">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        Statisztikák betöltése…
      </p>
    );
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Statisztikák"
        sub="Keresési és kompatibilitási ellenőrzési statisztikák a valós adatbázisból."
        className="mb-6"
      />

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Felhasználók" value={allUsers.length} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Keresések" value={searches.length} icon={<Search className="h-4 w-4" />} />
        <StatCard label="Kompatibilitási ellenőrzések" value={checks.length} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Mentett jegyzőkönyvek" value={reports.length} icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
            Ellenőrzési eredmények megoszlása
          </h3>
          {reports.length === 0 ? (
            <p className="text-sm text-graphite-400">Még nincs mentett kompatibilitási jegyzőkönyv.</p>
          ) : (
            <div className="space-y-4">
              <DistBar label="Kompatibilis" value={statusCounts.compatible} total={total} tone="bg-emerald-500" />
              <DistBar label="Nem kompatibilis" value={statusCounts.incompatible} total={total} tone="bg-rose-500" />
              <DistBar label="Nem biztos" value={statusCounts.uncertain} total={total} tone="bg-amber-500" />
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
            Leggyakoribb keresések
          </h3>
          {topTerms.length === 0 ? (
            <p className="text-sm text-graphite-400">Még nincs rögzített keresés.</p>
          ) : (
            <ul className="space-y-2.5">
              {topTerms.map(([term, count]) => (
                <li key={term} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-graphite-200">{term}</span>
                  <Badge tone="neutral">{count}×</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">Legutóbbi események</h3>
        {searchLog.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Nincs esemény"
            description="Amint a felhasználók keresnek vagy ellenőriznek, az események itt jelennek meg."
          />
        ) : (
          <ul className="divide-y divide-ink-800">
            {searchLog.slice(0, 15).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex items-center gap-2.5">
                  <Badge tone={s.type === "compatibility" ? "brand" : "neutral"} className="text-[10px]">
                    {s.type === "compatibility" ? "Ellenőrzés" : "Keresés"}
                  </Badge>
                  <span className="truncate text-graphite-200">{s.label}</span>
                </span>
                <span className="shrink-0 text-xs text-graphite-500">
                  {new Date(s.at).toLocaleString("hu-HU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-graphite-400">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-sm bg-ink-800 text-brand-400">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function DistBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-graphite-200">{label}</span>
        <span className="text-graphite-400">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
        <div className={cn("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
