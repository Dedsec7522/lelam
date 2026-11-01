import { describe, expect, it } from "vitest";
import { filterAuctions, parseQuery, statusOf } from "@/lib/search";
import type { Auction } from "@/lib/types";

describe("parseQuery", () => {
  it("extracts category, sub-category and city from plain English", () => {
    const p = parseQuery("Copper scrap auctions in Mumbai");
    expect(p.category).toBe("scrap");
    expect(p.subCategory).toBe("Copper scrap");
    expect(p.city).toBe("Mumbai");
    expect(p.nearMe).toBe(false);
    expect(p.keywords).toEqual([]);
  });

  it("understands near-me and explicit radius", () => {
    expect(parseQuery("vehicles near me")).toMatchObject({ category: "vehicles", nearMe: true });
    expect(parseQuery("batteries within 100 km")).toMatchObject({ category: "e-waste", nearMe: true, radiusKm: 100 });
  });

  it("maps aliases and states", () => {
    expect(parseQuery("teak in trivandrum").city).toBe("Thiruvananthapuram");
    expect(parseQuery("auctions in Gujarat").state).toBe("Gujarat");
    expect(parseQuery("property in bangalore")).toMatchObject({ category: "real-estate", city: "Bengaluru" });
  });

  it("detects re-auction and source hints", () => {
    expect(parseQuery("re-auctioned lots").reauction).toBe(true);
    expect(parseQuery("mstc iron").source).toBe("MSTC");
    expect(parseQuery("bank property").source).toBe("BaankNet");
  });

  it("keeps meaningful free-text keywords and tolerates junk", () => {
    expect(parseQuery("transformer 1 MVA").keywords).toContain("transformer");
    expect(parseQuery("   ").keywords).toEqual([]);
    expect(() => parseQuery("(((*&^%$")).not.toThrow();
  });
});

const base: Auction = {
  id: "1",
  source: "MSTC",
  officialRef: "REF/1",
  title: "Copper scrap",
  category: "scrap",
  subCategory: "Copper scrap",
  seller: "Depot",
  office: "Western Regional Office (Mumbai)",
  city: "Mumbai",
  state: "Maharashtra",
  lat: 19.08,
  lng: 72.88,
  auctionType: "O-General",
  emdPercent: 10,
  preBidEmd: null,
  startsAt: "2026-11-05T05:00:00.000Z",
  endsAt: "2026-11-05T09:00:00.000Z",
  inspectionFrom: "2026-10-22T05:00:00.000Z",
  inspectionTo: "2026-11-04T05:00:00.000Z",
  isReauction: false,
  hasDocs: true,
  hasImages: false,
  gstScheme: "RCM",
  gstRate: 18,
  lots: [{ lotNo: "01", description: "Copper winding wire", quantity: 2, unit: "MT", marketPrice: 600000 }],
  contacts: [],
  compliance: [],
  description: "",
  weightTonnes: 2,
};

const fixtures: Auction[] = [
  base,
  { ...base, id: "2", title: "Iron and steel", subCategory: "Iron and steel", city: "Kolkata", state: "West Bengal", lat: 22.57, lng: 88.36, isReauction: true, preBidEmd: 5000 },
  { ...base, id: "3", title: "Flat", category: "real-estate", subCategory: "Residential flat", source: "BaankNet", city: "Chennai", state: "Tamil Nadu", lat: 13.08, lng: 80.27, startsAt: "2026-10-20T05:00:00.000Z", endsAt: "2026-10-20T07:00:00.000Z" },
];
const NOW = Date.parse("2026-11-01T06:00:00.000Z");

describe("statusOf", () => {
  it("classifies upcoming, live and closed", () => {
    expect(statusOf(base, NOW)).toBe("upcoming");
    expect(statusOf(base, Date.parse("2026-11-05T06:00:00.000Z"))).toBe("live");
    expect(statusOf(base, Date.parse("2026-11-06T00:00:00.000Z"))).toBe("closed");
  });
});

describe("filterAuctions", () => {
  it("applies parsed query filters", () => {
    const r = filterAuctions(fixtures, { q: "copper scrap in mumbai" }, NOW);
    expect(r.items.map((a) => a.id)).toEqual(["1"]);
  });

  it("filters by radius when a location is supplied and sorts by distance", () => {
    const r = filterAuctions(fixtures, { q: "near me", near: { lat: 22.6, lng: 88.4 }, radiusKm: 50 }, NOW);
    expect(r.items.map((a) => a.id)).toEqual(["2"]);
    expect(r.items[0].distanceKm).toBeLessThan(10);
  });

  it("supports structured filters and hides closed auctions on demand", () => {
    expect(filterAuctions(fixtures, { reauction: true }, NOW).total).toBe(1);
    expect(filterAuctions(fixtures, { preBid: "required" }, NOW).items[0].id).toBe("2");
    expect(filterAuctions(fixtures, { status: "open" }, NOW).items.map((a) => a.id)).not.toContain("3");
    expect(filterAuctions(fixtures, { source: "BaankNet" }, NOW).total).toBe(1);
  });

  it("puts closed auctions last in the default sort", () => {
    const r = filterAuctions(fixtures, {}, NOW);
    expect(r.items[r.items.length - 1].id).toBe("3");
  });
});
