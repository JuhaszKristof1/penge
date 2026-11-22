"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CircleStop,
  Info,
  Loader2,
  MapPin,
  Play,
  Radio,
  Satellite,
  Upload,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { formatLapTime } from "@/lib/motorsport/format";
import { PageHeader } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// GPS-alapú köridőmérés (első szakasz).
//
// FONTOS: ez a mérés KIZÁRÓLAG zárt versenypályán használható, közúti időmérésre
// nem alkalmas és nem engedélyezett. A helyadatokat kizárólag a felhasználó
// által elindított mérés ideje alatt gyűjtjük.
//
// A telefonos GPS NEM professzionális transzponder: a mért értékek
// pontossága a jel minőségétől függ. A start-/célvonal felismerése heurisztikus,
// ezért a bizonytalan köröket megjelöljük, és a beküldött eredmény mindig
// ellenőrzésre (pending) kerül – soha nem lesz automatikusan hiteles.
// ---------------------------------------------------------------------------

interface Sample {
  t: number;
  lat: number;
  lng: number;
  speed: number | null;
  acc: number | null;
}

interface DetectedLap {
  lapNumber: number;
  lapTimeMs: number;
  confidence: number;
  flagged: boolean;
  flagReason?: string | null;
}

/** Két GPS-pont távolsága méterben (Haversine). */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type GpsState = "idle" | "requesting" | "recording" | "finished";

export function GpsMeasure() {
  const { currentUser, ready } = useApp();
  const { tracks, layouts, status, message } = useMotorsport();

  const [trackId, setTrackId] = useState("");
  const [layoutId, setLayoutId] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [state, setState] = useState<GpsState>("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [laps, setLaps] = useState<DetectedLap[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const watchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPointRef = useRef<Sample | null>(null);
  const lastLapTimeRef = useRef<number>(0);
  const lapCounterRef = useRef(0);
  const samplesRef = useRef<Sample[]>([]);

  const trackLayouts = useMemo(() => layouts.filter((l) => l.trackId === trackId), [layouts, trackId]);
  const selectedTrack = tracks.find((t) => t.id === trackId);

  useEffect(() => {
    setLayoutId(trackLayouts[0]?.id ?? "");
  }, [trackLayouts]);

  const stopWatch = useCallback(() => {
    if (watchRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => stopWatch, [stopWatch]);

  // Időzítő a mérés közben.
  useEffect(() => {
    if (state !== "recording") return;
    const id = window.setInterval(() => setElapsed(Date.now() - startTimeRef.current), 100);
    return () => window.clearInterval(id);
  }, [state]);

  const accuracyStats = useMemo(() => {
    const accs = samples.map((s) => s.acc).filter((a): a is number => a != null && a > 0);
    if (accs.length === 0) return { min: null, max: null, avg: null };
    return {
      min: Math.min(...accs),
      max: Math.max(...accs),
      avg: accs.reduce((s, a) => s + a, 0) / accs.length,
    };
  }, [samples]);

  const quality: "good" | "fair" | "poor" | "unknown" = useMemo(() => {
    if (accuracyStats.avg == null) return "unknown";
    if (accuracyStats.avg <= 8) return "good";
    if (accuracyStats.avg <= 20) return "fair";
    return "poor";
  }, [accuracyStats.avg]);

  const handleSample = useCallback((sample: Sample) => {
    samplesRef.current.push(sample);
    setSamples(samplesRef.current.slice());

    const start = startPointRef.current;
    if (!start) return;

    // Start-/célvonal: a kezdőpont körüli ~25 m sugarú kör átlépése.
    const distToStart = haversine(sample, start);
    const insideLine = distToStart < 25;
    const sinceLast = sample.t - lastLapTimeRef.current;

    if (insideLine && lastLapTimeRef.current === 0) {
      // Az első áthaladás rögzíti a mérés kezdetét.
      lastLapTimeRef.current = sample.t;
      return;
    }
    if (insideLine && sinceLast > 15000) {
      // Legalább 15 s a kör – így a zaj nem generál hamis kört.
      const lapMs = sinceLast;
      const poorSignal = (sample.acc ?? 999) > 25 || accuracyStats.avg != null && accuracyStats.avg > 20;
      lapCounterRef.current += 1;
      setLaps((prev) => [
        ...prev,
        {
          lapNumber: lapCounterRef.current,
          lapTimeMs: lapMs,
          confidence: poorSignal ? 0.4 : 0.75,
          flagged: poorSignal,
          flagReason: poorSignal ? "Gyenge GPS-pontosság a kör alatt – ellenőrizd a bizonyítékot." : null,
        },
      ]);
      lastLapTimeRef.current = sample.t;
    }
  }, [accuracyStats.avg]);

  const startMeasurement = async () => {
    setGeoError(null);
    if (!trackId) {
      setGeoError("Először válaszd ki a versenypályát.");
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Ez a böngésző nem támogatja a helymeghatározást.");
      return;
    }
    setState("requesting");
    samplesRef.current = [];
    setSamples([]);
    setLaps([]);
    lapCounterRef.current = 0;
    lastLapTimeRef.current = 0;

    try {
      const res = await apiFetch<{ data: { id: string } }>("/api/gps-sessions", {
        method: "POST",
        body: JSON.stringify({ trackId, layoutId: layoutId || null }),
      });
      setSessionId(res.data?.id ?? null);
    } catch (err) {
      setGeoError(apiErrorMessage(err));
      setState("idle");
      return;
    }

    startTimeRef.current = Date.now();
    startPointRef.current = null;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const sample: Sample = {
          t: pos.timestamp || Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          acc: pos.coords.accuracy,
        };
        if (!startPointRef.current) {
          // Az első pont a start/célvonal referencia.
          startPointRef.current = sample;
          lastLapTimeRef.current = sample.t;
        }
        handleSample(sample);
        setState((s) => (s === "requesting" ? "recording" : s));
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "A helymeghatározás engedélyezése elutasítva. Engedélyezd a böngészőben a helyadat-hozzáférést.",
          2: "A helyadat nem elérhető (GPS-jelkimaradás). Próbáld újra nyílt területen.",
          3: "A helymeghatározás időtúllépés miatt nem sikerült.",
        };
        setGeoError(messages[err.code] ?? "Helymeghatározási hiba.");
        setState((s) => (s === "recording" || s === "requesting" ? "idle" : s));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  };

  const stopMeasurement = async () => {
    stopWatch();
    setState("finished");
    const endedAt = Date.now();
    const validLaps = laps;

    try {
      if (sessionId) {
        await apiFetch("/api/gps-sessions", {
          method: "PATCH",
          body: JSON.stringify({
            id: sessionId,
            status: "completed",
            sampleCount: samplesRef.current.length,
            accuracyMinM: accuracyStats.min,
            accuracyMaxM: accuracyStats.max,
            quality,
            startLat: startPointRef.current?.lat ?? null,
            startLng: startPointRef.current?.lng ?? null,
            finishLat: samplesRef.current.at(-1)?.lat ?? null,
            finishLng: samplesRef.current.at(-1)?.lng ?? null,
            samples: samplesRef.current,
            laps: validLaps,
          }),
        });
      }
      toast.success("A GPS-mérés elmentve. Az eredményt ellenőrzésre beküldheted.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
    void endedAt;
  };

  const submitBestLap = async () => {
    if (!currentUser) return;
    const best = laps.filter((l) => !l.flagged).sort((a, b) => a.lapTimeMs - b.lapTimeMs)[0] ?? laps[0];
    if (!best) {
      toast.error("Nincs rögzített kör a beküldéshez.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/lap-times", {
        method: "POST",
        body: JSON.stringify({
          trackId,
          layoutId: layoutId || null,
          vehicleLabel: vehicleLabel.trim() || "GPS-mérés",
          lapTimeMs: best.lapTimeMs,
          measuredAt: new Date().toISOString().slice(0, 10),
          measurementType: "gps",
          gpsSessionId: sessionId,
          note: `GPS-mérésből. Pontosság (átlag): ${accuracyStats.avg ? accuracyStats.avg.toFixed(1) : "?"} m, minőség: ${quality}. A GPS-eredmény nem automatikusan hiteles.`,
        }),
      });
      toast.success("A GPS-eredményt beküldtük ellenőrzésre.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (ready && !currentUser) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-sm border border-ink-700 bg-ink-850 p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">Jelentkezz be a GPS-méréshez</h1>
          <p className="mt-3 text-sm text-graphite-400">
            A mérési eredmények a versenyzői profilodhoz kötődnek.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/bejelentkezes" className="btn-primary">
              Bejelentkezés
            </Link>
            <Link href="/regisztracio" className="btn-ghost">
              Regisztráció
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const qualityTone =
    quality === "good"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : quality === "fair"
        ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
        : quality === "poor"
          ? "text-rose-300 border-rose-500/30 bg-rose-500/10"
          : "text-graphite-400 border-ink-600 bg-ink-800";

  return (
    <>
      <PageHeader
        eyebrow="GPS köridőmérés"
        title="Mérés a pályán"
      />

      <div className="container-page py-12 sm:py-16">
      {/* Biztonsági / pontossági figyelmeztetés */}
      <div className="mt-6 flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm leading-relaxed text-amber-100/90">
          <strong className="font-semibold text-amber-200">Kizárólag zárt versenypályán használd.</strong> Ez a
          rendszer nem közúti időmérésre készült, és a telefonos GPS nem nyújt professzionális transzponder
          pontosságot. A helyadatokat csak a mérés ideje alatt gyűjtjük, és a beküldött eredmény mindig ellenőrzésre
          kerül.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          {/* Pálya választás */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="g-track">
                Versenypálya *
              </label>
              <select
                id="g-track"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="input"
                disabled={state === "recording"}
              >
                <option value="">Válassz pályát…</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} – {t.locality ?? t.country}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="g-layout">
                Pályaváltozat *
              </label>
              <select
                id="g-layout"
                value={layoutId}
                onChange={(e) => setLayoutId(e.target.value)}
                className="input"
                disabled={!trackId || trackLayouts.length === 0 || state === "recording"}
              >
                {trackLayouts.length === 0 && <option value="">— válassz pályát —</option>}
                {trackLayouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="g-vehicle">
              Autó megnevezése
            </label>
            <input
              id="g-vehicle"
              type="text"
              value={vehicleLabel}
              onChange={(e) => setVehicleLabel(e.target.value)}
              placeholder="pl. Honda Civic Type R (EP3)"
              className="input"
              disabled={state === "recording"}
            />
          </div>

          {(geoError || status === "unavailable") && (
            <div className="flex items-start gap-2 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{geoError ?? message}</span>
            </div>
          )}

          {/* Vezérlő */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-6">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-graphite-500">Eltelt idő</p>
                <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-white">
                  {formatLapTime(elapsed)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-graphite-400">
                  <Satellite className="h-3.5 w-3.5 text-brand-400" />
                  {samples.length} GPS-pont rögzítve
                </p>
              </div>

              <div className="flex items-center gap-3">
                {state === "recording" ? (
                  <button type="button" onClick={stopMeasurement} className="btn-danger px-6 py-3">
                    <CircleStop className="h-5 w-5" />
                    Mérés leállítása
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startMeasurement}
                    disabled={state === "requesting" || !trackId}
                    className="btn-primary px-6 py-3"
                  >
                    {state === "requesting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    {state === "requesting" ? "Helymeghatározás…" : "Mérés indítása"}
                  </button>
                )}
              </div>
            </div>

            {/* Élő állapot */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-ink-700 bg-ink-900 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite-500">Állapot</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {state === "recording" ? "Mérés folyamatban" : state === "finished" ? "Befejezve" : "Készenlét"}
                </p>
              </div>
              <div className={cn("rounded-md border p-3", qualityTone)}>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">GPS-pontosság</p>
                <p className="mt-1 text-sm font-semibold">
                  {accuracyStats.avg != null ? `±${accuracyStats.avg.toFixed(1)} m` : "—"}
                </p>
              </div>
              <div className="rounded-md border border-ink-700 bg-ink-900 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite-500">Min / max</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {accuracyStats.min != null
                    ? `${accuracyStats.min.toFixed(0)} / ${accuracyStats.max?.toFixed(0)} m`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-ink-700 bg-ink-900 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-graphite-500">Rögzített körök</p>
                <p className="mt-1 text-sm font-semibold text-white">{laps.length}</p>
              </div>
            </div>
          </div>

          {/* Rögzített körök */}
          {laps.length > 0 && (
            <div className="overflow-hidden rounded-sm border border-ink-700 bg-ink-850">
              <div className="border-b border-ink-700 px-4 py-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
                  Rögzített körök
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-800 text-left text-[11px] font-bold uppercase tracking-wider text-graphite-500">
                    <th className="py-2.5 pl-4 pr-3">Kör</th>
                    <th className="py-2.5 pr-3">Idő</th>
                    <th className="py-2.5 pr-3">Bizonyosság</th>
                    <th className="py-2.5 pr-4">Megjegyzés</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((l) => (
                    <tr key={l.lapNumber} className="border-b border-ink-800 last:border-0">
                      <td className="py-3 pl-4 pr-3 font-display font-bold text-white">{l.lapNumber}</td>
                      <td className="py-3 pr-3 font-display font-bold tabular-nums text-white">
                        {formatLapTime(l.lapTimeMs)}
                      </td>
                      <td className="py-3 pr-3">
                        {l.flagged ? (
                          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                            Bizonytalan
                          </span>
                        ) : (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                            Elfogadható
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-graphite-500">{l.flagReason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {state === "finished" && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submitBestLap}
                disabled={submitting || laps.length === 0}
                className="btn-primary px-6 py-3"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Legjobb kör beküldése ellenőrzésre
              </button>
              <button type="button" onClick={startMeasurement} className="btn-ghost px-6 py-3">
                Új mérés
              </button>
            </div>
          )}
        </div>

        {/* Oldalsáv: útmutató */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              <Info className="h-4 w-4 text-brand-400" />
              Hogyan működik?
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-graphite-400">
              {[
                "Válaszd ki a pályát és a pályaváltozatot.",
                "Engedélyezd a helymeghatározást a böngészőben.",
                "Indítsd el a mérést a startvonalnál.",
                "A rendszer a start-/célvonal áthaladását figyeli, és rögzíti a köröket.",
                "A mérés végén mentsd el, majd küldd be ellenőrzésre.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/15 text-[11px] font-bold text-brand-400">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5 text-xs leading-relaxed text-graphite-400">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-white">
              <Radio className="h-4 w-4 text-brand-400" />
              Pontosságról őszintén
            </h3>
            <p>
              A telefonos GPS pontossága tipikusan 5–20 méter, ezért a körhatárok detektálása heurisztikus. A gyenge
              jel alatt mért köröket <span className="text-amber-300">bizonytalanként</span> jelöljük. A GPS-eredmény
              soha nem automatikusan hiteles: emberi ellenőrzés után kerülhet a ranglistára.
            </p>
            {selectedTrack?.sourceUrl && (
              <p className="mt-3 flex items-start gap-1.5 text-graphite-500">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                Pályaadatok forrása:{" "}
                <a href={selectedTrack.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-400">
                  {selectedTrack.sourceNote ?? "ellenőrzött forrás"}
                </a>
              </p>
            )}
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
