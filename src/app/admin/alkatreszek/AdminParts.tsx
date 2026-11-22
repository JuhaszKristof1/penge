"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Database,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { EmptyState, SectionHeading } from "@/components/ui";
import { PartImage } from "@/components/PartImage";
import { toast } from "@/components/Toaster";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Admin alkatrész-kezelő (Supabase parts + part_oe_numbers).
// A műveletek a szerveroldali /api/admin/parts végponton keresztül futnak,
// amely ellenőrzi az admin szerepkört, majd a service_role kulccsal ír.
// ---------------------------------------------------------------------------

interface AdminPart {
  id: string;
  category_id: string | null;
  name: string;
  manufacturer: string | null;
  manufacturer_part_number: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  oeNumbers?: string[];
}

interface FormState {
  id: string;
  name: string;
  manufacturer: string;
  manufacturerPartNumber: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  oeNumbers: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  manufacturer: "",
  manufacturerPartNumber: "",
  description: "",
  categoryId: "",
  imageUrl: "",
  oeNumbers: "",
};

export function AdminParts() {
  const { categories, refresh } = useCatalog();
  const [parts, setParts] = useState<AdminPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importType, setImportType] = useState("parts");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: AdminPart[] }>("/api/admin/parts");
      setParts(res.data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.manufacturer ?? "").toLowerCase().includes(q) ||
        (p.manufacturer_part_number ?? "").toLowerCase().includes(q),
    );
  }, [parts, query]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: AdminPart) => {
    setForm({
      id: p.id,
      name: p.name,
      manufacturer: p.manufacturer ?? "",
      manufacturerPartNumber: p.manufacturer_part_number ?? "",
      description: p.description ?? "",
      categoryId: p.category_id ?? "",
      imageUrl: p.image_url ?? "",
      oeNumbers: (p.oeNumbers ?? []).join(", "),
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Az alkatrész neve kötelező.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: form.id || undefined,
        name: form.name,
        manufacturer: form.manufacturer,
        manufacturerPartNumber: form.manufacturerPartNumber,
        description: form.description,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
        oeNumbers: form.oeNumbers.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await apiFetch("/api/admin/parts", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(form.id ? "Alkatrész frissítve." : "Alkatrész létrehozva.");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/admin/parts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast.success("Alkatrész törölve.");
      setConfirmDelete(null);
      await load();
      refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const runImport = async () => {
    if (!importText.trim()) {
      toast.error("Illeszd be a CSV vagy JSON tartalmat.");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const isJson = importText.trim().startsWith("[") || importText.trim().startsWith("{");
      const body = isJson ? { type: importType, rows: JSON.parse(importText) } : { type: importType, csv: importText };
      const res = await apiFetch<{ imported: number; skipped: number; errors: string[] }>("/api/admin/import", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setImportResult(`Importálva: ${res.imported} sor. Kihagyva: ${res.skipped}.`);
      toast.success(`${res.imported} sor importálva.`);
      await load();
      refresh();
    } catch (err) {
      setImportResult(apiErrorMessage(err));
      toast.error(apiErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Alkatrészek kezelése"
        sub="Alkatrészek hozzáadása, szerkesztése és törlése a Supabase adatbázisban. A módosítások azonnal megjelennek a nyilvános felületen."
        className="mb-6"
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
          <input
            className="input pl-10"
            placeholder="Keresés név, gyártó vagy cikkszám szerint…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Új alkatrész
        </button>
        <button type="button" onClick={() => setImportOpen((v) => !v)} className="btn-outline">
          <Upload className="h-4 w-4" />
          Import
        </button>
      </div>

      {importOpen && (
        <div className="card mb-5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-400" />
            <h3 className="font-display text-sm font-bold text-white">Adatimport (CSV vagy JSON)</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <select className="input" value={importType} onChange={(e) => setImportType(e.target.value)}>
              <option value="parts">parts</option>
              <option value="oe_numbers">oe_numbers</option>
              <option value="brands">vehicle_brands</option>
              <option value="models">vehicle_models</option>
              <option value="engines">vehicle_engines</option>
              <option value="categories">part_categories</option>
              <option value="fitments">fitments</option>
            </select>
            <textarea
              className="input min-h-[120px] font-mono text-xs"
              placeholder='Példa CSV: id,name&#10;p-1,Fékbetét első'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={runImport} disabled={importing} className="btn-primary">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Importálás
            </button>
            {importResult && <span className="text-xs text-graphite-300">{importResult}</span>}
          </div>
          <p className="mt-2 text-[11px] text-graphite-500">
            A sorok az <span className="font-mono">id</span> mező szerint kerülnek be (upsert). Az OE számok
            normalizálása automatikus.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 py-10 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Alkatrészek betöltése…
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nincs megjeleníthető alkatrész"
          description={parts.length === 0 ? "Az adatbázisban jelenleg nincs alkatrész. Adj hozzá újat vagy importálj adatot." : "A keresés nem adott találatot."}
        />
      ) : (
        <div className="overflow-hidden rounded-sm border border-ink-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-graphite-400">
              <tr>
                <th className="px-4 py-3">Alkatrész</th>
                <th className="hidden px-4 py-3 sm:table-cell">Gyártó</th>
                <th className="hidden px-4 py-3 md:table-cell">Cikkszám</th>
                <th className="px-4 py-3 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {filtered.map((p) => (
                <tr key={p.id} className="bg-ink-900/40 transition-colors hover:bg-ink-850/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PartImage
                        part={{ name: p.name, category: "", image: p.image_url ?? undefined }}
                        className="h-10 w-10 shrink-0 rounded-sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{p.name}</p>
                        <p className="truncate text-xs text-graphite-500">ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-graphite-300 sm:table-cell">{p.manufacturer ?? "—"}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-graphite-400 md:table-cell">
                    {p.manufacturer_part_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="grid h-8 w-8 place-items-center rounded-sm border border-ink-600 text-graphite-300 transition-colors hover:border-brand-500/50 hover:text-brand-300"
                        aria-label="Szerkesztés"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(p.id)}
                        className="grid h-8 w-8 place-items-center rounded-sm border border-ink-600 text-graphite-300 transition-colors hover:border-rose-500/50 hover:text-rose-300"
                        aria-label="Törlés"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Űrlap modál */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm">
          <div className="card my-8 w-full max-w-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">
                {form.id ? "Alkatrész szerkesztése" : "Új alkatrész"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="grid h-9 w-9 place-items-center rounded-sm border border-ink-600 text-graphite-300 hover:text-white"
                aria-label="Bezárás"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <Field label="Név *" className="sm:col-span-2">
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Gyártó">
                <input className="input" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
              </Field>
              <Field label="Gyártói cikkszám">
                <input
                  className="input"
                  value={form.manufacturerPartNumber}
                  onChange={(e) => setForm({ ...form, manufacturerPartNumber: e.target.value })}
                />
              </Field>
              <Field label="Kategória">
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— Nincs megadva —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kép URL">
                <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="OE számok (vesszővel elválasztva)" className="sm:col-span-2">
                <input className="input" value={form.oeNumbers} onChange={(e) => setForm({ ...form, oeNumbers: e.target.value })} placeholder="1K0698151, 5Q0698151" />
              </Field>
              <Field label="Leírás" className="sm:col-span-2">
                <textarea
                  className="input min-h-[90px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              <div className="sm:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Mégse
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {form.id ? "Mentés" : "Létrehozás"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Törlés megerősítés */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-white">Alkatrész törlése</h3>
            <p className="mt-2 text-sm text-graphite-400">
              Biztosan törlöd ezt az alkatrészt? A hozzá tartozó OE számok és kompatibilitási rekordok is törlődnek. Ez a
              művelet nem vonható vissza.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-ghost">
                Mégse
              </button>
              <button
                type="button"
                onClick={() => remove(confirmDelete)}
                className="btn bg-rose-500 text-white hover:bg-rose-600"
              >
                <Trash2 className="h-4 w-4" />
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
