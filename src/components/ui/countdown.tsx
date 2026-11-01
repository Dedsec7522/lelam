"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCountdown } from "@/lib/format";
import { statusOf } from "@/lib/search";

/**
 * Live auction status. Renders a stable placeholder on the server and first client paint
 * (avoids hydration mismatch from Date.now()), then ticks every 30s.
 */
export function AuctionStatus({ startsAt, endsAt, compact = false }: { startsAt: string; endsAt: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.requestAnimationFrame(tick);
    const t = window.setInterval(tick, 30_000);
    return () => {
      window.cancelAnimationFrame(first);
      window.clearInterval(t);
    };
  }, []);

  if (now === null) {
    return <span className={cn("inline-block h-6 w-28 rounded-full skeleton", compact && "h-5 w-20")} aria-hidden />;
  }

  const status = statusOf({ startsAt, endsAt }, now);
  const label =
    status === "live"
      ? `Live · ends in ${formatCountdown(Date.parse(endsAt) - now)}`
      : status === "upcoming"
        ? `Opens in ${formatCountdown(Date.parse(startsAt) - now)}`
        : "Closed";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium leading-5",
        status === "live" && "bg-copper-soft text-copper",
        status === "upcoming" && "bg-brand-soft text-brand-ink",
        status === "closed" && "bg-paper-2 text-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === "live" && "animate-pulse-dot",
        )}
      />
      {label}
    </span>
  );
}
