import { json, limit, parseBody } from "@/server/api";
import { filterSchema, runSearch } from "@/server/auction-query";
import { getCurrentUser } from "@/server/session";
import { canUse } from "@/lib/plans";

/**
 * POST so the (optional) browser location travels in the body, never in a URL or log line.
 */
export async function POST(req: Request) {
  const limited = limit(req, "search", 120, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, filterSchema);
  if (!parsed.ok) return parsed.response;
  const user = await getCurrentUser();
  const result = runSearch(parsed.data, { allowReauction: !!user && canUse(user.plan, "reauctionFilter") });
  return json(result, { headers: { "Cache-Control": "private, no-store" } });
}
