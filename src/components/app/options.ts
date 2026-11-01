/**
 * Enumerations shared by workspace forms (client) and their zod schemas (server).
 * Framework-free so both sides import the same source of truth.
 */

export const BID_STATUSES = ["placed", "won", "lost", "withdrawn"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const REMINDER_CHANNELS = ["email", "sms", "whatsapp"] as const;

export const INVENTORY_UNITS = ["MT", "KG", "NOS", "CUM", "SQFT", "LTR"] as const;

export const VENDOR_SERVICES = ["transport", "loading", "recycler", "buyer", "other"] as const;

export const QUOTE_STATUSES = ["draft", "sent"] as const;

export const DOCUMENT_KINDS = [
  "GST certificate",
  "PAN card",
  "MSTC registration",
  "EMD receipt",
  "Sale / acceptance letter",
  "Delivery order",
  "Pollution / CPCB authorisation",
  "Invoice",
  "Other",
] as const;

export const VEHICLES = [
  "Pickup (up to 1 T)",
  "LCV 14 ft (up to 4 T)",
  "Truck 19 ft (up to 9 T)",
  "Truck 22 ft (up to 15 T)",
  "Trailer 32 ft (up to 25 T)",
  "Tipper",
  "Container",
] as const;

/** Suggests a vehicle class for a given load. */
export function vehicleFor(tonnes: number): (typeof VEHICLES)[number] {
  if (tonnes <= 1) return VEHICLES[0];
  if (tonnes <= 4) return VEHICLES[1];
  if (tonnes <= 9) return VEHICLES[2];
  if (tonnes <= 15) return VEHICLES[3];
  return VEHICLES[4];
}

export const ROLES = ["buyer", "seller", "logistics", "admin"] as const;
export const PLAN_IDS = ["free", "individual", "business", "enterprise"] as const;
