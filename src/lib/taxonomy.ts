import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
  subCategories: string[];
  /** Words that map a plain-English query to this category. */
  keywords: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "scrap",
    label: "Scrap & Metals",
    short: "Scrap",
    description: "Ferrous and non-ferrous lots, production scrap and plant clearances from PSUs and departments.",
    subCategories: ["Iron and steel", "Copper scrap", "Aluminium scrap", "Brass scrap", "Mixed metal scrap", "Cable scrap"],
    keywords: ["scrap", "metal", "metals", "iron", "steel", "copper", "aluminium", "aluminum", "brass", "ferrous", "cable", "hms"],
  },
  {
    id: "machinery",
    label: "Plant & Machinery",
    short: "Machinery",
    description: "CNC machines, processing lines, surplus spares and complete plants released through liquidation.",
    subCategories: ["Surplus stores / Spares", "CNC & machine tools", "Process plant", "Generators & motors"],
    keywords: ["machinery", "machine", "machines", "plant", "cnc", "spares", "generator", "motor", "equipment"],
  },
  {
    id: "vehicles",
    label: "Vehicles & Fleet",
    short: "Vehicles",
    description: "End-of-life vehicles, seized and unclaimed cars, trucks, buses and utility fleets.",
    subCategories: ["End of Life Vehicles", "Seized & unclaimed vehicles", "Trucks & buses", "Two-wheelers"],
    keywords: ["vehicle", "vehicles", "car", "cars", "truck", "trucks", "bus", "buses", "bike", "bikes", "elv", "fleet", "two-wheeler"],
  },
  {
    id: "real-estate",
    label: "Property & Real Estate",
    short: "Property",
    description: "Bank-foreclosed homes, plots, warehouses and commercial buildings under SARFAESI, DRT and IBC.",
    subCategories: ["Residential flat", "Commercial building", "Industrial plot", "Warehouse"],
    keywords: ["property", "properties", "flat", "house", "home", "land", "plot", "warehouse", "building", "real", "estate", "office", "sarfaesi"],
  },
  {
    id: "e-waste",
    label: "E-Waste & Electronics",
    short: "E-Waste",
    description: "Servers, IT hardware, telecom gear and batteries from organised surplus disposals.",
    subCategories: ["IT hardware", "Telecom equipment", "Batteries", "Mixed e-waste"],
    keywords: ["e-waste", "ewaste", "electronic", "electronics", "computer", "computers", "server", "servers", "battery", "batteries", "telecom", "it"],
  },
  {
    id: "minerals",
    label: "Minerals & Ores",
    short: "Minerals",
    description: "Iron ore, bauxite, coal and other resource lots with clear base prices and timelines.",
    subCategories: ["Iron ore fines", "Bauxite", "Coal", "Manganese ore"],
    keywords: ["mineral", "minerals", "ore", "ores", "coal", "bauxite", "manganese", "fines"],
  },
  {
    id: "forest",
    label: "Forest Produce",
    short: "Forest",
    description: "Teak, rosewood, firewood and bamboo lots from state forest depots.",
    subCategories: ["Timber - Teak", "Timber - Others", "Firewood", "Bamboo"],
    keywords: ["timber", "teak", "wood", "firewood", "bamboo", "forest", "rosewood", "logs"],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export interface Place {
  city: string;
  state: string;
  office: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

/** Auction locations with approximate coordinates for radius search. */
export const PLACES: Place[] = [
  { city: "New Delhi", state: "Delhi & NCR", office: "Northern Regional Office (Delhi)", lat: 28.61, lng: 77.21, aliases: ["delhi", "ncr"] },
  { city: "Gurugram", state: "Haryana", office: "Northern Regional Office (Delhi)", lat: 28.46, lng: 77.03, aliases: ["gurgaon"] },
  { city: "Chandigarh", state: "Punjab & Haryana", office: "Chandigarh", lat: 30.73, lng: 76.78 },
  { city: "Ludhiana", state: "Punjab & Haryana", office: "Chandigarh", lat: 30.9, lng: 75.85 },
  { city: "Lucknow", state: "Uttar Pradesh", office: "Lucknow", lat: 26.85, lng: 80.95 },
  { city: "Kanpur", state: "Uttar Pradesh", office: "Lucknow", lat: 26.45, lng: 80.33 },
  { city: "Jaipur", state: "Rajasthan", office: "Jaipur", lat: 26.91, lng: 75.79 },
  { city: "Mumbai", state: "Maharashtra", office: "Western Regional Office (Mumbai)", lat: 19.08, lng: 72.88, aliases: ["bombay"] },
  { city: "Pune", state: "Maharashtra", office: "Western Regional Office (Mumbai)", lat: 18.52, lng: 73.86 },
  { city: "Nagpur", state: "Maharashtra", office: "Nagpur", lat: 21.15, lng: 79.09 },
  { city: "Vadodara", state: "Gujarat", office: "Vadodara", lat: 22.31, lng: 73.18, aliases: ["baroda"] },
  { city: "Ahmedabad", state: "Gujarat", office: "Vadodara", lat: 23.02, lng: 72.57 },
  { city: "Kolkata", state: "West Bengal", office: "Eastern Regional Office (Kolkata)", lat: 22.57, lng: 88.36, aliases: ["calcutta"] },
  { city: "Durgapur", state: "West Bengal", office: "Eastern Regional Office (Kolkata)", lat: 23.52, lng: 87.31 },
  { city: "Bhubaneswar", state: "Odisha", office: "Bhubaneswar", lat: 20.3, lng: 85.82 },
  { city: "Rourkela", state: "Odisha", office: "Bhubaneswar", lat: 22.26, lng: 84.85 },
  { city: "Ranchi", state: "Jharkhand", office: "Ranchi", lat: 23.34, lng: 85.31 },
  { city: "Chennai", state: "Tamil Nadu", office: "Southern Regional Office (Chennai)", lat: 13.08, lng: 80.27, aliases: ["madras"] },
  { city: "Coimbatore", state: "Tamil Nadu", office: "Southern Regional Office (Chennai)", lat: 11.02, lng: 76.96 },
  { city: "Bengaluru", state: "Karnataka", office: "Bengaluru", lat: 12.97, lng: 77.59, aliases: ["bangalore"] },
  { city: "Hyderabad", state: "Telangana", office: "Hyderabad", lat: 17.39, lng: 78.49 },
  { city: "Visakhapatnam", state: "Andhra Pradesh", office: "Visakhapatnam (Vizag)", lat: 17.69, lng: 83.22, aliases: ["vizag"] },
  { city: "Thiruvananthapuram", state: "Kerala", office: "Trivandrum Central", lat: 8.52, lng: 76.94, aliases: ["trivandrum"] },
  { city: "Kochi", state: "Kerala", office: "Trivandrum Central", lat: 9.93, lng: 76.27, aliases: ["cochin"] },
  { city: "Nilambur", state: "Kerala", office: "Trivandrum Central", lat: 11.28, lng: 76.23 },
  { city: "Guwahati", state: "Assam", office: "Guwahati", lat: 26.14, lng: 91.74 },
  { city: "Bhopal", state: "Madhya Pradesh", office: "Bhopal", lat: 23.26, lng: 77.41 },
  { city: "Raipur", state: "Chhattisgarh", office: "Raipur", lat: 21.25, lng: 81.63 },
];

export const STATES = Array.from(new Set(PLACES.map((p) => p.state))).sort();
export const OFFICES = Array.from(new Set(PLACES.map((p) => p.office))).sort();
