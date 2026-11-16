import type { Metadata } from "next";
import { AccountDashboard } from "./AccountDashboard";

export const metadata: Metadata = {
  title: "Fiókom",
  description: "Felhasználói profil, mentett autók, korábbi kompatibilitási ellenőrzések és kedvenc alkatrészek.",
};

export default function AccountPage() {
  return <AccountDashboard />;
}
