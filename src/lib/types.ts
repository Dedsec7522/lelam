export type Source = "MSTC" | "BaankNet";

export type CategoryId = "scrap" | "machinery" | "vehicles" | "real-estate" | "e-waste" | "minerals" | "forest";

export type AuctionType = "O-General" | "F-Forest" | "U-Price" | "SARFAESI" | "DRT" | "IBC";

export type AuctionStatus = "upcoming" | "live" | "closed";

export type Unit = "MT" | "CUM" | "NOS" | "KG" | "SQFT";

export interface Lot {
  lotNo: string;
  description: string;
  quantity: number;
  unit: Unit;
  /** Indicative market price per unit, INR. */
  marketPrice: number;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ComplianceItem {
  title: string;
  description: string;
  conditional?: boolean;
}

export interface Auction {
  id: string;
  source: Source;
  officialRef: string;
  title: string;
  category: CategoryId;
  subCategory: string;
  seller: string;
  office: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  auctionType: AuctionType;
  emdPercent: number;
  /** null → not an auto pre-bid EMD auction. */
  preBidEmd: number | null;
  /** BaankNet only: reserve price. */
  reservePrice?: number;
  startsAt: string;
  endsAt: string;
  inspectionFrom: string;
  inspectionTo: string;
  isReauction: boolean;
  hasDocs: boolean;
  hasImages: boolean;
  gstScheme: "RCM" | "FCM";
  gstRate: number;
  lots: Lot[];
  contacts: Contact[];
  compliance: ComplianceItem[];
  description: string;
  /** Approximate total weight in tonnes, used by the transport estimator. */
  weightTonnes: number;
}

export type Role = "buyer" | "seller" | "logistics" | "admin";

export type PlanId = "free" | "individual" | "business" | "enterprise";

export type BillingCycle = "monthly" | "yearly";
