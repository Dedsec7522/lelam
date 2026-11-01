import { z } from "zod";
import { error, json, parseBody, requireApiUser } from "@/server/api";
import { catalog } from "@/server/catalog";
import { partnerBoard } from "@/server/logistics";
import { newId, read, write, type ShippingRequestRecord } from "@/server/store";
import { VEHICLES } from "@/components/app/options";
import { featureDenied, hasFeature, isoNow, pushAudit } from "@/server/workspace";

const createSchema = z.object({
  pickup: z.string().trim().min(2, "Enter the pickup location.").max(120),
  drop: z.string().trim().min(2, "Enter the drop location.").max(120),
  weightTonnes: z.number({ message: "Enter the weight in tonnes." }).finite().positive("Must be more than zero.").max(5000),
  vehicle: z.enum(VEHICLES, { message: "Choose a vehicle." }),
  auctionId: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/** Own requests; logistics/admin can pass `?scope=open` for the partner board. */
export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const scope = new URL(req.url).searchParams.get("scope");
  const partner = user.role === "logistics" || user.role === "admin";
  if (scope === "open" && partner) {
    return json({ items: await partnerBoard(user.id) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const items = await read((db) =>
    db.shippingRequests.filter((r) => r.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  return json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!hasFeature(user, "logisticsQuotes")) return featureDenied("logisticsQuotes");
  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  if (input.auctionId && !catalog().get(input.auctionId)) {
    return error("Unknown auction.", 422, { fields: { auctionId: "No auction with this Ref ID." } });
  }
  const item = await write((db) => {
    const rec: ShippingRequestRecord = { id: newId("s"), userId: user.id, ...input, status: "open", quotes: [], createdAt: isoNow() };
    db.shippingRequests.push(rec);
    pushAudit(db, "shipping.create", user.id, { id: rec.id });
    return rec;
  });
  return json({ item }, 201);
}
