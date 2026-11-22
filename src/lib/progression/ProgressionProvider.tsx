// ---------------------------------------------------------------------------
// Fejlődési rendszer provider (licencek, feladatok, pontok).
//
// Az adatok a szerveroldali /api/progression route-ból jönnek, amely a
// Supabase `get_progression` / `claim_challenge` függvényeit hívja. A pontokat
// mindig a szerver ítéli oda; a kliens csak kérvényezni tud. Bejelentkezés
// nélkül a feladatlista látszik, haladás nélkül.
// ---------------------------------------------------------------------------

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";
import type { ChallengeProgress, ProgressionSummary } from "@/lib/types";
import { useApp } from "@/context/AppContext";

export interface PointsEntry {
  id: number;
  delta: number;
  reason: string;
  source: string;
  sourceRef: string | null;
  createdAt: string;
}

interface ProgressionValue {
  challenges: ChallengeProgress[];
  summary: ProgressionSummary | null;
  points: PointsEntry[];
  loading: boolean;
  error: string | null;
  /** Igényli egy feladat jutalmát (a feltételt a szerver ellenőrzi). */
  claim: (code: string) => Promise<{ ok: boolean; message: string; pointsAwarded?: number }>;
  refresh: () => void;
}

const ProgressionContext = createContext<ProgressionValue | null>(null);

interface ProgressionResponse {
  data: {
    challenges: ChallengeProgress[];
    summary: ProgressionSummary;
    points?: PointsEntry[];
  } | null;
  error?: string;
}

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, ready } = useApp();
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [summary, setSummary] = useState<ProgressionSummary | null>(null);
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // A munkamenet feloldásáig várunk, hogy ne kérdezzünk le feleslegesen.
    if (!ready) return;
    let active = true;

    setLoading(true);
    apiFetch<ProgressionResponse>("/api/progression")
      .then((res) => {
        if (!active) return;
        setChallenges(res.data?.challenges ?? []);
        setSummary(res.data?.summary ?? null);
        setPoints(res.data?.points ?? []);
        setError(res.data ? null : "A fejlődési adatok nem érhetők el.");
      })
      .catch((err) => {
        if (!active) return;
        setChallenges([]);
        setSummary(null);
        setPoints([]);
        setError(apiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ready, currentUser?.id, reloadKey]);

  const claim = useCallback(
    async (code: string) => {
      try {
        const res = await apiFetch<{
          data: {
            pointsAwarded: number;
            progression: { challenges: ChallengeProgress[]; summary: ProgressionSummary } | null;
          };
        }>("/api/progression", {
          method: "POST",
          body: JSON.stringify({ code }),
        });

        if (res.data?.progression) {
          setChallenges(res.data.progression.challenges);
          setSummary(res.data.progression.summary);
        }
        refresh();

        return {
          ok: true,
          message: `Feladat teljesítve! +${res.data?.pointsAwarded ?? 0} pont`,
          pointsAwarded: res.data?.pointsAwarded,
        };
      } catch (err) {
        return { ok: false, message: apiErrorMessage(err) };
      }
    },
    [refresh],
  );

  const value = useMemo<ProgressionValue>(
    () => ({ challenges, summary, points, loading, error, claim, refresh }),
    [challenges, summary, points, loading, error, claim, refresh],
  );

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
}

export function useProgression(): ProgressionValue {
  const ctx = useContext(ProgressionContext);
  if (!ctx) throw new Error("useProgression must be used within ProgressionProvider");
  return ctx;
}
