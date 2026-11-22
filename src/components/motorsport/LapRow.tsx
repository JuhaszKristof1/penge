import type { LapTime, MeasurementType, Track } from "@/lib/types";
import { formatDate, formatLapTime, MEASUREMENT_META } from "@/lib/motorsport/format";

// ---------------------------------------------------------------------------
// Közös motorsport UI elemek: pályakártya, köridő-sor, ranglista-táblázat.
// ---------------------------------------------------------------------------

/** Pálya nagy bemutató fotója. Ha nincs kép, semleges helyőrzőt mutatunk
 *  (nem kitalált tartalmat). */
export function TrackHeroImage({
  track,
  className,
  priority = false,
}: {
  track: Pick<Track, "name" | "imageUrl">;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={className}>
      {track.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.imageUrl}
          alt={`${track.name} versenypálya`}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-ink-800 text-graphite-600">
          <span className="text-xs font-semibold uppercase tracking-widest">{track.name}</span>
        </div>
      )}
    </div>
  );
}

/** Pályarajz (SVG/PNG). A világos rajzokat a sötét háttérhez igazítjuk. */
export function TrackMapImage({
  src,
  alt,
  invert = false,
  className,
}: {
  src: string;
  alt: string;
  invert?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className ?? ""} ${invert ? "track-map-invert" : ""}`}
      loading="lazy"
    />
  );
}

/** Kis címke a mérési módhoz (kézi / GPS). */
export function MeasurementBadge({ type }: { type: MeasurementType }) {
  const meta = MEASUREMENT_META[type];
  const isGps = type === "gps";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isGps ? "border-sky-500/30 bg-sky-500/10 text-sky-300" : "border-ink-600 bg-ink-800 text-graphite-300"
      }`}
    >
      {meta.short}
    </span>
  );
}

/** Egy ranglista-sor (helyezés, versenyző, autó, köridő, mérés). */
export function LapRow({
  rank,
  lap,
  categoryName,
}: {
  rank: number;
  lap: LapTime;
  categoryName: (code: string) => string;
}) {
  const medal = rank === 1 ? "text-brand-400" : rank <= 3 ? "text-graphite-200" : "text-graphite-500";
  return (
    <tr className="border-b border-ink-800 last:border-0">
      <td className="w-12 py-3 pl-4 pr-2 align-middle">
        <span className={`font-display text-lg font-extrabold tabular-nums ${medal}`}>{rank}</span>
      </td>
      <td className="py-3 pr-3 align-middle">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded text-xs font-bold text-white"
            style={{ backgroundColor: lap.driverAvatarColor ?? "#363b43" }}
          >
            {(lap.driverName ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{lap.driverName ?? "Ismeretlen versenyző"}</p>
            <p className="truncate text-xs text-graphite-500">{formatDate(lap.measuredAt)}</p>
          </div>
        </div>
      </td>
      <td className="hidden py-3 pr-3 align-middle sm:table-cell">
        <p className="truncate text-sm text-graphite-200">{lap.vehicleLabel ?? "—"}</p>
        <p className="text-xs text-graphite-500">{categoryName(lap.vehicleCategory)}</p>
      </td>
      <td className="py-3 pr-3 align-middle">
        <MeasurementBadge type={lap.measurementType} />
      </td>
      <td className="py-3 pr-4 text-right align-middle">
        <span className="font-display text-base font-bold tabular-nums text-white">
          {formatLapTime(lap.lapTimeMs)}
        </span>
      </td>
    </tr>
  );
}
