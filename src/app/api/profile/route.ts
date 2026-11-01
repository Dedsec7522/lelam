import { error, json, parseBody, requireApiUser } from "@/server/api";
import { profileSchema } from "@/lib/validation";
import { toSafeUser } from "@/server/session";
import { write } from "@/server/store";
import { pushAudit } from "@/server/workspace";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  return json({ user: auth.user }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(req, profileSchema);
  if (!parsed.ok) return parsed.response;
  const p = parsed.data;
  const user = await write((db) => {
    const u = db.users.find((x) => x.id === auth.user.id);
    if (!u) return null;
    u.name = p.name;
    u.company = p.company || undefined;
    u.phone = p.phone || undefined;
    u.preferences = {
      categories: p.categories,
      states: p.states,
      keywords: Array.from(new Set(p.keywords.map((k) => k.toLowerCase()))),
      emailAlerts: p.emailAlerts,
    };
    pushAudit(db, "profile.update", u.id);
    return toSafeUser(u);
  });
  if (!user) return error("Account not found.", 404);
  return json({ user });
}
