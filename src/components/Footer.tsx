import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Motorsport",
    links: [
      { href: "/versenypalyak", label: "Versenypályák" },
      { href: "/ranglistak", label: "Ranglisták" },
      { href: "/koridok/feltoltes", label: "Köridő feltöltése" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/garazs", label: "Autógarázs" },
      { href: "/alkatreszek", label: "Alkatrészkereső" },
      { href: "/kompatibilitas", label: "Kompatibilitás ellenőrző" },
      { href: "/bejelentkezes", label: "Bejelentkezés" },
    ],
  },
  {
    title: "Információ",
    links: [
      { href: "/rolunk", label: "A projektről" },
      { href: "/utitervek", label: "Fejlesztési útiterv" },
      { href: "/kapcsolat", label: "Kapcsolat" },
      { href: "/letoltes", label: "Projekt letöltése" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-800 bg-ink-950">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-graphite-400">
              Magyar versenypályák, hitelesített köridők és versenyzői profilok egy helyen. A GRIDLINE a magyar motorsport
              közösség platformja.
            </p>
            <p className="mt-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
              Find your line. Set your time.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-sm border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-graphite-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Adatbázis-alapú · Supabase
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-graphite-400 transition-colors hover:text-brand-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 divider" />

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-graphite-500 sm:flex-row">
          <p>© {new Date().getFullYear()} GRIDLINE. Az adatok a Supabase adatbázisból származnak.</p>
          <p>Későbbi bővítés: licencek és feladatok · GPS köridőmérés · versenyesemények</p>
        </div>
      </div>
    </footer>
  );
}
