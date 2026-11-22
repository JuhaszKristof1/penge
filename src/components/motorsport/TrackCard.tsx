import Link from "next/link";
import { MapPin, Route } from "lucide-react";
import type { Track } from "@/lib/types";
import { formatLength } from "@/lib/motorsport/format";
import { TrackHeroImage } from "./LapRow";

/** Versenypálya-kártya (lista és kiemelt szekciók). */
export function TrackCard({ track, compact = false }: { track: Track; compact?: boolean }) {
  return (
    <Link
      href={`/versenypalyak/${track.slug}`}
      className="group block overflow-hidden rounded-sm border border-ink-700 bg-ink-850 transition-colors hover:border-ink-600"
    >
      <TrackHeroImage
        track={track}
        className={`overflow-hidden ${compact ? "h-36" : "h-48"} [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105`}
      />
      <div className="p-4">
        <h3 className="font-display text-base font-bold text-white">{track.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-graphite-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[track.locality, track.county].filter(Boolean).join(", ") || track.country}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-graphite-300">
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-brand-400" />
            {formatLength(track.lengthM)}
          </span>
          {track.corners != null && <span>{track.corners} kanyar</span>}
          {track.openedYear != null && <span>{track.openedYear}</span>}
        </div>
      </div>
    </Link>
  );
}
