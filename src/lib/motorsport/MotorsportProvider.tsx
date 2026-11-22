// ---------------------------------------------------------------------------
// Motorsport provider (kizárólag adatbázis).
//
// A versenypályák, pályaváltozatok, autókategóriák és a nyilvános ranglista
// adatai a Supabase adatbázisból (tracks, track_layouts, vehicle_categories,
// lap_times) származnak. Nincs beépített demó adat: ha az adatbázis nem
// elérhető, a felület egyértelmű hibát jelez.
// ---------------------------------------------------------------------------

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LapStatus, LapTime, Track, TrackLayout, VehicleCategory } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { probeSupabase } from "@/lib/supabase/client";
import {
  fetchLapTimes,
  fetchLayoutsForTracks,
  fetchTracks,
  fetchVehicleCategories,
  type LapQueryFilters,
} from "@/lib/supabase/queries";
import { mapLapTime, mapTrack, mapTrackLayout, mapVehicleCategory } from "@/lib/supabase/mappers";

export type MotorsportStatus = "loading" | "ready" | "unavailable";

interface MotorsportValue {
  ready: boolean;
  status: MotorsportStatus;
  message: string;
  dbAvailable: boolean;

  tracks: Track[];
  layouts: TrackLayout[];
  categories: VehicleCategory[];

  getTrack: (idOrSlug: string) => Track | undefined;
  getLayout: (id: string) => TrackLayout | undefined;
  layoutsForTrack: (trackId: string) => TrackLayout[];
  categoryName: (code: string) => string;

  /** Jóváhagyott köridők (ranglista), szűrhető dimenziók szerint. */
  approvedLaps: LapTime[];
  lapsLoading: boolean;
  /** Ranglista-lekérdezés a megadott szűrőkkel. */
  loadLaps: (filters?: LapQueryFilters) => Promise<LapTime[]>;

  refresh: () => void;
}

const MotorsportContext = createContext<MotorsportValue | null>(null);

export function MotorsportProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<MotorsportStatus>("loading");
  const [message, setMessage] = useState("Versenypályák betöltése…");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [layouts, setLayouts] = useState<TrackLayout[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [approvedLaps, setApprovedLaps] = useState<LapTime[]>([]);
  const [lapsLoading, setLapsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      if (!isSupabaseConfigured()) {
        if (cancelled) return;
        setStatus("unavailable");
        setMessage("Nincs Supabase konfiguráció (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
        setReady(true);
        return;
      }
      const probe = await probeSupabase();
      if (cancelled) return;
      if (!probe.reachable) {
        setStatus("unavailable");
        setMessage(probe.message);
        setReady(true);
        return;
      }

      const [trackRes, catRes] = await Promise.all([fetchTracks(), fetchVehicleCategories()]);
      if (cancelled) return;
      if (trackRes.error) {
        setStatus("unavailable");
        setMessage(`Hiba a versenypályák betöltésekor: ${trackRes.error}`);
        setReady(true);
        return;
      }

      const trackRows = trackRes.data ?? [];
      const mappedTracks = trackRows.map(mapTrack);
      const layoutRes = await fetchLayoutsForTracks(trackRows.map((t) => t.id));
      if (cancelled) return;

      setTracks(mappedTracks);
      setLayouts((layoutRes.data ?? []).map(mapTrackLayout));
      setCategories((catRes.data ?? []).map(mapVehicleCategory));
      setStatus("ready");
      setMessage(
        mappedTracks.length === 0
          ? "Az adatbázis elérhető, de a pályaadatbázis üres."
          : `${mappedTracks.length} versenypálya betöltve az adatbázisból.`,
      );
      setReady(true);
    }

    load().catch((err) => {
      if (cancelled) return;
      setStatus("unavailable");
      setMessage(`Hiba a pályaadatok betöltésekor: ${err instanceof Error ? err.message : String(err)}`);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadLaps = useCallback(async (filters: LapQueryFilters = {}): Promise<LapTime[]> => {
    setLapsLoading(true);
    try {
      const res = await fetchLapTimes({ status: "approved" as LapStatus, limit: 100, ...filters });
      const laps = (res.data ?? []).map(mapLapTime);
      setApprovedLaps(laps);
      return laps;
    } finally {
      setLapsLoading(false);
    }
  }, []);

  const getTrack = useCallback(
    (idOrSlug: string) => tracks.find((t) => t.id === idOrSlug || t.slug === idOrSlug),
    [tracks],
  );
  const getLayout = useCallback((id: string) => layouts.find((l) => l.id === id), [layouts]);
  const layoutsForTrack = useCallback((trackId: string) => layouts.filter((l) => l.trackId === trackId), [layouts]);
  const categoryName = useCallback(
    (code: string) => categories.find((c) => c.code === code)?.name ?? code,
    [categories],
  );

  const value = useMemo<MotorsportValue>(
    () => ({
      ready,
      status,
      message,
      dbAvailable: status === "ready",
      tracks,
      layouts,
      categories,
      getTrack,
      getLayout,
      layoutsForTrack,
      categoryName,
      approvedLaps,
      lapsLoading,
      loadLaps,
      refresh,
    }),
    [
      ready,
      status,
      message,
      tracks,
      layouts,
      categories,
      getTrack,
      getLayout,
      layoutsForTrack,
      categoryName,
      approvedLaps,
      lapsLoading,
      loadLaps,
      refresh,
    ],
  );

  return <MotorsportContext.Provider value={value}>{children}</MotorsportContext.Provider>;
}

export function useMotorsport(): MotorsportValue {
  const ctx = useContext(MotorsportContext);
  if (!ctx) throw new Error("useMotorsport must be used within MotorsportProvider");
  return ctx;
}
