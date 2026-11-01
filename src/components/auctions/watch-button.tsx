"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { useSession } from "@/components/session";
import { useToast } from "@/components/ui/toast";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

interface WatchState {
  ids: Set<string>;
  toggle: (id: string) => Promise<void>;
}

const WatchCtx = createContext<WatchState | null>(null);
const EMPTY_IDS: Set<string> = new Set();

/** Loads the user's watchlist once per page and shares it with every card. */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/watchlist", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ids: string[] }>)
      .then((d) => !cancelled && setIds(new Set(d.ids)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (id: string) => {
      if (!user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      const wasSaved = ids.has(id);
      // Optimistic update, rolled back on failure.
      setIds((cur) => {
        const next = new Set(cur);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auctionId: id }),
        });
        const data = (await res.json()) as { saved?: boolean; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Could not update your watchlist.");
        toast({ tone: "success", title: data.saved ? "Saved to watchlist" : "Removed from watchlist" });
      } catch (err) {
        setIds((cur) => {
          const next = new Set(cur);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
        toast({ tone: "error", title: (err as Error).message });
      }
    },
    [user, ids, router, toast],
  );

  // Signed-out visitors never show saved state, even if a previous session's ids linger.
  const value = useMemo(() => ({ ids: user ? ids : EMPTY_IDS, toggle }), [user, ids, toggle]);
  return <WatchCtx.Provider value={value}>{children}</WatchCtx.Provider>;
}

export function WatchButton({ auctionId, variant = "icon", className }: { auctionId: string; variant?: "icon" | "full"; className?: string }) {
  const ctx = useContext(WatchCtx);
  const reduce = useSafeReducedMotion();
  const saved = ctx?.ids.has(auctionId) ?? false;
  const label = saved ? "Saved" : "Save";

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void ctx?.toggle(auctionId);
      }}
      aria-pressed={saved}
      aria-label={variant === "icon" ? (saved ? "Remove from watchlist" : "Save to watchlist") : undefined}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={springs.snappy}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-2 font-medium transition-colors",
        variant === "icon"
          ? "size-10 rounded-full border border-line bg-surface/90 text-ink-2 backdrop-blur hover:border-copper hover:text-copper"
          : "h-11 rounded-xl border border-line-strong bg-surface px-4 text-sm text-ink hover:border-copper hover:text-copper",
        saved && "border-copper/40 text-copper",
        className,
      )}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={springs.snappy}
        className="grid place-items-center"
      >
        <Heart className={cn("size-[18px]", saved && "fill-current")} aria-hidden />
      </motion.span>
      {variant === "full" && label}
    </motion.button>
  );
}
