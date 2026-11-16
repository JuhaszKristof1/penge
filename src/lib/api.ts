// ---------------------------------------------------------------------------
// Kliensoldali API segédfüggvény.
//
// A felhasználói adatok (garázs, kedvencek, ellenőrzések, előzmények) és az
// admin műveletek a Next.js API route-okon keresztül érik el az adatbázist. A
// hívásokhoz a Supabase Auth access tokent csatoljuk (Bearer), a szerver pedig
// ellenőrzi azt, és a service_role kulccsal, a felhasználóra szűrve dolgozik.
// ---------------------------------------------------------------------------

import { getSupabaseClient } from "./supabase/client";

export interface ApiError {
  status: number;
  message: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (body && (body.error || body.message)) || `Hiba (${res.status})`;
    throw { status: res.status, message } as ApiError;
  }
  return body as T;
}

export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as ApiError).message);
  return err instanceof Error ? err.message : String(err);
}
