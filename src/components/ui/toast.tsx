"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionTokens, springs } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const ToastCtx = createContext<((t: Omit<ToastItem, "id">) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const reduce = useSafeReducedMotion();

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur.slice(-2), { ...t, id }]);
    window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), 4500);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? TriangleAlert : Info;
            return (
              <motion.div
                key={t.id}
                layout={!reduce}
                initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.md, scale: reduce ? 1 : 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: motionTokens.duration.fast } }}
                transition={springs.snappy}
                role={t.tone === "error" ? "alert" : "status"}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    t.tone === "success" && "text-positive",
                    t.tone === "error" && "text-danger",
                    t.tone === "info" && "text-brand",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
