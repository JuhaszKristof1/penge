// ---------------------------------------------------------------------------
// Szerveroldali Supabase segédfüggvények (kizárólag API route-okban használva).
//
// A service_role kulcs SOHA nem kerül a kliens bundle-be: csak szerveroldalon,
// a `SUPABASE_SERVICE_ROLE_KEY` környezeti változóból olvassuk.
//
// A felhasználói adatok (garázs, kedvencek, ellenőrzések) írása és olvasása
// ezeken az API route-okon keresztül történik: a szerver ellenőrzi a hívó
// Supabase access tokenjét, majd a service_role kulccsal, a felhasználóra
// szűrve hajtja végre a műveletet.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/** Szerveroldali admin (service_role) kliens, vagy null, ha nincs beállítva. */
export function getAdminClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isSupabaseConfigured() || !serviceKey) return null;
  return createClient(SUPABASE_URL as string, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Szerveroldali anon kliens a token-ellenőrzéshez (auth.getUser). */
function getAnonClient(): SupabaseClient | null {
  if (!isSupabaseConfigured() || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthContext {
  userId: string;
  email: string | null;
  role: "user" | "admin";
}

/** Kiolvassa a Bearer tokent a kérés fejlécéből. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

/**
 * Ellenőrzi a hívó access tokenjét, és visszaadja a felhasználót a profiles
 * táblából (a szerepkör innen származik). `null`, ha nincs érvényes munkamenet.
 */
export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const anon = getAnonClient();
  const admin = getAdminClient();
  if (!anon || !admin) return null;

  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = (profile?.role as "user" | "admin" | undefined) ?? "user";
  return { userId: data.user.id, email: profile?.email ?? data.user.email ?? null, role };
}

/** Igaz, ha a Supabase szerveroldali kulcsok rendelkezésre állnak. */
export function isServerConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** Egységes JSON válasz. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
