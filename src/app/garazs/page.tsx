import type { Metadata } from "next";
import { GarageManager } from "./GarageManager";

export const metadata: Metadata = {
  title: "Autógarázs",
  description: "Add hozzá, szerkeszd és kezeld a járműveidet. Állíts be alapértelmezett autót a gyors ellenőrzésekhez.",
};

export default function GaragePage() {
  return <GarageManager />;
}
