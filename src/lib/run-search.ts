import { z } from "zod";
import { filterAuctions, type AuctionFilters, type SortKey } from "@/lib/search";
import { CATEGORIES, OFFICES, STATES } from "@/lib/taxonomy";
import type { Auction, CategoryId } from "@/lib/types";
import { catalog } from "./catalog-data";

export const PAGE_SIZE = 24;

const categoryIds = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export const filterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(categoryIds).optional(),
  subCategory: z.string().max(60).optional(),
  source: z.enum(["MSTC", "BaankNet"]).optional(),
  state: z.string().refine((s) => STATES.includes(s)).optional(),
  office: z.string().refine((s) => OFFICES.includes(s)).optional(),
  preBid: z.enum(["required", "none"]).optional(),
  docs: z.boolean().optional(),
  images: z.boolean().optional(),
  reauction: z.boolean().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["upcoming", "live", "closed", "open"]).optional(),
  sort: z.enum(["ending", "newest", "emd-asc", "value-desc", "distance"]).optional(),
  radiusKm: z.number().min(5).max(2000).optional(),
  near: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  page: z.number().int().min(1).max(500).optional(),
});

export type FilterInput = z.infer<typeof filterSchema>;

/** Converts URL search params into validated filters (invalid values are dropped, not fatal). */
export function filtersFromSearchParams(sp: Record<string, string | string[] | undefined>): FilterInput {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const bool = (k: string) => (get(k) === "1" || get(k) === "true" ? true : undefined);
  const candidate = {
    q: get("q") || undefined,
    category: get("category") || undefined,
    subCategory: get("sub") || undefined,
    source: get("source") || undefined,
    state: get("state") || undefined,
    office: get("office") || undefined,
    preBid: get("prebid") || undefined,
    docs: bool("docs"),
    images: bool("images"),
    reauction: bool("reauction"),
    from: get("from") || undefined,
    to: get("to") || undefined,
    status: get("status") || undefined,
    sort: get("sort") || undefined,
    radiusKm: get("radius") ? Number(get("radius")) : undefined,
    page: get("page") ? Number(get("page")) : undefined,
  };
  const out: Record<string, unknown> = {};
  const shape = filterSchema.shape;
  for (const [k, v] of Object.entries(candidate)) {
    if (v === undefined) continue;
    const r = shape[k as keyof typeof shape].safeParse(v);
    if (r.success) out[k] = r.data;
  }
  return out as FilterInput;
}

export interface SearchResult {
  items: Array<Auction & { distanceKm?: number }>;
  total: number;
  page: number;
  pages: number;
  understood: { category?: CategoryId; subCategory?: string; city?: string; state?: string; nearMe: boolean; radiusKm?: number; reauction?: boolean } | null;
}

export function runSearch(input: FilterInput, opts: { allowReauction: boolean }): SearchResult {
  const filters: AuctionFilters = {
    ...input,
    reauction: opts.allowReauction ? input.reauction : undefined,
    sort: input.sort as SortKey | undefined,
  };
  const { items, total, parsed } = filterAuctions(catalog().list(), filters, Date.now());
  const page = Math.min(input.page ?? 1, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    understood: parsed
      ? {
          category: parsed.category,
          subCategory: parsed.subCategory,
          city: parsed.city,
          state: parsed.state,
          nearMe: parsed.nearMe,
          radiusKm: parsed.radiusKm,
          reauction: parsed.reauction,
        }
      : null,
  };
}
