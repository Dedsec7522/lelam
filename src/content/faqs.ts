export type FaqGroup = "auctions" | "platform" | "billing";

export interface Faq {
  id: string;
  group: FaqGroup;
  q: string;
  a: string;
  tags: string[];
}

export const FAQ_GROUPS: { id: FaqGroup; label: string }[] = [
  { id: "auctions", label: "Government auctions" },
  { id: "platform", label: "Using Lelam" },
  { id: "billing", label: "Plans & billing" },
];

export const FAQS: Faq[] = [
  {
    id: "how-bidding-works",
    group: "auctions",
    q: "Where do I actually place my bid?",
    a: "Bids are placed on the official portal that runs the auction: MSTC for government e-auctions, or BaankNet and the bank's auction partner for bank properties. Lelam is an independent research and analysis layer. It helps you find lots, read catalogs and estimate landed cost and margin, and every listing links straight to the official page.",
    tags: ["bid", "bidding", "mstc", "portal", "place"],
  },
  {
    id: "affiliation",
    group: "auctions",
    q: "Is Lelam affiliated with MSTC, BaankNet or any government body?",
    a: "No. Lelam is an independent third-party platform. We are not affiliated with, authorised by or endorsed by MSTC Limited, BaankNet, GeM, any bank or any government department. We work only with publicly available auction information.",
    tags: ["affiliated", "government", "official", "mstc", "independent"],
  },
  {
    id: "emd-refund",
    group: "auctions",
    q: "How do pre-bid EMD deposits and refunds work?",
    a: "The pre-bid Earnest Money Deposit is paid to and refunded by the portal or seller, never through Lelam. On MSTC, EMD for unsuccessful bids normally returns to your portal ledger after the auction is finalised. Delays usually come from one challan being used for several deposits, or from paying long after the challan was generated. If a refund is late, contact the regional office listed on the auction.",
    tags: ["emd", "refund", "deposit", "earnest", "ledger", "challan"],
  },
  {
    id: "photos-missing",
    group: "auctions",
    q: "Why do so many scrap lots have no photos?",
    a: "Scrap and surplus material is often stored outdoors and changes condition, so sellers frequently publish few or no photos and ask buyers to inspect in person. Lelam flags lots that have documents or images, extracts lot details from the catalog, and shows the inspection window so you can plan a visit.",
    tags: ["photos", "images", "inspection", "pictures"],
  },
  {
    id: "extensions",
    group: "auctions",
    q: "Why do auctions run late or go into extensions?",
    a: "Many portals extend the closing time automatically when a bid arrives in the final minutes, so the last bidder cannot win simply by sniping. Long sessions are normal for popular lots. Set your walk-away price before the auction starts, and use Lelam's landed-cost view so you know your break-even point when extensions begin.",
    tags: ["extension", "late", "closing", "time"],
  },
  {
    id: "gst-rcm",
    group: "auctions",
    q: "What does GST under reverse charge (RCM) mean for my cost?",
    a: "For many scrap and forest-produce lots, GST is payable by the registered buyer directly to the government under the reverse charge mechanism, instead of being collected by the seller. It is still part of your cash outlay, but registered businesses can usually claim it back as input tax credit. Lelam's landed-cost estimator shows both the gross cost and the cost net of ITC.",
    tags: ["gst", "rcm", "reverse", "tax", "itc"],
  },
  {
    id: "pcb-docs",
    group: "auctions",
    q: "Do I need Pollution Control Board documents for e-waste or hazardous scrap?",
    a: "Yes, for most e-waste, battery and hazardous-waste lots. Sellers generally require a valid CPCB or SPCB authorisation as a recycler or dismantler before you can lift the material. Each Lelam listing shows its compliance checklist, and conditional items are marked.",
    tags: ["pcb", "pollution", "e-waste", "hazardous", "battery", "documents"],
  },
  {
    id: "sarfaesi",
    group: "auctions",
    q: "What should I check before bidding on a bank property?",
    a: "Read the sale notice for the reserve price, EMD deadline and inspection date. Verify the title and any outstanding dues, such as property tax and society charges, independently, because bank properties are sold on an as-is, where-is basis. Note whether the sale is under SARFAESI, DRT or IBC, since timelines and remedies differ.",
    tags: ["bank", "property", "sarfaesi", "drt", "ibc", "reserve"],
  },
  {
    id: "what-is-lelam",
    group: "platform",
    q: "What does Lelam do?",
    a: "Lelam brings MSTC and bank auction listings into one searchable catalog, reads the lot details from catalogs, and adds the maths a bidder needs: market value, landed cost (GST, TCS, transport and loading), predicted closing price and projected margin. It also gives you a watchlist, reminders, a document vault and a quote builder.",
    tags: ["what", "lelam", "about", "features"],
  },
  {
    id: "plain-english-search",
    group: "platform",
    q: "How does plain-English search work?",
    a: "Type the way you would ask a colleague, for example \"copper scrap in Mumbai\" or \"vehicle auctions within 100 km\". Lelam turns that into filters for category, material, city or state and distance. With \"near me\" it uses your browser location, but only after you allow it.",
    tags: ["search", "natural", "english", "near", "location"],
  },
  {
    id: "valuation",
    group: "platform",
    q: "How are market value and projected ROI calculated?",
    a: "Each lot is valued at an indicative market price per unit, then multiplied by quantity. The predicted closing bid uses category-level close ratios, which are adjusted for re-auctioned lots. Projected profit is resale value minus that predicted close. Treat these figures as decision support, not guarantees. Always inspect the material and check current rates.",
    tags: ["valuation", "roi", "profit", "price", "market"],
  },
  {
    id: "alerts",
    group: "platform",
    q: "Can I get alerts for specific materials or locations?",
    a: "Yes. Save keywords, categories and states in your profile and Lelam will notify you when matching auctions are listed. You can also add any lot to your watchlist and set reminders before inspection or bidding opens.",
    tags: ["alert", "alerts", "notification", "reminder", "watchlist"],
  },
  {
    id: "data-privacy",
    group: "platform",
    q: "Is my data safe?",
    a: "Passwords are stored as salted scrypt hashes and sessions use signed, HttpOnly cookies. We never ask for your portal passwords or handle your EMD payments. Uploaded documents stay private to your account. See the Privacy Policy for details.",
    tags: ["privacy", "security", "data", "safe"],
  },
  {
    id: "trial",
    group: "billing",
    q: "Can I try the Business plan before paying?",
    a: "Yes. The Business plan includes a 30-day free trial, once per account. You can cancel any time during the trial.",
    tags: ["trial", "free", "business", "try"],
  },
  {
    id: "switch",
    group: "billing",
    q: "Can I switch or cancel my plan?",
    a: "You can upgrade at any time, and the new features apply immediately. Downgrades take effect at the end of the current billing period. Yearly billing saves 12%.",
    tags: ["switch", "upgrade", "downgrade", "cancel", "plan"],
  },
  {
    id: "payment-methods",
    group: "billing",
    q: "Which payment methods do you accept?",
    a: "Cards, UPI and net banking through our payment partner. Add your GSTIN at checkout to receive a GST invoice.",
    tags: ["payment", "upi", "card", "invoice", "gstin"],
  },
  {
    id: "refunds",
    group: "billing",
    q: "What is your refund policy?",
    a: "If a paid plan is not right for you, contact support within 7 days of your first payment for a full refund. Renewals are not refunded, but you can cancel before the next renewal date.",
    tags: ["refund", "money", "back"],
  },
];

/** Simple keyword retrieval used by the FAQ search box and the assistant. */
export function searchFaqs(query: string, limit = 3): Faq[] {
  const terms = query.toLowerCase().split(/[^a-z0-9-]+/).filter((t) => t.length > 2);
  if (!terms.length) return [];
  return FAQS.map((f) => {
    const hay = `${f.q} ${f.a}`.toLowerCase();
    const score = terms.reduce((s, t) => s + (f.tags.includes(t) ? 3 : 0) + (f.q.toLowerCase().includes(t) ? 2 : 0) + (hay.includes(t) ? 1 : 0), 0);
    return { f, score };
  })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f);
}
