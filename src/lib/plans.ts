import type { BillingCycle, PlanId } from "./types";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in INR; null = custom. */
  monthly: number | null;
  highlight?: boolean;
  cta: string;
  includesLabel: string;
  features: string[];
  trialDays?: number;
}

export const YEARLY_DISCOUNT = 0.12;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Discover auctions across portals. No card needed.",
    monthly: 0,
    cta: "Start free",
    includesLabel: "Free includes",
    features: [
      "Search & browse with filters",
      "Auction details & catalogs",
      "Basic commodity prices",
      "Email closing reminders",
      "Keyword auction alerts",
      "Watchlist up to 10 lots",
    ],
  },
  {
    id: "individual",
    name: "Individual",
    tagline: "For active bidders who want the numbers done for them.",
    monthly: 799,
    cta: "Choose Individual",
    includesLabel: "Everything in Free, plus",
    features: [
      "Landed-cost estimator (GST, TCS, transport)",
      "Basic max-bid calculator",
      "Custom reminders",
      "Document vault",
      "Inventory manager",
      "Logistics quote requests",
      "Re-auctioned lot filter",
      "Priority email support (24h)",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "The full intelligence suite to value and win lots.",
    monthly: 1499,
    highlight: true,
    cta: "Start 30-day trial",
    includesLabel: "Everything in Individual, plus",
    trialDays: 30,
    features: [
      "Bid Intelligence & win probability",
      "Profit & loss valuation",
      "Scrap vs resale breakdown",
      "Risk & margin warnings",
      "Market price history",
      "Quote Builder with PDF export",
      "Personalised recommendations",
      "Up to 5 team seats",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Scale, security and a dedicated team.",
    monthly: null,
    cta: "Talk to sales",
    includesLabel: "Everything in Business, plus",
    features: [
      "What-if bid simulator",
      "Custom commodity indices",
      "Seller portal access",
      "Single sign-on (SSO)",
      "Dedicated account manager",
      "API access & dedicated server",
      "Up to 10 team seats",
    ],
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

export function priceFor(plan: Plan, cycle: BillingCycle): number | null {
  if (plan.monthly === null) return null;
  if (cycle === "monthly") return plan.monthly;
  return Math.round(plan.monthly * 12 * (1 - YEARLY_DISCOUNT));
}

export function monthlyEquivalent(plan: Plan, cycle: BillingCycle): number | null {
  const p = priceFor(plan, cycle);
  if (p === null) return null;
  return cycle === "monthly" ? p : Math.round(p / 12);
}

export type Feature =
  | "landedCost"
  | "reminders"
  | "documents"
  | "inventory"
  | "logisticsQuotes"
  | "reauctionFilter"
  | "bidIntelligence"
  | "quoteBuilder"
  | "recommendations"
  | "sellerPortal";

const RANK: Record<PlanId, number> = { free: 0, individual: 1, business: 2, enterprise: 3 };

const MIN_PLAN: Record<Feature, PlanId> = {
  landedCost: "individual",
  reminders: "individual",
  documents: "individual",
  inventory: "individual",
  logisticsQuotes: "individual",
  reauctionFilter: "individual",
  bidIntelligence: "business",
  quoteBuilder: "business",
  recommendations: "business",
  sellerPortal: "enterprise",
};

export function canUse(plan: PlanId, feature: Feature): boolean {
  return RANK[plan] >= RANK[MIN_PLAN[feature]];
}

export function requiredPlan(feature: Feature): Plan {
  return PLAN_BY_ID[MIN_PLAN[feature]];
}

export const WATCHLIST_LIMIT: Record<PlanId, number> = {
  free: 10,
  individual: 50,
  business: Number.POSITIVE_INFINITY,
  enterprise: Number.POSITIVE_INFINITY,
};

export interface ComparisonRow {
  label: string;
  values: [string | boolean, string | boolean, string | boolean, string | boolean];
}

export interface ComparisonGroup {
  title: string;
  rows: ComparisonRow[];
}

export const COMPARISON: ComparisonGroup[] = [
  {
    title: "Discovery & search",
    rows: [
      { label: "Search & browse across MSTC and BaankNet", values: [true, true, true, true] },
      { label: "Plain-English search", values: [true, true, true, true] },
      { label: "Keyword auction alerts", values: [true, true, true, true] },
      { label: "Re-auctioned lot filter", values: [false, true, true, true] },
      { label: "Personalised recommendations", values: [false, false, true, true] },
    ],
  },
  {
    title: "Valuation & pricing",
    rows: [
      { label: "Basic commodity prices", values: [true, true, true, true] },
      { label: "Landed-cost estimator", values: [false, true, true, true] },
      { label: "Max-bid calculator", values: [false, "Basic", "Advanced", "Custom"] },
      { label: "Bid Intelligence & win probability", values: [false, false, true, true] },
      { label: "Profit & loss valuation", values: [false, false, true, true] },
      { label: "What-if bid simulator", values: [false, false, false, true] },
      { label: "Custom commodity indices", values: [false, false, false, true] },
    ],
  },
  {
    title: "Workspace",
    rows: [
      { label: "Watchlist", values: ["10 lots", "50 lots", "Unlimited", "Unlimited"] },
      { label: "Document vault", values: [false, true, true, true] },
      { label: "Reminders", values: ["Email", true, true, true] },
      { label: "Inventory & vendor directory", values: [false, true, true, true] },
      { label: "Quote Builder", values: [false, false, true, true] },
      { label: "Logistics quote requests", values: [false, true, true, true] },
    ],
  },
  {
    title: "Team & support",
    rows: [
      { label: "Team seats", values: ["—", "—", "Up to 5", "Up to 10"] },
      { label: "Priority support", values: [false, "24h email", "24h email", "Dedicated manager"] },
      { label: "SSO & audit trail", values: [false, false, false, true] },
      { label: "Seller portal", values: [false, false, false, true] },
    ],
  },
];
