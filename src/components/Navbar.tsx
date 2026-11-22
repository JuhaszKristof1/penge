"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Car, ChevronDown, Flag, Gauge, GraduationCap, ListChecks, LogOut, Menu, ShieldCheck,
  TrendingUp, User as UserIcon, X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useApp } from "@/context/AppContext";
import { useProgression } from "@/lib/progression/ProgressionProvider";
import { LicenceBadge } from "@/components/progression/LicenceBadge";
import { cn } from "@/lib/utils";

// A GRIDLINE főmenü: motorsport-központú sorrend, az alkatrészkereső hátrébb.
// A FEJLŐDÉS legördülő menü a licencek, feladatok és pontok világát fogja össze.
const NAV_LINKS = [
  { href: "/", label: "Kezdőlap" },
  { href: "/versenypalyak", label: "Versenypályák" },
  { href: "/ranglistak", label: "Ranglisták" },
  { href: "/garazs", label: "Garázs" },
  { href: "/alkatreszek", label: "Alkatrészkereső" },
];

const PROGRESSION_LINKS = [
  { href: "/fejlodes/licencrendszer", label: "Licencrendszer", icon: GraduationCap, hint: "Rookie-tól A-ig" },
  { href: "/fejlodes/feladatok", label: "Feladatok", icon: ListChecks, hint: "Badge-ek és kihívások" },
  { href: "/fejlodes/pontok", label: "Pontok", icon: TrendingUp, hint: "Pontnapló" },
  { href: "/fejlodes/fejlodesem", label: "Fejlődésem", icon: Flag, hint: "Saját haladásod" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, ready } = useApp();
  const { summary } = useProgression();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const devRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
    setDevOpen(false);
  }, [pathname]);

  // A legördülő menü kattintáson kívül (és Escape-re) bezárul.
  useEffect(() => {
    if (!devOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (devRef.current && !devRef.current.contains(e.target as Node)) setDevOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key ==="Escape") setDevOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [devOpen]);

  const isActive = (href: string) =>
    href ==="/" ? pathname ==="/" : pathname === href || pathname.startsWith(href +"/");

  const devActive = pathname.startsWith("/fejlodes");

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    router.push("/");
  };

  // A /letoltes önálló oldal: egyetlen dolga a letöltés, ezért nincs főmenü.
  if (pathname === "/letoltes") return null;

  return (
    <header
      className={cn("sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled ?"border-ink-700 bg-ink-950/95 backdrop-blur" :"border-transparent bg-ink-950/70 backdrop-blur",
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-6 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("link-nav", isActive(link.href) &&"link-nav-active")}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={devRef}>
            <button
              type="button"
              onClick={() => setDevOpen((v) => !v)}
              className={cn("link-nav inline-flex items-center gap-1.5", devActive &&"link-nav-active")}
              aria-haspopup="menu"
              aria-expanded={devOpen}
            >
              Fejlődés
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", devOpen &&"rotate-180")} />
            </button>

            {devOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-30 mt-3 w-64 animate-fade-up overflow-hidden surface-raised"
              >
                <div className="border-b border-ink-700 px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-graphite-500">
                    Fejlődési rendszer
                  </p>
                </div>
                <div className="p-1.5">
                  {PROGRESSION_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setDevOpen(false)}
                        className={cn("flex items-start gap-3 rounded px-3 py-2.5 transition-colors hover:bg-ink-800",
                          isActive(item.href) &&"bg-brand-500/10",
                        )}
                      >
                        <Icon
                          className={cn("mt-0.5 h-4 w-4 shrink-0",
                            isActive(item.href) ?"text-brand-400" :"text-graphite-500",
                          )}
                        />
                        <span className="min-w-0">
                          <span
                            className={cn("block text-sm font-medium",
                              isActive(item.href) ?"text-brand-300" :"text-graphite-200",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="block text-xs text-graphite-500">{item.hint}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="hidden items-center gap-3 xl:flex">
          {ready && currentUser ? (
            <div className="flex items-center gap-2">
              {summary && <LicenceBadge code={summary.licenceCode} name={summary.licenceName} />}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-850 py-1.5 pl-1.5 pr-3 transition-colors hover:border-ink-500"
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate text-sm font-medium text-graphite-200">
                    {currentUser.name.split("")[0]}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-graphite-400 transition-transform", userMenu &&"rotate-180")} />
                </button>

                {userMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} aria-hidden />
                    <div className="absolute right-0 z-20 mt-2 w-60 animate-fade-up overflow-hidden surface-raised">
                      <div className="border-b border-ink-700 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                        <p className="truncate text-xs text-graphite-400">{currentUser.email}</p>
                      </div>
                      <div className="p-1.5">
                        <MenuLink href="/kozosseg" icon={<UserIcon className="h-4 w-4" />} onClick={() => setUserMenu(false)}>
                          Versenyzői profil
                        </MenuLink>
                        <MenuLink href="/fejlodes/fejlodesem" icon={<Gauge className="h-4 w-4" />} onClick={() => setUserMenu(false)}>
                          Fejlődésem
                        </MenuLink>
                        <MenuLink href="/garazs" icon={<Car className="h-4 w-4" />} onClick={() => setUserMenu(false)}>
                          Autógarázs
                        </MenuLink>
                        {currentUser.role ==="admin" && (
                          <MenuLink
                            href="/admin"
                            icon={<ShieldCheck className="h-4 w-4" />}
                            onClick={() => setUserMenu(false)}
                          >
                            Admin felület
                          </MenuLink>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-0.5 flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Kijelentkezés
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/bejelentkezes" className="btn-ghost">
                Bejelentkezés
              </Link>
              <Link href="/regisztracio" className="btn-primary">
                Csatlakozás
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-ink-600 text-graphite-200 xl:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-ink-700 bg-ink-950 px-4 pb-6 pt-4 xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <MobileLink key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </MobileLink>
            ))}

            <div className="mt-2 border-t border-ink-800 pt-2">
              <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-graphite-500">
                Fejlődés
              </p>
              {PROGRESSION_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ?"bg-brand-500/10 text-brand-300"
                        :"text-graphite-300 hover:bg-ink-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

          </div>

          <div className="mt-4 border-t border-ink-700 pt-4">
            {ready && currentUser ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-2 pb-2">
                  <span
                    className="grid h-9 w-9 place-items-center rounded text-sm font-bold text-white"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="truncate text-xs text-graphite-400">{currentUser.email}</p>
                  </div>
                  {summary && (
                    <LicenceBadge code={summary.licenceCode} name={summary.licenceName} className="ml-auto" />
                  )}
                </div>
                <Link href="/kozosseg" className="btn-ghost w-full">
                  Versenyzői profil
                </Link>
                {currentUser.role ==="admin" && (
                  <Link href="/admin" className="btn-outline w-full">
                    Admin felület
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="btn-danger w-full">
                  <LogOut className="h-4 w-4" /> Kijelentkezés
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/bejelentkezes" className="btn-ghost w-full">
                  Bejelentkezés
                </Link>
                <Link href="/regisztracio" className="btn-primary w-full">
                  Csatlakozás
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn("rounded-md px-4 py-3 text-sm font-medium transition-colors",
        active ?"bg-brand-500/10 text-brand-300" :"text-graphite-300 hover:bg-ink-800 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-graphite-300 transition-colors hover:bg-ink-800 hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}
