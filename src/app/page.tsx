import type { Metadata } from "next";
import { HomeContent } from "@/components/motorsport/HomeContent";

export const metadata: Metadata = {
  title: "Kezdőlap",
  description:
    "Magyar versenypályák, hitelesített köridő-ranglisták, GPS-alapú köridőmérés és versenyzői profilok. A GRIDLINE a magyar motorsport közösség platformja.",
};

export default function HomePage() {
  return <HomeContent />;
}
