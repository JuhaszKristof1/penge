"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookmarkPlus,
  Check,
  Gauge,
  ImagePlus,
  Info,
  Loader2,
  Package,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CarSelector, EMPTY_SELECTION, type CarSelection } from "@/components/CarSelector";
import { ResultCard } from "@/components/ResultCard";
import { DbNotice, EmptyState, PageHeader } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { useApp } from "@/context/AppContext";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { runDatabaseCompatibilityCheck } from "@/lib/compatibility-db";
import { apiErrorMessage } from "@/lib/api";
import type { CompatibilityResult } from "@/lib/types";
import { cn } from "@/lib/utils";

// Teljes kompatibilitás-ellenőrző. A kiértékelés KIZÁRÓLAG az adatbázis
// `fitments` táblájából történik (lásd lib/compatibility-db.ts). Ha az adatbázis
// nem elérhető, a felület hibát jelez, nem kitalált eredményt.

export function CompatibilityChecker() {
  const searchParams = useSearchParams();
  const { ready, currentUser, saveCheck, logSearch, catalogParts } = useApp();
  const { getMake, getModel, getGeneration, getEngine, ensureModels, ensureEngines, status, message } = useCatalog();

  const [selection, setSelection] = useState<CarSelection>(EMPTY_SELECTION);
  const [partName, setPartName] = useState("");
  const [oeNumber, setOeNumber] = useState("");
  const [manufacturerSku, setManufacturerSku] = useState("");
  const [category, setCategory] = useState("");
  const [imageName, setImageName] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const set = new Set(catalogParts.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, [catalogParts]);

  // URL-előtöltés a főoldali gyorskeresőből (make, model, gen).
  useEffect(() => {
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const gen = searchParams.get("gen");
    if (!make || !model || !gen) return;
    ensureModels(make);
    ensureEngines(make, gen);
    setSelection((prev) => ({ ...prev, makeId: make, modelId: model, generationId: gen }));
  }, [searchParams, ensureModels, ensureEngines]);

  const make = getMake(selection.makeId);
  const model = getModel(selection.makeId, selection.modelId);
  const generation = getGeneration(selection.makeId, selection.modelId, selection.generationId);
  const engine = getEngine(selection.makeId, selection.modelId, selection.generationId, selection.engineId);

  const carComplete =
    !!selection.makeId && !!selection.modelId && !!selection.generationId && selection.year !== "" && !!selection.engineId;
  const partComplete = partName.trim().length > 1 || oeNumber.trim().length > 1 || manufacturerSku.trim().length > 1;
  const canSubmit = carComplete && partComplete && !running;

  const reset = () => {
    setSelection(EMPTY_SELECTION);
    setPartName("");
    setOeNumber("");
    setManufacturerSku("");
    setCategory("");
    setImageName("");
    setResult(null);
    setError(null);
    setSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageName(file ? file.name : "");
  };

  const runCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!carComplete) {
      setError("Válaszd ki a jármű összes adatát (márka, modell, generáció, évjárat, motor).");
      return;
    }
    if (!partComplete) {
      setError("Add meg legalább az alkatrész nevét, OE számát vagy gyártói cikkszámát.");
      return;
    }

    setRunning(true);
    try {
      const res = await runDatabaseCompatibilityCheck({
        makeId: selection.makeId,
        makeName: make?.name ?? "",
        modelId: selection.modelId,
        modelName: model?.name ?? "",
        generationId: selection.generationId,
        generationName: generation?.name ?? "",
        year: Number(selection.year),
        body: selection.body,
        engineId: selection.engineId,
        engineName: engine?.name ?? "",
        engineCode: engine?.code ?? "",
        partName: partName.trim(),
        oeNumber: oeNumber.trim(),
        manufacturerSku: manufacturerSku.trim(),
        category,
        imageName: imageName || undefined,
      });

      if (!res) {
        setError("Az adatbázis nem elérhető, ezért a kompatibilitás nem ellenőrizhető.");
        setResult(null);
        return;
      }

      setResult(res);
      void logSearch({
        type: "compatibility",
        label: `${make?.name ?? ""} ${model?.name ?? ""} · ${partName.trim() || oeNumber.trim() || manufacturerSku.trim()}`,
      });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  const saveResult = async () => {
    if (!result) return;
    if (!currentUser) {
      toast.info("A mentéshez jelentkezz be a fiókodba.");
      return;
    }
    try {
      await saveCheck(result);
      setSaved(true);
      toast.success("Ellenőrzés elmentve a fiókodba.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Kompatibilitás ellenőrző"
        title="Ellenőrizd, hogy az alkatrész illik-e a járművedhez"
        sub="Válaszd ki a járművet, add meg az alkatrész adatait, és a rendszer az adatbázis kompatibilitási rekordjai alapján értékeli az illeszkedést."
      />

      <div className="container-page py-10 sm:py-14">
      {status === "unavailable" && (
        <div className="mt-6 flex items-start gap-2.5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {message} A kompatibilitás-ellenőrzés csak akkor működik, ha az adatbázis elérhető.
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Űrlap */}
        <form onSubmit={runCheck} className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-brand-500/10 text-brand-400">
              <Gauge className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-white">Ellenőrzés indítása</h2>
              <p className="text-xs text-graphite-400">1. jármű · 2. alkatrész · 3. eredmény</p>
            </div>
          </div>

          <CarSelector value={selection} onChange={setSelection} />

          <div className="mt-6 border-t border-ink-700 pt-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-white">
              <Package className="h-4 w-4 text-brand-400" />
              Alkatrész adatai
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="part-name">
                  Alkatrész neve
                </label>
                <input
                  id="part-name"
                  className="input"
                  placeholder="pl. Fékbetét első tengely"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="oe-number">
                  OE szám
                </label>
                <input
                  id="oe-number"
                  className="input font-mono"
                  placeholder="pl. 1K0698151"
                  value={oeNumber}
                  onChange={(e) => setOeNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="sku">
                  Gyártói cikkszám
                </label>
                <input
                  id="sku"
                  className="input font-mono"
                  placeholder="pl. 0 986 494 567"
                  value={manufacturerSku}
                  onChange={(e) => setManufacturerSku(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="category">
                  Alkatrészkategória
                </label>
                <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">— Nincs megadva —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="part-image">
                  Kép feltöltése (opcionális)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="btn-outline px-4 py-2 text-xs"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Kép kiválasztása
                  </button>
                  {imageName && (
                    <span className="flex items-center gap-1.5 text-xs text-graphite-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      {imageName}
                      <button
                        type="button"
                        onClick={() => {
                          setImageName("");
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="text-graphite-500 hover:text-white"
                        aria-label="Kép eltávolítása"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                <input
                  id="part-image"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
                <p className="mt-1.5 text-[11px] text-graphite-500">
                  A kép feltöltése jelenleg csak a kiválasztott fájl nevét rögzíti az ellenőrzéshez (nincs képfeldolgozás).
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={!canSubmit} className="btn-primary flex-1 py-3">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {running ? "Ellenőrzés…" : "Kompatibilitás ellenőrzése"}
            </button>
            <button type="button" onClick={reset} className="btn-ghost py-3">
              <RotateCcw className="h-4 w-4" />
              Mezők törlése
            </button>
          </div>
        </form>

        {/* Eredmény */}
        <div className="space-y-5">
          {result ? (
            <>
              <ResultCard result={result} />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveResult}
                  disabled={saved}
                  className={cn("btn-outline", saved && "opacity-70")}
                >
                  {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {saved ? "Elmentve" : "Eredmény mentése"}
                </button>
                <Link href="/fiok" className="btn-ghost">
                  <BookmarkPlus className="h-4 w-4" />
                  Mentett ellenőrzések
                </Link>
              </div>
              {!currentUser && (
                <p className="text-xs text-graphite-500">
                  Az eredmény mentéséhez{" "}
                  <Link href="/bejelentkezes" className="font-semibold text-brand-400 hover:text-brand-300">
                    jelentkezz be
                  </Link>
                  .
                </p>
              )}
            </>
          ) : (
            <div className="card p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-sm bg-brand-500/10 text-brand-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-bold text-white">Itt jelenik meg az eredmény</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-graphite-300">
                {[
                  "Add meg a jármű és az alkatrész adatait, majd indítsd el az ellenőrzést.",
                  "Az eredmény: kompatibilis, nem kompatibilis vagy nem biztos.",
                  "A kiértékelés az adatbázis kompatibilitási (fitments) rekordjain alapul.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-start gap-2 rounded-sm border border-ink-700 bg-ink-900/50 px-3.5 py-3 text-xs text-graphite-400">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                Ha az alkatrészhez nincs kompatibilitási rekord a kiválasztott járműre, az eredmény „nem biztos” lesz –
                ez nem jelent jóváhagyást.
              </div>
            </div>
          )}

          <DbNotice />
        </div>
      </div>
    </div>
    </>
  );
}
