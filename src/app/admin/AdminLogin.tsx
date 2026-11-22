"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { DbNotice } from "@/components/ui";
import { useApp } from "@/context/AppContext";

// Admin belépő. Valós Supabase Auth-tal hitelesít; csak admin szerepkörű
// felhasználó jut be az admin felületre.

export function AdminLogin() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Hiba a bejelentkezés során.");
      return;
    }
    if (res.user?.role !== "admin") {
      setError("Ez a fiók nem adminisztrátor. Jelentkezz be admin fiókkal az admin felület eléréséhez.");
    }
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-sm bg-brand-500/10 text-brand-400">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-white">Admin belépés</h1>
          <p className="mt-2 text-sm text-graphite-400">
            Az admin felület eléréséhez adminisztrátor jogosultságú fiók szükséges.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">
                E-mail cím
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="admin-email"
                  type="email"
                  className="input pl-10"
                  placeholder="admin@gridline.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="admin-password">
                Jelszó
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="admin-password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? "Belépés…" : "Belépés"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6">
            <DbNotice compact />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-graphite-500">
          <LogoMark className="h-4 w-4" />
          GRIDLINE admin
        </div>
      </div>
    </div>
  );
}
