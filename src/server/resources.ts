import "server-only";
import { z } from "zod";
import { catalog } from "./catalog";
import { FieldError, type CrudConfig } from "./crud";
import { newId } from "./store";
import { deleteUpload } from "./uploads";
import { isoNow } from "./workspace";
import { BID_STATUSES, DOCUMENT_KINDS, INVENTORY_UNITS, QUOTE_STATUSES, REMINDER_CHANNELS, VENDOR_SERVICES } from "@/components/app/options";

/** Validation schemas + CRUD configs for each workspace collection. */

const text = (min: number, max: number, msg = "Required.") => z.string().trim().min(min, msg).max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));
const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time.");
const dateOnly = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date.")
  .optional()
  .transform((v) => (v ? v : undefined));
const money = (msg: string) => z.number({ message: msg }).finite().min(0, "Cannot be negative.").max(1e11, "That is too large.");
const auctionRef = optText(20);

function checkAuction(id: string | undefined, field: string) {
  if (id && !catalog().get(id)) throw new FieldError({ [field]: "No auction with this Ref ID. Copy it from the auction page." });
}

/* ---------------------------------------------------------------- bids */

export const bidSchema = z.object({
  auctionId: text(1, 20, "Enter the auction Ref ID."),
  lotNo: optText(20),
  amount: money("Enter your bid amount.").refine((v) => v > 0, "Enter your bid amount."),
  status: z.enum(BID_STATUSES),
  note: optText(500),
});

export const bidsConfig: CrudConfig<"bids", typeof bidSchema> = {
  collection: "bids",
  schema: bidSchema,
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  build: (input, user) => {
    checkAuction(input.auctionId, "auctionId");
    return { id: newId("b"), userId: user.id, ...input, createdAt: isoNow() };
  },
  apply: (rec, input) => {
    checkAuction(input.auctionId, "auctionId");
    // Keys present in the body are applied (an emptied optional field clears it).
    Object.assign(rec, input);
  },
};

/* ----------------------------------------------------------- reminders */

export const reminderSchema = z.object({
  title: text(2, 120, "Give the reminder a title."),
  remindAt: isoDateTime,
  channel: z.enum(REMINDER_CHANNELS),
  auctionId: auctionRef,
  done: z.boolean().optional(),
});

export const remindersConfig: CrudConfig<"reminders", typeof reminderSchema> = {
  collection: "reminders",
  feature: "reminders",
  schema: reminderSchema,
  sort: (a, b) => a.remindAt.localeCompare(b.remindAt),
  build: (input, user) => {
    checkAuction(input.auctionId, "auctionId");
    return {
      id: newId("r"),
      userId: user.id,
      title: input.title,
      remindAt: new Date(input.remindAt).toISOString(),
      channel: input.channel,
      auctionId: input.auctionId,
      done: input.done ?? false,
      createdAt: isoNow(),
    };
  },
  apply: (rec, input) => {
    checkAuction(input.auctionId, "auctionId");
    Object.assign(rec, input);
    if (input.remindAt) rec.remindAt = new Date(input.remindAt).toISOString();
  },
};

/* ----------------------------------------------------------- inventory */

export const inventorySchema = z.object({
  material: text(2, 120, "Name the material."),
  quantity: z.number({ message: "Enter a quantity." }).finite().positive("Must be more than zero.").max(1e9),
  unit: z.enum(INVENTORY_UNITS),
  costPerUnit: money("Enter the cost per unit."),
  location: text(2, 80, "Where is it stored?"),
  sourceAuctionId: auctionRef,
});

export const inventoryConfig: CrudConfig<"inventory", typeof inventorySchema> = {
  collection: "inventory",
  feature: "inventory",
  schema: inventorySchema,
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  build: (input, user) => {
    checkAuction(input.sourceAuctionId, "sourceAuctionId");
    return { id: newId("inv"), userId: user.id, ...input, createdAt: isoNow() };
  },
  apply: (rec, input) => {
    checkAuction(input.sourceAuctionId, "sourceAuctionId");
    // Keys present in the body are applied (an emptied optional field clears it).
    Object.assign(rec, input);
  },
};

/* ------------------------------------------------------------- vendors */

export const vendorSchema = z.object({
  name: text(2, 100, "Enter the vendor name."),
  service: z.enum(VENDOR_SERVICES),
  city: text(2, 60, "Enter a city."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s-]{7,15}\d)$/, "Enter a valid phone number."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
    .optional()
    .transform((v) => (v ? v : undefined)),
  rating: z.number().int().min(1, "Rate 1 to 5.").max(5, "Rate 1 to 5."),
});

export const vendorsConfig: CrudConfig<"vendors", typeof vendorSchema> = {
  collection: "vendors",
  // The vendor directory ships with the inventory manager on Individual+.
  feature: "inventory",
  schema: vendorSchema,
  sort: (a, b) => a.name.localeCompare(b.name),
  build: (input, user) => ({ id: newId("v"), userId: user.id, ...input, createdAt: isoNow() }),
};

/* -------------------------------------------------------------- quotes */

export const quoteLineSchema = z.object({
  description: text(1, 200, "Describe the item."),
  quantity: z.number({ message: "Qty?" }).finite().positive("Qty must be > 0.").max(1e9),
  unit: text(1, 12, "Unit?"),
  rate: money("Rate?"),
});

export const quoteSchema = z.object({
  client: text(2, 120, "Who is this quote for?"),
  auctionId: auctionRef,
  lines: z.array(quoteLineSchema).min(1, "Add at least one line item.").max(60, "Up to 60 lines."),
  gstRate: z.number().min(0, "0–28%").max(28, "0–28%"),
  marginPct: z.number().min(0, "0–100%").max(100, "0–100%"),
  terms: z.string().trim().max(2000, "Keep terms under 2,000 characters."),
  status: z.enum(QUOTE_STATUSES),
});

export const quotesConfig: CrudConfig<"quotes", typeof quoteSchema> = {
  collection: "quotes",
  feature: "quoteBuilder",
  schema: quoteSchema,
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  build: (input, user, db) => {
    checkAuction(input.auctionId, "auctionId");
    const year = new Date().getFullYear();
    const count = db.quotes.filter((q) => q.userId === user.id).length + 1;
    return { id: newId("q"), userId: user.id, number: `LQ-${year}-${String(count).padStart(4, "0")}`, ...input, createdAt: isoNow() };
  },
  apply: (rec, input) => {
    checkAuction(input.auctionId, "auctionId");
    // Keys present in the body are applied (an emptied optional field clears it).
    Object.assign(rec, input);
  },
};

/* ----------------------------------------------------------- documents */

export const documentSchema = z.object({
  name: text(2, 120, "Name the document."),
  kind: z.enum(DOCUMENT_KINDS, { message: "Choose a document type." }),
  expiresOn: dateOnly,
});

export const documentsConfig: CrudConfig<"documents", typeof documentSchema> = {
  collection: "documents",
  feature: "documents",
  schema: documentSchema,
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  build: (input, user) => ({ id: newId("d"), userId: user.id, ...input, sizeKb: 0, createdAt: isoNow() }),
  apply: (rec, input) => {
    Object.assign(rec, defined({ name: input.name, kind: input.kind }));
    // An explicit empty date clears the expiry.
    if ("expiresOn" in input) rec.expiresOn = input.expiresOn;
  },
  afterDelete: async (rec) => deleteUpload(rec.userId, rec.id),
};

/* ------------------------------------------------------------- helpers */

function defined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}
