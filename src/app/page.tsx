import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Car,
  Database,
  Gauge,
  Image as ImageIcon,
  Layers,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { QuickCheck } from "@/components/QuickCheck";
import { CategoryGrid } from "@/components/CategoryGrid";
import { DbNotice, SectionHeading } from "@/components/ui";

const FEATURES = [
  {
    icon: Gauge,
    title: "Kompatibilitás ellenőrzés",
    text: "Autó és alkatrész megadása után azonnal látszik az illeszkedés – indoklással, részletesen.",
  },
  {
    icon: Search,
    title: "Alkatrészkereső",
    text: "Keresés név, OE szám vagy gyártói cikkszám alapján, kategória- és rendezési szűrőkkel.",
  },
  {
    icon: Car,
    title: "Autógarázs",
    text: "Mentsd el a járműveidet, és az ellenőrzéseknél egy kattintással előtöltheted őket.",
  },
  {
    icon: ShieldCheck,
    title: "Mentett ellenőrzések",
    text: "A korábbi kompatibilitási eredmények és kedvenc alkatrészeid egy helyen, elérhetően.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Car,
    title: "Válaszd ki az autót",
    text: "Márka, modell, generáció, évjárat, karosszéria és motorkód – pontosan, ahogy a valóságban.",
  },
  {
    n: "02",
    icon: Wrench,
    title: "Add meg az alkatrészt",
    text: "Név, OE szám, gyártói cikkszám, kategória. Képfeltöltéssel is megjelölheted a vizsgálandó alkatrészt.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Futtasd az ellenőrzést",
    text: "A rendszer kiértékeli az adatokat, és kompatibilis / nem kompatibilis / bizonytalan eredményt ad.",
  },
  {
    n: "04",
    icon: BadgeCheck,
    title: "Nézd meg a részleteket",
    text: "Részletes eredménykártya: jármű, alkatrész, státusz, indoklás és figyelmeztetések egy helyen.",
  },
];

const ROADMAP_PREVIEW = [
  { icon: ScanLine, title: "AI alkatrész felismerés képből" },
  { icon: Car, title: "VIN alapú kompatibilitás" },
  { icon: Database, title: "Külső adatforrás integráció" },
  { icon: Boxes, title: "3D autó konfigurátor" },
  { icon: Gauge, title: "Tuning kompatibilitás" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO -------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850/70 px-3.5 py-1.5 text-xs font-semibold text-graphite-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Valós adatbázis · Supabase
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              Találd meg a járművedhez
              <span className="relative mx-2 inline-block">
                <span className="relative z-10 text-brand-500">pontosan illő</span>
              </span>
              alkatrészt.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-graphite-300 sm:text-lg">
              Az AutoFit AI összeköti az autóadatokat az alkatrészadatokkal. Válaszd ki az autót, add meg az
              alkatrészt, és kapj azonnal érthető kompatibilitási eredményt – indoklással együtt.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/kompatibilitas" className="btn-primary px-6 py-3 text-base">
                <Gauge className="h-4.5 w-4.5" />
                Kompatibilitás ellenőrzés
              </Link>
              <Link href="/alkatreszek" className="btn-ghost px-6 py-3 text-base">
                <Search className="h-4 w-4" />
                Alkatrészek böngészése
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                { k: "PostgreSQL", v: "valós adatbázis" },
                { k: "OE szám", v: "alapú egyeztetés" },
                { k: "Supabase", v: "hitelesítés" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-lg font-extrabold text-white sm:text-xl">{s.k}</dt>
                  <dd className="mt-1 text-xs text-graphite-400 sm:text-sm">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            <QuickCheck />
            <div className="mt-4">
              <DbNotice compact />
            </div>
          </div>
        </div>

        <div className="container-page">
          <div className="divider-glow" />
        </div>
      </section>

      {/* FEATURES ---------------------------------------------------------- */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Mit tud a rendszer"
          title="Egy platform, ami átláthatóvá teszi a kompatibilitást"
          sub="Az AutoFit AI négy fő pillérre épül: gyors ellenőrzés, kereshető katalógus, személyes garázs és mentett eredmények."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover group p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES -------------------------------------------------------- */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Népszerű kategóriák"
            title="Böngéssz alkatrészkategóriák szerint"
            sub="Válassz kategóriát, és a keresőben már csak az ide tartozó alkatrészeket látod."
          />
          <Link href="/alkatreszek" className="btn-ghost shrink-0">
            Összes alkatrész
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10">
          <CategoryGrid />
        </div>
      </section>

      {/* HOW IT WORKS ------------------------------------------------------ */}
      <section className="relative border-y border-ink-800 bg-ink-900/40 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Hogyan működik"
            title="Négy lépés a biztos döntésig"
            sub="A folyamat a jármű kiválasztásától a részletes eredményig vezet – végig átláthatóan."
            className="mx-auto"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-full top-8 hidden h-px w-6 bg-gradient-to-r from-brand-500/50 to-transparent lg:block" />
                )}
                <div className="card h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 text-brand-400">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-3xl font-extrabold text-ink-600">{s.n}</span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-graphite-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP PREVIEW --------------------------------------------------- */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHeading
            eyebrow="Későbbi funkciók"
            title="Amit a következő fázisokban tervezünk"
            sub="Ezek a funkciók egyelőre helyet kapnak a felületen, de még nem működnek. A cél a fokozatos, valós integráció."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {ROADMAP_PREVIEW.map((r) => (
              <div
                key={r.title}
                className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-850/60 px-4 py-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-800 text-graphite-400">
                  <r.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-graphite-200">{r.title}</span>
                <span className="ml-auto rounded-full border border-ink-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-graphite-500">
                  soon
                </span>
              </div>
            ))}
            <Link
              href="/utitervek"
              className="flex items-center justify-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/[0.07] px-4 py-3.5 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-500/15"
            >
              Teljes útiterv
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA --------------------------------------------------------------- */}
      <section className="container-page pb-20">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-70" />
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-400">
              <Layers className="h-6 w-6" />
            </span>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              Készítsd el a fiókod, és kezdd el a saját járműveiddel
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-graphite-300 sm:text-base">
              Regisztrálj, mentsd el az autóidat a garázsba, és kövesd nyomon a kompatibilitási
              ellenőrzéseidet.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/regisztracio" className="btn-primary px-6 py-3">
                Regisztráció
              </Link>
              <Link href="/bejelentkezes" className="btn-ghost px-6 py-3">
                Bejelentkezés
              </Link>
              <Link href="/admin" className="btn-outline px-6 py-3">
                <ShieldCheck className="h-4 w-4" />
                Admin belépés
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
