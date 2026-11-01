import { json, parseBody, requireApiUser } from "@/server/api";
import { listingSchema, normaliseListing } from "@/server/listings";
import { newId, read, write, type SellerAuctionRecord } from "@/server/store";
import { isoNow, pushAudit, roleDenied } from "@/server/workspace";

function allowed(role: string) {
  return role === "seller" || role === "admin";
}

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!allowed(user.role)) return roleDenied(["seller", "admin"]);
  const items = await read((db) =>
    db.sellerAuctions.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  return json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}

/** New listings wait in "pending" until an admin publishes them. */
export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!allowed(user.role)) return roleDenied(["seller", "admin"]);
  const parsed = await parseBody(req, listingSchema);
  if (!parsed.ok) return parsed.response;
  const item = await write((db) => {
    const rec: SellerAuctionRecord = {
      id: newId("sa"),
      userId: user.id,
      ...normaliseListing(parsed.data),
      status: "pending",
      createdAt: isoNow(),
    };
    db.sellerAuctions.push(rec);
    pushAudit(db, "listing.create", user.id, { id: rec.id });
    return rec;
  });
  return json({ item }, 201);
}
