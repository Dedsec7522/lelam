import "server-only";
import { z } from "zod";
import { CATEGORIES } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/types";

const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
const when = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time.");

/** Seller listing form (SellerAuctionRecord minus server-owned fields). */
export const listingSchema = z
  .object({
    title: z.string().trim().min(6, "Use at least 6 characters.").max(140),
    category: z.enum(CATEGORY_IDS, { message: "Choose a category." }),
    city: z.string().trim().min(2, "Enter the city.").max(60),
    state: z.string().trim().min(2, "Enter the state.").max(60),
    startsAt: when,
    endsAt: when,
    reservePrice: z.number({ message: "Enter the reserve price." }).finite().positive("Must be more than zero.").max(1e11),
    emdPercent: z.number({ message: "Enter EMD %." }).min(0, "0–50%").max(50, "0–50%"),
    description: z.string().trim().min(20, "Describe the lot in at least 20 characters.").max(4000),
  })
  .refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt), { path: ["endsAt"], message: "Closing must be after opening." });

export type ListingInput = z.infer<typeof listingSchema>;

export function normaliseListing(v: ListingInput): ListingInput {
  return { ...v, startsAt: new Date(v.startsAt).toISOString(), endsAt: new Date(v.endsAt).toISOString() };
}
