import type { Metadata } from "next";
import {
  ArrowRight,
  Boxes,
  Camera,
  Car,
  Database,
  Gauge,
  Layers,
  Lock,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { DbNotice, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Fejlesztési útiterv",
  description:
    "Az AutoFit AI működő funkciói és tervezett bővítései: AI alkatrész felismerés képből, VIN alapú kompatibilitás, 3D konfigurátor és tuning kompatibilitás.",
};

const FUTURE = [
  {
    icon: Camera,
    title: "AI alkatrész felismerés képből",
    text: "Fotózd le az alkatrészt, és a rendszer felismeri a típust, majd javaslatot ad a kompatibilitásra.",
    status: "Tervezett",
  },
  {
    icon: Car,
    title: "VIN alapú kompatibilitás",
    text: "A jármű VIN kódjából automatikus járműazonosítás, így a kézi kiválasztás helyett azonnal pontos adatok.",
    status: "Tervezett",
  },
  {
    icon: Database,
    title: "Külső adatforrás integráció",
    text: "Éles gyártói és kereskedői adatforrások (TecDoc, gyártói feedek) integrálása a jelenlegi adatbázis mellé.",
    status: "Tervezett",
  },
  {
    icon: Boxes,
    title: "3D autó konfigurátor",
    text: "Interaktív 3D modell, ahol a kiválasztott alkatrészek és tuning elemek valós időben megjelennek.",
    status: "Tervezett",
  },
  {
    icon: Gauge,
    title: "Tuning kompatibilitás",
    text: "Teljesítménynövelő és futómű-tuning alkatrészek kompatibilitásának vizsgálata a gyári paraméterekhez képest.",
    status: "Tervezett",
  },
];

const DONE = [
  { icon: Gauge, title: "Kompatibilitás ellenőrző", text: "Teljes folyamat az adatbázis fitments táblája alapján, részletes eredménykártyával." },
  { icon: Wrench, title: "Alkatrészkereső", text: "Keresés, szűrés, rendezés és részletes alkatrészkártyák az adatbázisból." },
  { icon: Car, title: "Autógarázs", text: "Járművek mentése, szerkesztése és alapértelmezett beállítása – bejelentkezve." },
  { icon: Layers, title: "Admin felület", text: "Alkatrészek, import, felhasználók és statisztikák kezelése." },
];

export default function RoadmapPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading
        eyebrow="Fejlesztési útiterv"
        title="A jelenlegi állapot és a következő fázisok"
        sub="Az AutoFit AI egy valós adatbázisra épülő platform. Az alábbi modulok későbbi fejlesztésként jelennek meg a felületen."
      />

      <div className="mt-6">
        <DbNotice />
      </div>

      {/* Későbbi funkciók */}
      <section className="mt-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-400">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Későbbi funkciók</h2>
            <p className="text-xs text-graphite-400">Ezek a modulok egyelőre nem működnek – csak helyet kapnak a felületen.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FUTURE.map((f) => (
            <div key={f.title} className="card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-500/[0.06] blur-2xl" />
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 text-graphite-400">
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-ink-600 bg-ink-800/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-graphite-400">
                  <Lock className="h-3 w-3" />
                  {f.status}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite-400">{f.text}</p>
              <div className="mt-4 border-t border-ink-700 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite-500">
                  Nem elérhető ebben a verzióban
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Jelenlegi funkciók */}
      <section className="mt-14">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Már elérhető</h2>
            <p className="text-xs text-graphite-400">Ezek a funkciók teljes egészében működnek az adatbázisra épülő platformon.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DONE.map((d) => (
            <div key={d.title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <d.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-sm font-bold text-white">{d.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-graphite-400">{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="card mt-14 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Próbáld ki a jelenlegi funkciókat</h3>
          <p className="mt-1 text-sm text-graphite-400">
            Minden elérhető funkció használható – nézd meg a kompatibilitás ellenőrzőt vagy az alkatrészkeresőt.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/kompatibilitas" className="btn-primary">
            Ellenőrzés indítása
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/alkatreszek" className="btn-ghost">
            Alkatrészek
          </Link>
        </div>
      </div>
    </div>
  );
}
