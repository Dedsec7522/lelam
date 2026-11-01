import { z } from "zod";
import { error, json, parseBody, requireApiUser } from "@/server/api";
import { write } from "@/server/store";
import { canTouch, pushAudit, pushNotification } from "@/server/workspace";

const acceptSchema = z.object({ partnerId: z.string().min(1).max(40) });

/** The request owner accepts one partner's quote. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(req, acceptSchema);
  if (!parsed.ok) return parsed.response;

  const result = await write((db) => {
    const r = db.shippingRequests.find((x) => x.id === id);
    if (!r || !canTouch(auth.user, r)) return null;
    if (r.status === "accepted" || r.status === "closed") return "closed" as const;
    const q = r.quotes.find((x) => x.partnerId === parsed.data.partnerId);
    if (!q) return "noquote" as const;
    r.status = "accepted";
    // Keep only the accepted quote first so the UI can show it as the winner.
    r.quotes = [q, ...r.quotes.filter((x) => x !== q)];
    pushNotification(db, q.partnerId, "Quote accepted", `Your quote for ${r.pickup} → ${r.drop} was accepted.`, "/logistics/requests");
    pushAudit(db, "shipping.accept", auth.user.id, { id, partnerId: q.partnerId });
    return r;
  });
  if (!result) return error("Not found.", 404);
  if (result === "closed") return error("This request already has an accepted quote.", 409);
  if (result === "noquote") return error("That quote no longer exists.", 404);
  return json({ item: result });
}
