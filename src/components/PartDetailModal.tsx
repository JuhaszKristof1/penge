"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Part } from "@/lib/types";
import { PartDetailContent } from "./PartDetailContent";

export function PartDetailModal({
  part,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenRelated,
  scrollToShop = false,
}: {
  part: Part | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (part: Part) => void;
  onOpenRelated?: (part: Part) => void;
  /** Ha igaz, a modál megnyitásakor a vásárlási szekcióhoz görget. */
  scrollToShop?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (part) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [part, onClose]);

  useEffect(() => {
    if (!part) return;
    const container = scrollRef.current;
    if (!container) return;
    if (scrollToShop) {
      requestAnimationFrame(() => {
        const target = container.querySelector("#vasarlas");
        target?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    } else {
      container.scrollTop = 0;
    }
  }, [part, scrollToShop]);

  if (!part) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        ref={scrollRef}
        className="relative max-h-[92vh] w-full max-w-3xl animate-fade-up overflow-y-auto rounded-t-2xl border border-ink-700 bg-ink-850 shadow-card sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={part.name}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl border border-ink-600 bg-ink-950/70 text-graphite-300 backdrop-blur transition-colors hover:text-white"
          aria-label="Bezárás"
        >
          <X className="h-4 w-4" />
        </button>

        <PartDetailContent
          part={part}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onOpen={onOpenRelated}
          headingId="part-modal-title"
        />
      </div>
    </div>
  );
}
