export interface NewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  kind: "Platform" | "Explainer" | "Regulation";
  source: string;
  href?: string;
}

/**
 * Built-in bulletin. Live third-party news needs a licensed feed; set NEWS_RSS_URL to merge
 * an RSS feed server-side (see src/server/news.ts). Items here describe Lelam itself or explain
 * standing rules, so none of them is presented as a third-party report.
 */
export const NEWS: NewsItem[] = [
  {
    id: "n-2026-10-28",
    date: "2026-10-28",
    title: "Re-auctioned lot detection is now in the marketplace filter",
    summary: "Lots that went unsold and are listed again now carry a Re-auction badge, and Individual plans and above can filter for them.",
    kind: "Platform",
    source: "Lelam",
  },
  {
    id: "n-2026-10-14",
    date: "2026-10-14",
    title: "Landed-cost estimator adds TCS and ITC-aware totals",
    summary: "The estimator now separates TCS from GST and shows your cost net of input tax credit for registered buyers.",
    kind: "Platform",
    source: "Lelam",
  },
  {
    id: "n-2026-09-30",
    date: "2026-09-30",
    title: "How auto-extensions work in the final minutes of an e-auction",
    summary: "Most portals extend closing time when a bid lands late. Here is how that affects your walk-away strategy.",
    kind: "Explainer",
    source: "Lelam",
    href: "/faq#extensions",
  },
  {
    id: "n-2026-09-12",
    date: "2026-09-12",
    title: "Reverse charge GST on scrap: what buyers need to file",
    summary: "Under RCM the buyer pays GST directly. A short checklist for staying compliant and claiming input tax credit.",
    kind: "Regulation",
    source: "Lelam",
    href: "/blog/true-cost-of-winning-an-auction-emd-gst-tcs",
  },
  {
    id: "n-2026-08-26",
    date: "2026-08-26",
    title: "Bank property listings now show the legal framework",
    summary: "Every BaankNet-style listing now states whether it is sold under SARFAESI, DRT or IBC, with what that means for timelines.",
    kind: "Platform",
    source: "Lelam",
  },
  {
    id: "n-2026-08-05",
    date: "2026-08-05",
    title: "End-of-life vehicles: scrapping facility rules in brief",
    summary: "Many ELV auctions are restricted to registered vehicle scrapping facilities. What to check before bidding.",
    kind: "Explainer",
    source: "Lelam",
    href: "/blog/buying-seized-and-unclaimed-vehicles",
  },
];

export interface Notice {
  id: string;
  date: string;
  title: string;
  body: string;
}

export const NOTICES: Notice[] = [
  {
    id: "notice-independence",
    date: "2026-10-01",
    title: "Lelam is independent of all auction portals",
    body: "Lelam is not affiliated with MSTC, BaankNet, GeM or any bank. We never collect EMD or bid on your behalf. If anyone asks you to pay EMD to a Lelam account, do not pay. Report it to support.",
  },
  {
    id: "notice-catalog",
    date: "2026-09-15",
    title: "Catalog figures are indicative",
    body: "Market prices, projections and lot extractions are decision support. Always confirm quantities and terms in the official catalog and STC before bidding.",
  },
];
