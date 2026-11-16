import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin · AutoFit AI",
  },
  description: "AutoFit AI admin felület – alkatrészek, felhasználók és statisztikák kezelése.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
