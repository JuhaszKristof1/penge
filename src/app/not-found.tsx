import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-sm bg-brand-500/10 text-brand-400">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-6 font-display text-5xl font-extrabold text-white">404</p>
      <h1 className="mt-2 font-display text-xl font-bold text-white">Az oldal nem található</h1>
      <p className="mt-2 max-w-md text-sm text-graphite-400">
        A keresett oldal nem létezik vagy elköltözött. Térj vissza a főoldalra, vagy keress alkatrészt.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" />
          Főoldal
        </Link>
        <Link href="/alkatreszek" className="btn-ghost">
          <Search className="h-4 w-4" />
          Alkatrészkereső
        </Link>
      </div>
    </div>
  );
}
