import type { Metadata } from "next";
import { AdminLapResults } from "./AdminLapResults";

export const metadata: Metadata = {
  title: "Eredmények ellenőrzése",
  description: "Beküldött köridők ellenőrzése, elfogadása és elutasítása az admin felületen.",
};

export default function AdminResultsPage() {
  return <AdminLapResults />;
}
