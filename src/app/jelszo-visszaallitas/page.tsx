import type { Metadata } from "next";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export const metadata: Metadata = {
  title: "Jelszó visszaállítás",
  description: "Állítsd vissza az AutoFit AI fiókod jelszavát.",
};

export default function PasswordResetPage() {
  return <PasswordResetForm />;
}
