import Link from "next/link";
import { cn } from "@/lib/utils";

// A GRIDLINE márkajel: ferde, motorsportos blokk, benne a start-cél vonal és a
// versenyvonal. Tömör narancs, éles geometria – nincs gradiens, nincs neon.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative grid h-8 w-9 shrink-0 place-items-center bg-brand-500", className)}
      style={{ clipPath: "polygon(16% 0, 100% 0, 84% 100%, 0 100%)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-white">
        {/* Start-cél vonal (kockás rács bal széle). */}
        <path d="M4 4h3v16H4z" fill="currentColor" opacity="0.4" />
        <path d="M4 4h3v4H4zM4 12h3v4H4z" fill="currentColor" />
        {/* A versenyvonal: a rácsról indulva ível a cél felé. */}
        <path
          d="M9 18c3.4 0 4.2-3.2 6-6.4 1.2-2.1 2.4-3.6 5-3.6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <circle cx="19.4" cy="8" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

/** A GRIDLINE szóvédjegy (logó + felirat), opcionálisan szlogen nélkül. */
export function Logo({
  className,
  compact = false,
  showSlogan = false,
}: {
  className?: string;
  compact?: boolean;
  showSlogan?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="GRIDLINE – kezdőlap"
    >
      <LogoMark className="transition-transform duration-200 group-hover:-translate-y-px" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[19px] font-bold uppercase tracking-[0.26em] text-white">
            Grid<span className="text-brand-500">line</span>
          </span>
          {showSlogan && (
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-graphite-500">
              Find your line. Set your time.
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
