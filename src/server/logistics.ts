import "server-only";
import { read } from "./store";

/** Partner-facing view of a shipping request: no requester identity, no competitor prices. */
export interface PartnerRequest {
  id: string;
  pickup: string;
  drop: string;
  weightTonnes: number;
  vehicle: string;
  auctionId?: string;
  status: "open" | "quoted" | "accepted" | "closed";
  createdAt: string;
  quoteCount: number;
  myQuote?: { amount: number; etaDays: number; createdAt: string };
  /** true when this partner's quote was the one accepted. */
  won: boolean;
}

export async function partnerBoard(partnerId: string): Promise<PartnerRequest[]> {
  return read((db) =>
    db.shippingRequests
      .filter((r) => r.status === "open" || r.status === "quoted" || r.quotes.some((q) => q.partnerId === partnerId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const mine = r.quotes.find((q) => q.partnerId === partnerId);
        return {
          id: r.id,
          pickup: r.pickup,
          drop: r.drop,
          weightTonnes: r.weightTonnes,
          vehicle: r.vehicle,
          auctionId: r.auctionId,
          status: r.status,
          createdAt: r.createdAt,
          quoteCount: r.quotes.length,
          myQuote: mine ? { amount: mine.amount, etaDays: mine.etaDays, createdAt: mine.createdAt } : undefined,
          won: r.status === "accepted" && r.quotes[0]?.partnerId === partnerId,
        };
      }),
  );
}
