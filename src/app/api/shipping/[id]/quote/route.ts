import { z } from "zod";
import { error, json, parseBody, requireApiUser } from "@/server/api";
import { write } from "@/server/store";
import { formatINR } from "@/lib/format";
import { isoNow, pushAudit, pushNotification, roleDenied } from "@/server/workspace";

const quoteSchema = z.object({
  amount: z.number({ message: "Enter your price." }).finite().positive("Must be more than zero.").max(1e9),
  etaDays: z.number({ message: "Enter days to deliver." }).int("Whole days only.").min(1, "At least 1 day.").max(60, "Up to 60 days."),
});

/** A logistics partner quotes on an open request (re-quoting replaces their previous price). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (user.role !== "logistics" && user.role !== "admin") return roleDenied(["logistics", "admin"]);
  const parsed = await parseBody(req, quoteSchema);
  if (!parsed.ok) return parsed.response;

  const result = await write((db) => {
    const r = db.shippingRequests.find((x) => x.id === id);
    if (!r) return null;
    if (r.status === "accepted" || r.status === "closed") return "closed" as const;
    const quote = { partnerId: user.id, partnerName: user.company || user.name, ...parsed.data, createdAt: isoNow() };
    r.quotes = [...r.quotes.filter((q) => q.partnerId !== user.id), quote];
    r.status = "quoted";
    pushNotification(
      db,
      r.userId,
      "New transport quote",
      `${quote.partnerName} quoted ${formatINR(quote.amount)} (${quote.etaDays} days) for ${r.pickup} → ${r.drop}.`,
      "/dashboard/shipping-requests",
    );
    pushAudit(db, "shipping.quote", user.id, { id, amount: String(quote.amount) });
    // Partner view only: never echo the requester or competing prices.
    return {
      id: r.id,
      status: r.status,
      quoteCount: r.quotes.length,
      myQuote: { amount: quote.amount, etaDays: quote.etaDays, createdAt: quote.createdAt },
    };
  });
  if (!result) return error("Not found.", 404);
  if (result === "closed") return error("This request is no longer accepting quotes.", 409);
  return json({ item: result });
}
