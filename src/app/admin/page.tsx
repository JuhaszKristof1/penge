"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Boxes,
  Database,
  Loader2,
  Package,
  Search,
  Users,
} from "lucide-react";
import { Badge, SectionHeading } from "@/components/ui";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { useApp } from "@/context/AppContext";
import { apiFetch, apiErrorMessage } from "@/lib/api";

// Admin áttekintő. Valós adatbázis-számok a /api/admin/stats végpontról,
// valamint a katalógus és a felhasználók összesítése.

interface Stats {
  users: number;
  vehicles: number;
  favorites: number;
  searches: number;
  checks: number;
  reports: { status: "compatible" | "incompatible" | "uncertain"; confidence: number }[];
}

export default function AdminOverviewPage() {
  const { brands, parts, categories, source, status, message } = useCatalog();
  const { allUsers, refreshAdminData } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await refreshAdminData();
        const body = await apiFetch<Stats>("/api/admin/stats");
        if (!cancelled) setStats(body);
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

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Áttekintés"
        sub="A platform aktuális állapota a valós adatbázis alapján."
        className="mb-6"
      />

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Adatbázis állapot */}
      <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-sm bg-ink-800 text-brand-400">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Adatbázis-kapcsolat</p>
            <p className="text-xs text-graphite-400">{message}</p>
          </div>
        </div>
        {status === "ready" ? (
          <Badge tone="success">Csatlakozva</Badge>
        ) : status === "loading" ? (
          <Badge tone="neutral">Betöltés…</Badge>
        ) : (
          <Badge tone="danger">Nincs kapcsolat</Badge>
        )}
      </div>

      {/* Katalógus számok */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Márkák" value={brands.length} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Alkatrészek" value={parts.length} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Kategóriák" value={categories.length} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Felhasználók" value={allUsers.length} icon={<Users className="h-4 w-4" />} />
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Statisztikák betöltése…
        </p>
      ) : (
        stats && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Mentett autók" value={stats.vehicles} icon={<Boxes className="h-4 w-4" />} />
              <StatCard label="Kedvencek" value={stats.favorites} icon={<Package className="h-4 w-4" />} />
              <StatCard label="Keresések" value={stats.searches} icon={<Search className="h-4 w-4" />} />
              <StatCard label="Ellenőrzések" value={stats.checks} icon={<BarChart3 className="h-4 w-4" />} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link href="/admin/alkatreszek" className="card card-hover flex items-center justify-between p-5">
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-sm bg-ink-800 text-brand-400">
                    <Package className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">Alkatrészek kezelése</span>
                    <span className="block text-xs text-graphite-400">Hozzáadás, szerkesztés, törlés, import</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-graphite-500" />
              </Link>
              <Link href="/admin/statisztikak" className="card card-hover flex items-center justify-between p-5">
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-sm bg-ink-800 text-brand-400">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">Statisztikák</span>
                    <span className="block text-xs text-graphite-400">Keresések, ellenőrzések, megoszlás</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-graphite-500" />
              </Link>
            </div>
          </>
        )
      )}

      {source === "none" && (
        <div className="mt-6 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Az adatbázis jelenleg nem elérhető. Ellenőrizd a Supabase konfigurációt és a szerver futását.
        </div>
      )}
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
