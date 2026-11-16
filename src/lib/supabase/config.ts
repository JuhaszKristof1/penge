// ---------------------------------------------------------------------------
// Supabase konfiguráció-felismerés.
//
// A projekt adatbázis-alapú: ha a környezeti változók be vannak állítva, a
// katalógus, a keresés és a kompatibilitás a Supabase (PostgreSQL) adatbázisból
// dolgozik. Ha nincsenek beállítva, a felület egyértelmű hibát jelez – nincs
// beépített demó adat és nincs kitalált tartalék.
//
// Csak a nyilvános (kliens-oldali) kulcsokat használjuk: a publishable /
// anon kulcsot. Service_role kulcsot SOHA nem teszünk a kliens kódba.
// ---------------------------------------------------------------------------

/**
 * Olvasási időben kiértékelt env-értékek.
 *
 * A Next.js a `NEXT_PUBLIC_*` változókat build időben behelyettesíti a kliens
 * bundle-be, ezért ezekre közvetlenül kell hivatkozni (nem dinamikus
 * `process.env[name]` kulccsal), különben a csere nem történik meg.
 */
const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RAW_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Normalizált Supabase URL (záró perjel nélkül), vagy null, ha nincs beállítva. */
export const SUPABASE_URL: string | null = RAW_URL ? RAW_URL.replace(/\/+$/, "") : null;

/** A nyilvános (anon / publishable) kulcs, vagy null, ha nincs beállítva. */
export const SUPABASE_ANON_KEY: string | null = RAW_ANON_KEY?.trim() || null;

/** Igaz, ha a Supabase-kapcsolathoz szükséges változók rendelkezésre állnak. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Emberi olvasásra szánt állapotüzenet a diagnosztikához / naplózáshoz. */
export function supabaseStatus(): { configured: boolean; reason: string } {
  if (!SUPABASE_URL && !SUPABASE_ANON_KEY) {
    return {
      configured: false,
      reason: "A NEXT_PUBLIC_SUPABASE_URL és NEXT_PUBLIC_SUPABASE_ANON_KEY nincs beállítva.",
    };
  }
  if (!SUPABASE_URL) {
    return { configured: false, reason: "A NEXT_PUBLIC_SUPABASE_URL nincs beállítva." };
  }
  if (!SUPABASE_ANON_KEY) {
    return { configured: false, reason: "A NEXT_PUBLIC_SUPABASE_ANON_KEY nincs beállítva." };
  }
  return { configured: true, reason: "A Supabase környezeti változók rendben vannak." };
}
