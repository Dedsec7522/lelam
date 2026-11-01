export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  minutes: number;
  tag: string;
  /** Two-colour art direction for the generated cover (theme tokens, so it adapts to light/dark). */
  cover: { from: string; to: string; motif: "grid" | "rings" | "bars" | "waves" };
  blocks: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "what-is-mstc-guide-to-government-e-auctions",
    title: "What is MSTC? A practical guide to government e-auctions in India",
    excerpt: "How MSTC works, what gets sold, how bidding and EMD flow, and how to read a catalog before you commit money.",
    author: "Editorial team",
    date: "2026-06-27",
    minutes: 7,
    tag: "Guide",
    cover: { from: "var(--brand)", to: "var(--cat-machinery)", motif: "grid" },
    blocks: [
      { type: "p", text: "MSTC Limited is a Government of India enterprise under the Ministry of Steel. It began as a scrap-trading agency and now runs one of the country's largest e-auction platforms, used by ministries, PSUs, state departments and banks to sell surplus and seized assets." },
      { type: "h2", text: "What is sold on MSTC" },
      { type: "ul", items: ["Ferrous and non-ferrous scrap from plants, railways and defence establishments", "End-of-life and seized vehicles", "Plant, machinery and surplus spares", "Forest produce such as teak, other timber and firewood", "Minerals and coal, often in very large lots", "E-waste, batteries and IT hardware"] },
      { type: "h2", text: "How an MSTC auction runs" },
      { type: "p", text: "Each auction has a catalog that lists its lots, quantities, inspection window and Special Terms & Conditions (STC). Buyers register on the portal, complete KYC, pay any pre-bid EMD and then bid online during the scheduled window. Closing times usually extend automatically when bids arrive late." },
      { type: "callout", text: "The STC governs everything: EMD percentage, payment deadlines, lifting period and penalties. Two auctions from the same seller can have different terms." },
      { type: "h2", text: "Reading a catalog like a professional" },
      { type: "ul", items: ["Check the unit (MT, CUM, NOS). A price per unit can look cheap until you multiply it by quantity.", "Note the lifting period. Missing it can mean ground rent or forfeiture.", "Look for conditional compliance such as PCB consent or forest transit passes.", "Plan an inspection. Photos are rare for scrap, and condition varies."] },
      { type: "h2", text: "Where Lelam fits" },
      { type: "p", text: "Lelam does not replace the portal. It reads catalogs into structured lots, values them against indicative market rates, and calculates landed cost and margin before you bid. Then it links you to the official listing to place the bid." },
    ],
  },
  {
    slug: "true-cost-of-winning-an-auction-emd-gst-tcs",
    title: "The real cost of winning an auction: EMD, GST (RCM), TCS and penalties",
    excerpt: "Your winning bid is only the start. Here is everything that sits on top of it, with a worked example.",
    author: "Editorial team",
    date: "2026-08-19",
    minutes: 6,
    tag: "Costs",
    cover: { from: "var(--copper)", to: "var(--cat-minerals)", motif: "bars" },
    blocks: [
      { type: "p", text: "First-time bidders often budget for the hammer price and nothing else. In practice tax, tax collected at source, transport and loading can add a third or more to your outlay, before any penalties." },
      { type: "h2", text: "The building blocks" },
      { type: "table", head: ["Component", "Typical range", "Notes"], rows: [["EMD", "5–20% of bid", "Adjusted against the sale value if you win; refunded otherwise"], ["GST", "5–18%", "Often under reverse charge for scrap; claimable as ITC if registered"], ["TCS", "~1%", "Collected on certain goods such as scrap and minerals"], ["Transport", "Distance × weight", "Plan for the full lifting window"], ["Loading", "Per tonne", "Sometimes done by the seller, sometimes by you"]] },
      { type: "h2", text: "A worked example" },
      { type: "p", text: "Say you bid ₹5,00,000 on 20 MT of steel scrap located 180 km away, with GST at 18% under RCM and TCS at 1%. GST adds ₹90,000 and TCS about ₹5,900. Transport at ₹5.5 per tonne-km adds ₹19,800 and loading roughly ₹7,000. Your landed cost is about ₹6,22,700, roughly 25% above the bid." },
      { type: "callout", text: "Registered businesses can usually recover the GST as input tax credit, so the effective cost here is closer to ₹5,32,700. Cash flow still needs the full amount up front." },
      { type: "h2", text: "Penalties to watch" },
      { type: "ul", items: ["Late payment can mean interest, or forfeiture of the EMD", "Late lifting can attract ground rent per day", "Default on a confirmed sale may bar you from future auctions"] },
      { type: "p", text: "Lelam's landed-cost estimator does this arithmetic for every lot, so you can compare auctions on what they will really cost you." },
    ],
  },
  {
    slug: "buying-seized-and-unclaimed-vehicles",
    title: "How to buy seized and unclaimed vehicles at government auctions",
    excerpt: "From police and customs yards to end-of-life fleets: registration, scrapping rules and inspection tips.",
    author: "Editorial team",
    date: "2026-07-08",
    minutes: 5,
    tag: "Vehicles",
    cover: { from: "var(--cat-vehicles)", to: "var(--brand)", motif: "rings" },
    blocks: [
      { type: "p", text: "Departments and police units regularly auction vehicles that are condemned, seized or unclaimed. Some are road-worthy and can be re-registered. Many are end-of-life vehicles that must be scrapped at a registered facility." },
      { type: "h2", text: "Know which kind you are buying" },
      { type: "ul", items: ["Road-worthy vehicles come with transfer paperwork. Check fitness, insurance history and pending challans.", "End-of-life vehicles go to a Registered Vehicle Scrapping Facility (RVSF), and many sellers restrict bidding to authorised scrappers."] },
      { type: "h2", text: "Inspection checklist" },
      { type: "ul", items: ["Match the chassis and engine numbers to the catalog", "Check for missing parts. Yards are not always secure.", "Estimate towing if the vehicle does not run", "Confirm the lifting deadline and any yard charges"] },
      { type: "p", text: "Filter Lelam by Vehicles & Fleet and sort by distance to see what is within reach of your yard. The listing shows the compliance checklist for each lot." },
    ],
  },
  {
    slug: "why-finding-auctions-in-india-is-hard",
    title: "Why finding auctions in India is hard, and how to fix your pipeline",
    excerpt: "Fragmented portals, PDF-only catalogs and short windows. A system for never missing a relevant lot.",
    author: "Editorial team",
    date: "2026-09-02",
    minutes: 4,
    tag: "Strategy",
    cover: { from: "var(--cat-machinery)", to: "var(--cat-e-waste)", motif: "waves" },
    blocks: [
      { type: "p", text: "Public assets are sold every day across MSTC, BaankNet, GeM forward auctions and bank partner sites. Each portal has its own search, its own vocabulary and, often, catalogs that exist only as PDFs." },
      { type: "h2", text: "The three leaks in most pipelines" },
      { type: "ul", items: ["Discovery: relevant lots are listed on portals you do not check", "Evaluation: there is no time to read a 40-page catalog before inspection closes", "Timing: reminders live in someone's head, not a system"] },
      { type: "h2", text: "A simple operating rhythm" },
      { type: "ul", items: ["Save keyword and state alerts for the materials you trade", "Triage new lots daily on landed cost and margin, not headline price", "Put every shortlisted lot on a watchlist, with reminders for inspection and bidding"] },
    ],
  },
  {
    slug: "gem-forward-auction-eligibility-emd-msme",
    title: "GeM eligibility explained: EMD, MSME and startup exemptions",
    excerpt: "Who can skip EMD on GeM, how exemptions are verified, and the documents to keep ready.",
    author: "Editorial team",
    date: "2026-10-15",
    minutes: 5,
    tag: "Compliance",
    cover: { from: "var(--cat-forest)", to: "var(--copper)", motif: "grid" },
    blocks: [
      { type: "p", text: "Government e-Marketplace (GeM) bids often ask for an Earnest Money Deposit. Eligible MSMEs and recognised startups can usually claim an exemption, but only if their registrations are valid and match the bidding entity." },
      { type: "h2", text: "Documents to keep current" },
      { type: "ul", items: ["Udyam registration certificate for MSMEs", "DPIIT recognition for startups", "PAN and GSTIN that match the GeM seller profile", "Experience and turnover proofs, where a bid asks for them"] },
      { type: "callout", text: "Exemptions are checked against the specific bid's terms. A buyer can still require EMD for some categories, so read the Additional Terms & Conditions." },
      { type: "p", text: "Keep these documents in Lelam's Document Vault with expiry dates, and you will get a reminder before a registration lapses." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function postsByDate(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}
