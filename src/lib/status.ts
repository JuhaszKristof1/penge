import type { CompatibilityStatus } from "./types";

// ---------------------------------------------------------------------------
// Kompatibilitási státusz megjelenítési metaadatai.
// A státusz kizárólag az adatbázis `fitments` táblájából származik.
// ---------------------------------------------------------------------------

export const STATUS_META: Record<
  CompatibilityStatus,
  { label: string; short: string; color: string; bg: string; border: string; dot: string }
> = {
  compatible: {
    label: "Kompatibilis",
    short: "Illeszkedik",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  incompatible: {
    label: "Nem kompatibilis",
    short: "Nem illeszkedik",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  uncertain: {
    label: "Nem biztos",
    short: "Bizonytalan",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
};
