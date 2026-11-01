"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, FileText, Image as ImageIcon, MapPin, Navigation, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime, formatINR } from "@/lib/format";
import { lotValue } from "@/lib/search";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { springs } from "@/lib/motion";
import type { Auction } from "@/lib/types";
import { AuctionStatus } from "@/components/ui/countdown";
import { Badge } from "@/components/ui/primitives";
import { LotArt } from "./lot-art";
import { WatchButton } from "./watch-button";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export type CardAuction = Auction & { distanceKm?: number };

/** Marketplace card. Clicking opens the quick-view modal when `onOpen` is provided; otherwise navigates. */
export function AuctionCard({ auction, onOpen, layout = "grid" }: { auction: CardAuction; onOpen?: (id: string) => void; layout?: "grid" | "list" }) {
  const reduce = useSafeReducedMotion();
  const value = lotValue(auction);
  const href = `/auctions/${auction.id}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(auction.id);
  };

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -4 }}
      transition={springs.snappy}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-line-strong hover:shadow-lg",
        layout === "grid" ? "flex-col" : "flex-col sm:flex-row",
      )}
    >
      <div className={cn("relative shrink-0", layout === "grid" ? "h-32" : "h-32 sm:h-auto sm:w-56")}>
        <LotArt category={auction.category} seed={auction.id} className="size-full transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="border-line bg-surface/90 font-semibold text-ink shadow-xs backdrop-blur">
            {auction.source}
          </Badge>
          {auction.isReauction && (
            <Badge tone="copper" className="bg-surface/90 shadow-xs backdrop-blur">
              <RotateCcw className="size-3" aria-hidden /> Re-auction
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3 z-10">
          <WatchButton auctionId={auction.id} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow truncate text-[0.66rem]">{CATEGORY_BY_ID[auction.category].label}</p>
          <span className="font-mono text-[0.7rem] text-faint">#{auction.id}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[1.06rem] font-semibold leading-snug text-ink">
          <Link href={href} onClick={handleClick} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
            {auction.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.82rem] text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {auction.city}, {auction.state}
          </span>
          {auction.distanceKm !== undefined && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-brand">
              <Navigation className="size-3" aria-hidden />
              {auction.distanceKm} km
            </span>
          )}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[0.8rem]">
          <div>
            <dt className="text-faint">Est. value</dt>
            <dd className="mt-0.5 font-mono font-medium tabular-nums text-ink">{formatINR(value, { compact: true })}</dd>
          </div>
          <div>
            <dt className="text-faint">{auction.source === "BaankNet" ? "Reserve" : "Pre-bid EMD"}</dt>
            <dd className="mt-0.5 font-mono font-medium tabular-nums text-ink">
              {auction.source === "BaankNet"
                ? formatINR(auction.reservePrice ?? 0, { compact: true })
                : auction.preBidEmd
                  ? formatINR(auction.preBidEmd, { compact: true })
                  : "Not required"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-faint">Bidding opens</dt>
            <dd className="mt-0.5 text-ink-2">{formatDateTime(auction.startsAt)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <AuctionStatus startsAt={auction.startsAt} endsAt={auction.endsAt} />
          <span className="flex items-center gap-2 text-faint">
            {auction.hasDocs && <FileText className="size-4" aria-label="Catalog documents available" />}
            {auction.hasImages && <ImageIcon className="size-4" aria-label="Images available" />}
            <ArrowUpRight className="size-4 text-ink transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export function AuctionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden>
      <div className="h-32 skeleton rounded-none" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 skeleton" />
        <div className="h-5 w-3/4 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="h-9 skeleton" />
          <div className="h-9 skeleton" />
        </div>
      </div>
    </div>
  );
}
