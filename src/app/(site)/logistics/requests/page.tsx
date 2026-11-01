import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { partnerBoard } from "@/server/logistics";
import { PageHeader } from "@/components/app/page-header";
import { QuoteBoard } from "@/components/app/logistics/quote-board";

export const metadata: Metadata = { title: "Requests & quotes" };

export default async function LogisticsRequestsPage() {
  const user = await requireRole(["logistics", "admin"], "/logistics/requests");
  const board = await partnerBoard(user.id);
  return (
    <>
      <PageHeader
        eyebrow="Logistics portal"
        title="Requests & quotes"
        description="Quote once per request; quoting again replaces your earlier price. Buyers only see partner name, price and ETA."
      />
      <QuoteBoard initial={board} />
    </>
  );
}
