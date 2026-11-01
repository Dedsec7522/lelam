import { error, json } from "@/server/api";
import { catalog } from "@/server/catalog";
import { getCurrentUser } from "@/server/session";
import { canUse, requiredPlan } from "@/lib/plans";
import { projectAuction, winProbability } from "@/lib/costing";

/** Bid Intelligence: bid caps, win probabilities and margin warnings. Business plan and above. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return error("Sign in to use Bid Intelligence.", 401);
  if (!canUse(user.plan, "bidIntelligence")) {
    return error(`Bid Intelligence is part of the ${requiredPlan("bidIntelligence").name} plan.`, 403, { upgrade: true });
  }
  const { id } = await ctx.params;
  const auction = catalog().get(id);
  if (!auction) return error("Auction not found.", 404);

  const p = projectAuction(auction);
  const scenarios = (["conservative", "aggressive", "walkAway"] as const).map((key) => {
    const bid = p.caps[key];
    return {
      key,
      bid,
      winProbability: winProbability(bid, p.predictedClose),
      marginPercent: bid > 0 ? Math.round(((p.turnover - bid) / bid) * 1000) / 10 : 0,
    };
  });
  const warnings: string[] = [];
  if (auction.isReauction) warnings.push("Re-auctioned lot: it went unsold before, so check the reason (quality, terms or location).");
  if (!auction.hasDocs) warnings.push("No catalog documents attached. Quantities may differ on inspection.");
  if (auction.gstScheme === "RCM") warnings.push("GST under reverse charge: plan the cash outlay even if you can claim ITC.");
  if (scenarios[2].marginPercent < 8) warnings.push("Thin margin at the walk-away price. Transport could erase it.");

  return json({ projection: p, scenarios, warnings }, { headers: { "Cache-Control": "private, no-store" } });
}
