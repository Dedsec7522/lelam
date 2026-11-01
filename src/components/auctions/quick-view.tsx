"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Auction } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { AuctionDetail, type PublicProjection } from "./auction-detail";

/** Marketplace quick view. Keeps list context; "Open full page" gives a shareable URL. */
export function QuickView({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [data, setData] = useState<{ auction: Auction; projection: PublicProjection } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The parent remounts this component per id (key), so state starts empty for each auction.
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetch(`/api/auctions/${id}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("This auction is no longer listed.");
        setData((await r.json()) as { auction: Auction; projection: PublicProjection });
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => controller.abort();
  }, [id]);

  return (
    <Dialog open={!!id} onClose={onClose} title={data?.auction.title ?? "Auction details"} size="xl" hideHeader>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/90 px-5 py-3 backdrop-blur sm:px-7">
        <span className="font-mono text-[0.75rem] text-muted">#{id}</span>
        <div className="flex items-center gap-1">
          {id && (
            <Link href={`/auctions/${id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft">
              Open full page <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          )}
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:bg-paper-2 hover:text-ink">
            Close
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="p-8 text-center text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <AuctionDetail auction={data.auction} projection={data.projection} mode="modal" />
      ) : (
        <div className="space-y-4 p-7" aria-label="Loading auction">
          <div className="h-5 w-40 skeleton" />
          <div className="h-8 w-3/4 skeleton" />
          <div className="h-4 w-1/2 skeleton" />
          <div className="grid grid-cols-4 gap-3 pt-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 skeleton" />
            ))}
          </div>
          <div className="h-56 skeleton" />
        </div>
      )}
    </Dialog>
  );
}
