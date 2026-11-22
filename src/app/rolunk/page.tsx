import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Database, Layers, ShieldCheck, Sparkles, Users } from "lucide-react";
import { DbNotice, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "A projektről",
  description: "A GRIDLINE célja: átlátható, modern autóalkatrész-kompatibilitási platform valós adatbázissal.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="A projektről"
        title="A GRIDLINE bemutatása"
        sub="Modern, prémium motorsport-platform, amely a magyar versenypályákat, a hiteles köridőket és az autós közösséget egy helyre gyűjti."
      />

      <div className="container-page py-10 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-white">Miért készült ez a projekt?</h2>
          <p className="mt-4 text-sm leading-relaxed text-graphite-300">
            Az alkatrészvásárlás gyakran bizonytalansággal jár: vajon a kiválasztott fékbetét vagy szűrő tényleg illik a
            járműhöz? A GRIDLINE ezt a folyamatot rendszerezi. A felhasználó kiválasztja az autót és megadja az
            alkatrészt, a rendszer pedig érthető eredményt ad – indoklással, figyelmeztetésekkel és bizonyossági szinttel.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-graphite-300">
            Az adatok egy valós PostgreSQL (Supabase) adatbázisban tárolódnak: a jármű-katalógus, az alkatrészek, az OE
            számok és a kompatibilitási rekordok mind onnan származnak. A bejelentkezés valós Supabase Auth-tal működik,
            a mentett autók, kedvencek és ellenőrzések pedig a felhasználói fiókhoz kötődnek.
          </p>

          <div className="mt-6">
            <DbNotice />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Layers, title: "Modern architektúra", text: "Next.js + TypeScript + Tailwind, komponensalapú felépítés." },
              { icon: Database, title: "Valós adatbázis", text: "Supabase (PostgreSQL): járművek, alkatrészek, fitmentek, felhasználói adatok." },
              { icon: ShieldCheck, title: "Átláthatóság", text: "Minden kompatibilitási eredmény az adatbázis fitments rekordjain alapul." },
              { icon: Users, title: "Felhasználó-központú", text: "Garázs, mentett ellenőrzések és kedvencek a saját fiókban." },
            ].map((f) => (
              <div key={f.title} className="rounded-sm border border-ink-700 bg-ink-900/40 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-sm bg-ink-800 text-brand-400">
                  <f.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-graphite-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
              <Building2 className="h-4 w-4 text-brand-400" />
              Projekt tények
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Fact label="Név" value="GRIDLINE" />
              <Fact label="Verzió" value="2.0 – adatbázis" />
              <Fact label="Stack" value="Next.js · TypeScript · Tailwind" />
              <Fact label="Adattárolás" value="Supabase (PostgreSQL)" />
              <Fact label="Hitelesítés" value="Supabase Auth" />
              <Fact label="AI integráció" value="Tervezett" />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-brand-400" />
              Következő lépések
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-graphite-400">
              A hosszú távú cél egy valós adatbázisra és AI szolgáltatásokra épülő platform, kép alapú alkatrész
              felismeréssel, VIN alapú azonosítással és 3D konfigurátorral.
            </p>
            <Link href="/utitervek" className="btn-ghost mt-4 w-full">
              Teljes útiterv
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-800 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-graphite-500">{label}</dt>
      <dd className="text-right font-medium text-graphite-100">{value}</dd>
    </div>
  );
}
