import type { Metadata } from "next";
import { TracksList } from "@/components/motorsport/TracksList";

export const metadata: Metadata = {
  title: "Versenypályák",
  description:
    "Magyarországi versenypályák adatbázisa: Hungaroring, Pannónia-Ring, Euroring, Balaton Park Circuit, Kakucs Ring, RabócsiRing – helyszín, hossz, kanyarok és pályaváltozatok.",
};

export default function TracksPage() {
  return <TracksList />;
}
