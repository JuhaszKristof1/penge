import type { Metadata } from "next";
import { LicenceSystemContent } from "@/components/progression/LicenceSystemContent";

export const metadata: Metadata = {
  title: "Licencrendszer",
  description:
    "A GRIDLINE ranglétrája: Rookie, D, C, B és A licenc. Pontküszöbök, a szintek leírása és a fejlődés menete.",
};

export default function LicenceSystemPage() {
  return <LicenceSystemContent />;
}
