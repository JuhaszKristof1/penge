import type { Metadata } from "next";
import { AdminStats } from "./AdminStats";

export const metadata: Metadata = {
  title: "Statisztikák",
  description: "Keresési és kompatibilitási ellenőrzési statisztikák az admin felületen.",
};

export default function AdminStatsPage() {
  return <AdminStats />;
}
