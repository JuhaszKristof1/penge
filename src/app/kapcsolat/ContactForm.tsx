"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "@/components/Toaster";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Add meg a nevedet.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Adj meg érvényes e-mail címet.");
    if (!subject.trim()) return setError("Add meg a tárgyat.");
    if (message.trim().length < 10) return setError("Az üzenet legalább 10 karakter legyen.");

    setSent(true);
    toast.success("Üzenet elküldve. Köszönjük!");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  if (sent) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-sm bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-white">Köszönjük az üzenetet!</h2>
        <p className="mt-2 max-w-md text-sm text-graphite-400">
          Az üzenetet rögzítettük. Ebben a verzióban a rendszer még nem küld automatikus e-mailt, de az űrlap működése és a visszajelzés teljes.
        </p>
        <button type="button" onClick={() => setSent(false)} className="btn-ghost mt-6">
          Új üzenet írása
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold text-white">Kapcsolatfelvételi űrlap</h2>
      <p className="mt-1 text-sm text-graphite-400">Minden mező kötelező.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">
            Név
          </label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kovács Péter" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">
            E-mail
          </label>
          <input
            id="c-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pelda@email.hu"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-subject">
            Tárgy
          </label>
          <input
            id="c-subject"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="pl. Kérdés a kompatibilitás ellenőrzőről"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-message">
            Üzenet
          </label>
          <textarea
            id="c-message"
            className="input min-h-[140px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Írd le a kérdésedet vagy észrevételedet…"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary mt-6 w-full py-3 sm:w-auto">
        <Send className="h-4 w-4" />
        Üzenet küldése
      </button>
    </form>
  );
}
