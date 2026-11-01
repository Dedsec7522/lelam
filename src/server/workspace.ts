import "server-only";
import { canUse, requiredPlan, type Feature } from "@/lib/plans";
import type { Auction, Role } from "@/lib/types";
import { error } from "./api";
import { catalog } from "./catalog";
import type { SafeUser } from "./session";
import { newId, read, type Db } from "./store";

/**
 * Shared helpers for the signed-in workspace (dashboard, seller, logistics, admin).
 * Pages and API routes use the same entitlement rule so the UI never offers what the API refuses.
 */

/** Plan entitlement; admins can always open every tool (support and QA). */
export function hasFeature(user: Pick<SafeUser, "plan" | "role">, feature: Feature): boolean {
  return user.role === "admin" || canUse(user.plan, feature);
}

/** 403 response for a locked feature, with the plan the client should upsell. */
export function featureDenied(feature: Feature) {
  const plan = requiredPlan(feature);
  return error(`This tool needs the ${plan.name} plan or higher.`, 403, { requiredPlan: plan.id, upgrade: "/pricing" });
}

export function roleDenied(roles: Role[]) {
  return error(`This action is limited to ${roles.join(" / ")} accounts.`, 403);
}

/** Owner or admin may touch a record. */
export function canTouch(user: Pick<SafeUser, "id" | "role">, record: { userId: string }) {
  return record.userId === user.id || user.role === "admin";
}

/** Request-time clock for server components (keeps render bodies free of impure calls). */
export function requestTime(): number {
  return Date.now();
}

export function isoNow() {
  return new Date().toISOString();
}

/** Appends a notification inside an existing write transaction. */
export function pushNotification(db: Db, userId: string, title: string, body: string, href?: string) {
  db.notifications.push({ id: newId("n"), userId, title, body, href, read: false, createdAt: isoNow() });
}

/** Appends an audit entry inside an existing write transaction (capped like `audit()`). */
export function pushAudit(db: Db, action: string, actorId?: string, meta?: Record<string, string>) {
  db.audit.push({ id: newId("a"), actorId, action, meta, createdAt: isoNow() });
  if (db.audit.length > 2000) db.audit.splice(0, db.audit.length - 2000);
}

export interface WatchedAuction {
  auctionId: string;
  savedAt: string;
  auction?: Auction;
}

/** Watchlist entries joined with the live catalog (missing entries are kept so they can be removed). */
export async function watchlistFor(userId: string): Promise<WatchedAuction[]> {
  const rows = await read((db) => db.watchlist.filter((w) => w.userId === userId));
  const cat = catalog();
  return rows
    .map((w) => ({ auctionId: w.auctionId, savedAt: w.createdAt, auction: cat.get(w.auctionId) }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Compact auction options for pickers (watchlist first). */
export interface AuctionOption {
  id: string;
  label: string;
}

export function auctionOption(a: Auction): AuctionOption {
  return { id: a.id, label: `${a.id} · ${a.title}, ${a.city}` };
}

export async function auctionOptionsFor(userId: string): Promise<AuctionOption[]> {
  const watched = await watchlistFor(userId);
  return watched.flatMap((w) => (w.auction ? [auctionOption(w.auction)] : []));
}

export function auctionTitle(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const a = catalog().get(id);
  return a ? `${a.title}, ${a.city}` : undefined;
}
