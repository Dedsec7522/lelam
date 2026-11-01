import { error, json, parseBody, requireApiUser } from "@/server/api";
import { listingSchema, normaliseListing } from "@/server/listings";
import { write } from "@/server/store";
import { canTouch, pushAudit, roleDenied } from "@/server/workspace";

type Ctx = { params: Promise<{ id: string }> };

function allowed(role: string) {
  return role === "seller" || role === "admin";
}

/** Edits send the listing back to review unless an admin makes them. */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!allowed(user.role)) return roleDenied(["seller", "admin"]);
  const parsed = await parseBody(req, listingSchema);
  if (!parsed.ok) return parsed.response;
  const item = await write((db) => {
    const rec = db.sellerAuctions.find((a) => a.id === id);
    if (!rec || !canTouch(user, rec)) return null;
    Object.assign(rec, normaliseListing(parsed.data));
    if (user.role !== "admin") rec.status = "pending";
    pushAudit(db, "listing.update", user.id, { id });
    return rec;
  });
  if (!item) return error("Not found.", 404);
  return json({ item });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!allowed(user.role)) return roleDenied(["seller", "admin"]);
  const ok = await write((db) => {
    const idx = db.sellerAuctions.findIndex((a) => a.id === id);
    if (idx < 0 || !canTouch(user, db.sellerAuctions[idx])) return false;
    db.sellerAuctions.splice(idx, 1);
    pushAudit(db, "listing.delete", user.id, { id });
    return true;
  });
  if (!ok) return error("Not found.", 404);
  return json({ ok: true });
}
