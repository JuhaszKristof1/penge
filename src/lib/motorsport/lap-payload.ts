// ---------------------------------------------------------------------------
// Köridő-beküldés közös feldolgozása (validálás + normalizálás).
//
// A kliens által küldött adatot szerveroldalon ellenőrizzük, mielőtt az
// adatbázisba kerülne. A köridőt a felület "1:23.456" / "83.456" formátumban
// küldheti, itt alakítjuk milliszekundummá.
// ---------------------------------------------------------------------------

import type { EvidenceType, MeasurementType } from "@/lib/types";

export const LAP_EMBED_COLUMNS =
  "id, user_id, track_id, layout_id, vehicle_id, vehicle_label, vehicle_category, lap_time_ms, measured_at, measurement_type, status, evidence_url, evidence_type, note, gps_session_id, reviewed_by, reviewed_at, review_note, created_at, tracks(name, slug), track_layouts(name), profiles!lap_times_user_id_fkey(full_name, avatar_color)";

export interface LapPayload {
  trackId?: string;
  layoutId?: string | null;
  vehicleId?: string | null;
  vehicleLabel?: string | null;
  vehicleCategory?: string;
  lapTimeMs?: number;
  lapTime?: string;
  measuredAt?: string;
  measurementType?: MeasurementType;
  evidenceUrl?: string | null;
  evidenceType?: EvidenceType;
  note?: string | null;
  gpsSessionId?: string | null;
}

export interface NormalizedLap {
  track_id: string;
  layout_id: string | null;
  vehicle_id: string | null;
  vehicle_label: string | null;
  vehicle_category: string;
  lap_time_ms: number;
  measured_at: string;
  measurement_type: MeasurementType;
  evidence_url: string | null;
  evidence_type: EvidenceType;
  note: string | null;
  gps_session_id: string | null;
}

/** "1:23.456" vagy "83.456" szöveg → milliszekundum. */
export function parseLapTimeMs(value: string): number | null {
  const trimmed = (value ?? "").trim().replace(",", ".");
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length > 2) return null;
  let minutes = 0;
  let secondsPart = trimmed;
  if (parts.length === 2) {
    minutes = Number(parts[0]);
    secondsPart = parts[1];
  }
  const seconds = Number(secondsPart);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0) return null;
  const ms = Math.round((minutes * 60 + seconds) * 1000);
  return ms > 0 ? ms : null;
}

export type NormalizeResult =
  | { ok: true; value: NormalizedLap }
  | { ok: false; error: string };

/** A beküldött köridő-adat validálása és normalizálása. */
export function normalizeLapPayload(payload: LapPayload): NormalizeResult {
  const trackId = (payload.trackId ?? "").trim();
  if (!trackId) return { ok: false, error: "Válaszd ki a versenypályát." };

  const lapTimeMs =
    typeof payload.lapTimeMs === "number" && payload.lapTimeMs > 0
      ? Math.round(payload.lapTimeMs)
      : parseLapTimeMs(payload.lapTime ?? "");
  if (!lapTimeMs) return { ok: false, error: "Add meg érvényes köridőt (pl. 1:23.456 vagy 83.456)." };
  if (lapTimeMs > 60 * 60 * 1000) return { ok: false, error: "A köridő nem lehet egy óránál hosszabb." };

  const measuredAt = (payload.measuredAt ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredAt)) return { ok: false, error: "Add meg a mérés dátumát." };

  const vehicleLabel = (payload.vehicleLabel ?? "").trim();
  if (!payload.vehicleId && !vehicleLabel) {
    return { ok: false, error: "Válassz autót a garázsból, vagy add meg az autó megnevezését." };
  }

  const measurementType: MeasurementType = payload.measurementType === "gps" ? "gps" : "manual";
  const evidenceUrl = (payload.evidenceUrl ?? "").trim() || null;
  const evidenceType: EvidenceType =
    payload.evidenceType === "image" || payload.evidenceType === "video"
      ? payload.evidenceType
      : evidenceUrl
        ? "image"
        : "none";

  const vehicleCategory = (payload.vehicleCategory ?? "egyeb").trim() || "egyeb";

  return {
    ok: true,
    value: {
      track_id: trackId,
      layout_id: (payload.layoutId ?? "")?.trim() || null,
      vehicle_id: (payload.vehicleId ?? "")?.trim() || null,
      vehicle_label: vehicleLabel || null,
      vehicle_category: vehicleCategory,
      lap_time_ms: lapTimeMs,
      measured_at: measuredAt,
      measurement_type: measurementType,
      evidence_url: evidenceUrl,
      evidence_type: evidenceType,
      note: (payload.note ?? "").trim() || null,
      gps_session_id: (payload.gpsSessionId ?? "")?.trim() || null,
    },
  };
}
