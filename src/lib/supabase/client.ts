// ---------------------------------------------------------------------------
// Supabase kliens (böngésző).
//
// A klienst lazy módon, egyszer hozzuk létre (memoizálva), és csak akkor, ha a
// konfiguráció rendelkezésre áll. Ha nincs beállítva, a hívók egyértelmű hibát
// kapnak – az alkalmazás NEM esik vissza kitalált adatra.
//
// Az auth munkamenetet perzisztáljuk (persistSession), mert a bejelentkezés
// valós Supabase Auth-tal történik.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured, supabaseStatus } from "./config";

let cached: SupabaseClient | null = null;

/** Visszaadja a memoizált Supabase klienst, vagy null-t, ha nincs beállítva. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;

  cached = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "autofit-auth",
    },
    global: {
      headers: { "x-application-name": "autofit-ai" },
    },
  });
  return cached;
}

export interface SupabaseProbe {
  configured: boolean;
  reachable: boolean;
  /** A vehicle_brands tábla sorainak száma (ha elérhető). */
  brandCount: number | null;
  error?: string;
  message: string;
}

/**
 * Kapcsolat-ellenőrzés: be van-e állítva a Supabase, és elérhető-e a
 * vehicle_brands tábla. Csak olvas (count), nem módosít semmit.
 */
export async function probeSupabase(): Promise<SupabaseProbe> {
  const status = supabaseStatus();
  if (!status.configured) {
    return { configured: false, reachable: false, brandCount: null, message: status.reason };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { configured: false, reachable: false, brandCount: null, message: "A Supabase kliens nem hozható létre." };
  }

  try {
    // Szándékosan GET + limit (nem head), hogy a hiányzó tábla / RLS hiba is
    // megbízhatóan kiderüljön.
    const { data, error } = await supabase.from("vehicle_brands").select("id").limit(1);

    if (error) {
      return {
        configured: true,
        reachable: false,
        brandCount: null,
        error: `${error.code ?? ""} ${error.message}`.trim(),
        message:
          "A Supabase elérhető, de a vehicle_brands lekérdezés hibát adott (ellenőrizd a séma SQL-t, a tábla nevét és az RLS policy-kat).",
      };
    }

    return {
      configured: true,
      reachable: true,
      brandCount: Array.isArray(data) ? data.length : 0,
      message: `Kapcsolat rendben. vehicle_brands elérhető (${Array.isArray(data) ? data.length : 0} sor).`,
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      brandCount: null,
      error: err instanceof Error ? err.message : String(err),
      message: "Hálózati hiba a Supabase elérése közben.",
    };
  }
}
