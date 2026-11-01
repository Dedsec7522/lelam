import { z } from "zod";
import { error, json, limit, parseBody, requireApiUser } from "@/server/api";
import { hashPassword, verifyPassword } from "@/server/password";
import { read, write } from "@/server/store";
import { pushAudit } from "@/server/workspace";
import { createSession } from "@/server/session";

// Mirrors the registration password rules in lib/validation.
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128)
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password you have not used here." });

export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const limited = limit(req, `pw:${auth.user.id}`, 5, 15 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, passwordSchema);
  if (!parsed.ok) return parsed.response;

  const stored = await read((db) => db.users.find((u) => u.id === auth.user.id)?.passwordHash);
  if (!stored || !(await verifyPassword(parsed.data.currentPassword, stored))) {
    return error("Your current password is incorrect.", 422, { fields: { currentPassword: "That is not your current password." } });
  }
  const hash = await hashPassword(parsed.data.newPassword);
  const updated = await write((db) => {
    const u = db.users.find((x) => x.id === auth.user.id);
    if (u) {
      u.passwordHash = hash;
      // Sign out every other device; this one gets a fresh session below.
      u.sessionVersion = (u.sessionVersion ?? 0) + 1;
    }
    pushAudit(db, "profile.password", auth.user.id);
    return u;
  });
  if (updated) await createSession(updated);
  return json({ ok: true });
}
