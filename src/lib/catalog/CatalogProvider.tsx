// ---------------------------------------------------------------------------
// Katalógus provider (kizárólag adatbázis).
//
// A katalógus (márkák → modellek → motorok, kategóriák, alkatrészek) a Supabase
// adatbázisból származik. Nincs beépített demó adat és nincs automatikus
// tartalék: ha az adatbázis nem elérhető vagy üres, a felület egyértelmű hibát
// jelez.
//
// A márkák betöltése után a modellek és motorok LUSTA módon, igény szerint
// töltődnek (márkaválasztás → modellek, modellválasztás → motorok).
// ---------------------------------------------------------------------------

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CarMake, CarModel, Engine, Generation, Part } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { probeSupabase } from "@/lib/supabase/client";
import {
  fetchBrands,
  fetchCategories,
  fetchEnginesByModel,
  fetchModelsByBrand,
  fetchOeNumbersForParts,
  fetchParts,
  findPartIdsByOeNumber,
  findPartsByName,
  findPartsBySku,
} from "@/lib/supabase/queries";
import {
  mapBrand,
  mapEngine,
  mapModelToGeneration,
  mapPart,
  type CategoryRow,
  type PartRow,
} from "@/lib/supabase/mappers";
import { findEngine, findGeneration, findMake, findModel } from "@/lib/cars";

export type CatalogStatus = "loading" | "ready" | "unavailable";

interface CatalogValue {
  /** Az induló (márka-szintű) betöltés befejeződött-e. */
  ready: boolean;
  /** A katalógus állapota. "unavailable" = nincs adatbázis-kapcsolat. */
  status: CatalogStatus;
  /** Emberi olvasásra szánt állapotüzenet. */
  message: string;
  /** Az adatforrás: "database", ha az adatbázis elérhető, egyébként "none". */
  source: "database" | "none";
  /** Igaz, ha az adatbázis elérhető és a katalógus betöltődött. */
  dbAvailable: boolean;

  brands: CarMake[];
  categories: string[];
  parts: Part[];

  /** Modellek lusta betöltése egy márkához (idempotens). */
  ensureModels: (brandId: string) => void;
  /** Motorok lusta betöltése egy modellhez (idempotens). */
  ensureEngines: (makeId: string, modelId: string) => void;

  getMake: (makeId: string) => CarMake | undefined;
  getModel: (makeId: string, modelId: string) => CarModel | undefined;
  getGeneration: (makeId: string, modelId: string, generationId: string) => Generation | undefined;
  getEngine: (makeId: string, modelId: string, generationId: string, engineId: string) => Engine | undefined;
  getPart: (partId: string) => Part | undefined;

  isLoadingModels: (brandId: string) => boolean;
  isLoadingEngines: (makeId: string, modelId: string) => boolean;

  /** Adatbázis-alapú alkatrész-keresés (OE szám → cikkszám → név/gyártó). */
  searchParts: (term: string) => Promise<Part[]>;
  /** A katalógus újratöltése az adatbázisból (admin módosítás után). */
  refresh: () => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [message, setMessage] = useState("Adatbázis-katalógus betöltése…");
  const [brands, setBrands] = useState<CarMake[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const modelsLoaded = useRef<Set<string>>(new Set());
  const enginesLoaded = useRef<Set<string>>(new Set());
  const loadingModels = useRef<Set<string>>(new Set());
  const loadingEngines = useRef<Set<string>>(new Set());
  // Gyorsítótár: a lustán betöltött modellek/motorok, hogy az induló (márka-szintű)
  // betöltés ne dobja el a párhuzamosan, URL-előtöltésből betöltött adatokat.
  const modelsByBrand = useRef<Map<string, CarModel[]>>(new Map());
  const enginesByModel = useRef<Map<string, Engine[]>>(new Map());
  const [loadingModelKeys, setLoadingModelKeys] = useState<Set<string>>(new Set());
  const [loadingEngineKeys, setLoadingEngineKeys] = useState<Set<string>>(new Set());
  const categoryNameById = useRef<Map<string, string>>(new Map());
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const mapPartRows = useCallback(async (rows: PartRow[]): Promise<Part[]> => {
    if (rows.length === 0) return [];
    const oeRes = await fetchOeNumbersForParts(rows.map((p) => p.id));
    const oeByPart = (oeRes.data ?? []).reduce((acc, row) => {
      const list = acc.get(row.part_id) ?? [];
      list.push(row.oe_number);
      acc.set(row.part_id, list);
      return acc;
    }, new Map<string, string[]>());
    return rows.map((row) => mapPart(row, categoryNameById.current.get(row.category_id ?? "") ?? "Egyéb", oeByPart.get(row.id) ?? []));
  }, []);

  // A betöltött márkához visszafűzi a gyorsítótárban lévő modelleket/motorokat.
  const applyCachedModels = useCallback((brand: CarMake): CarMake => {
    const models = modelsByBrand.current.get(brand.id);
    if (!models) return brand;
    return {
      ...brand,
      models: models.map((m) => ({
        ...m,
        generations: m.generations.map((g) => ({ ...g, engines: enginesByModel.current.get(g.id) ?? g.engines })),
      })),
    };
  }, []);

  // --- Kezdeti betöltés ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      modelsLoaded.current = new Set();
      enginesLoaded.current = new Set();
      setStatus("loading");
      if (!isSupabaseConfigured()) {
        if (cancelled) return;
        setStatus("unavailable");
        setMessage("Nincs Supabase konfiguráció (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
        setReady(true);
        return;
      }

      const probe = await probeSupabase();
      if (cancelled) return;

      if (!probe.reachable) {
        setStatus("unavailable");
        setMessage(probe.message);
        setReady(true);
        return;
      }

      const [brandRes, catRes, partRes] = await Promise.all([fetchBrands(), fetchCategories(), fetchParts()]);
      if (cancelled) return;

      if (brandRes.error) {
        setStatus("unavailable");
        setMessage(`Hiba a márkák betöltésekor: ${brandRes.error}`);
        setReady(true);
        return;
      }

      const brandRows = brandRes.data ?? [];
      const catRows: CategoryRow[] = catRes.data ?? [];
      const partRows = partRes.data ?? [];

      categoryNameById.current = new Map(catRows.map((c) => [c.id, c.name]));

      const mappedBrands = brandRows.map(mapBrand).map(applyCachedModels);
      const mappedParts = await mapPartRows(partRows);
      if (cancelled) return;

      setBrands(mappedBrands);
      setCategories(catRows.map((c) => c.name));
      setParts(mappedParts);
      setStatus("ready");
      setMessage(
        brandRows.length === 0
          ? "Az adatbázis elérhető, de a jármű-katalógus üres. Importálj adatot az admin felületen."
          : `${mappedBrands.length} márka, ${mappedParts.length} alkatrész betöltve az adatbázisból.`,
      );
      setReady(true);
    }

    load().catch((err) => {
      if (cancelled) return;
      setStatus("unavailable");
      setMessage(`Hiba a katalógus betöltésekor: ${err instanceof Error ? err.message : String(err)}`);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [mapPartRows, reloadKey]);

  // --- Modellek lusta betöltése -------------------------------------------
  const ensureModels = useCallback((brandId: string) => {
    if (modelsLoaded.current.has(brandId) || loadingModels.current.has(brandId)) return;
    loadingModels.current.add(brandId);
    setLoadingModelKeys(new Set(loadingModels.current));

    fetchModelsByBrand(brandId)
      .then((res) => {
        const rows = res.data ?? [];
        const generations = rows.map(mapModelToGeneration);
        const groups = new Map<string, CarModel>();
        rows.forEach((row, i) => {
          const key = row.name;
          if (!groups.has(key)) {
            groups.set(key, { id: `${brandId}-${slugify(row.name)}`, name: row.name, generations: [] });
          }
          groups.get(key)!.generations.push(generations[i]);
        });
        const models = Array.from(groups.values());
        modelsByBrand.current.set(brandId, models);
        setBrands((prev) =>
          prev.map((b) => (b.id !== brandId ? b : { ...b, models })),
        );
        modelsLoaded.current.add(brandId);
      })
      .finally(() => {
        loadingModels.current.delete(brandId);
        setLoadingModelKeys(new Set(loadingModels.current));
      });
  }, []);

  // --- Motorok lusta betöltése --------------------------------------------
  const ensureEngines = useCallback((makeId: string, modelId: string) => {
    const key = `${makeId}:${modelId}`;
    if (enginesLoaded.current.has(key) || loadingEngines.current.has(key)) return;
    loadingEngines.current.add(key);
    setLoadingEngineKeys(new Set(loadingEngines.current));

    // A generáció azonosítója a valós DB model_id.
    fetchEnginesByModel(modelId)
      .then((res) => {
        const engines = (res.data ?? []).map(mapEngine);
        enginesByModel.current.set(modelId, engines);
        setBrands((prev) =>
          prev.map((b) => {
            if (b.id !== makeId) return b;
            return {
              ...b,
              models: b.models.map((m) => {
                if (m.id !== modelId && !m.generations.some((g) => g.id === modelId)) return m;
                return {
                  ...m,
                  generations: m.generations.map((g) => (g.id === modelId ? { ...g, engines } : g)),
                };
              }),
            };
          }),
        );
        enginesLoaded.current.add(key);
      })
      .finally(() => {
        loadingEngines.current.delete(key);
        setLoadingEngineKeys(new Set(loadingEngines.current));
      });
  }, []);

  const isLoadingModels = useCallback((brandId: string) => loadingModelKeys.has(brandId), [loadingModelKeys]);
  const isLoadingEngines = useCallback(
    (makeId: string, modelId: string) => loadingEngineKeys.has(`${makeId}:${modelId}`),
    [loadingEngineKeys],
  );

  const getMake = useCallback((makeId: string) => findMake(brands, makeId), [brands]);
  const getModel = useCallback((makeId: string, modelId: string) => findModel(brands, makeId, modelId), [brands]);
  const getGeneration = useCallback(
    (makeId: string, modelId: string, generationId: string) => findGeneration(brands, makeId, modelId, generationId),
    [brands],
  );
  const getEngine = useCallback(
    (makeId: string, modelId: string, generationId: string, engineId: string) =>
      findEngine(brands, makeId, modelId, generationId, engineId),
    [brands],
  );
  const getPart = useCallback((partId: string) => parts.find((p) => p.id === partId), [parts]);

  // --- Adatbázis-alapú alkatrész-keresés ----------------------------------
  const searchParts = useCallback(
    async (term: string): Promise<Part[]> => {
      const value = term.trim();
      if (!value) return [];

      const seen = new Map<string, PartRow>();

      const oeRes = await findPartIdsByOeNumber(value);
      const oePartIds = Array.from(new Set((oeRes.data ?? []).map((r) => r.part_id)));

      const skuRes = await findPartsBySku(value);
      const nameRes = await findPartsByName(value);

      (skuRes.data ?? []).forEach((r) => seen.set(r.id, r));
      (nameRes.data ?? []).forEach((r) => seen.set(r.id, r));

      if (oePartIds.length > 0) {
        const all = await fetchParts();
        (all.data ?? []).filter((r) => oePartIds.includes(r.id)).forEach((r) => seen.set(r.id, r));
      }

      return mapPartRows(Array.from(seen.values()));
    },
    [mapPartRows],
  );

  const value = useMemo<CatalogValue>(
    () => ({
      ready,
      status,
      message,
      source: status === "ready" ? "database" : "none",
      dbAvailable: status === "ready",
      brands,
      categories,
      parts,
      ensureModels,
      ensureEngines,
      getMake,
      getModel,
      getGeneration,
      getEngine,
      getPart,
      isLoadingModels,
      isLoadingEngines,
      searchParts,
      refresh,
    }),
    [
      ready,
      status,
      message,
      brands,
      categories,
      parts,
      ensureModels,
      ensureEngines,
      getMake,
      getModel,
      getGeneration,
      getEngine,
      getPart,
      isLoadingModels,
      isLoadingEngines,
      searchParts,
      refresh,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
