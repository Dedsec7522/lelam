import { error, json } from "@/server/api";
import { catalog } from "@/server/catalog";
import { projectAuction } from "@/lib/costing";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auction = catalog().get(id);
  if (!auction) return error("Auction not found.", 404);
  const p = projectAuction(auction);
  // Public projection excludes the bid caps (those are Bid Intelligence, Business plan).
  return json({
    auction,
    projection: { turnover: p.turnover, predictedClose: p.predictedClose, profit: p.profit, roiPercent: p.roiPercent },
  });
}
