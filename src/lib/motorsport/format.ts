// ---------------------------------------------------------------------------
// Motorsport megjelenítési segédfüggvények (köridő, státusz, mérési mód).
// ---------------------------------------------------------------------------

import type { LapStatus, MeasurementType, Track } from "@/lib/types";

/** Köridő (ms) → "1:23.456" vagy "23.456" formátum. */
export function formatLapTime(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "—";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsStr = seconds.toFixed(3).padStart(6, "0");
  return minutes > 0 ? `${minutes}:${secondsStr}` : seconds.toFixed(3);
}

/** Köridő szöveg (mm:ss.mmm vagy ss.mmm) → milliszekundum. `null`, ha érvénytelen. */
export function parseLapTime(value: string): number | null {
  const trimmed = (value ?? "").trim().replace(",", ".");
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  let minutes = 0;
  let secondsPart = trimmed;
  if (parts.length === 2) {
    minutes = Number(parts[0]);
    secondsPart = parts[1];
  } else if (parts.length > 2) {
    return null;
  }
  const seconds = Number(secondsPart);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0) return null;
  const ms = Math.round((minutes * 60 + seconds) * 1000);
  return ms > 0 ? ms : null;
}

export const LAP_STATUS_META: Record<
  LapStatus,
  { label: string; color: string; bg: string; border: string; dot: string; hint: string }
> = {
  pending: {
    label: "Ellenőrzés alatt",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    hint: "Az eredmény beküldve, ellenőrzésre vár. Még nem szerepel a hivatalos ranglistán.",
  },
  approved: {
    label: "Elfogadva",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    hint: "Az eredményt ellenőriztük, és szerepel a hivatalos ranglistán.",
  },
  rejected: {
    label: "Elutasítva",
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
    hint: "Az eredményt ellenőrzés után elutasítottuk, ezért nem kerül a ranglistára.",
  },
};

export const MEASUREMENT_META: Record<MeasurementType, { label: string; short: string }> = {
  manual: { label: "Kézi feltöltés", short: "Kézi" },
  gps: { label: "GPS-mérés", short: "GPS" },
};

export const TRACK_STATUS_META: Record<Track["status"], { label: string; tone: "success" | "warn" | "neutral" }> = {
  active: { label: "Aktív", tone: "success" },
  inactive: { label: "Bezárt", tone: "neutral" },
  planned: { label: "Tervezett", tone: "warn" },
};

export const DIRECTION_LABELS: Record<string, string> = {
  clockwise: "Óramutató járásával megegyező",
  counterclockwise: "Óramutató járásával ellentétes",
  both: "Mindkét irányban",
};

/** Pályahossz méterben → "4,381 km" vagy "1050 m". */
export function formatLength(lengthM: number | null | undefined): string {
  if (lengthM == null || lengthM <= 0) return "—";
  if (lengthM >= 1000) {
    return `${(lengthM / 1000).toFixed(3).replace(".", ",")} km`;
  }
  return `${lengthM} m`;
}

/** ISO dátum → "2024. 06. 02." */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
}
