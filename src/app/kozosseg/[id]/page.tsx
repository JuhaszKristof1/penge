import type { Metadata } from "next";
import { DriverProfile } from "@/components/motorsport/DriverProfile";

export const metadata: Metadata = {
  title: "Versenyzői profil",
  description: "Versenyzői profil: bemutatkozás, saját autók, elfogadott köridők, ranglistás helyezések és statisztikák.",
};

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriverProfile id={id} />;
}
