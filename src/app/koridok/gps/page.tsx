import type { Metadata } from "next";
import { GpsMeasure } from "@/components/motorsport/GpsMeasure";

export const metadata: Metadata = {
  title: "GPS köridőmérés",
  description:
    "GPS-alapú köridőmérés zárt versenypályán. A rendszer a start-/célvonal áthaladását figyeli, rögzíti a köröket, és a bizonytalan köröket megjelöli. A GPS-eredmény ellenőrzés után kerülhet a ranglistára.",
};

export default function GpsPage() {
  return <GpsMeasure />;
}
