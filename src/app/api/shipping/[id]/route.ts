import { error, json, requireApiUser } from "@/server/api";
import { write } from "@/server/store";
import { canTouch, pushAudit } from "@/server/workspace";

/** Cancel (delete) a request that has not been accepted yet. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const result = await write((db) => {
    const idx = db.shippingRequests.findIndex((r) => r.id === id);
    if (idx < 0 || !canTouch(auth.user, db.shippingRequests[idx])) return "missing" as const;
    if (db.shippingRequests[idx].status === "accepted") return "locked" as const;
    db.shippingRequests.splice(idx, 1);
    pushAudit(db, "shipping.cancel", auth.user.id, { id });
    return "ok" as const;
  });
  if (result === "missing") return error("Not found.", 404);
  if (result === "locked") return error("Accepted requests cannot be cancelled here. Contact the partner.", 409);
  return json({ ok: true });
}
