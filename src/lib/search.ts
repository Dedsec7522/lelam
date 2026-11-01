import { distanceKm, type LatLng } from "./geo";
import { CATEGORIES, PLACES } from "./taxonomy";
import type { Auction, AuctionStatus, CategoryId, Source } from "./types";

export const DEFAULT_RADIUS_KM = 200;

export interface ParsedQuery {
  keywords: string[];
  category?: CategoryId;
  /** Sub-category hint, e.g. "Copper scrap". */
  subCategory?: string;
  city?: string;
  state?: string;
  nearMe: boolean;
  radiusKm?: number;
  source?: Source;
  reauction?: boolean;
}

const STOPWORDS = new Set([
  "show", "me", "find", "auction", "auctions", "in", "at", "near", "around", "within", "for", "the", "a", "an",
  "of", "lots", "lot", "all", "any", "and", "to", "from", "listing", "listings", "upcoming", "km", "kms", "of",
]);

const SUB_HINTS: Record<string, string> = {
  copper: "Copper scrap",
  aluminium: "Aluminium scrap",
  aluminum: "Aluminium scrap",
  brass: "Brass scrap",
  cable: "Cable scrap",
  iron: "Iron and steel",
  steel: "Iron and steel",
  teak: "Timber - Teak",
  firewood: "Firewood",
  bamboo: "Bamboo",
  bauxite: "Bauxite",
  coal: "Coal",
  manganese: "Manganese ore",
  battery: "Batteries",
  batteries: "Batteries",
  warehouse: "Warehouse",
  flat: "Residential flat",
};

/**
 * Turns plain English ("copper scrap auctions in Mumbai", "vehicles near me within 50km")
 * into structured filters. Pure and deterministic — no network, no LLM.
 */
export function parseQuery(raw: string): ParsedQuery {
  const text = raw.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
  const result: ParsedQuery = { keywords: [], nearMe: false };
  if (!text) return result;

  let rest = ` ${text} `;

  if (/\b(near me|nearby|close to me|around me|my location)\b/.test(rest)) {
    result.nearMe = true;
    rest = rest.replace(/\b(near me|nearby|close to me|around me|my location)\b/g, " ");
  }
  const radius = rest.match(/\b(?:within\s+)?(\d{1,4})\s?(?:km|kms|kilometers|kilometres)\b/);
  if (radius) {
    result.radiusKm = Math.min(2000, Math.max(5, Number(radius[1])));
    result.nearMe = true;
    rest = rest.replace(radius[0], " ");
  }
  if (/\b(re-?auction(?:ed)?|relisted|unsold)\b/.test(rest)) {
    result.reauction = true;
    rest = rest.replace(/\b(re-?auction(?:ed)?|relisted|unsold)\b/g, " ");
  }
  if (/\bmstc\b/.test(rest)) {
    result.source = "MSTC";
    rest = rest.replace(/\bmstc\b/g, " ");
  } else if (/\b(baanknet|bank|banks|sarfaesi)\b/.test(rest)) {
    result.source = "BaankNet";
  }

  // Locations: longest names first so "new delhi" wins over "delhi".
  const placeNames = PLACES.flatMap((p) => [p.city.toLowerCase(), ...(p.aliases ?? [])].map((name) => ({ name, place: p })));
  placeNames.sort((a, b) => b.name.length - a.name.length);
  for (const { name, place } of placeNames) {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`);
    if (re.test(rest)) {
      result.city = place.city;
      rest = rest.replace(re, " ");
      break;
    }
  }
  if (!result.city) {
    const states = Array.from(new Set(PLACES.map((p) => p.state)));
    for (const state of states) {
      const head = state.toLowerCase().split(" & ")[0];
      const re = new RegExp(`\\b${escapeRegExp(head)}\\b`);
      if (re.test(rest)) {
        result.state = state;
        rest = rest.replace(re, " ");
        break;
      }
    }
  }

  const tokens = rest.split(" ").filter(Boolean);
  for (const token of tokens) {
    if (!result.category) {
      const cat = CATEGORIES.find((c) => c.keywords.includes(token));
      if (cat) result.category = cat.id;
    }
    if (!result.subCategory && SUB_HINTS[token]) result.subCategory = SUB_HINTS[token];
  }

  const categoryWords = new Set(CATEGORIES.flatMap((c) => c.keywords));
  result.keywords = tokens.filter((t) => !STOPWORDS.has(t) && !categoryWords.has(t) && !/^\d+$/.test(t) && t.length > 1);
  return result;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function statusOf(a: Pick<Auction, "startsAt" | "endsAt">, now: number): AuctionStatus {
  const start = Date.parse(a.startsAt);
  const end = Date.parse(a.endsAt);
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "closed";
}

export type SortKey = "ending" | "newest" | "emd-asc" | "value-desc" | "distance";

export interface AuctionFilters {
  q?: string;
  category?: CategoryId;
  subCategory?: string;
  source?: Source;
  state?: string;
  office?: string;
  preBid?: "required" | "none";
  docs?: boolean;
  images?: boolean;
  reauction?: boolean;
  from?: string;
  to?: string;
  status?: AuctionStatus | "open";
  near?: LatLng;
  radiusKm?: number;
  sort?: SortKey;
}

export function lotValue(a: Pick<Auction, "lots">): number {
  return a.lots.reduce((sum, l) => sum + l.quantity * l.marketPrice, 0);
}

export interface FilterResult {
  items: Array<Auction & { distanceKm?: number }>;
  total: number;
  parsed: ParsedQuery | null;
}

/** Applies structured filters plus the parsed plain-English query. */
export function filterAuctions(all: Auction[], filters: AuctionFilters, now: number): FilterResult {
  const parsed = filters.q ? parseQuery(filters.q) : null;
  const category = filters.category ?? parsed?.category;
  const source = filters.source ?? parsed?.source;
  const reauction = filters.reauction ?? parsed?.reauction;
  const near = filters.near;
  const radius = filters.radiusKm ?? parsed?.radiusKm ?? DEFAULT_RADIUS_KM;
  const fromTs = filters.from ? Date.parse(filters.from) : null;
  const toTs = filters.to ? Date.parse(filters.to) + 86_399_999 : null;

  let items: Array<Auction & { distanceKm?: number }> = all.map((a) =>
    near ? { ...a, distanceKm: Math.round(distanceKm(near, a)) } : a,
  );

  items = items.filter((a) => {
    if (category && a.category !== category) return false;
    const sub = filters.subCategory ?? (parsed?.category === a.category ? parsed?.subCategory : undefined);
    if (sub && a.subCategory !== sub) return false;
    if (source && a.source !== source) return false;
    if (filters.state && a.state !== filters.state) return false;
    if (parsed?.state && a.state !== parsed.state) return false;
    if (parsed?.city && a.city !== parsed.city) return false;
    if (filters.office && a.office !== filters.office) return false;
    if (filters.preBid === "required" && !a.preBidEmd) return false;
    if (filters.preBid === "none" && a.preBidEmd) return false;
    if (filters.docs && !a.hasDocs) return false;
    if (filters.images && !a.hasImages) return false;
    if (reauction && !a.isReauction) return false;
    if (fromTs !== null && Date.parse(a.startsAt) < fromTs) return false;
    if (toTs !== null && Date.parse(a.startsAt) > toTs) return false;
    const st = statusOf(a, now);
    if (filters.status === "open" && st === "closed") return false;
    if (filters.status && filters.status !== "open" && st !== filters.status) return false;
    if (near && (parsed?.nearMe || filters.radiusKm || !parsed) && a.distanceKm !== undefined && a.distanceKm > radius) return false;
    if (parsed?.keywords.length) {
      const hay = `${a.title} ${a.subCategory} ${a.seller} ${a.city} ${a.state} ${a.officialRef} ${a.id} ${a.lots
        .map((l) => l.description)
        .join(" ")}`.toLowerCase();
      if (!parsed.keywords.every((k) => hay.includes(k))) return false;
    }
    return true;
  });

  const sort = filters.sort ?? (near ? "distance" : "ending");
  items.sort((a, b) => {
    switch (sort) {
      case "newest":
        return Date.parse(b.startsAt) - Date.parse(a.startsAt);
      case "emd-asc":
        return (a.preBidEmd ?? 0) - (b.preBidEmd ?? 0);
      case "value-desc":
        return lotValue(b) - lotValue(a);
      case "distance":
        return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
      case "ending":
      default: {
        // Open auctions first, soonest first; closed ones last.
        const sa = statusOf(a, now) === "closed" ? 1 : 0;
        const sb = statusOf(b, now) === "closed" ? 1 : 0;
        if (sa !== sb) return sa - sb;
        return Date.parse(a.startsAt) - Date.parse(b.startsAt);
      }
    }
  });

  return { items, total: items.length, parsed };
}

/** Example prompts shown by the animated search placeholder and the suggestion list. */
export const SEARCH_EXAMPLES = [
  "Copper scrap auctions in Mumbai",
  "Vehicle auctions near me",
  "Bank property in Chennai",
  "Teak timber in Kerala",
  "Iron and steel near Kolkata",
  "Re-auctioned lots in Gujarat",
  "Batteries within 100 km",
];
