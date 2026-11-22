import type { Metadata } from "next";

// A letöltő oldal szándékosan önálló: nincs főmenü és nincs lábléc, mert az
// oldalnak egyetlen feladata van – a projekt ZIP-jének kiszolgálása.
export const metadata: Metadata = {
  title: "Letöltés",
  robots: { index: false, follow: false },
};

export default function LetoltesLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-4 py-12">{children}</div>;
}
