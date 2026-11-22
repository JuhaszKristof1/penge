import type { Metadata } from "next";
import { LapSubmit } from "@/components/motorsport/LapSubmit";

export const metadata: Metadata = {
  title: "Köridő feltöltése",
  description:
    "Kézi köridő beküldése magyar versenypályákra: válaszd ki a pályát és a pályaváltozatot, add meg az autót és a mért köridőt, csatolj bizonyítékot. Az eredmény ellenőrzés után kerül a ranglistára.",
};

export default function LapSubmitPage() {
  return <LapSubmit />;
}
