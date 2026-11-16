import type { Metadata } from "next";
import { AdminParts } from "./AdminParts";

export const metadata: Metadata = {
  title: "Alkatrészek kezelése",
  description: "Alkatrészek hozzáadása, szerkesztése és törlése az admin felületen.",
};

export default function AdminPartsPage() {
  return <AdminParts />;
}
