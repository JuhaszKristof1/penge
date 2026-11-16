import type { Metadata } from "next";
import { AdminUsers } from "./AdminUsers";

export const metadata: Metadata = {
  title: "Felhasználók",
  description: "Regisztrált felhasználók listája és szerepkörei az admin felületen.",
};

export default function AdminUsersPage() {
  return <AdminUsers />;
}
