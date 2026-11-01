import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { BillingCycle, PlanId, Role } from "@/lib/types";

/**
 * File-backed JSON store for development and demos.
 * Swap `JsonStore` for a Postgres/Supabase implementation of the same shape in production;
 * serverless hosts have a read-only or ephemeral filesystem.
 */

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  plan: PlanId;
  planCycle?: BillingCycle;
  planRenewsAt?: string;
  trialUsed?: boolean;
  /** Bumped on password change/reset; sessions carrying an older version are rejected. */
  sessionVersion?: number;
  preferences: { categories: string[]; states: string[]; emailAlerts: boolean; keywords: string[] };
  createdAt: string;
}

export interface WatchRecord { userId: string; auctionId: string; createdAt: string }
export interface DocumentRecord { id: string; userId: string; name: string; kind: string; sizeKb: number; expiresOn?: string; createdAt: string }
export interface ReminderRecord { id: string; userId: string; auctionId?: string; title: string; remindAt: string; channel: "email" | "sms" | "whatsapp"; done: boolean; createdAt: string }
export interface InventoryRecord { id: string; userId: string; material: string; quantity: number; unit: string; costPerUnit: number; location: string; sourceAuctionId?: string; createdAt: string }
export interface VendorRecord { id: string; userId: string; name: string; service: "transport" | "loading" | "recycler" | "buyer" | "other"; city: string; phone: string; email?: string; rating: number; createdAt: string }
export interface QuoteLine { description: string; quantity: number; unit: string; rate: number }
export interface QuoteRecord { id: string; userId: string; number: string; client: string; auctionId?: string; lines: QuoteLine[]; gstRate: number; marginPct: number; terms: string; status: "draft" | "sent"; createdAt: string }
export interface NotificationRecord { id: string; userId: string; title: string; body: string; href?: string; read: boolean; createdAt: string }
export interface LeadRecord { id: string; kind: "contact" | "sales"; name: string; email: string; phone?: string; company?: string; topic?: string; subject?: string; message: string; createdAt: string }
export interface SubscriptionRecord { id: string; userId: string; plan: PlanId; cycle: BillingCycle; amount: number; coupon?: string; gstin?: string; reference: string; status: "active" | "trial"; createdAt: string }
export interface ShippingRequestRecord { id: string; userId: string; auctionId?: string; pickup: string; drop: string; weightTonnes: number; vehicle: string; status: "open" | "quoted" | "accepted" | "closed"; quotes: { partnerId: string; partnerName: string; amount: number; etaDays: number; createdAt: string }[]; createdAt: string }
export interface SellerAuctionRecord { id: string; userId: string; title: string; category: string; city: string; state: string; startsAt: string; endsAt: string; reservePrice: number; emdPercent: number; description: string; status: "draft" | "pending" | "published"; createdAt: string }
export interface ResetTokenRecord { tokenHash: string; userId: string; expiresAt: string }
export interface AuditRecord { id: string; actorId?: string; action: string; meta?: Record<string, string>; createdAt: string }
/** Bids the user placed on the official portal, logged in Lelam for tracking (Lelam never bids). */
export interface BidRecord { id: string; userId: string; auctionId: string; lotNo?: string; amount: number; status: "placed" | "won" | "lost" | "withdrawn"; note?: string; createdAt: string }
export interface SubscriberRecord { email: string; createdAt: string }

export interface Db {
  users: UserRecord[];
  watchlist: WatchRecord[];
  documents: DocumentRecord[];
  reminders: ReminderRecord[];
  inventory: InventoryRecord[];
  vendors: VendorRecord[];
  quotes: QuoteRecord[];
  notifications: NotificationRecord[];
  leads: LeadRecord[];
  subscriptions: SubscriptionRecord[];
  shippingRequests: ShippingRequestRecord[];
  sellerAuctions: SellerAuctionRecord[];
  resetTokens: ResetTokenRecord[];
  audit: AuditRecord[];
  bids: BidRecord[];
  subscribers: SubscriberRecord[];
}

const EMPTY: Db = {
  bids: [],
  subscribers: [],
  users: [],
  watchlist: [],
  documents: [],
  reminders: [],
  inventory: [],
  vendors: [],
  quotes: [],
  notifications: [],
  leads: [],
  subscriptions: [],
  shippingRequests: [],
  sellerAuctions: [],
  resetTokens: [],
  audit: [],
};

function dbPath() {
  return process.env.LELAM_DB_PATH ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "db.json");
}

let memory: Db | null = null;
let memoryMtime = 0;
let queue: Promise<unknown> = Promise.resolve();

/**
 * Next.js bundles route handlers and pages as separate module instances, each with its own
 * `memory`. Revalidating against the file's mtime keeps every instance consistent.
 */
async function load(): Promise<Db> {
  let mtime = 0;
  try {
    mtime = (await fs.stat(dbPath())).mtimeMs;
  } catch {
    /* no file yet */
  }
  if (memory && mtime === memoryMtime) return memory;
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    memory = { ...structuredClone(EMPTY), ...(JSON.parse(raw) as Partial<Db>) };
  } catch {
    memory = memory ?? structuredClone(EMPTY);
  }
  memoryMtime = mtime;
  return memory;
}

async function persist(db: Db) {
  const file = dbPath();
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${randomBytes(4).toString("hex")}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, file);
    memoryMtime = (await fs.stat(file)).mtimeMs;
  } catch (err) {
    // Read-only filesystems (serverless) keep working in memory; surface it in logs.
    console.error("[store] could not persist db:", (err as Error).message);
  }
}

/** Read-only snapshot. */
export async function read<T>(fn: (db: Db) => T): Promise<T> {
  const db = await load();
  return fn(db);
}

/** Serialised mutation; writes are queued so concurrent requests cannot clobber each other. */
export function write<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

/** Test hook: reset in-memory state (the file path is controlled via LELAM_DB_PATH). */
export function __resetStoreForTests() {
  memory = null;
  memoryMtime = 0;
  queue = Promise.resolve();
}
