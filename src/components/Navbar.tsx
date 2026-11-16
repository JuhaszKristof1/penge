"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Car,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Főoldal" },
  { href: "/kompatibilitas", label: "Kompatibilitás" },
  { href: "/alkatreszek", label: "Alkatrészek" },
  { href: "/garazs", label: "Garázs" },
  { href: "/utitervek", label: "Útiterv" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, ready } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-ink-700/80 bg-ink-950/85 backdrop-blur-xl"
          : "border-transparent bg-ink-950/40 backdrop-blur-sm",
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("link-nav", isActive(link.href) && "link-nav-active")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/alkatreszek"
            className="grid h-9 w-9 place-items-center rounded-xl border border-ink-600 text-graphite-300 transition-colors hover:border-brand-500/50 hover:text-white"
            aria-label="Alkatrészkereső"
          >
            <Search className="h-4 w-4" />
          </Link>

          {ready && currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-850/70 py-1.5 pl-1.5 pr-3 transition-colors hover:border-brand-500/40"
                aria-haspopup="menu"
                aria-expanded={userMenu}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate text-sm font-medium text-graphite-200">
                  {currentUser.name.split(" ")[0]}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-graphite-400 transition-transform", userMenu && "rotate-180")} />
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} aria-hidden />
                  <div className="absolute right-0 z-20 mt-2 w-60 animate-fade-up overflow-hidden rounded-xl border border-ink-700 bg-ink-850 shadow-card">
                    <div className="border-b border-ink-700 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                      <p className="truncate text-xs text-graphite-400">{currentUser.email}</p>
                    </div>
                    <div className="p-1.5">
                      <MenuLink href="/fiok" icon={<UserIcon className="h-4 w-4" />} onClick={() => setUserMenu(false)}>
                        Fiókom
                      </MenuLink>
                      <MenuLink href="/garazs" icon={<Car className="h-4 w-4" />} onClick={() => setUserMenu(false)}>
                        Autógarázs
                      </MenuLink>
                      {currentUser.role === "admin" && (
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
                        className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Kijelentkezés
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/bejelentkezes" className="btn-ghost">
                Bejelentkezés
              </Link>
              <Link href="/regisztracio" className="btn-primary">
                Regisztráció
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink-600 text-graphite-200 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-ink-700 bg-ink-950/98 px-4 pb-6 pt-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-brand-500/10 text-brand-300"
                    : "text-graphite-300 hover:bg-ink-800 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-ink-700 pt-4">
            {ready && currentUser ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-2 pb-2">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="truncate text-xs text-graphite-400">{currentUser.email}</p>
                  </div>
                </div>
                <Link href="/fiok" className="btn-ghost w-full">
                  Fiókom
                </Link>
                {currentUser.role === "admin" && (
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
                  Regisztráció
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
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
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-graphite-300 transition-colors hover:bg-ink-800 hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}
