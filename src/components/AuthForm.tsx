"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Car, CheckCircle2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { LogoMark } from "./Logo";
import { DbNotice } from "./ui";
import { toast } from "./Toaster";
import { useApp } from "@/context/AppContext";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { register, login, currentUser, ready } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  useEffect(() => {
    if (ready && currentUser) router.replace(currentUser.role === "admin" ? "/admin" : "/fiok");
  }, [ready, currentUser, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (isRegister) {
      if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        setError("A két e-mail cím nem egyezik.");
        return;
      }
      if (password !== confirm) {
        setError("A két jelszó nem egyezik.");
        return;
      }
      setSubmitting(true);
      const res = await register(name, email, password);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? "Hiba a regisztráció során.");
        return;
      }
      if (res.needsEmailConfirm) {
        setNotice(
          "Sikeres regisztráció! A fiók aktiválásához erősítsd meg az e-mail címedet a kapott levélben, majd jelentkezz be.",
        );
        return;
      }
      toast.success("Sikeres regisztráció! Üdvözlünk az AutoFit AI-nál.");
      router.push("/fiok");
    } else {
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? "Hiba a bejelentkezés során.");
        return;
      }
      toast.success(`Üdv újra, ${res.user?.name.split(" ")[0] ?? ""}!`);
      router.push(res.user?.role === "admin" ? "/admin" : "/fiok");
    }
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        {/* Bal oldali bemutató */}
        <div className="hidden lg:block">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight text-white">
            {isRegister ? (
              <>
                Csatlakozz az AutoFit AI <span className="text-brand-500">platformjához</span>
              </>
            ) : (
              <>
                Üdv újra az <span className="text-brand-500">AutoFit AI</span>-nál
              </>
            )}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-graphite-400">
            A fiókoddal elmented az autóidat, nyomon követheted a kompatibilitási ellenőrzéseidet és kedvencnek
            jelölheted a fontos alkatrészeket.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: Car, text: "Autógarázs: mentsd és kezeld a járműveidet" },
              { icon: CheckCircle2, text: "Mentett kompatibilitási ellenőrzések és eredmények" },
              { icon: ShieldCheck, text: "Kedvenc alkatrészek egy helyen" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-graphite-300">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-800 text-brand-400">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <DbNotice />
          </div>
        </div>

        {/* Jobb oldali űrlap */}
        <div className="card p-6 shadow-card sm:p-8">
          <div className="mb-6 lg:hidden">
            <LogoMark className="h-11 w-11" />
          </div>

          <h2 className="font-display text-xl font-extrabold text-white">
            {isRegister ? "Fiók létrehozása" : "Bejelentkezés"}
          </h2>
          <p className="mt-1 text-sm text-graphite-400">
            {isRegister ? "Töltsd ki az adatokat a regisztrációhoz." : "Add meg az e-mail címed és a jelszavad."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="name">
                  Teljes név
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                  <input
                    id="name"
                    className="input pl-10"
                    placeholder="Kovács Péter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                E-mail cím
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="email"
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

            {isRegister && (
              <div>
                <label className="label" htmlFor="confirmEmail">
                  E-mail cím megerősítése
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                  <input
                    id="confirmEmail"
                    type="email"
                    className="input pl-10"
                    placeholder="pelda@email.hu"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="password">
                Jelszó
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                <input
                  id="password"
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                />
              </div>
              {isRegister && <p className="mt-1.5 text-xs text-graphite-500">Legalább 6 karakter.</p>}
              {!isRegister && (
                <div className="mt-2 text-right">
                  <Link
                    href="/jelszo-visszaallitas"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    Elfelejtetted a jelszavad?
                  </Link>
                </div>
              )}
            </div>

            {isRegister && (
              <div>
                <label className="label" htmlFor="confirm">
                  Jelszó megerősítése
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
                  <input
                    id="confirm"
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
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {notice && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? "Feldolgozás…" : isRegister ? "Regisztráció" : "Bejelentkezés"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 border-t border-ink-700 pt-5 text-center text-sm text-graphite-400">
            {isRegister ? (
              <>
                Már van fiókod?{" "}
                <Link href="/bejelentkezes" className="font-semibold text-brand-400 hover:text-brand-300">
                  Bejelentkezés
                </Link>
              </>
            ) : (
              <>
                Még nincs fiókod?{" "}
                <Link href="/regisztracio" className="font-semibold text-brand-400 hover:text-brand-300">
                  Regisztráció
                </Link>
              </>
            )}
          </div>

          {!isRegister && (
            <p className="mt-4 text-center text-xs leading-relaxed text-graphite-500">
              Admin fiókkal a{" "}
              <Link href="/admin" className="font-semibold text-brand-400 hover:text-brand-300">
                /admin
              </Link>{" "}
              felületen is be tudsz jelentkezni.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
