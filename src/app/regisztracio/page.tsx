import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Regisztráció",
  description: "Készíts fiókot a GRIDLINE platformon – mentsd autóidat és kompatibilitási ellenőrzéseidet.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
