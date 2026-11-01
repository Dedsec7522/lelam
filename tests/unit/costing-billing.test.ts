import { describe, expect, it } from "vitest";
import { computeLandedCost, projectAuction, winProbability } from "@/lib/costing";
import { quoteFor, stateFromPincode } from "@/lib/billing";
import { canUse, monthlyEquivalent, PLAN_BY_ID, priceFor, WATCHLIST_LIMIT } from "@/lib/plans";
import { distanceKm } from "@/lib/geo";
import { formatCountdown, formatINR, slugify } from "@/lib/format";

describe("computeLandedCost", () => {
  it("matches the worked example from the costs article", () => {
    const c = computeLandedCost({ bid: 500000, gstRate: 18, tcsRate: 1, emdPercent: 10, weightTonnes: 20, distanceKm: 180 });
    expect(c.gst).toBe(90000);
    expect(c.tcs).toBe(5900);
    expect(c.transport).toBe(19800);
    expect(c.loading).toBe(7000);
    expect(c.total).toBe(622700);
    expect(c.emd).toBe(50000);
    expect(c.balanceAfterEmd).toBe(572700);
  });

  it("removes recoverable GST from the effective cost when ITC applies", () => {
    const c = computeLandedCost({ bid: 500000, gstRate: 18, emdPercent: 10, weightTonnes: 20, distanceKm: 180, itcEligible: true });
    expect(c.effectiveCost).toBe(c.total - c.gst);
  });

  it("never goes negative", () => {
    const c = computeLandedCost({ bid: -100, gstRate: 18, emdPercent: 10, weightTonnes: 0, distanceKm: 0, otherCharges: -5 });
    expect(c.total).toBe(0);
  });
});

describe("projectAuction", () => {
  const lots = [{ lotNo: "1", description: "x", quantity: 10, unit: "MT" as const, marketPrice: 100000 }];
  it("projects close, profit and ROI from category ratios", () => {
    const p = projectAuction({ lots, category: "scrap", isReauction: false });
    expect(p.turnover).toBe(1_000_000);
    expect(p.predictedClose).toBe(780_000);
    expect(p.profit).toBe(220_000);
    expect(p.roiPercent).toBeCloseTo(28.2, 1);
    expect(p.caps.conservative).toBeLessThan(p.caps.aggressive);
    expect(p.caps.aggressive).toBeLessThan(p.caps.walkAway);
  });

  it("lowers the expected close for re-auctioned lots", () => {
    const a = projectAuction({ lots, category: "scrap", isReauction: false });
    const b = projectAuction({ lots, category: "scrap", isReauction: true });
    expect(b.predictedClose).toBeLessThan(a.predictedClose);
  });

  it("gives higher win probability for higher bids", () => {
    expect(winProbability(900, 1000)).toBeLessThan(winProbability(1100, 1000));
    expect(winProbability(1000, 1000)).toBe(50);
    expect(winProbability(100, 0)).toBe(0);
  });
});

describe("billing", () => {
  it("applies yearly discount, coupons and GST", () => {
    expect(priceFor(PLAN_BY_ID.individual, "yearly")).toBe(Math.round(799 * 12 * 0.88));
    expect(monthlyEquivalent(PLAN_BY_ID.enterprise, "monthly")).toBeNull();
    const q = quoteFor("business", "monthly", "launch10");
    expect(q.coupon).toBe("LAUNCH10");
    expect(q.discount).toBe(150);
    expect(q.gst).toBe(Math.round((1499 - 150) * 0.18));
    expect(q.total).toBe(q.subtotal + q.gst);
    expect(quoteFor("business", "monthly", "BOGUS").discount).toBe(0);
  });

  it("maps PIN codes to states", () => {
    expect(stateFromPincode("560008")).toBe("Karnataka");
    expect(stateFromPincode("110001")).toBe("Delhi");
    expect(stateFromPincode("834001")).toBe("Jharkhand");
    expect(stateFromPincode("012345")).toBeNull();
  });
});

describe("entitlements", () => {
  it("gates features by plan rank", () => {
    expect(canUse("free", "landedCost")).toBe(false);
    expect(canUse("individual", "landedCost")).toBe(true);
    expect(canUse("individual", "bidIntelligence")).toBe(false);
    expect(canUse("business", "bidIntelligence")).toBe(true);
    expect(canUse("business", "sellerPortal")).toBe(false);
    expect(WATCHLIST_LIMIT.free).toBe(10);
  });
});

describe("helpers", () => {
  it("measures distance", () => {
    expect(Math.round(distanceKm({ lat: 28.61, lng: 77.21 }, { lat: 19.08, lng: 72.88 }))).toBeGreaterThan(1100);
  });
  it("formats Indian currency and countdowns", () => {
    expect(formatINR(156011)).toBe("₹1,56,011");
    expect(formatINR(25_000_000, { compact: true })).toBe("₹2.5 Cr");
    expect(formatCountdown(26 * 3600_000)).toBe("1d 2h");
    expect(formatCountdown(-1)).toBe("0m");
    expect(slugify("Hello, World!  2026")).toBe("hello-world-2026");
  });
});
