import type { Metadata } from "next";
import { PartDetailPageClient } from "./PartDetailPageClient";

export const metadata: Metadata = {
  title: "Alkatrész adatlap",
  description:
    "Alkatrész részletes adatlapja: termékkép, azonosítók, műszaki adatok, kompatibilis autók, kompatibilitási státusz és vásárlási lehetőségek.",
};

export default function PartDetailPage() {
  return <PartDetailPageClient />;
}
