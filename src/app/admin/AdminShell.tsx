"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { AdminLogin } from "./AdminLogin";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/admin/alkatreszek", label: "Alkatrészek", icon: Package },
  { href: "/admin/felhasznalok", label: "Felhasználók", icon: Users },
  { href: "/admin/statisztikak", label: "Statisztikák", icon: BarChart3 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, currentUser, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAdmin = currentUser?.role === "admin";

  if (!ready) {
    return <div className="container-page py-24 text-center text-graphite-400">Betöltés…</div>;
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              Admin
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-ink-600 text-graphite-200"
              aria-label="Admin menü"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          <nav
            className={cn(
              "card space-y-1 p-3",
              sidebarOpen ? "block" : "hidden lg:block",
            )}
          >
            <div className="mb-2 hidden items-center gap-2 px-2 py-1.5 lg:flex">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-graphite-400">Admin panel</span>
            </div>

            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-brand-500 text-white"
                    : "text-graphite-300 hover:bg-ink-800 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-ink-700" />

            <div className="flex items-center gap-2.5 rounded-xl bg-ink-900/60 px-3 py-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: currentUser?.avatarColor }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{currentUser?.name}</p>
                <p className="truncate text-[11px] text-graphite-500">Adminisztrátor</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Kijelentkezés
            </button>
          </nav>

          <div className="mt-4 hidden lg:block">
            <div className="rounded-xl border border-brand-500/25 bg-brand-500/[0.06] px-3 py-3 text-[11px] leading-relaxed text-brand-100/80">
              <div className="mb-1 flex items-center gap-1.5 font-bold text-brand-300">
                <Boxes className="h-3.5 w-3.5" />
                Adatbázis admin
              </div>
              Az itt végzett módosítások a Supabase adatbázisba íródnak, és a nyilvános felület azonnal tükrözi őket.
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>

      <div className="mt-10 hidden justify-center lg:flex">
        <Link href="/" className="text-xs text-graphite-500 hover:text-graphite-300">
          ← Vissza a nyilvános oldalra
        </Link>
      </div>
      <div className="mt-6 lg:hidden">
        <Logo compact />
      </div>
    </div>
  );
}
