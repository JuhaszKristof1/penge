import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin · GRIDLINE",
  },
  description: "GRIDLINE admin felület – alkatrészek, felhasználók és statisztikák kezelése.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
