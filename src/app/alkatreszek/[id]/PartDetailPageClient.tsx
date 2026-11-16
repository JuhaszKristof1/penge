"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PartDetailContent } from "@/components/PartDetailContent";
import { DbNotice, EmptyState } from "@/components/ui";
import { toast } from "@/components/Toaster";

export function PartDetailPageClient() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const { ready, allParts, isFavorite, toggleFavorite } = useApp();

  if (!ready) {
    return <div className="container-page py-20 text-graphite-400">Betöltés…</div>;
  }

  const part = allParts.find((p) => p.id === id);

  if (!part) {
    return (
      <div className="container-page py-12 sm:py-16">
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Az alkatrész nem található"
          description="Lehet, hogy az azonosító hibás, vagy az alkatrészt eltávolították az adatbázisból."
          action={
            <Link href="/alkatreszek" className="btn-primary">
              <Package className="h-4 w-4" />
              Vissza az alkatrészkeresőhöz
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-graphite-500">
        <Link href="/alkatreszek" className="inline-flex items-center gap-1 transition-colors hover:text-brand-400">
          <ArrowLeft className="h-3.5 w-3.5" />
          Alkatrészkereső
        </Link>
        <span>/</span>
        <span className="text-graphite-400">{part.category}</span>
        <span>/</span>
        <span className="truncate text-graphite-300">{part.name}</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-850/80 backdrop-blur-sm">
        <PartDetailContent
          part={part}
          isFavorite={isFavorite(part.id)}
          onToggleFavorite={(p) => {
            toggleFavorite(p.id);
            toast.success(isFavorite(p.id) ? "Eltávolítva a kedvencek közül." : "Hozzáadva a kedvencekhez.");
          }}
          onOpen={(p) => {
            window.location.href = `/alkatreszek/${p.id}`;
          }}
          headingId="part-detail-title"
        />
      </div>

      <div className="mt-6">
        <DbNotice />
      </div>
    </div>
  );
}
