"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, BookmarkX, ReceiptText, Truck } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { AuctionStatus } from "@/components/ui/countdown";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, formatINR } from "@/lib/format";
import { motionTokens, springs } from "@/lib/motion";
import { api } from "../api-client";
import { RowAction } from "../crud-manager";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface WatchRow {
  auctionId: string;
  savedAt: string;
  auction?: {
    id: string;
    title: string;
    city: string;
    state: string;
    source: string;
    category: string;
    startsAt: string;
    endsAt: string;
    emdPercent: number;
    lots: number;
    value: number;
    isReauction: boolean;
  };
}

export function WatchlistClient({ initial, limit, canQuote, canShip }: { initial: WatchRow[]; limit: number | null; canQuote: boolean; canShip: boolean }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();

  async function remove(id: string) {
    setBusy(id);
    const res = await api<{ saved: boolean; count: number }>("/api/watchlist", "POST", { auctionId: id });
    setBusy(null);
    if (!res.ok) {
      toast({ tone: "error", title: "Could not update watchlist", description: res.error });
      return;
    }
    if (res.data.saved) {
      // Toggle endpoint re-added it (stale state); reflect the server's truth.
      toast({ tone: "info", title: "Auction is still saved" });
      return;
    }
    setRows((cur) => cur.filter((r) => r.auctionId !== id));
    setAnnounce("Removed from watchlist");
    toast({ tone: "success", title: "Removed from watchlist" });
    router.refresh();
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {rows.length} saved{limit !== null && ` · ${Math.max(0, limit - rows.length)} slots left`}
        </p>
        <ButtonLink href="/auctions" variant="secondary" size="sm">
          Find more
        </ButtonLink>
      </div>
      {limit !== null && (
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-label="Watchlist usage" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={rows.length}>
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={false}
            animate={{ width: `${Math.min(100, (rows.length / limit) * 100)}%` }}
            transition={reduce ? { duration: 0 } : springs.gentle}
          />
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title="Your watchlist is empty"
          description="Tap the bookmark on any auction to track its timing, EMD and lots here."
          action={<ButtonLink href="/auctions">Browse auctions</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-3">
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <motion.li
                key={r.auctionId}
                layout={!reduce}
                initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
                animate={{ opacity: 1, y: 0, transition: { ...springs.gentle, delay: Math.min(i, 8) * motionTokens.stagger.tight } }}
                exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
              >
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  {r.auction ? (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AuctionStatus startsAt={r.auction.startsAt} endsAt={r.auction.endsAt} compact />
                        <Badge>{r.auction.source}</Badge>
                        {r.auction.isReauction && <Badge tone="warning">Re-auction</Badge>}
                      </div>
                      <Link href={`/auctions/${r.auction.id}`} className="mt-2 block font-semibold text-ink hover:text-brand">
                        {r.auction.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {r.auction.city}, {r.auction.state} · Ref {r.auction.id} · {r.auction.lots} lots · est. {formatINR(r.auction.value, { compact: true })} · EMD {r.auction.emdPercent}%
                      </p>
                      <p className="mt-0.5 text-xs text-faint">Opens {formatDateTime(r.auction.startsAt)}</p>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">Auction {r.auctionId}</p>
                      <p className="text-sm text-muted">This listing is no longer in the catalog.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {r.auction && canQuote && (
                      <Link
                        href={`/dashboard/quotes/new?auction=${r.auction.id}`}
                        aria-label="Build a quote from this auction"
                        title="Build a quote"
                        className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
                      >
                        <ReceiptText className="size-[18px]" />
                      </Link>
                    )}
                    {r.auction && canShip && (
                      <Link
                        href={`/dashboard/shipping-requests?new=1&auction=${r.auction.id}`}
                        aria-label="Request transport for this auction"
                        title="Request transport"
                        className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
                      >
                        <Truck className="size-[18px]" />
                      </Link>
                    )}
                    <RowAction label="Remove from watchlist" tone="danger" onClick={() => remove(r.auctionId)} disabled={busy === r.auctionId}>
                      <BookmarkX className="size-[18px]" />
                    </RowAction>
                  </div>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
