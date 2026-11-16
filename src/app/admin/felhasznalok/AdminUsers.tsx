"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Search, ShieldCheck, User as UserIcon } from "lucide-react";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { apiErrorMessage } from "@/lib/api";

// Admin felhasználólista a valós `profiles` táblából (/api/admin/users).

export function AdminUsers() {
  const { allUsers, refreshAdminData, adminLoading } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    refreshAdminData().catch((err) => setError(apiErrorMessage(err)));
  }, [refreshAdminData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [allUsers, query]);

  return (
    <div>
      <SectionHeading
        eyebrow="Admin"
        title="Felhasználók"
        sub="A regisztrált felhasználók listája a Supabase profiles táblájából."
        className="mb-6"
      />

      <div className="mb-5 relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
        <input
          className="input pl-10"
          placeholder="Keresés név vagy e-mail szerint…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {adminLoading ? (
        <p className="flex items-center gap-2 py-10 text-sm text-graphite-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Felhasználók betöltése…
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="h-6 w-6" />}
          title="Nincs megjeleníthető felhasználó"
          description={allUsers.length === 0 ? "Még egyetlen regisztrált felhasználó sincs." : "A keresés nem adott találatot."}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-graphite-400">
              <tr>
                <th className="px-4 py-3">Felhasználó</th>
                <th className="hidden px-4 py-3 sm:table-cell">E-mail</th>
                <th className="px-4 py-3">Szerepkör</th>
                <th className="hidden px-4 py-3 md:table-cell">Regisztrált</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {filtered.map((u) => (
                <tr key={u.id} className="bg-ink-900/40 transition-colors hover:bg-ink-850/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: u.avatarColor }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate font-semibold text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-graphite-300 sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <Badge tone="brand">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Felhasználó</Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-graphite-400 md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString("hu-HU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
