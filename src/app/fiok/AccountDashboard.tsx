"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookmarkCheck,
  Car,
  CheckCircle2,
  Clock,
  Heart,
  HelpCircle,
  LogOut,
  Package,
  Palette,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { EmptyState, SectionHeading, StatusBadge } from "@/components/ui";
import { PartCard } from "@/components/PartCard";
import { PartDetailModal } from "@/components/PartDetailModal";
import { toast } from "@/components/Toaster";
import { useApp } from "@/context/AppContext";
import type { Part } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const TABS = [
  { key: "cars", label: "Mentett autók", icon: Car },
  { key: "checks", label: "Ellenőrzések", icon: BookmarkCheck },
  { key: "favorites", label: "Kedvencek", icon: Heart },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AVATAR_COLORS = ["#ff6a00", "#3b82f6", "#10b981", "#a855f7", "#ef4444", "#eab308", "#ec4899", "#14b8a6"];

export function AccountDashboard() {
  const router = useRouter();
  const {
    ready,
    currentUser,
    logout,
    updateProfile,
    garage,
    setDefaultCar,
    deleteCar,
    checks,
    deleteCheck,
    clearChecks,
    favorites,
    allParts,
    toggleFavorite,
    isFavorite,
  } = useApp();

  const [tab, setTab] = useState<TabKey>("cars");
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [shopMode, setShopMode] = useState(false);

  useEffect(() => {
    if (ready && !currentUser) router.replace("/bejelentkezes");
  }, [ready, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setColor(currentUser.avatarColor);
      setBio(currentUser.bio ?? "");
      setCountry(currentUser.country ?? "");
    }
  }, [currentUser]);

  if (!ready || !currentUser) {
    return <div className="container-page py-24 text-center text-graphite-400">Betöltés…</div>;
  }

  const favoriteParts = allParts.filter((p) => favorites.includes(p.id));
  const compatibleCount = checks.filter((c) => c.status === "compatible").length;
  const uncertainCount = checks.filter((c) => c.status === "uncertain").length;
  const incompatibleCount = checks.filter((c) => c.status === "incompatible").length;

  const saveProfile = () => {
    if (!name.trim()) {
      toast.error("A név nem lehet üres.");
      return;
    }
    updateProfile({ name: name.trim(), avatarColor: color, bio: bio.trim(), country: country.trim() });
    toast.success("Profil mentve.");
  };

  const handleLogout = () => {
    logout();
    toast.info("Kijelentkeztél.");
    router.push("/");
  };

  return (
    <div className="container-page py-10 sm:py-14">
      {/* Profil fejléc */}
      <div className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-brand-700/30 via-ink-800 to-ink-850">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        </div>
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span
                className="grid h-20 w-20 place-items-center rounded-sm border-4 border-ink-850 text-2xl font-extrabold text-white shadow-lg"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-extrabold text-white">{currentUser.name}</h1>
                  {currentUser.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-300">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-graphite-400">{currentUser.email}</p>
                <p className="mt-0.5 text-xs text-graphite-500">Regisztrált: {formatDate(currentUser.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              {currentUser.role === "admin" && (
                <Link href="/admin" className="btn-outline">
                  <ShieldCheck className="h-4 w-4" />
                  Admin felület
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="btn-danger">
                <LogOut className="h-4 w-4" />
                Kijelentkezés
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statisztikák */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Car} label="Mentett autó" value={garage.length} tone="brand" />
        <StatCard icon={CheckCircle2} label="Kompatibilis" value={compatibleCount} tone="success" />
        <StatCard icon={HelpCircle} label="Bizonytalan" value={uncertainCount} tone="warn" />
        <StatCard icon={Heart} label="Kedvenc alkatrész" value={favoriteParts.length} tone="danger" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Fő tartalom */}
        <div>
          <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-sm border border-ink-700 bg-ink-900/50 p-1.5 no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors",
                  tab === t.key ? "bg-brand-500 text-white" : "text-graphite-400 hover:bg-ink-800 hover:text-white",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Mentett autók */}
          {tab === "cars" && (
            <div className="space-y-3">
              {garage.length === 0 ? (
                <EmptyState
                  icon={<Car className="h-6 w-6" />}
                  title="Még nincs mentett autód"
                  description="Adj hozzá járművet a garázsban, hogy az ellenőrzéseknél egy kattintással előtölthesd."
                  action={
                    <Link href="/garazs" className="btn-primary">
                      Autó hozzáadása
                    </Link>
                  }
                />
              ) : (
                garage.map((c) => (
                  <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="grid h-11 w-11 place-items-center rounded-sm bg-ink-800 text-brand-400">
                      <Car className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {c.makeName} {c.modelName}
                        </p>
                        {c.isDefault && (
                          <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-300">
                            Alapértelmezett
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-graphite-400">
                        {c.generationName} · {c.year} · {c.body} · {c.engineName} ({c.engineCode})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!c.isDefault && (
                        <button type="button" onClick={() => setDefaultCar(c.id)} className="btn-ghost px-3 py-1.5 text-xs">
                          Alapértelmezett
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deleteCar(c.id);
                          toast.info("Autó törölve.");
                        }}
                        className="btn-danger px-3 py-1.5 text-xs"
                        aria-label="Autó törlése"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              <Link href="/garazs" className="btn-ghost w-full">
                <Car className="h-4 w-4" />
                Garázs kezelése
              </Link>
            </div>
          )}

          {/* Ellenőrzések */}
          {tab === "checks" && (
            <div className="space-y-3">
              {checks.length === 0 ? (
                <EmptyState
                  icon={<BookmarkCheck className="h-6 w-6" />}
                  title="Még nincs mentett ellenőrzés"
                  description="Futtass kompatibilitás ellenőrzést – az eredmények automatikusan megjelennek itt."
                  action={
                    <Link href="/kompatibilitas" className="btn-primary">
                      Ellenőrzés indítása
                    </Link>
                  }
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="chip">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {compatibleCount}
                      </span>
                      <span className="chip">
                        <XCircle className="h-3 w-3 text-rose-400" /> {incompatibleCount}
                      </span>
                      <span className="chip">
                        <HelpCircle className="h-3 w-3 text-amber-400" /> {uncertainCount}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearChecks();
                        toast.info("Minden ellenőrzés törölve.");
                      }}
                      className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                    >
                      Összes törlése
                    </button>
                  </div>

                  {checks.map((c) => (
                    <div key={c.id} className="card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={c.status} />
                            <span className="text-xs font-semibold text-graphite-400">{c.confidence}%</span>
                          </div>
                          <p className="mt-2 font-semibold text-white">{c.input.partName}</p>
                          <p className="mt-0.5 text-xs text-graphite-400">
                            {c.input.makeName} {c.input.modelName} {c.input.generationName} · {c.input.year} ·{" "}
                            {c.input.engineName} ({c.input.engineCode})
                          </p>
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-graphite-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(c.createdAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCheck(c.id)}
                          className="text-graphite-500 hover:text-rose-300"
                          aria-label="Ellenőrzés törlése"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Kedvencek */}
          {tab === "favorites" && (
            <div>
              {favoriteParts.length === 0 ? (
                <EmptyState
                  icon={<Heart className="h-6 w-6" />}
                  title="Még nincs kedvenc alkatrészed"
                  description="Az alkatrészkeresőben a szív ikonnal jelölhetsz meg kedvenceket."
                  action={
                    <Link href="/alkatreszek" className="btn-primary">
                      Alkatrészek böngészése
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {favoriteParts.map((p) => (
                    <PartCard
                      key={p.id}
                      part={p}
                      onOpen={(part) => {
                        setShopMode(false);
                        setSelectedPart(part);
                      }}
                      isFavorite={isFavorite(p.id)}
                      onToggleFavorite={(part) => {
                        void toggleFavorite(part.id);
                        toast.info("Eltávolítva a kedvencek közül.");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Oldalsáv: profil szerkesztés */}
        <aside className="card p-5 lg:sticky lg:top-20">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <UserIcon className="h-4 w-4 text-brand-400" />
            Profil szerkesztése
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="profile-name">
                Név
              </label>
              <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="label">E-mail</label>
              <input className="input" value={currentUser.email} disabled />
              <p className="mt-1.5 text-[11px] text-graphite-500">Az e-mail cím itt nem módosítható.</p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Avatar szín
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-sm border-2 transition-transform hover:scale-110",
                      color === c ? "border-white" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Szín: ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="profile-country">
                Ország
              </label>
              <input
                id="profile-country"
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Magyarország"
              />
            </div>

            <div>
              <label className="label" htmlFor="profile-bio">
                Bemutatkozás
              </label>
              <textarea
                id="profile-bio"
                className="input resize-y"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Rövid bemutatkozás a versenyzői profilodhoz…"
              />
            </div>

            <button type="button" onClick={saveProfile} className="btn-primary w-full">
              <Save className="h-4 w-4" />
              Mentés
            </button>
          </div>

          <div className="mt-5 border-t border-ink-700 pt-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-graphite-400">Gyors elérés</h4>
            <div className="space-y-2">
              <Link href="/kompatibilitas" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-graphite-300 hover:bg-ink-800 hover:text-white">
                <Package className="h-4 w-4 text-brand-400" /> Kompatibilitás ellenőrzés
              </Link>
              <Link href="/alkatreszek" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-graphite-300 hover:bg-ink-800 hover:text-white">
                <Package className="h-4 w-4 text-brand-400" /> Alkatrészkereső
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <PartDetailModal
        part={selectedPart}
        onClose={() => {
          setSelectedPart(null);
          setShopMode(false);
        }}
        isFavorite={selectedPart ? isFavorite(selectedPart.id) : false}
        onOpenRelated={(part) => {
          setShopMode(false);
          setSelectedPart(part);
        }}
        scrollToShop={shopMode}
        onToggleFavorite={(part) => {
          toggleFavorite(part.id);
          toast.info("Kedvencek frissítve.");
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "brand" | "success" | "warn" | "danger";
}) {
  const tones = {
    brand: "text-brand-400 bg-brand-500/10",
    success: "text-emerald-400 bg-emerald-500/10",
    warn: "text-amber-400 bg-amber-500/10",
    danger: "text-rose-400 bg-rose-500/10",
  };
  return (
    <div className="card p-4">
      <span className={cn("grid h-10 w-10 place-items-center rounded-sm", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-graphite-400">{label}</p>
    </div>
  );
}
