import type { Metadata } from "next";
import { Suspense } from "react";
import { PartsBrowser } from "./PartsBrowser";

export const metadata: Metadata = {
  title: "Alkatrészkereső",
  description:
    "Keress autóalkatrészek között név, OE szám vagy gyártói cikkszám alapján. Kategória szűrés, rendezés és részletes alkatrészkártyák.",
};

export default function PartsPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-graphite-400">Betöltés…</div>}>
      <PartsBrowser />
    </Suspense>
  );
}
