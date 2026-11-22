import type { Metadata } from "next";
import { PointsLeaderboard } from "@/components/motorsport/PointsLeaderboard";

export const metadata: Metadata = {
  title: "Ranglisták",
  description:
    "A GRIDLINE pontversenye: ki hány pontot gyűjtött a feladatok teljesítésével. A köridős ranglisták pályánként, a pálya adatlapján érhetők el.",
};

export default function LeaderboardsPage() {
  return <PointsLeaderboard />;
}
