import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { SectionHeading } from "@/components/ui";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Kapcsolat",
  description: "Vedd fel a kapcsolatot az AutoFit AI csapatával – kapcsolatfelvételi űrlap.",
};

const INFO = [
  { icon: Mail, label: "E-mail", value: "hello@autofit.ai" },
  { icon: Phone, label: "Telefon", value: "+36 1 234 5678" },
  { icon: MapPin, label: "Cím", value: "1051 Budapest, Alkotmány utca 1." },
  { icon: Clock, label: "Nyitvatartás", value: "H–P: 9:00 – 17:00" },
];

export default function ContactPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading
        eyebrow="Kapcsolat"
        title="Írj nekünk"
        sub="Kérdésed van a projekttel kapcsolatban? Töltsd ki az űrlapot, és hamarosan válaszolunk."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <ContactForm />

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-sm font-bold text-white">Elérhetőségek</h3>
            <ul className="mt-4 space-y-4">
              {INFO.map((i) => (
                <li key={i.label} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-800 text-brand-400">
                    <i.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-graphite-500">{i.label}</p>
                    <p className="text-sm text-graphite-100">{i.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-sm font-bold text-white">Gyakori kérdések</h3>
            <div className="mt-3 space-y-3">
              {[
                { q: "Valódi adatbázist használ?", a: "Igen. A jármű- és alkatrészadatok, valamint a fiókhoz kötött mentések egy Supabase (PostgreSQL) adatbázisban tárolódnak." },
                { q: "Lesz AI funkció?", a: "Igen, tervezett – lásd a fejlesztési útitervet." },
                { q: "Ingyenes a használat?", a: "A platform jelenlegi verziója teljes egészében elérhető és ingyenes." },
              ].map((f) => (
                <details key={f.q} className="group rounded-xl border border-ink-700 bg-ink-900/40 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-graphite-200 marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-graphite-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
