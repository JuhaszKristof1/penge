"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { mapProfile, type ProfileRow, type UserVehicleRow } from "@/lib/supabase/mappers";
import type { GarageCar, Part, SavedCheck, SearchLogEntry, User } from "@/lib/types";

// ---------------------------------------------------------------------------
// Alkalmazás-szintű állapot.
//
// A hitelesítés valós Supabase Auth-tal történik, a felhasználói adatok
// (garázs, kedvencek, ellenőrzések, előzmények) pedig az adatbázisban
// (user_vehicles, favorites, compatibility_reports, search_history) tárolódnak
// a szerveroldali API route-okon keresztül.
// ---------------------------------------------------------------------------

interface AppContextValue {
  ready: boolean;

  // Auth (Supabase Auth + profiles)
  currentUser: User | null;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; needsEmailConfirm?: boolean }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateProfile: (patch: { name?: string; avatarColor?: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>;

  // Garage (user_vehicles)
  garage: GarageCar[];
  garageLoading: boolean;
  addCar: (car: Omit<GarageCar, "id" | "createdAt" | "isDefault">) => Promise<void>;
  updateCar: (id: string, patch: Partial<GarageCar>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  setDefaultCar: (id: string) => Promise<void>;

  // Favorites (favorites)
  favorites: string[];
  toggleFavorite: (partId: string) => Promise<void>;
  isFavorite: (partId: string) => boolean;

  // Checks (compatibility_reports)
  checks: SavedCheck[];
  saveCheck: (check: SavedCheck) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  clearChecks: () => Promise<void>;

  // Catalog parts (adatbázisból)
  catalogParts: Part[];
  /** Az összes elérhető alkatrész (id szerint deduplikálva). */
  allParts: Part[];
  findPart: (id: string) => Part | undefined;

  // Search log / stats (search_history)
  searchLog: SearchLogEntry[];
  logSearch: (entry: Omit<SearchLogEntry, "id" | "at">) => Promise<void>;
  clearSearchLog: () => Promise<void>;

  // Admin
  allUsers: User[];
  refreshAdminData: () => Promise<void>;
  adminLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { parts: catalogParts } = useCatalog();

  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [garage, setGarage] = useState<GarageCar[]>([]);
  const [garageLoading, setGarageLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checks, setChecks] = useState<SavedCheck[]>([]);
  const [searchLog, setSearchLog] = useState<SearchLogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // --- Felhasználói adatok betöltése -------------------------------------
  const loadUserData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      setGarage([]);
      setFavorites([]);
      setChecks([]);
      return;
    }

    setGarageLoading(true);
    try {
      const [garageRes, favRes, checksRes] = await Promise.all([
        apiFetch<{ data: UserVehicleRow[] }>("/api/garage"),
        apiFetch<{ data: { part_id: string }[] }>("/api/favorites"),
        apiFetch<{ data: SavedCheck[] }>("/api/checks"),
      ]);
      setGarage(mapVehicles(garageRes.data ?? []));
      setFavorites((favRes.data ?? []).map((f) => f.part_id));
      setChecks(checksRes.data ?? []);
    } catch {
      // Ha az API nem elérhető, üres listákat tartunk (nincs kitalált adat).
    } finally {
      setGarageLoading(false);
    }
  }, []);

  // --- Auth állapot követése ---------------------------------------------
  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setReady(true);
      return;
    }

    async function bootstrap() {
      const { data } = await supabase!.auth.getSession();
      if (!active) return;
      if (data.session) {
        await resolveProfile(data.session.user.id, data.session.user.email ?? "");
      }
      setReady(true);
      if (data.session) await loadUserData();
    }

    async function resolveProfile(userId: string, email: string) {
      try {
        const res = await apiFetch<{ data: ProfileRow | null }>("/api/me");
        if (!active) return;
        if (res.data) {
          setCurrentUser(mapProfile(res.data));
        } else {
          setCurrentUser({ id: userId, name: email.split("@")[0], email, role: "user", createdAt: new Date().toISOString(), avatarColor: "#ff6a00" });
        }
      } catch {
        if (active) setCurrentUser({ id: userId, name: email.split("@")[0], email, role: "user", createdAt: new Date().toISOString(), avatarColor: "#ff6a00" });
      }
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setCurrentUser(null);
        setGarage([]);
        setFavorites([]);
        setChecks([]);
        return;
      }
      resolveProfile(session.user.id, session.user.email ?? "").then(loadUserData);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  // --- Auth műveletek -----------------------------------------------------
  const register = useCallback(async (name: string, email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Nincs adatbázis-kapcsolat (Supabase nincs beállítva)." };
    const normalized = email.trim().toLowerCase();
    if (!name.trim()) return { ok: false, error: "Add meg a nevedet." };
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return { ok: false, error: "Érvénytelen e-mail cím." };
    if (password.length < 6) return { ok: false, error: "A jelszó legalább 6 karakter legyen." };

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/bejelentkezes` : undefined,
      },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    // Ha nincs munkamenet, a projekt e-mail-megerősítést kér: a profil a
    // `on_auth_user_created` triggerrel jön létre a regisztrációkor.
    if (!data.session) {
      return { ok: true, needsEmailConfirm: true };
    }
    await refreshProfile(data.session.user.id);
    await loadUserData();
    return { ok: true };
  }, [loadUserData]);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Nincs adatbázis-kapcsolat (Supabase nincs beállítva)." };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    const user = await refreshProfile(data.user.id);
    await loadUserData();
    return { ok: true, user: user ?? undefined };
  }, [loadUserData]);

  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    setCurrentUser(null);
    setGarage([]);
    setFavorites([]);
    setChecks([]);
  }, []);

  const refreshProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const res = await apiFetch<{ data: ProfileRow | null }>("/api/me");
      if (res.data) {
        const user = mapProfile(res.data);
        setCurrentUser(user);
        return user;
      }
    } catch {
      /* noop */
    }
    return null;
  }, []);

  const updateProfile = useCallback(
    async (patch: { name?: string; avatarColor?: string }) => {
      if (!currentUser) return;
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: patch.name, avatarColor: patch.avatarColor }),
      });
      setCurrentUser((cur) => (cur ? { ...cur, name: patch.name ?? cur.name, avatarColor: patch.avatarColor ?? cur.avatarColor } : cur));
    },
    [currentUser],
  );

  // --- Jelszó-visszaállítás ----------------------------------------------
  const sendPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Nincs adatbázis-kapcsolat (Supabase nincs beállítva)." };
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) return { ok: false, error: "Érvénytelen e-mail cím." };
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/jelszo-visszaallitas` : undefined,
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Nincs adatbázis-kapcsolat (Supabase nincs beállítva)." };
    if (password.length < 6) return { ok: false, error: "A jelszó legalább 6 karakter legyen." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  }, []);

  // --- Garázs -------------------------------------------------------------
  const refreshGarage = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: UserVehicleRow[] }>("/api/garage");
      setGarage(mapVehicles(res.data ?? []));
    } catch (err) {
      throw err;
    }
  }, []);

  const addCar = useCallback(
    async (car: Omit<GarageCar, "id" | "createdAt" | "isDefault">) => {
      await apiFetch("/api/garage", { method: "POST", body: JSON.stringify(car) });
      await refreshGarage();
    },
    [refreshGarage],
  );

  const updateCar = useCallback(
    async (id: string, patch: Partial<GarageCar>) => {
      await apiFetch("/api/garage", { method: "PATCH", body: JSON.stringify({ id, ...patch }) });
      await refreshGarage();
    },
    [refreshGarage],
  );

  const deleteCar = useCallback(
    async (id: string) => {
      await apiFetch(`/api/garage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await refreshGarage();
    },
    [refreshGarage],
  );

  const setDefaultCar = useCallback(
    async (id: string) => {
      await apiFetch("/api/garage", { method: "PATCH", body: JSON.stringify({ id, isDefault: true }) });
      await refreshGarage();
    },
    [refreshGarage],
  );

  // --- Kedvencek ----------------------------------------------------------
  const toggleFavorite = useCallback(async (partId: string) => {
    const res = await apiFetch<{ favorite: boolean }>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ partId }),
    });
    setFavorites((prev) => (res.favorite ? [...prev, partId] : prev.filter((p) => p !== partId)));
  }, []);

  const isFavorite = useCallback((partId: string) => favorites.includes(partId), [favorites]);

  // --- Ellenőrzések -------------------------------------------------------
  const saveCheck = useCallback(async (check: SavedCheck) => {
    try {
      const res = await apiFetch<{ data: SavedCheck }>("/api/checks", {
        method: "POST",
        body: JSON.stringify(check),
      });
      setChecks((prev) => [res.data, ...prev].slice(0, 100));
    } catch {
      // A mentés naplózása nem kritikus; a hibát a hívó felület kezeli.
    }
  }, []);

  const deleteCheck = useCallback(async (id: string) => {
    await apiFetch(`/api/checks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setChecks((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearChecks = useCallback(async () => {
    await apiFetch("/api/checks", { method: "DELETE" });
    setChecks([]);
  }, []);

  // --- Katalógus alkatrészek ---------------------------------------------
  const findPart = useCallback((id: string) => catalogParts.find((p) => p.id === id), [catalogParts]);
  const allParts = useMemo(() => catalogParts, [catalogParts]);

  // --- Keresési napló -----------------------------------------------------
  const logSearch = useCallback(async (entry: Omit<SearchLogEntry, "id" | "at">) => {
    setSearchLog((prev) => [{ ...entry, id: `log-${Date.now().toString(36)}`, at: new Date().toISOString() }, ...prev].slice(0, 200));
    try {
      await apiFetch("/api/search-history", { method: "POST", body: JSON.stringify(entry) });
    } catch {
      /* noop */
    }
  }, []);

  const clearSearchLog = useCallback(async () => {
    await apiFetch("/api/search-history", { method: "DELETE" });
    setSearchLog([]);
  }, []);

  // --- Admin adatok -------------------------------------------------------
  const refreshAdminData = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [usersRes, logRes] = await Promise.all([
        apiFetch<{ data: ProfileRow[] }>("/api/admin/users"),
        apiFetch<{ data: { id: string; type: "search" | "compatibility"; label: string; created_at: string }[] }>(
          "/api/admin/search-history",
        ),
      ]);
      setAllUsers((usersRes.data ?? []).map(mapProfile));
      setSearchLog((logRes.data ?? []).map((s) => ({ id: s.id, type: s.type, label: s.label, at: s.created_at })));
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      currentUser,
      register,
      login,
      logout,
      updateProfile,
      sendPasswordReset,
      updatePassword,
      garage,
      garageLoading,
      addCar,
      updateCar,
      deleteCar,
      setDefaultCar,
      favorites,
      toggleFavorite,
      isFavorite,
      checks,
      saveCheck,
      deleteCheck,
      clearChecks,
      catalogParts,
      allParts,
      findPart,
      searchLog,
      logSearch,
      clearSearchLog,
      allUsers,
      refreshAdminData,
      adminLoading,
    }),
    [
      ready,
      currentUser,
      register,
      login,
      logout,
      updateProfile,
      sendPasswordReset,
      updatePassword,
      garage,
      garageLoading,
      addCar,
      updateCar,
      deleteCar,
      setDefaultCar,
      favorites,
      toggleFavorite,
      isFavorite,
      checks,
      saveCheck,
      deleteCheck,
      clearChecks,
      catalogParts,
      allParts,
      findPart,
      searchLog,
      logSearch,
      clearSearchLog,
      allUsers,
      refreshAdminData,
      adminLoading,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** user_vehicles sorok → GarageCar (a neveket a GET /api/garage oldja fel). */
function mapVehicles(rows: UserVehicleRow[]): GarageCar[] {
  return rows.map((r) => ({
    id: r.id,
    makeId: r.brand_id ?? "",
    makeName: r.brand_name ?? "",
    modelId: r.model_id ?? "",
    modelName: r.model_name ?? "",
    generationId: r.model_id ?? "",
    generationName: r.generation_name ?? r.model_name ?? "",
    year: r.year ?? 0,
    body: r.body ?? "",
    engineId: r.engine_id ?? "",
    engineName: r.engine_name ?? "",
    engineCode: r.engine_code ?? "",
    nickname: r.nickname ?? undefined,
    isDefault: r.is_default,
    createdAt: r.created_at,
  }));
}

/** Supabase Auth hibaüzenetek magyarítása. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Hibás e-mail cím vagy jelszó.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ezzel az e-mail címmel már létezik fiók.";
  if (m.includes("email not confirmed")) return "Az e-mail cím még nincs megerősítve.";
  if (m.includes("password should be")) return "A jelszó túl rövid.";
  return message;
}

export { isSupabaseConfigured };
export { apiErrorMessage };
