import type { CarMake, Generation } from "./types";

// ---------------------------------------------------------------------------
// Jármű-katalógus segédfüggvények.
//
// A katalógus kizárólag az adatbázisból (vehicle_brands / vehicle_models /
// vehicle_engines) származik. Itt nincs beépített demó adat: a feloldók a
// betöltött katalógusból dolgoznak, és ha valamit nem találnak, undefined-ot
// adnak vissza (a hívó ezt megfelelően kezeli).
// ---------------------------------------------------------------------------

export function findMake(brands: CarMake[], makeId: string): CarMake | undefined {
  return brands.find((b) => b.id === makeId);
}

export function findModel(brands: CarMake[], makeId: string, modelId: string) {
  return findMake(brands, makeId)?.models.find((m) => m.id === modelId);
}

export function findGeneration(
  brands: CarMake[],
  makeId: string,
  modelId: string,
  generationId: string,
): Generation | undefined {
  const model = findModel(brands, makeId, modelId);
  const direct = model?.generations.find((g) => g.id === generationId);
  if (direct) return direct;
  // Az adatbázisban a generáció azonosítója a model_id, ezért a márka összes
  // generációja között is keresünk (a modell-szint eltérhet a UI csoportosítástól).
  return findMake(brands, makeId)
    ?.models.flatMap((m) => m.generations)
    .find((g) => g.id === generationId);
}

export function findEngine(
  brands: CarMake[],
  makeId: string,
  modelId: string,
  generationId: string,
  engineId: string,
) {
  return findGeneration(brands, makeId, modelId, generationId)?.engines.find((e) => e.id === engineId);
}

export function formatCarLabel(
  makeName: string,
  modelName: string,
  generationName: string,
  year: number,
  engineName: string,
  engineCode: string,
): string {
  return `${makeName} ${modelName} ${generationName} · ${year} · ${engineName} (${engineCode})`;
}

// ---------------------------------------------------------------------------
// "fits" (makeId:modelId:generationId) formátum feloldása.
// Az admin által megadott kompatibilitási lista olvasható autólistává alakítása
// a betöltött katalógusból. Ahol a katalógus még nem töltötte be a modelleket,
// ott az adott bejegyzés kimarad (nincs kitalált adat).
// ---------------------------------------------------------------------------

export interface FittedCar {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  yearFrom: number;
  yearTo: number;
}

export function resolveFittedCars(brands: CarMake[], fits: string[]): FittedCar[] {
  const out: FittedCar[] = [];
  const seen = new Set<string>();

  for (const entry of fits) {
    const [makeId, modelId, genId] = entry.split(":");
    const make = findMake(brands, makeId);
    if (!make) continue;

    const models = modelId && modelId !== "*" ? make.models.filter((m) => m.id === modelId) : make.models;

    for (const model of models) {
      const gens = genId && genId !== "*" ? model.generations.filter((g) => g.id === genId) : model.generations;

      for (const gen of gens) {
        const key = `${make.id}:${model.id}:${gen.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          makeId: make.id,
          makeName: make.name,
          modelId: model.id,
          modelName: model.name,
          generationId: gen.id,
          generationName: gen.name,
          yearFrom: gen.yearFrom,
          yearTo: gen.yearTo,
        });
      }
    }
  }

  return out;
}
