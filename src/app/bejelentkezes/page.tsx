import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Bejelentkezés",
  description: "Jelentkezz be a GRIDLINE fiókodba.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
