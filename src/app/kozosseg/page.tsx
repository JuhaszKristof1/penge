import type { Metadata } from "next";
import { Community } from "@/components/motorsport/Community";

export const metadata: Metadata = {
  title: "Közösség",
  description:
    "Versenyzői profilok, a ranglisták élen álló pilótái és friss közösségi bejegyzések a GRIDLINE magyar motorsport platformon.",
};

export default function CommunityPage() {
  return <Community />;
}
