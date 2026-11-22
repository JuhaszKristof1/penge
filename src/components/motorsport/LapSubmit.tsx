"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Timer, Upload, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase/client";
import { parseLapTimeMs } from "@/lib/motorsport/lap-payload";
import { formatLapTime, LAP_STATUS_META } from "@/lib/motorsport/format";
import type { LapTime } from "@/lib/types";
import { toast } from "@/components/Toaster";
import { PageHeader } from "@/components/ui";

/** Bizonyíték-fájl feltöltése a Supabase Storage "lap-evidence" bucketbe. */
async function uploadEvidence(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "A Supabase kliens nem érhető el." };
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("lap-evidence").upload(path, file, { upsert: false });
  if (error) {
    return {
      error:
        "A bizonyíték feltöltése nem sikerült. Ellenőrizd, hogy létezik-e a 'lap-evidence' Storage bucket. Alternatívaként add meg a bizonyíték URL-jét.",
    };
  }
  const { data } = supabase.storage.from("lap-evidence").getPublicUrl(path);
  return { url: data.publicUrl };
}

export function LapSubmit() {
  const router = useRouter();
  const { currentUser, ready, garage } = useApp();
  const { tracks, layouts, categories, status, message } = useMotorsport();

  const [trackId, setTrackId] = useState("");
  const [layoutId, setLayoutId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [category, setCategory] = useState("utcai");
  const [lapTime, setLapTime] = useState("");
  const [measuredAt, setMeasuredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myLaps, setMyLaps] = useState<LapTime[]>([]);

  const trackLayouts = useMemo(() => layouts.filter((l) => l.trackId === trackId), [layouts, trackId]);
  const selectedTrack = tracks.find((t) => t.id === trackId);

  useEffect(() => {
    if (trackLayouts.length > 0) {
      setLayoutId((prev) => (trackLayouts.some((l) => l.id === prev) ? prev : trackLayouts[0].id));
    } else {
      setLayoutId("");
    }
  }, [trackLayouts]);

  useEffect(() => {
    if (garage.length > 0) {
      const def = garage.find((c) => c.isDefault) ?? garage[0];
      setVehicleId(def.id);
      setVehicleLabel(`${def.makeName} ${def.modelName} ${def.generationName}`.trim());
    }
  }, [garage]);

  const loadMine = useMemo(
    () => async () => {
      if (!currentUser) return;
      try {
        const res = await apiFetch<{ data: LapTime[] }>("/api/lap-times");
        setMyLaps(res.data ?? []);
      } catch {
        /* a saját lista hibája nem blokkolja az űrlapot */
      }
    },
    [currentUser],
  );

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  if (ready && !currentUser) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-sm border border-ink-700 bg-ink-850 p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">Jelentkezz be a köridő feltöltéséhez</h1>
          <p className="mt-3 text-sm text-graphite-400">
            Az eredmények versenyzői profilhoz kötődnek, ezért a feltöltéshez bejelentkezés szükséges.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ms = parseLapTimeMs(lapTime);
    if (!ms) {
      setError("Add meg érvényes köridőt (pl. 1:23.456 vagy 83.456).");
      return;
    }
    if (!trackId) {
      setError("Válaszd ki a versenypályát.");
      return;
    }
    if (!vehicleId && !vehicleLabel.trim()) {
      setError("Válassz autót a garázsból, vagy add meg az autó megnevezését.");
      return;
    }

    setSubmitting(true);
    try {
      let finalEvidenceUrl = evidenceUrl.trim();

      // Ha van kiválasztott fájl és nincs URL, megpróbáljuk feltölteni.
      if (file && !finalEvidenceUrl && currentUser) {
        setUploading(true);
        const res = await uploadEvidence(currentUser.id, file);
        setUploading(false);
        if (res.error) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
        finalEvidenceUrl = res.url ?? "";
      }

      await apiFetch("/api/lap-times", {
        method: "POST",
        body: JSON.stringify({
          trackId,
          layoutId: layoutId || null,
          vehicleId: vehicleId || null,
          vehicleLabel: vehicleLabel.trim() || null,
          vehicleCategory: category,
          lapTimeMs: ms,
          measuredAt,
          measurementType: "manual",
          evidenceUrl: finalEvidenceUrl || null,
          evidenceType: finalEvidenceUrl ? (file && file.type.startsWith("video") ? "video" : "image") : "none",
          note: note.trim() || null,
        }),
      });

      toast.success("Az eredményt beküldtük. Ellenőrzés után kerülhet a ranglistára.");
      setLapTime("");
      setNote("");
      setEvidenceUrl("");
      setFile(null);
      await loadMine();
      router.refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/lap-times?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.info("Az eredményt visszavontuk.");
      await loadMine();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const dbUnavailable = status === "unavailable";

  return (
    <>
      <PageHeader
        eyebrow="Köridő feltöltése"
        title="Kézi köridő beküldése"
        sub="Add meg a pályát, a pályaváltozatot, az autót és a mért köridőt. Kép vagy videó bizonyíték csatolásával növeled az elfogadás esélyét. A beküldött eredmény ellenőrzés alatt állapotba kerül, és csak jóváhagyás után jelenik meg a ranglistán."
      />

      <div className="container-page py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          {dbUnavailable && (
            <div className="rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {message}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pálya + változat */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-track">
                Versenypálya *
              </label>
              <select
                id="f-track"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="input"
                required
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
              <label className="label" htmlFor="f-layout">
                Pályaváltozat *
              </label>
              <select
                id="f-layout"
                value={layoutId}
                onChange={(e) => setLayoutId(e.target.value)}
                className="input"
                disabled={!trackId || trackLayouts.length === 0}
                required
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

          {/* Autó */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">Autó</h2>
            <div className="mt-4 space-y-4">
              {garage.length > 0 && (
                <div>
                  <label className="label" htmlFor="f-vehicle">
                    Választás a garázsból
                  </label>
                  <select
                    id="f-vehicle"
                    value={vehicleId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setVehicleId(id);
                      const car = garage.find((c) => c.id === id);
                      if (car) setVehicleLabel(`${car.makeName} ${car.modelName} ${car.generationName}`.trim());
                    }}
                    className="input"
                  >
                    <option value="">— nincs garázs-autó kiválasztva —</option>
                    {garage.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname ? `${c.nickname} · ` : ""}
                        {c.makeName} {c.modelName} {c.generationName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label" htmlFor="f-label">
                  Autó megnevezése {garage.length === 0 && "*"}
                </label>
                <input
                  id="f-label"
                  type="text"
                  value={vehicleLabel}
                  onChange={(e) => setVehicleLabel(e.target.value)}
                  placeholder="pl. Honda Civic Type R (EP3)"
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="f-category">
                  Autókategória *
                </label>
                <select
                  id="f-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Köridő + dátum */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-laptime">
                Köridő *
              </label>
              <input
                id="f-laptime"
                type="text"
                value={lapTime}
                onChange={(e) => setLapTime(e.target.value)}
                placeholder="1:23.456"
                inputMode="decimal"
                className="input font-display text-lg tabular-nums"
                required
              />
              <p className="mt-1.5 text-xs text-graphite-500">Formátum: perc:másodperc.ezred (pl. 1:23.456) vagy másodperc (83.456).</p>
            </div>
            <div>
              <label className="label" htmlFor="f-date">
                Mérés dátuma *
              </label>
              <input
                id="f-date"
                type="date"
                value={measuredAt}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setMeasuredAt(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          {/* Bizonyíték */}
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">Bizonyíték</h2>
            <p className="mt-2 text-xs text-graphite-500">
              Kép vagy videó. Feltölthetsz fájlt (Storage bucket szükséges), vagy megadhatod a bizonyíték URL-jét.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="f-file">
                  Fájl feltöltése
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="f-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-ink-600 bg-ink-900 px-4 py-2.5 text-sm font-medium text-graphite-200 hover:border-ink-500 hover:text-white"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Kép / videó kiválasztása
                  </label>
                  <input
                    id="f-file"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file && (
                    <span className="flex items-center gap-2 text-xs text-graphite-300">
                      {file.name}
                      <button type="button" onClick={() => setFile(null)} aria-label="Fájl eltávolítása">
                        <X className="h-3.5 w-3.5 text-rose-400" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="f-evidence-url">
                  Vagy bizonyíték URL
                </label>
                <input
                  id="f-evidence-url"
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://…"
                  className="input"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="f-note">
              Megjegyzés
            </label>
            <textarea
              id="f-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Körülmények, gumik, mérési környezet…"
              className="input resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={submitting || uploading} className="btn-primary px-6 py-3">
              {submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Feltöltés…" : submitting ? "Beküldés…" : "Eredmény beküldése"}
            </button>
            <Link href="/ranglistak" className="btn-ghost px-6 py-3">
              Ranglisták
            </Link>
          </div>
        </form>

        {/* Saját eredmények */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              Saját eredményeim
            </h2>
            <p className="mt-2 text-xs text-graphite-500">
              Az itt látható eredmények státusza: ellenőrzés alatt / elfogadva / elutasítva.
            </p>
            <ul className="mt-4 space-y-3">
              {myLaps.length > 0 ? (
                myLaps.map((lap) => {
                  const meta = LAP_STATUS_META[lap.status];
                  return (
                    <li key={lap.id} className="rounded-md border border-ink-700 bg-ink-900 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{lap.trackName ?? "—"}</p>
                          <p className="truncate text-xs text-graphite-500">{lap.layoutName ?? "—"}</p>
                        </div>
                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${meta.bg} ${meta.border} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-base font-bold tabular-nums text-white">
                          {formatLapTime(lap.lapTimeMs)}
                        </span>
                        {lap.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(lap.id)}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            Visszavonás
                          </button>
                        )}
                      </div>
                      {lap.status === "approved" && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> A ranglistán szerepel
                        </p>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="flex items-center gap-2 text-xs text-graphite-500">
                  <Timer className="h-3.5 w-3.5" />
                  Még nincs beküldött eredményed.
                </li>
              )}
            </ul>
          </div>

          {selectedTrack && (
            <p className="mt-4 px-1 text-xs text-graphite-500">
              Kiválasztott pálya: <span className="text-graphite-300">{selectedTrack.name}</span>
              {selectedTrack.sourceNote ? " · az adatok ellenőrzött forrásból származnak." : ""}
            </p>
          )}
        </aside>
      </div>
      </div>
    </>
  );
}
