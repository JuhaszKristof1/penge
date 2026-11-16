import type { Metadata } from "next";
import { Suspense } from "react";
import { CompatibilityChecker } from "./CompatibilityChecker";

export const metadata: Metadata = {
  title: "Kompatibilitás ellenőrző",
  description:
    "Teljes autóalkatrész kompatibilitás ellenőrző: válaszd ki a járművet, add meg az alkatrészt, és kapj részletes, adatbázis-alapú eredményt.",
};

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-graphite-400">Betöltés…</div>}>
      <CompatibilityChecker />
    </Suspense>
  );
}
