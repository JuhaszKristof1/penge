"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";

// ---------------------------------------------------------------------------
// Jelszó-visszaállítás.
//
// Két mód:
//   1. Kérés: a felhasználó megadja az e-mail címét, és kap egy visszaállító
//      linket (Supabase Auth resetPasswordForEmail).
//   2. Új jelszó: a linkre kattintva a Supabase `PASSWORD_RECOVERY` eseményt
//      küld, ilyenkor jelenik meg az új jelszó megadása.
// ---------------------------------------------------------------------------

export function PasswordResetForm() {
  const { sendPasswordReset, updatePassword } = useApp();

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // A visszaállító linkre kattintva a Supabase munkamenetet hoz létre és
    // PASSWORD_RECOVERY eseményt küld.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("access_token")) setRecoveryMode(true);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const res = await sendPasswordReset(email);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Hiba a kérés feldolgozása közben.");
      return;
    }
    setNotice("Elküldtük a visszaállító linket. Nézd meg az e-mail fiókodat (a spam mappát is).");
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password !== confirm) {
      setError("A két jelszó nem egyezik.");
      return;
    }
    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Hiba a jelszó módosítása közben.");
      return;
    }
    setNotice("A jelszavad frissült. Most már bejelentkezhetsz az új jelszóval.");
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="card w-full max-w-md p-6 shadow-card sm:p-8">
        <LogoMark className="h-11 w-11" />
        <h1 className="mt-5 font-display text-xl font-extrabold text-white">
          {recoveryMode ? "Új jelszó megadása" : "Elfelejtett jelszó"}
        </h1>
        <p className="mt-1 text-sm text-graphite-400">
          {recoveryMode
            ? "Add meg az új jelszavadat."
            : "Add meg az e-mail címedet, és elküldjük a jelszó-visszaállító linket."}
        </p>

        {recoveryMode ? (
          <form onSubmit={submitNewPassword} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="new-password">
                Új jelszó
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="new-password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-graphite-500">Legalább 6 karakter.</p>
            </div>

            <div>
              <label className="label" htmlFor="new-password-confirm">
                Új jelszó megerősítése
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="new-password-confirm"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && <ErrorBox message={error} />}
            {notice && <NoticeBox message={notice} />}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? "Feldolgozás…" : "Jelszó mentése"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={submitRequest} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="reset-email">
                E-mail cím
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="reset-email"
                  type="email"
                  className="input pl-10"
                  placeholder="pelda@email.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {error && <ErrorBox message={error} />}
            {notice && <NoticeBox message={notice} />}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? "Feldolgozás…" : "Visszaállító link kérése"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-ink-700 pt-5 text-center text-sm text-graphite-400">
          <Link href="/bejelentkezes" className="font-semibold text-brand-400 hover:text-brand-300">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function NoticeBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
