import { error, json, sameOrigin } from "@/server/api";
import { destroySession } from "@/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  await destroySession();
  return json({ ok: true });
}
