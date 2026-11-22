"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Car,
  Check,
  Gauge,
  Loader2,
  LogIn,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { DbNotice, EmptyState, PageHeader } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { apiErrorMessage } from "@/lib/api";
import { CarSelector, EMPTY_SELECTION, type CarSelection } from "@/components/CarSelector";
import { useApp } from "@/context/AppContext";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import type { GarageCar } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GarageManager() {
  const router = useRouter();
  const { ready, currentUser, garage, addCar, updateCar, deleteCar, setDefaultCar } = useApp();
  const { getMake, getModel, getGeneration, getEngine, ensureModels, ensureEngines } = useCatalog();

  const [selection, setSelection] = useState<CarSelection>(EMPTY_SELECTION);
  const [nickname, setNickname] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // A szerkesztett autó motorkódja, amíg a motorlista be nem töltődik.
  const pendingEngineCode = useRef<string>("");
  // A szerkesztett autó generációja, amíg a modellek be nem töltődnek.
  const pendingGenerationId = useRef<string>("");

  useEffect(() => {
    if (ready && !currentUser) {
      // Nem irányítjuk el azonnal, hogy a vendég is lássa a felületet.
    }
  }, [ready, currentUser]);

  const selectionComplete =
    !!selection.makeId &&
    !!selection.modelId &&
    !!selection.generationId &&
    selection.year !== "" &&
    !!selection.body &&
    !!selection.engineId;

  const duplicate = useMemo(() => {
    if (!selectionComplete) return false;
    return garage.some(
      (c) =>
        c.id !== editingId &&
        c.makeId === selection.makeId &&
        c.modelId === selection.modelId &&
        c.generationId === selection.generationId &&
        c.year === selection.year &&
        c.engineCode ===
          (getEngine(selection.makeId, selection.modelId, selection.generationId, selection.engineId)?.code ?? ""),
    );
  }, [garage, selection, selectionComplete, editingId, getEngine]);

  const resetForm = () => {
    setSelection(EMPTY_SELECTION);
    setNickname("");
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("Az autók mentéséhez jelentkezz be a fiókodba.");
      return;
    }
    if (!selectionComplete) {
      setError("Kérlek, válaszd ki a jármű összes adatát.");
      return;
    }
    if (duplicate) {
      setError("Ez az autó már szerepel a garázsban.");
      return;
    }

    const make = getMake(selection.makeId);
    const model = getModel(selection.makeId, selection.modelId);
    const gen = getGeneration(selection.makeId, selection.modelId, selection.generationId);
    const engine = getEngine(selection.makeId, selection.modelId, selection.generationId, selection.engineId);

    const payload = {
      makeId: selection.makeId,
      makeName: make?.name ?? "",
      modelId: selection.modelId,
      modelName: model?.name ?? "",
      generationId: selection.generationId,
      generationName: gen?.name ?? "",
      year: Number(selection.year),
      body: selection.body,
      engineId: selection.engineId,
      engineName: engine?.name ?? "",
      engineCode: engine?.code ?? "",
      nickname: nickname.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCar(editingId, payload);
        toast.success("Autó frissítve.");
      } else {
        await addCar(payload);
        toast.success("Autó hozzáadva a garázshoz.");
      }
      resetForm();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (car: GarageCar) => {
    setEditingId(car.id);
    ensureModels(car.makeId);
    ensureEngines(car.makeId, car.generationId);
    // A UI modellcsoport azonosítója eltér az adatbázis model_id-től (ami a
    // generáció azonosítója), ezért a generáció alapján oldjuk fel.
    const modelId = resolveModelGroupId(car.makeId, car.generationId) ?? car.modelId;
    const gen = getGeneration(car.makeId, modelId, car.generationId);
    const engines = gen?.engines ?? [];
    const match = engines.find((e) => e.code === car.engineCode);
    setSelection({
      makeId: car.makeId,
      modelId,
      generationId: car.generationId,
      year: car.year,
      body: car.body,
      engineId: match?.id ?? engines[0]?.id ?? "",
    });
    // Ha az adatbázis csak később tölti be a modelleket/motorokat, akkor a
    // generáció és a motorkód alapján utólag beállítjuk a hiányzó mezőket.
    pendingEngineCode.current = car.engineCode;
    pendingGenerationId.current = car.generationId;
    setNickname(car.nickname ?? "");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // A szerkesztett autó modellcsoportjának feloldása, ha a modellek később
  // töltődnek be az adatbázisból.
  const resolveModelGroupId = (makeId: string, generationId: string) => {
    const make = getMake(makeId);
    return make?.models.find((m) => m.generations.some((g) => g.id === generationId))?.id;
  };

  // A szerkesztett autó generációjának/modellezésének utólagos feloldása.
  useEffect(() => {
    const generationId = pendingGenerationId.current;
    if (!generationId) return;
    const modelId = resolveModelGroupId(selection.makeId, generationId);
    if (modelId && (modelId !== selection.modelId || selection.generationId !== generationId)) {
      pendingGenerationId.current = "";
      setSelection((prev) => ({ ...prev, modelId, generationId }));
    }
  }, [selection, getMake]);

  // A szerkesztett autó motorjának utólagos feloldása, ha a motorlista később
  // töltődik be az adatbázisból.
  useEffect(() => {
    const code = pendingEngineCode.current;
    if (!code || !selection.generationId || selection.engineId) return;
    const gen = getGeneration(selection.makeId, selection.modelId, selection.generationId);
    const match = gen?.engines.find((e) => e.code === code);
    if (match) {
      pendingEngineCode.current = "";
      setSelection((prev) => ({ ...prev, engineId: match.id }));
    }
  }, [selection, getGeneration]);

  const loggedOut = ready && !currentUser;

  return (
    <>
      <PageHeader
        eyebrow="Személyes járművek"
        title="Autógarázs"
        sub="Mentsd el a járműveidet, állíts be egyet alapértelmezettként, és az ellenőrzéseknél egy kattintással töltsd be őket."
      />

      <div className="container-page py-10 sm:py-14">
      {loggedOut && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-brand-500/25 bg-brand-500/[0.07] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-brand-100">
            <AlertCircle className="h-4 w-4 text-brand-400" />
            Vendég módban nem menthető autó. Jelentkezz be a fiókodba a mentéshez.
          </p>
          <Link href="/bejelentkezes" className="btn-primary py-2">
            <LogIn className="h-4 w-4" />
            Bejelentkezés
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        {/* FORM */}
        <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-sm bg-brand-500/10 text-brand-400">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  {editingId ? "Autó szerkesztése" : "Új autó hozzáadása"}
                </h2>
                <p className="text-xs text-graphite-400">Válaszd ki a jármű pontos paramétereit</p>
              </div>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost px-3 py-1.5 text-xs">
                <X className="h-3.5 w-3.5" />
                Mégsem
              </button>
            )}
          </div>

          <CarSelector value={selection} onChange={setSelection} />

          <div className="mt-5">
            <label className="label" htmlFor="nickname">
              Becenév (opcionális)
            </label>
            <input
              id="nickname"
              className="input"
              placeholder="pl. Családi Golf"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={loggedOut || saving} className="btn-primary flex-1 py-3">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mentés…
                </>
              ) : editingId ? (
                <>
                  <Check className="h-4 w-4" />
                  Változások mentése
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Autó hozzáadása
                </>
              )}
            </button>
            <button type="button" onClick={resetForm} className="btn-ghost py-3">
              Mezők törlése
            </button>
          </div>
        </form>

        {/* LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
              <Car className="h-4.5 w-4.5 text-brand-400" />
              Garázs
              <span className="chip">{garage.length}</span>
            </h2>
            {garage.length > 0 && (
              <Link href="/kompatibilitas" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
                Ellenőrzés indítása →
              </Link>
            )}
          </div>

          {garage.length === 0 ? (
            <EmptyState
              icon={<Car className="h-6 w-6" />}
              title="A garázs üres"
              description="Add hozzá az első autódat a bal oldali űrlappal."
            />
          ) : (
            garage.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "card p-4 transition-colors",
                  editingId === c.id && "border-brand-500/50 bg-brand-500/[0.04]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-sm",
                        c.isDefault ? "bg-brand-500/15 text-brand-400" : "bg-ink-800 text-graphite-300",
                      )}
                    >
                      <Car className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">
                          {c.nickname ? `${c.nickname} · ` : ""}
                          {c.makeName} {c.modelName}
                        </p>
                        {c.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-300">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Alapértelmezett
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-graphite-400">{c.generationName}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="chip text-[10px]">{c.year}</span>
                        <span className="chip text-[10px]">{c.body}</span>
                        <span className="chip text-[10px]">{c.engineName}</span>
                        <span className="chip font-mono text-[10px]">{c.engineCode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-700 pt-3">
                  {!c.isDefault && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setDefaultCar(c.id);
                          toast.success("Alapértelmezett autó beállítva.");
                        } catch (err) {
                          setError(apiErrorMessage(err));
                        }
                      }}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Alapértelmezett
                    </button>
                  )}
                  <button type="button" onClick={() => startEdit(c)} className="btn-ghost px-3 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" />
                    Szerkesztés
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(c.id)}
                    className="btn-danger ml-auto px-3 py-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Törlés
                  </button>
                </div>

                {confirmDelete === c.id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
                    <p className="text-xs text-rose-200">Biztosan törlöd ezt az autót?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteCar(c.id);
                            if (editingId === c.id) resetForm();
                            toast.info("Autó törölve.");
                          } catch (err) {
                            setError(apiErrorMessage(err));
                          } finally {
                            setConfirmDelete(null);
                          }
                        }}
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        Igen, törlés
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        Mégsem
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div className="card p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-graphite-300">
              <Gauge className="h-3.5 w-3.5 text-brand-400" />
              Tipp
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-graphite-400">
              Az alapértelmezett autót a rendszer automatikusan felajánlja a kompatibilitás ellenőrzőben. A garázs
              adatai a fiókodhoz kapcsolódva az adatbázisban tárolódnak.
            </p>
          </div>

          <DbNotice compact />
        </div>
      </div>
    </div>
    </>
  );
}
