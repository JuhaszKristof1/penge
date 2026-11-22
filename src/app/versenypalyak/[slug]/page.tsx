import type { Metadata } from "next";
import { TrackDetail } from "@/components/motorsport/TrackDetail";

export const metadata: Metadata = {
  title: "Versenypálya",
  description: "Versenypálya adatlap: helyszín, pályarajz, pályaváltozatok és köridő-ranglista.",
};

export default async function TrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TrackDetail slug={slug} />;
}
