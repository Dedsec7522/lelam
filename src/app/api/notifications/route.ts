import { z } from "zod";
import { json, parseBody, requireApiUser } from "@/server/api";
import { read, write } from "@/server/store";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const items = await read((db) =>
    db.notifications.filter((n) => n.userId === auth.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  return json({ items, unread: items.filter((n) => !n.read).length }, { headers: { "Cache-Control": "private, no-store" } });
}

const markSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().max(40)).min(1).max(200), read: z.boolean().optional() }),
]);

/** Mark one/many as read (or unread), or `{ all: true }` to clear the badge. */
export async function PATCH(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(req, markSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const unread = await write((db) => {
    const mine = db.notifications.filter((n) => n.userId === auth.user.id);
    if ("all" in body) mine.forEach((n) => (n.read = true));
    else {
      const ids = new Set(body.ids);
      mine.filter((n) => ids.has(n.id)).forEach((n) => (n.read = body.read ?? true));
    }
    return mine.filter((n) => !n.read).length;
  });
  return json({ ok: true, unread });
}

const deleteSchema = z.object({ ids: z.array(z.string().max(40)).min(1).max(200) });

export async function DELETE(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(req, deleteSchema);
  if (!parsed.ok) return parsed.response;
  const ids = new Set(parsed.data.ids);
  await write((db) => {
    db.notifications = db.notifications.filter((n) => !(n.userId === auth.user.id && ids.has(n.id)));
  });
  return json({ ok: true });
}
