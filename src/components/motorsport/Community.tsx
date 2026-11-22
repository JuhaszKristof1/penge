"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MessageSquare, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMotorsport } from "@/lib/motorsport/MotorsportProvider";
import { apiFetch, apiErrorMessage } from "@/lib/api";
import { fetchLapTimes } from "@/lib/supabase/queries";
import { mapLapTime } from "@/lib/supabase/mappers";
import { formatDate, formatLapTime } from "@/lib/motorsport/format";
import type { LapTime } from "@/lib/types";
import { toast } from "@/components/Toaster";

interface DriverRow {
  id: string;
  full_name: string | null;
  avatar_color: string | null;
  bio: string | null;
  country: string | null;
  created_at: string;
}

interface PostRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_color: string | null } | { full_name: string | null; avatar_color: string | null }[] | null;
  tracks?: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

function embed<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export function Community() {
  const { currentUser, ready } = useApp();
  const { tracks, categoryName, status, message } = useMotorsport();

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [leaderLaps, setLeaderLaps] = useState<LapTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [postBody, setPostBody] = useState("");
  const [postTrack, setPostTrack] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const [communityRes, lapsRes] = await Promise.all([
          fetch("/api/community").then((r) => (r.ok ? r.json() : { drivers: [], posts: [] })),
          fetchLapTimes({ limit: 20 }),
        ]);
        setDrivers(communityRes.drivers ?? []);
        setPosts(communityRes.posts ?? []);
        setLeaderLaps((lapsRes.data ?? []).map(mapLapTime));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Versenyzőnként a legjobb köridő.
  const topDrivers = useMemo(() => {
    const byUser = new Map<string, LapTime>();
    for (const lap of leaderLaps) {
      const existing = byUser.get(lap.userId);
      if (!existing || lap.lapTimeMs < existing.lapTimeMs) byUser.set(lap.userId, lap);
    }
    return Array.from(byUser.values()).sort((a, b) => a.lapTimeMs - b.lapTimeMs).slice(0, 8);
  }, [leaderLaps]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postBody.trim()) return;
    setPosting(true);
    try {
      await apiFetch("/api/community", {
        method: "POST",
        body: JSON.stringify({ body: postBody.trim(), trackId: postTrack || null }),
      });
      setPostBody("");
      toast.success("A bejegyzést közzétettük.");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const dbUnavailable = status === "unavailable";

  return (
    <>
      <section className="page-header">
        <div className="container-page py-12 sm:py-16">
          <span className="eyebrow">
            <span className="h-px w-6 bg-brand-500" />
            Közösség
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <Users className="mr-3 inline h-8 w-8 text-brand-400" />
            Versenyzői közösség
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite-400 sm:text-base">
            Versenyzői profilok, a ranglisták élen álló pilótái és friss közösségi bejegyzések. A profilok
            nyilvánosak – a követés és a hírfolyam a következő fejlesztési szakaszban érkezik.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="min-w-0">
          {dbUnavailable && (
            <div className="mb-6 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {message}
            </div>
          )}

          {/* Bejegyzés írása */}
          {ready && currentUser && (
            <form onSubmit={handlePost} className="mb-8 rounded-sm border border-ink-700 bg-ink-850 p-5">
              <label className="label" htmlFor="post-body">
                Új bejegyzés
              </label>
              <textarea
                id="post-body"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Oszd meg a legutóbbi pályanapod, egy beállítást vagy egy jó kört…"
                className="input resize-y"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  value={postTrack}
                  onChange={(e) => setPostTrack(e.target.value)}
                  className="input max-w-xs"
                  aria-label="Kapcsolódó pálya"
                >
                  <option value="">Nincs pálya megjelölve</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={posting || !postBody.trim()} className="btn-primary">
                  {posting ? "Közzététel…" : "Közzététel"}
                </button>
              </div>
            </form>
          )}

          {/* Bejegyzések */}
          <h2 className="font-display text-lg font-bold text-white">Friss bejegyzések</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="rounded-sm border border-ink-700 bg-ink-850 px-5 py-8 text-center text-sm text-graphite-400">
                Betöltés…
              </p>
            ) : posts.length > 0 ? (
              posts.map((p) => {
                const author = embed(p.profiles);
                const track = embed(p.tracks);
                return (
                  <article key={p.id} className="rounded-sm border border-ink-700 bg-ink-850 p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 place-items-center rounded text-xs font-bold text-white"
                        style={{ backgroundColor: author?.avatar_color ?? "#363b43" }}
                      >
                        {(author?.full_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/kozosseg/${p.user_id}`} className="text-sm font-semibold text-white hover:text-brand-400">
                          {author?.full_name ?? "Versenyző"}
                        </Link>
                        <p className="text-xs text-graphite-500">
                          {formatDate(p.created_at)}
                          {track ? ` · ${track.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-graphite-200">{p.body}</p>
                  </article>
                );
              })
            ) : (
              <p className="rounded-sm border border-dashed border-ink-600 px-5 py-10 text-center text-sm text-graphite-400">
                Még nincs közösségi bejegyzés. {currentUser ? "Legyél te az első!" : "Jelentkezz be, és írj egyet!"}
              </p>
            )}
          </div>
        </div>

        {/* Oldalsáv: élen álló versenyzők + versenyzők listája */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              A ranglisták élen
            </h2>
            <ul className="mt-4 space-y-2.5">
              {topDrivers.length > 0 ? (
                topDrivers.map((lap, i) => (
                  <li key={lap.userId}>
                    <Link
                      href={`/kozosseg/${lap.userId}`}
                      className="flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900 p-3 transition-colors hover:border-ink-600"
                    >
                      <span className="font-display text-lg font-extrabold text-brand-400">#{i + 1}</span>
                      <span
                        className="grid h-9 w-9 place-items-center rounded text-xs font-bold text-white"
                        style={{ backgroundColor: lap.driverAvatarColor ?? "#363b43" }}
                      >
                        {(lap.driverName ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{lap.driverName ?? "Versenyző"}</span>
                        <span className="block truncate text-xs text-graphite-500">{lap.trackName ?? "—"}</span>
                      </span>
                      <span className="font-display text-sm font-bold tabular-nums text-graphite-200">
                        {formatLapTime(lap.lapTimeMs)}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-graphite-500">Amint lesznek jóváhagyott eredmények, itt jelennek meg.</li>
              )}
            </ul>
          </div>

          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-graphite-300">
              Versenyzők ({drivers.length})
            </h2>
            <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
              {drivers.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/kozosseg/${d.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-ink-800"
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded text-xs font-bold text-white"
                      style={{ backgroundColor: d.avatar_color ?? "#363b43" }}
                    >
                      {(d.full_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-graphite-200">
                      {d.full_name ?? "Névtelen versenyző"}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-graphite-600" />
                  </Link>
                </li>
              ))}
              {drivers.length === 0 && !loading && (
                <li className="text-xs text-graphite-500">Nincs regisztrált versenyző.</li>
              )}
            </ul>
          </div>

          <div className="rounded-sm border border-ink-700 bg-ink-850 p-5 text-xs leading-relaxed text-graphite-400">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-white">
              <MessageSquare className="h-4 w-4 text-brand-400" />
              Következő lépések
            </h3>
            A versenyzők követése és a személyre szabott hírfolyam előkészített, de egyelőre nem teljes funkció.
            A cél egy valóban hasznos, nem túlzsúfolt közösségi tér.
          </div>
        </aside>
      </div>
    </>
  );
}
