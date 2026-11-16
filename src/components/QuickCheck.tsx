"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useCatalog } from "@/lib/catalog/CatalogProvider";

// Főoldali gyors kompatibilitás-kereső. Kiválasztás után átvisz a teljes
// ellenőrző oldalra, előre kitöltött paraméterekkel (URL query).
export function QuickCheck() {
  const router = useRouter();
  const { brands, ensureModels, ensureEngines, getMake, getModel, getGeneration } = useCatalog();
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [generationId, setGenerationId] = useState("");

  const make = useMemo(() => getMake(makeId), [getMake, makeId]);
  const model = useMemo(() => getModel(makeId, modelId), [getModel, makeId, modelId]);
  const generation = useMemo(
    () => getGeneration(makeId, modelId, generationId),
    [getGeneration, makeId, modelId, generationId],
  );

  useEffect(() => {
    if (makeId) ensureModels(makeId);
  }, [ensureModels, makeId]);

  useEffect(() => {
    if (makeId && generationId) ensureEngines(makeId, generationId);
  }, [ensureEngines, makeId, generationId]);

  const canSubmit = !!generation;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const params = new URLSearchParams({ make: makeId, model: modelId, gen: generationId });
    router.push(`/kompatibilitas?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="card relative overflow-hidden p-5 shadow-card sm:p-6"
      aria-label="Gyors kompatibilitás kereső"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-white">Kompatibilitás gyorsellenőrzés</p>
          <p className="text-xs text-graphite-400">Válaszd ki a járműved, és nézd meg, mit tud a rendszer</p>
        </div>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Márka</label>
          <select
            className="input"
            value={makeId}
            onChange={(e) => {
              setMakeId(e.target.value);
              setModelId("");
              setGenerationId("");
            }}
          >
            <option value="">Válassz…</option>
            {brands.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Modell</label>
          <select
            className="input"
            value={modelId}
            disabled={!make}
            onChange={(e) => {
              setModelId(e.target.value);
              setGenerationId("");
            }}
          >
            <option value="">{make ? "Válassz…" : "Előbb márka"}</option>
            {make?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Generáció</label>
          <select
            className="input"
            value={generationId}
            disabled={!model}
            onChange={(e) => setGenerationId(e.target.value)}
          >
            <option value="">{model ? "Válassz…" : "Előbb modell"}</option>
            {model?.generations.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-graphite-500">
          {generation
            ? `Kiválasztva: ${make?.name} ${model?.name} ${generation.name}`
            : "Tipp: a márka → modell → generáció sorrendben haladj."}
        </p>
        <button type="submit" disabled={!canSubmit} className="btn-primary w-full sm:w-auto">
          <Search className="h-4 w-4" />
          Teljes ellenőrzés indítása
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
