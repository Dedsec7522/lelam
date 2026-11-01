import { z } from "zod";
import { error, json, parseBody } from "@/server/api";
import { requireApiAdmin } from "@/server/admin";
import { toSafeUser } from "@/server/session";
import { read, write } from "@/server/store";
import { PLAN_IDS, ROLES } from "@/components/app/options";
import { pushAudit, pushNotification } from "@/server/workspace";
import { PLAN_BY_ID } from "@/lib/plans";

export async function GET(req: Request) {
  const a = await requireApiAdmin(req);
  if (!a.ok) return a.response;
  const users = await read((db) => db.users.map(toSafeUser).sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
  return json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}

const patchSchema = z
  .object({ userId: z.string().min(1).max(40), role: z.enum(ROLES).optional(), plan: z.enum(PLAN_IDS).optional() })
  .refine((v) => v.role || v.plan, { message: "Nothing to change.", path: ["form"] });

export async function PATCH(req: Request) {
  const a = await requireApiAdmin(req);
  if (!a.ok) return a.response;
  const parsed = await parseBody(req, patchSchema);
  if (!parsed.ok) return parsed.response;
  const { userId, role, plan } = parsed.data;
  if (userId === a.user.id && role && role !== "admin") {
    return error("You cannot remove your own admin role.", 422, { fields: { role: "Ask another admin to change your role." } });
  }
  const user = await write((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return null;
    const meta: Record<string, string> = { userId };
    if (role && role !== u.role) {
      meta.role = `${u.role} -> ${role}`;
      u.role = role;
    }
    if (plan && plan !== u.plan) {
      meta.plan = `${u.plan} -> ${plan}`;
      u.plan = plan;
      pushNotification(db, u.id, "Your plan was updated", `Your account is now on the ${PLAN_BY_ID[plan].name} plan.`, "/dashboard");
    }
    pushAudit(db, "admin.user.update", a.user.id, meta);
    return toSafeUser(u);
  });
  if (!user) return error("User not found.", 404);
  return json({ user });
}
