import { CATEGORY_BY_ID, PLACES, type Place } from "@/lib/taxonomy";
import type { Auction, AuctionType, CategoryId, ComplianceItem, Lot, Source, Unit } from "@/lib/types";

/**
 * Seed catalog modelled on public MSTC and BaankNet listings.
 * A live feed needs portal partnership or catalog scraping (documented in README);
 * the `CatalogSource` boundary below is where that integration plugs in.
 */
export interface CatalogSource {
  list(): Auction[];
  get(id: string): Auction | undefined;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

interface SubSpec {
  name: string;
  unit: Unit;
  price: [number, number];
  qty: [number, number];
  tonnesPerUnit: number;
  items: string[];
}

const SPECS: Record<CategoryId, SubSpec[]> = {
  scrap: [
    { name: "Iron and steel", unit: "MT", price: [28000, 42000], qty: [5, 120], tonnesPerUnit: 1, items: ["HMS 1&2 melting scrap", "Rail cut pieces", "Structural steel scrap", "Turning & boring", "CI scrap"] },
    { name: "Copper scrap", unit: "MT", price: [560000, 720000], qty: [0.5, 12], tonnesPerUnit: 1, items: ["Copper winding wire", "Copper bus bar", "Mixed copper scrap", "Burnt copper wire"] },
    { name: "Aluminium scrap", unit: "MT", price: [140000, 185000], qty: [1, 25], tonnesPerUnit: 1, items: ["Aluminium conductor", "Aluminium utensils & sheets", "Aluminium extrusion scrap"] },
    { name: "Brass scrap", unit: "MT", price: [360000, 440000], qty: [0.5, 8], tonnesPerUnit: 1, items: ["Brass valves & fittings", "Brass turning", "Cartridge brass"] },
    { name: "Mixed metal scrap", unit: "MT", price: [24000, 38000], qty: [10, 200], tonnesPerUnit: 1, items: ["Mixed ferrous scrap", "Dismantled structures", "Old drums & barrels"] },
    { name: "Cable scrap", unit: "MT", price: [180000, 260000], qty: [1, 20], tonnesPerUnit: 1, items: ["PVC insulated cable", "Armoured cable", "Overhead conductor"] },
  ],
  machinery: [
    { name: "Surplus stores / Spares", unit: "NOS", price: [15000, 400000], qty: [1, 30], tonnesPerUnit: 0.4, items: ["Bearing assortment", "Pump spares", "Valve assemblies", "Gearbox spares"] },
    { name: "CNC & machine tools", unit: "NOS", price: [250000, 2400000], qty: [1, 6], tonnesPerUnit: 4, items: ["CNC lathe", "Vertical machining centre", "Radial drill", "Surface grinder"] },
    { name: "Process plant", unit: "NOS", price: [800000, 6500000], qty: [1, 3], tonnesPerUnit: 18, items: ["Rolling mill stand", "Boiler with accessories", "Conveyor line"] },
    { name: "Generators & motors", unit: "NOS", price: [60000, 900000], qty: [1, 12], tonnesPerUnit: 1.6, items: ["DG set 250 kVA", "HT motor 500 kW", "Transformer 1 MVA"] },
  ],
  vehicles: [
    { name: "End of Life Vehicles", unit: "NOS", price: [18000, 160000], qty: [3, 40], tonnesPerUnit: 1.4, items: ["Condemned jeeps", "Old ambulances", "Light commercial vehicles", "Staff cars"] },
    { name: "Seized & unclaimed vehicles", unit: "NOS", price: [45000, 650000], qty: [1, 18], tonnesPerUnit: 1.2, items: ["Hatchback cars", "Sedans", "SUVs", "Pickup vans"] },
    { name: "Trucks & buses", unit: "NOS", price: [250000, 950000], qty: [1, 10], tonnesPerUnit: 7, items: ["Tipper trucks", "Passenger buses", "Water tankers"] },
    { name: "Two-wheelers", unit: "NOS", price: [6000, 28000], qty: [10, 120], tonnesPerUnit: 0.12, items: ["Motorcycles", "Scooters", "Mopeds"] },
  ],
  "real-estate": [
    { name: "Residential flat", unit: "SQFT", price: [3800, 14000], qty: [650, 1900], tonnesPerUnit: 0, items: ["2 BHK apartment", "3 BHK apartment", "Independent floor"] },
    { name: "Commercial building", unit: "SQFT", price: [5200, 18000], qty: [1200, 9000], tonnesPerUnit: 0, items: ["Office floor", "Retail showroom", "Commercial complex unit"] },
    { name: "Industrial plot", unit: "SQFT", price: [900, 4200], qty: [8000, 60000], tonnesPerUnit: 0, items: ["Industrial land with shed", "Vacant industrial plot"] },
    { name: "Warehouse", unit: "SQFT", price: [1800, 5200], qty: [6000, 40000], tonnesPerUnit: 0, items: ["Godown with loading bay", "Cold storage warehouse"] },
  ],
  "e-waste": [
    { name: "IT hardware", unit: "MT", price: [60000, 240000], qty: [0.5, 15], tonnesPerUnit: 1, items: ["Desktops & monitors", "Servers & racks", "Laptops", "Networking switches"] },
    { name: "Telecom equipment", unit: "MT", price: [45000, 180000], qty: [1, 30], tonnesPerUnit: 1, items: ["BTS equipment", "Exchange cards", "Copper telecom cable"] },
    { name: "Batteries", unit: "MT", price: [70000, 115000], qty: [2, 60], tonnesPerUnit: 1, items: ["Lead acid batteries", "UPS batteries", "Traction batteries"] },
    { name: "Mixed e-waste", unit: "MT", price: [30000, 90000], qty: [1, 40], tonnesPerUnit: 1, items: ["Mixed e-waste", "Printers & peripherals"] },
  ],
  minerals: [
    { name: "Iron ore fines", unit: "MT", price: [3200, 5600], qty: [2000, 40000], tonnesPerUnit: 1, items: ["Iron ore fines Fe 58%", "Iron ore fines Fe 62%", "Iron ore lumps"] },
    { name: "Bauxite", unit: "MT", price: [1500, 2800], qty: [3000, 30000], tonnesPerUnit: 1, items: ["Metallurgical bauxite", "Refractory bauxite"] },
    { name: "Coal", unit: "MT", price: [2400, 6200], qty: [2000, 50000], tonnesPerUnit: 1, items: ["Non-coking coal G10", "Washery rejects", "Coal fines"] },
    { name: "Manganese ore", unit: "MT", price: [6500, 14000], qty: [500, 8000], tonnesPerUnit: 1, items: ["Manganese ore Mn 30%", "Manganese ore Mn 44%"] },
  ],
  forest: [
    { name: "Timber - Teak", unit: "CUM", price: [8000, 58000], qty: [0.08, 1.4], tonnesPerUnit: 0.65, items: ["Teak logs class I", "Teak logs class II", "Teak logs class III", "Teak billets"] },
    { name: "Timber - Others", unit: "CUM", price: [4500, 16000], qty: [0.2, 3], tonnesPerUnit: 0.7, items: ["Rosewood logs", "Mahogany logs", "Jungle wood logs"] },
    { name: "Firewood", unit: "MT", price: [3500, 6200], qty: [5, 80], tonnesPerUnit: 1, items: ["Firewood stacks", "Billets for fuel"] },
    { name: "Bamboo", unit: "NOS", price: [45, 140], qty: [500, 6000], tonnesPerUnit: 0.012, items: ["Bamboo poles", "Reed bamboo"] },
  ],
};

const CATEGORY_WEIGHTS: Array<[CategoryId, number]> = [
  ["scrap", 34],
  ["vehicles", 18],
  ["machinery", 12],
  ["real-estate", 14],
  ["e-waste", 8],
  ["minerals", 6],
  ["forest", 8],
];

const SELLERS: Record<CategoryId, string[]> = {
  scrap: ["Central Railway Stores Depot", "State Electricity Board Stores", "Ordnance Equipment Factory", "Steel Plant Scrap Yard", "Port Trust Engineering Stores"],
  machinery: ["Heavy Engineering PSU Stores", "Textile Mill (under liquidation)", "Fertiliser Plant Surplus Cell", "State Transport Workshop"],
  vehicles: ["District Police Motor Transport", "Municipal Corporation Garage", "Customs Warehouse", "State Transport Undertaking"],
  "real-estate": ["Public Sector Bank — Stressed Assets Branch", "Co-operative Bank — Recovery Cell", "Asset Reconstruction Company", "Liquidator under IBC"],
  "e-waste": ["Telecom PSU Circle Office", "Central Government Data Centre", "Public Sector Bank — IT Department", "University Central Stores"],
  minerals: ["State Mining Corporation", "Coal Company Area Office", "Mineral Development PSU"],
  forest: ["Government Timber Depot", "Forest Division Sales Depot", "Range Office Timber Yard"],
};

const COMPLIANCE: Record<CategoryId, ComplianceItem[]> = {
  scrap: [
    { title: "Portal buyer registration", description: "An active, verified buyer account on the official auction portal." },
    { title: "PAN & GSTIN", description: "PAN matching the bidding entity; GSTIN for input tax credit." },
    { title: "Pollution Control Board consent", description: "Required for hazardous or contaminated scrap categories.", conditional: true },
  ],
  machinery: [
    { title: "Portal buyer registration", description: "An active, verified buyer account on the official auction portal." },
    { title: "PAN & GSTIN", description: "PAN matching the bidding entity; GSTIN for input tax credit." },
    { title: "Dismantling & lifting plan", description: "Some sellers require a safety plan before removal.", conditional: true },
  ],
  vehicles: [
    { title: "Portal buyer registration", description: "An active, verified buyer account on the official auction portal." },
    { title: "Authorised scrapper registration (RVSF)", description: "Required for end-of-life vehicles that must be scrapped.", conditional: true },
    { title: "Identity & address proof", description: "Needed for the transfer of registration on road-worthy vehicles." },
  ],
  "real-estate": [
    { title: "KYC documents", description: "PAN, Aadhaar or passport and address proof of the bidder." },
    { title: "EMD by NEFT/RTGS", description: "Earnest money must reach the bank's account before the cut-off time." },
    { title: "Title & encumbrance check", description: "Inspect the title deed and dues independently; properties are sold as-is.", conditional: true },
  ],
  "e-waste": [
    { title: "Portal buyer registration", description: "An active, verified buyer account on the official auction portal." },
    { title: "CPCB/SPCB e-waste recycler authorisation", description: "Only authorised dismantlers or recyclers may lift e-waste." },
  ],
  minerals: [
    { title: "Mining & mineral trader registration", description: "State-issued registration to trade and transport minerals." },
    { title: "Transit permits", description: "Mineral transit passes for every dispatch.", conditional: true },
  ],
  forest: [
    { title: "Portal buyer registration", description: "An active, verified buyer account on the official auction portal." },
    { title: "PAN card", description: "Permanent Account Number matching the bidding entity." },
    { title: "Forest transit pass", description: "Transit pass issued by the Forest Department to move timber.", conditional: true },
  ],
};

const OFFICER_NAMES = ["A. Menon", "R. Sharma", "S. Banerjee", "P. Reddy", "K. Iyer", "M. Khan", "V. Patil", "D. Das", "N. Gupta", "T. Joseph"];

function weightedCategory(rng: Rng): CategoryId {
  const total = CATEGORY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [id, w] of CATEGORY_WEIGHTS) {
    r -= w;
    if (r <= 0) return id;
  }
  return "scrap";
}

function placeFor(rng: Rng, category: CategoryId): Place {
  if (category === "forest") return pick(rng, PLACES.filter((p) => ["Kerala", "Karnataka", "Madhya Pradesh", "Odisha", "Assam"].includes(p.state)));
  if (category === "minerals") return pick(rng, PLACES.filter((p) => ["Odisha", "Jharkhand", "Chhattisgarh", "Karnataka", "West Bengal"].includes(p.state)));
  return pick(rng, PLACES);
}

export function istDayStart(now: number): number {
  const IST = 5.5 * 3600_000;
  const d = new Date(now + IST);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - IST;
}

function auctionTypeFor(rng: Rng, category: CategoryId, source: Source): AuctionType {
  if (source === "BaankNet") return pick(rng, ["SARFAESI", "SARFAESI", "DRT", "IBC"] as const);
  if (category === "forest") return "F-Forest";
  return rng() < 0.82 ? "O-General" : "U-Price";
}

export function generateCatalog(now: number, count = 168, seed = 20261101): Auction[] {
  const rng = mulberry32(seed);
  const dayStart = istDayStart(now);
  const out: Auction[] = [];

  for (let i = 0; i < count; i++) {
    const category = weightedCategory(rng);
    const spec = pick(rng, SPECS[category]);
    const place = placeFor(rng, category);
    const source: Source = category === "real-estate" || (category === "vehicles" && rng() < 0.2) ? "BaankNet" : "MSTC";
    const id = String(41000 + i * 7 + Math.floor(rng() * 6));

    const lotCount = category === "real-estate" ? 1 : 2 + Math.floor(rng() * (category === "forest" ? 14 : 8));
    const lots: Lot[] = Array.from({ length: lotCount }, (_, j) => {
      const unitPrice = roundTo(between(rng, spec.price[0], spec.price[1]), spec.unit === "SQFT" ? 50 : spec.unit === "NOS" && spec.price[1] < 1000 ? 5 : 500);
      const rawQty = between(rng, spec.qty[0], spec.qty[1]);
      const quantity = spec.unit === "NOS" || spec.unit === "SQFT" ? Math.max(1, Math.round(rawQty)) : Math.round(rawQty * 1000) / 1000;
      return {
        lotNo: `${String(j + 1).padStart(2, "0")}/${(i % 9) + 18}`,
        description: pick(rng, spec.items),
        quantity,
        unit: spec.unit,
        marketPrice: unitPrice,
      };
    });

    // Spread start dates from 4 days ago to 24 days ahead; most auctions open 10:00–14:00 IST.
    const dayOffset = Math.floor(between(rng, -4, 25));
    const startHour = 10 + Math.floor(rng() * 5);
    const startsAt = dayStart + dayOffset * 86_400_000 + startHour * 3600_000;
    const durationH = source === "BaankNet" ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 4);
    const endsAt = startsAt + durationH * 3600_000;
    const inspectionFrom = startsAt - 14 * 86_400_000;
    const inspectionTo = startsAt - 86_400_000;

    const turnover = lots.reduce((s, l) => s + l.quantity * l.marketPrice, 0);
    const preBidRoll = rng();
    const preBidEmd = preBidRoll < 0.45 ? null : roundTo(turnover * between(rng, 0.02, 0.08), 1000);
    const weightTonnes = Math.round(lots.reduce((s, l) => s + l.quantity * spec.tonnesPerUnit, 0) * 100) / 100;
    const seller = `${pick(rng, SELLERS[category])}, ${place.city}`;
    const auctionType = auctionTypeFor(rng, category, source);
    const year = new Date(startsAt).getUTCFullYear() % 100;
    const officialRef =
      source === "MSTC"
        ? `MSTC/${place.office.slice(0, 3).toUpperCase()}/${CATEGORY_BY_ID[category].short.toUpperCase()}/${year}-${year + 1}/${id}`
        : `BKN/${auctionType}/${place.state.slice(0, 2).toUpperCase()}/${id}`;
    const officer = pick(rng, OFFICER_NAMES);

    out.push({
      id,
      source,
      officialRef,
      title: category === "real-estate" ? `${lots[0].description}, ${place.city}` : spec.name,
      category,
      subCategory: spec.name,
      seller,
      office: place.office,
      city: place.city,
      state: place.state,
      lat: place.lat + between(rng, -0.08, 0.08),
      lng: place.lng + between(rng, -0.08, 0.08),
      auctionType,
      emdPercent: source === "BaankNet" ? 10 : pick(rng, [5, 10, 10, 10, 20]),
      preBidEmd,
      reservePrice: source === "BaankNet" ? roundTo(turnover * between(rng, 0.62, 0.8), 10000) : undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      inspectionFrom: new Date(inspectionFrom).toISOString(),
      inspectionTo: new Date(inspectionTo).toISOString(),
      isReauction: rng() < 0.18,
      hasDocs: rng() < 0.62,
      hasImages: category === "real-estate" ? true : rng() < 0.4,
      gstScheme: category === "real-estate" ? "FCM" : category === "scrap" || category === "e-waste" || category === "forest" ? "RCM" : "FCM",
      gstRate: category === "real-estate" ? 0 : category === "minerals" ? 5 : 18,
      lots,
      contacts: [
        {
          name: officer,
          role: source === "MSTC" ? "Auction officer" : "Authorised officer",
          email: `desk.${place.city.toLowerCase().replace(/[^a-z]/g, "")}@auctions.example`,
          phone: `+91 ${90000 + Math.floor(rng() * 9999)} ${10000 + Math.floor(rng() * 89999)}`,
        },
      ],
      compliance: COMPLIANCE[category],
      description:
        source === "MSTC"
          ? `${spec.name} offered by ${seller} through the MSTC e-auction platform. Lots are sold on an as-is, where-is basis; inspect before bidding.`
          : `Property offered by the secured creditor under ${auctionType}. Sold on an as-is, where-is and whatever-there-is basis.`,
      weightTonnes,
    });
  }
  return out;
}

let cache: { day: number; items: Auction[]; byId: Map<string, Auction> } | null = null;

/** Catalog for the current IST day; regenerates once per day so dates stay current. */
export function catalog(now: number = Date.now()): CatalogSource {
  const day = istDayStart(now);
  if (!cache || cache.day !== day) {
    const items = generateCatalog(now);
    cache = { day, items, byId: new Map(items.map((a) => [a.id, a])) };
  }
  const c = cache;
  return { list: () => c.items, get: (id) => c.byId.get(id) };
}
