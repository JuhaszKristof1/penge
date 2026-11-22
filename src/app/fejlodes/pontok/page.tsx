import type { Metadata } from "next";
import { PointsContent } from "@/components/progression/PointsContent";

export const metadata: Metadata = {
  title: "Pontok",
  description: "A GRIDLINE pontnaplód: minden jóváhagyott eredmény és teljesített feladat után járó pont.",
};

export default function PointsPage() {
  return <PointsContent />;
}
