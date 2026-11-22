"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LicenceLevel } from "@/lib/types";

// ---------------------------------------------------------------------------
// Licenc-jelvény (rangjelvény).
//
// A rangot mindig a szerveroldali pontszám határozza meg (user_licences), ezért
// ez a komponens csak megjelenít – kézzel nem állítható. A `size` a fejléc
// kompakt jelvényét és az oldalak nagyobb változatát fedi le.
// ---------------------------------------------------------------------------

/** A ranglétra sorrendje (Rookie → A), a licencek megjelenítéséhez. */
export const LICENCE_ORDER = ["rookie", "d", "c", "b", "a"] as const;

export function sortLicences(levels: LicenceLevel[]): LicenceLevel[] {
  return [...levels].sort((a, b) => {
    const ai = LICENCE_ORDER.indexOf(a.code as (typeof LICENCE_ORDER)[number]);
    const bi = LICENCE_ORDER.indexOf(b.code as (typeof LICENCE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

/** Rangonkénti vizuális azonosító: pajzs-alak, akcentszín, csíkok száma. */
export const RANK_STYLE: Record<
  string,
  { accent: string; ring: string; glow: string; chevrons: number; label: string }
> = {
  rookie: { accent: "#9aa3ad", ring: "rgba(154,163,173,0.45)", glow: "rgba(154,163,173,0.16)", chevrons: 1, label: "Rookie" },
  d: { accent: "#c98b4b", ring: "rgba(201,139,75,0.55)", glow: "rgba(201,139,75,0.20)", chevrons: 2, label: "D" },
  c: { accent: "#b9c6d4", ring: "rgba(185,198,212,0.55)", glow: "rgba(185,198,212,0.18)", chevrons: 3, label: "C" },
  b: { accent: "#e0b64a", ring: "rgba(224,182,74,0.6)", glow: "rgba(224,182,74,0.22)", chevrons: 4, label: "B" },
  a: { accent: "#ff6a00", ring: "rgba(255,106,0,0.7)", glow: "rgba(255,106,0,0.28)", chevrons: 5, label: "A" },
};

const DEFAULT_STYLE = RANK_STYLE.rookie;

export function rankStyle(code: string) {
  return RANK_STYLE[code?.toLowerCase()] ?? DEFAULT_STYLE;
}

/** Kompakt rangjelvény a fejléchez és listákhoz (pajzs-ikon + kód). */
export function LicenceBadge({
  code,
  name,
  className,
  size = "sm",
  href = "/fejlodes/fejlodesem",
}: {
  code: string;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const style = rankStyle(code);
  const sizes = {
    sm: "h-7 gap-1.5 px-2 text-[11px]",
    md: "h-10 gap-2 px-3 text-sm",
    lg: "h-14 gap-2.5 px-4 text-xl",
  };
  const mark = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" };

  const content = (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border font-display font-bold uppercase tracking-[0.16em]",
        sizes[size],
        className,
      )}
      style={{
        borderColor: style.ring,
        color: style.accent,
        background: `linear-gradient(180deg, ${style.glow}, transparent)`,
      }}
      title={`Licenc: ${name}`}
    >
      <RankGlyph code={code} className={mark[size]} />
      {code.toUpperCase()}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={`Licenc: ${name} – fejlődésem`} className="shrink-0">
      {content}
    </Link>
  );
}

/** A rang saját pajzs-glifája: a csíkok száma a szintet jelképezi. */
export function RankGlyph({ code, className }: { code: string; className?: string }) {
  const style = rankStyle(code);
  const bars = Array.from({ length: style.chevrons });
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.4 20.4 6v7.1c0 4.3-3.4 7.3-8.4 8.5-5-1.2-8.4-4.2-8.4-8.5V6L12 2.4Z"
        fill="none"
        stroke={style.accent}
        strokeWidth="1.6"
        opacity="0.85"
      />
      {bars.map((_, i) => (
        <path
          key={i}
          d={`M8.4 ${16.2 - i * 2} l3.6 2 l3.6 -2`}
          fill="none"
          stroke={style.accent}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.45 + i * 0.12}
        />
      ))}
    </svg>
  );
}
