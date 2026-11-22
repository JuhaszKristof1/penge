"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Minimál toast rendszer (window event alapú, külső függőség nélkül).
// Használat: import { toast } from "@/components/Toaster"; toast.success("...")
// ---------------------------------------------------------------------------

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const EVENT = "gridline:toast";
let counter = 0;

export function toast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: ++counter, message, tone } }));
}

toast.success = (message: string) => toast(message, "success");
toast.error = (message: string) => toast(message, "error");
toast.info = (message: string) => toast(message, "info");

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev, detail]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== detail.id));
      }, 3600);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    error: <XCircle className="h-4 w-4 text-rose-400" />,
    info: <Info className="h-4 w-4 text-brand-400" />,
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-sm border bg-ink-850/95 px-4 py-3 backdrop-blur animate-fade-up",
            item.tone === "success" && "border-emerald-500/30",
            item.tone === "error" && "border-rose-500/30",
            item.tone === "info" && "border-brand-500/30",
          )}
          role="status"
        >
          <span className="mt-0.5">{icons[item.tone]}</span>
          <p className="text-sm text-graphite-100">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
