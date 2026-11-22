"use client";

import { useEffect, useMemo } from "react";
import { ChevronRight, Cog, Gauge, Layers, Loader2, Car as CarIcon } from "lucide-react";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { cn } from "@/lib/utils";

export interface CarSelection {
  makeId: string;
  modelId: string;
  generationId: string;
  year: number | "";
  body: string;
  engineId: string;
}

export const EMPTY_SELECTION: CarSelection = {
  makeId: "",
  modelId: "",
  generationId: "",
  year: "",
  body: "",
  engineId: "",
};

interface Props {
  value: CarSelection;
  onChange: (next: CarSelection) => void;
  className?: string;
}

export function CarSelector({ value, onChange, className }: Props) {
  const {
    brands,
    source,
    ensureModels,
    ensureEngines,
    getMake,
    getModel,
    getGeneration,
    getEngine,
    isLoadingModels,
    isLoadingEngines,
  } = useCatalog();

  const make = useMemo(() => getMake(value.makeId), [getMake, value.makeId]);
  const model = useMemo(() => getModel(value.makeId, value.modelId), [getModel, value.makeId, value.modelId]);
  const generation = useMemo(
    () => getGeneration(value.makeId, value.modelId, value.generationId),
    [getGeneration, value.makeId, value.modelId, value.generationId],
  );

  // Lusta betöltés: márka → modellek, generáció → motorok (csak adatbázis módban).
  useEffect(() => {
    if (value.makeId) ensureModels(value.makeId);
  }, [ensureModels, value.makeId]);

  useEffect(() => {
    // Az adatbázisban a generáció azonosítója a vehicle_models.id, ehhez
    // töltjük le a motorokat.
    if (value.makeId && value.generationId) ensureEngines(value.makeId, value.generationId);
  }, [ensureEngines, value.makeId, value.generationId]);

  const years = useMemo(() => {
    if (!generation) return [];
    const out: number[] = [];
    for (let y = generation.yearTo; y >= generation.yearFrom; y--) out.push(y);
    return out;
  }, [generation]);

  const engine = useMemo(
    () => getEngine(value.makeId, value.modelId, value.generationId, value.engineId),
    [getEngine, value.makeId, value.modelId, value.generationId, value.engineId],
  );

  const set = (patch: Partial<CarSelection>) => onChange({ ...value, ...patch });

  const steps = [
    { done: !!value.makeId, label: "Márka" },
    { done: !!value.modelId, label: "Modell" },
    { done: !!value.generationId, label: "Generáció" },
    { done: value.year !== "", label: "Évjárat" },
    { done: !!value.body, label: "Karosszéria" },
    { done: !!value.engineId, label: "Motor" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <CarIcon className="h-4 w-4 text-brand-400" />
          Autó kiválasztása
          {source === "database" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Adatbázis
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-graphite-400">
          {doneCount}/{steps.length} kitöltve
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SelectField label="Márka" icon={<CarIcon className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.makeId}
            onChange={(e) =>
              set({ makeId: e.target.value, modelId: "", generationId: "", year: "", body: "", engineId: "" })
            }
          >
            <option value="">Válassz márkát…</option>
            {brands.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Modell" icon={<CarIcon className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.modelId}
            disabled={!make || isLoadingModels(value.makeId)}
            onChange={(e) => set({ modelId: e.target.value, generationId: "", year: "", body: "", engineId: "" })}
          >
            <option value="">
              {!make
                ? "Előbb márka"
                : isLoadingModels(value.makeId)
                  ? "Betöltés…"
                  : make.models.length === 0
                    ? "Nincs modell"
                    : "Válassz modellt…"}
            </option>
            {make?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Generáció" icon={<Layers className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.generationId}
            disabled={!model}
            onChange={(e) => set({ generationId: e.target.value, year: "", body: "", engineId: "" })}
          >
            <option value="">{model ? "Válassz generációt…" : "Előbb modell"}</option>
            {model?.generations.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Évjárat" icon={<Gauge className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.year}
            disabled={!generation}
            onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : "" })}
          >
            <option value="">{generation ? "Válassz évet…" : "Előbb generáció"}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Karosszéria" icon={<CarIcon className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.body}
            disabled={!generation}
            onChange={(e) => set({ body: e.target.value })}
          >
            <option value="">{generation ? "Válassz típust…" : "Előbb generáció"}</option>
            {generation?.bodies.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Motor" icon={<Cog className="h-3.5 w-3.5" />}>
          <select
            className="input"
            value={value.engineId}
            disabled={!generation || isLoadingEngines(value.makeId, value.generationId)}
            onChange={(e) => set({ engineId: e.target.value })}
          >
            <option value="">
              {!generation
                ? "Előbb generáció"
                : isLoadingEngines(value.makeId, value.generationId)
                  ? "Betöltés…"
                  : (generation.engines?.length ?? 0) === 0
                    ? "Nincs motor adat"
                    : "Válassz motort…"}
            </option>
            {(generation?.engines ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.power ? ` · ${e.power} LE` : ""}
              </option>
            ))}
          </select>
        </SelectField>
      </div>

      {isLoadingEngines(value.makeId, value.generationId) && (
        <p className="flex items-center gap-2 text-xs text-graphite-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
          Motoradatok betöltése az adatbázisból…
        </p>
      )}

      {engine && (
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-ink-700 bg-ink-900/60 px-4 py-3 text-xs">
          <span className="font-semibold text-brand-300">Motorkód:</span>
          <span className="font-mono text-white">{engine.code}</span>
          <span className="text-graphite-600">·</span>
          <span className="text-graphite-400">Üzemanyag: {engine.fuel}</span>
          <span className="text-graphite-600">·</span>
          <span className="text-graphite-400">Hengerűrtartalom: {engine.displacement} cm³</span>
          <span className="text-graphite-600">·</span>
          <span className="text-graphite-400">Teljesítmény: {engine.power} LE</span>
        </div>
      )}

      {generation && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-graphite-500">
          <span className="font-semibold uppercase tracking-wide text-graphite-400">Útvonal:</span>
          <span>{make?.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{model?.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{generation.name}</span>
          {value.year !== "" && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{value.year}</span>
            </>
          )}
          {value.body && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{value.body}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
