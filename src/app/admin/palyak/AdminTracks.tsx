"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { formatLength } from "@/lib/motorsport/format";
import { toast } from "@/components/Toaster";

// ---------------------------------------------------------------------------
// Admin versenypálya-kezelés. A pályaadatokat ellenőrzött forrásból kell
// felvenni; a hosszt és a konfigurációt az admin adja meg.
// ---------------------------------------------------------------------------

interface TrackRecord {
  id: string;
  slug: string;
  name: string;
  locality: string | null;
  county: string | null;
  country: string | null;
  length_m: number | null;
  width: string | null;
  corners: number | null;
  opened_year: number | null;
  status: string | null;
  website: string | null;
  description: string | null;
  image_url: string | null;
  layout_image_url: string | null;
  source_url: string | null;
  source_note: string | null;
}

interface LayoutRecord {
  id: string;
  track_id: string;
  name: string;
  length_m: number | null;
  corners: number | null;
  direction: string | null;
  is_default: boolean;
}

const EMPTY: Partial<TrackRecord> = {
  name: "",
  locality: "",
  county: "",
  country: "Magyarország",
  status: "active",
};

type FormState = Partial<TrackRecord>;

export function AdminTracks() {
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [layouts, setLayouts] = useState<LayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: TrackRecord[]; layouts: LayoutRecord[] }>("/api/admin/tracks");
      setTracks(res.data ?? []);
      setLayouts(res.layouts ?? []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.error("A pálya neve kötelező.");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await apiFetch("/api/admin/tracks", { method: "PATCH", body: JSON.stringify(editing) });
        toast.success("A pálya adatait mentettük.");
      } else {
        await apiFetch("/api/admin/tracks", { method: "POST", body: JSON.stringify(editing) });
        toast.success("Az új pályát felvettük.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (track: TrackRecord) => {
    if (!window.confirm(`Biztosan törlöd a(z) ${track.name} pályát? A pályaváltozatai is törlődnek.`)) return;
    try {
      await apiFetch(`/api/admin/tracks?id=${encodeURIComponent(track.id)}`, { method: "DELETE" });
      toast.info("A pályát töröltük.");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const field = (key: keyof TrackRecord, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div>
      <label className="label" htmlFor={`tf-${key}`}>
        {label}
      </label>
      <input
        id={`tf-${key}`}
        type={opts?.type ?? "text"}
        value={(editing?.[key] as string | number | null | undefined) ?? ""}
        onChange={(e) =>
          setEditing((cur) => ({
            ...(cur ?? {}),
            [key]: opts?.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value,
          }))
        }
        placeholder={opts?.placeholder}
        className="input"
      />
    </div>
  );

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Versenypályák kezelése"
        sub="Pályák és pályaváltozatok felvétele, szerkesztése. Az adatokat ellenőrzött forrásból add meg."
        className="mb-6"
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY })}
          className="btn-primary px-4 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          Új pálya
        </button>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-ink-600 px-3.5 py-2 text-sm text-graphite-300 hover:text-white"
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Frissítés
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Szerkesztő űrlap */}
      {editing && (
        <div className="mb-6 rounded-sm border border-brand-500/30 bg-ink-850 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">
              {editing.id ? `Szerkesztés: ${editing.name}` : "Új versenypálya"}
            </h3>
            <button type="button" onClick={() => setEditing(null)} aria-label="Bezárás">
              <X className="h-4 w-4 text-graphite-400" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Név *")}
            {field("locality", "Helyszín (település)")}
            {field("county", "Vármegye / régió")}
            {field("country", "Ország")}
            {field("length_m", "Hossz (méter)", { type: "number", placeholder: "pl. 4381" })}
            {field("width", "Szélesség", { placeholder: "pl. 10–15 m" })}
            {field("corners", "Kanyarok száma", { type: "number" })}
            {field("opened_year", "Megnyitás éve", { type: "number" })}
            {field("image_url", "Bemutató kép URL", { placeholder: "/tracks/…" })}
            {field("layout_image_url", "Pályarajz URL", { placeholder: "/tracks/…" })}
            {field("website", "Hivatalos weboldal", { placeholder: "https://…" })}
            {field("source_url", "Forrás URL", { placeholder: "https://…" })}
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="tf-status">
              Állapot
            </label>
            <select
              id="tf-status"
              value={editing.status ?? "active"}
              onChange={(e) => setEditing((cur) => ({ ...(cur ?? {}), status: e.target.value }))}
              className="input"
            >
              <option value="active">Aktív</option>
              <option value="inactive">Bezárt</option>
              <option value="planned">Tervezett</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="tf-source-note">
              Forrás megjegyzés
            </label>
            <input
              id="tf-source-note"
              type="text"
              value={editing.source_note ?? ""}
              onChange={(e) => setEditing((cur) => ({ ...(cur ?? {}), source_note: e.target.value }))}
              placeholder="pl. Hossz: magyar Wikipédia pályaszócikk."
              className="input"
            />
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="tf-description">
              Leírás
            </label>
            <textarea
              id="tf-description"
              value={editing.description ?? ""}
              onChange={(e) => setEditing((cur) => ({ ...(cur ?? {}), description: e.target.value }))}
              rows={4}
              className="input resize-y"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Mentés
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost px-5 py-2.5">
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Pályák betöltése…
        </p>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => {
            const trackLayouts = layouts.filter((l) => l.track_id === t.id);
            return (
              <div key={t.id} className="rounded-sm border border-ink-700 bg-ink-850 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-white">{t.name}</h3>
                    <p className="text-xs text-graphite-500">
                      {[t.locality, t.county].filter(Boolean).join(", ")} · {formatLength(t.length_m)} ·{" "}
                      {t.corners != null ? `${t.corners} kanyar · ` : ""}
                      {trackLayouts.length} változat
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-graphite-600">{t.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...t })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-graphite-300 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Szerkesztés
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Törlés
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {tracks.length === 0 && (
            <p className="rounded-sm border border-dashed border-ink-600 px-6 py-12 text-center text-sm text-graphite-400">
              Nincs versenypálya az adatbázisban.
            </p>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-graphite-500">
        A pályaváltozatok szerkesztése az adatbázisban történik (track_layouts tábla). A pályaadatok megadásakor
        mindig ellenőrzött forrásra támaszkodj – a rendszer nem talál ki hosszt vagy konfigurációt.
      </p>
    </div>
  );
}
