import type { Metadata } from "next";
import { AdminTracks } from "./AdminTracks";

export const metadata: Metadata = {
  title: "Versenypályák kezelése",
  description: "Versenypályák felvétele, szerkesztése és törlése az admin felületen.",
};

export default function AdminTracksPage() {
  return <AdminTracks />;
}
