import type { Metadata } from "next";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export const metadata: Metadata = {
  title: "Jelszó visszaállítás",
  description: "Állítsd vissza a GRIDLINE fiókod jelszavát.",
};

export default function PasswordResetPage() {
  return <PasswordResetForm />;
}
