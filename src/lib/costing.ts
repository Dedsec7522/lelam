import { lotValue } from "./search";
import type { Auction } from "./types";

export interface LandedCostInput {
  bid: number;
  gstRate: number; // e.g. 18
  tcsRate?: number; // e.g. 1
  emdPercent: number; // e.g. 10
  weightTonnes: number;
  distanceKm: number;
  ratePerTonneKm?: number;
  loadingPerTonne?: number;
  otherCharges?: number;
  /** Registered buyers can usually claim GST as input tax credit. */
  itcEligible?: boolean;
}

export interface LandedCost {
  bid: number;
  gst: number;
  tcs: number;
  transport: number;
  loading: number;
  other: number;
  total: number;
  /** Total net of recoverable GST (ITC). */
  effectiveCost: number;
  emd: number;
  balanceAfterEmd: number;
}

export const DEFAULT_RATE_PER_TONNE_KM = 5.5;
export const DEFAULT_LOADING_PER_TONNE = 350;

const round = (n: number) => Math.round(n);

export function computeLandedCost(input: LandedCostInput): LandedCost {
  const bid = Math.max(0, input.bid);
  const gst = (bid * input.gstRate) / 100;
  const tcs = ((bid + gst) * (input.tcsRate ?? 1)) / 100;
  const transport = input.weightTonnes * input.distanceKm * (input.ratePerTonneKm ?? DEFAULT_RATE_PER_TONNE_KM);
  const loading = input.weightTonnes * (input.loadingPerTonne ?? DEFAULT_LOADING_PER_TONNE);
  const other = Math.max(0, input.otherCharges ?? 0);
  const total = bid + gst + tcs + transport + loading + other;
  const effectiveCost = input.itcEligible ? total - gst : total;
  const emd = (bid * input.emdPercent) / 100;
  return {
    bid: round(bid),
    gst: round(gst),
    tcs: round(tcs),
    transport: round(transport),
    loading: round(loading),
    other: round(other),
    total: round(total),
    effectiveCost: round(effectiveCost),
    emd: round(emd),
    balanceAfterEmd: round(total - emd),
  };
}

export interface Projection {
  turnover: number;
  predictedClose: number;
  profit: number;
  roiPercent: number;
  /** Bid caps: conservative < aggressive < walk-away. */
  caps: { conservative: number; aggressive: number; walkAway: number };
}

/** Category-level baseline for how close winning bids land to resale value. */
const CLOSE_RATIO: Record<Auction["category"], number> = {
  scrap: 0.78,
  machinery: 0.7,
  vehicles: 0.74,
  "real-estate": 0.82,
  "e-waste": 0.72,
  minerals: 0.85,
  forest: 0.75,
};

export function projectAuction(a: Pick<Auction, "lots" | "category" | "isReauction">): Projection {
  const turnover = lotValue(a);
  const ratio = CLOSE_RATIO[a.category] - (a.isReauction ? 0.06 : 0);
  const predictedClose = turnover * ratio;
  const profit = turnover - predictedClose;
  const roiPercent = predictedClose > 0 ? (profit / predictedClose) * 100 : 0;
  return {
    turnover: round(turnover),
    predictedClose: round(predictedClose),
    profit: round(profit),
    roiPercent: Math.round(roiPercent * 10) / 10,
    caps: {
      conservative: round(turnover * (ratio - 0.06)),
      aggressive: round(turnover * (ratio + 0.04)),
      walkAway: round(turnover * Math.min(0.95, ratio + 0.1)),
    },
  };
}

/** Logistic win-probability estimate for a bid relative to the predicted close. */
export function winProbability(bid: number, predictedClose: number): number {
  if (predictedClose <= 0) return 0;
  const x = (bid / predictedClose - 1) * 12;
  return Math.round((1 / (1 + Math.exp(-x))) * 100);
}
