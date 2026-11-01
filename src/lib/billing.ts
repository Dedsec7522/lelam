import { PLAN_BY_ID, priceFor } from "./plans";
import type { BillingCycle, PlanId } from "./types";

/** Promotional codes (percentage off the pre-tax subscription price). */
export const COUPONS: Record<string, number> = {
  LAUNCH10: 10,
  BIDDER15: 15,
};

export const SUBSCRIPTION_GST = 18;

export interface Quote {
  base: number;
  discountPercent: number;
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  coupon?: string;
}

export function quoteFor(plan: Exclude<PlanId, "free" | "enterprise">, cycle: BillingCycle, coupon?: string): Quote {
  const base = priceFor(PLAN_BY_ID[plan], cycle) ?? 0;
  const code = coupon?.trim().toUpperCase();
  const discountPercent = code && COUPONS[code] ? COUPONS[code] : 0;
  const discount = Math.round((base * discountPercent) / 100);
  const subtotal = base - discount;
  const gst = Math.round((subtotal * SUBSCRIPTION_GST) / 100);
  return { base, discountPercent, discount, subtotal, gst, total: subtotal + gst, coupon: discountPercent ? code : undefined };
}

/** PIN-code prefix → state (first two digits), for address autofill. */
const PIN_PREFIX: Array<[number, number, string]> = [
  [11, 11, "Delhi"],
  [12, 13, "Haryana"],
  [14, 16, "Punjab"],
  [17, 17, "Himachal Pradesh"],
  [18, 19, "Jammu & Kashmir"],
  [20, 28, "Uttar Pradesh"],
  [30, 34, "Rajasthan"],
  [36, 39, "Gujarat"],
  [40, 44, "Maharashtra"],
  [45, 48, "Madhya Pradesh"],
  [49, 49, "Chhattisgarh"],
  [50, 50, "Telangana"],
  [51, 53, "Andhra Pradesh"],
  [56, 59, "Karnataka"],
  [60, 64, "Tamil Nadu"],
  [67, 69, "Kerala"],
  [70, 74, "West Bengal"],
  [75, 77, "Odisha"],
  [78, 78, "Assam"],
  [80, 85, "Bihar"],
  [82, 83, "Jharkhand"],
];

export function stateFromPincode(pin: string): string | null {
  if (!/^[1-9]\d{5}$/.test(pin)) return null;
  const p = Number(pin.slice(0, 2));
  // Jharkhand's range sits inside Bihar's; prefer the narrower match.
  const matches = PIN_PREFIX.filter(([a, b]) => p >= a && p <= b).sort((x, y) => x[1] - x[0] - (y[1] - y[0]));
  return matches[0]?.[2] ?? null;
}
