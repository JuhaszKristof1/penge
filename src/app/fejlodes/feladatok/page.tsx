import type { Metadata } from "next";
import { ChallengesContent } from "@/components/progression/ChallengesContent";

export const metadata: Metadata = {
  title: "Feladatok",
  description:
    "GRIDLINE feladatok és kihívások: teljesíts badge-eket a magyar versenypályákon, és gyűjts pontokat a következő licenc-szinthez.",
};

export default function ChallengesPage() {
  return <ChallengesContent />;
}
