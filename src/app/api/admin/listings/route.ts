import { z } from "zod";
import { error, json, parseBody } from "@/server/api";
import { requireApiAdmin } from "@/server/admin";
import { read, write } from "@/server/store";
import { pushAudit, pushNotification } from "@/server/workspace";

export async function GET(req: Request) {
  const a = await requireApiAdmin(req);
  if (!a.ok) return a.response;
  const items = await read((db) => [...db.sellerAuctions].sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
  return json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}

const actionSchema = z.object({ id: z.string().min(1).max(40), action: z.enum(["approve", "reject"]) });

/** approve → published; reject → back to draft for the seller to fix. */
export async function PATCH(req: Request) {
  const a = await requireApiAdmin(req);
  if (!a.ok) return a.response;
  const parsed = await parseBody(req, actionSchema);
  if (!parsed.ok) return parsed.response;
  const { id, action } = parsed.data;
  const item = await write((db) => {
    const rec = db.sellerAuctions.find((x) => x.id === id);
    if (!rec) return null;
    rec.status = action === "approve" ? "published" : "draft";
    pushNotification(
      db,
      rec.userId,
      action === "approve" ? "Listing published" : "Listing needs changes",
      action === "approve"
        ? `"${rec.title}" is now live on Lelam.`
        : `"${rec.title}" was returned to draft. Edit it and resubmit for review.`,
      `/seller/auctions/${rec.id}/edit`,
    );
    pushAudit(db, `admin.listing.${action}`, a.user.id, { id });
    return rec;
  });
  if (!item) return error("Listing not found.", 404);
  return json({ item });
}
