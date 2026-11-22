"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// A kezdőlap szándékosan teljes képernyős, egyetlen fókuszú nyitófelület, a
// /letoltes pedig önálló letöltő oldal – ezeken nincs lábléc. Minden más
// oldalon a lábléc a megszokott módon látható.
const BARE_ROUTES = new Set(["/", "/letoltes"]);

export function FooterGate() {
  const pathname = usePathname();
  if (BARE_ROUTES.has(pathname)) return null;
  return <Footer />;
}
