import { z } from "zod";
import { error, json, parseBody, requireApiUser } from "@/server/api";
import { read, write } from "@/server/store";
import { catalog } from "@/server/catalog";
import { WATCHLIST_LIMIT } from "@/lib/plans";
import { getCurrentUser } from "@/server/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ ids: [] as string[] }, { headers: { "Cache-Control": "private, no-store" } });
  const ids = await read((db) => db.watchlist.filter((w) => w.userId === user.id).map((w) => w.auctionId));
  return json({ ids }, { headers: { "Cache-Control": "private, no-store" } });
}

const bodySchema = z.object({ auctionId: z.string().regex(/^\d{3,8}$/) });

/** Toggles an auction on the user's watchlist, enforcing the plan's limit. */
export async function POST(req: Request) {
  const guard = await requireApiUser(req);
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { auctionId } = parsed.data;
  if (!catalog().get(auctionId)) return error("Auction not found.", 404);

  const user = guard.user;
  const result = await write((db) => {
    const mine = db.watchlist.filter((w) => w.userId === user.id);
    const existing = mine.find((w) => w.auctionId === auctionId);
    if (existing) {
      db.watchlist = db.watchlist.filter((w) => w !== existing);
      return { saved: false, count: mine.length - 1 };
    }
    if (mine.length >= WATCHLIST_LIMIT[user.plan]) return { limit: WATCHLIST_LIMIT[user.plan] };
    db.watchlist.push({ userId: user.id, auctionId, createdAt: new Date().toISOString() });
    return { saved: true, count: mine.length + 1 };
  });
  if ("limit" in result) {
    return error(`Your plan's watchlist holds ${result.limit} lots. Upgrade to save more.`, 403, { upgrade: true });
  }
  return json(result);
}
