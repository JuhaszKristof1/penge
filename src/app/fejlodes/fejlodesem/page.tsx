import type { Metadata } from "next";
import { MyProgressionContent } from "@/components/progression/MyProgressionContent";

export const metadata: Metadata = {
  title: "Fejlődésem",
  description: "A saját licenced, pontjaid és teljesített feladataid a GRIDLINE-on.",
};

export default function MyProgressionPage() {
  return <MyProgressionContent />;
}
