import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
        <path
          d="M4 15.5 5.6 9.2A2.4 2.4 0 0 1 7.93 7.5h8.14a2.4 2.4 0 0 1 2.33 1.7L20 15.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path d="M3.2 15.5h17.6v2.6a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1v-.8H6.8v.8a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1v-2.6Z" fill="currentColor" />
        <circle cx="7.4" cy="13" r="1.05" fill="#fff" />
        <circle cx="16.6" cy="13" r="1.05" fill="#fff" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="AutoFit AI – főoldal">
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            AutoFit<span className="text-brand-500"> AI</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-graphite-500">
            Parts Compatibility
          </span>
        </span>
      )}
    </Link>
  );
}
