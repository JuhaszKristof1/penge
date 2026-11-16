import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/kompatibilitas", label: "Kompatibilitás ellenőrző" },
      { href: "/alkatreszek", label: "Alkatrészkereső" },
      { href: "/garazs", label: "Autógarázs" },
      { href: "/utitervek", label: "Fejlesztési útiterv" },
    ],
  },
  {
    title: "Fiók",
    links: [
      { href: "/bejelentkezes", label: "Bejelentkezés" },
      { href: "/regisztracio", label: "Regisztráció" },
      { href: "/fiok", label: "Felhasználói fiók" },
      { href: "/admin", label: "Admin belépés" },
    ],
  },
  {
    title: "Információ",
    links: [
      { href: "/utitervek", label: "Későbbi funkciók" },
      { href: "/rolunk", label: "A projektről" },
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
              Modern autóalkatrész-kompatibilitási platform. Találd meg a járművedhez illő alkatrészt – gyorsan,
              átláthatóan, megbízhatóan.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/[0.07] px-3 py-1.5 text-xs font-semibold text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              Valós adatbázis · Supabase
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

        <div className="mt-12 divider-glow" />

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-graphite-500 sm:flex-row">
          <p>© {new Date().getFullYear()} AutoFit AI. Az adatok a Supabase adatbázisból származnak.</p>
          <p>Későbbi bővítés: AI képfelismerés · VIN alapú ellenőrzés · 3D konfigurátor</p>
        </div>
      </div>
    </footer>
  );
}
