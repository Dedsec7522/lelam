import { error, json, limit, parseBody, sameOrigin } from "@/server/api";
import { resetSchema } from "@/lib/validation";
import { hashPassword, sha256 } from "@/server/password";
import { write } from "@/server/store";
import { audit } from "@/server/users";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "reset", 10, 15 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, resetSchema);
  if (!parsed.ok) return parsed.response;
  const tokenHash = sha256(parsed.data.token);
  const passwordHash = await hashPassword(parsed.data.password);

  const userId = await write((db) => {
    const entry = db.resetTokens.find((t) => t.tokenHash === tokenHash);
    if (!entry || Date.parse(entry.expiresAt) < Date.now()) return null;
    const user = db.users.find((u) => u.id === entry.userId);
    if (!user) return null;
    user.passwordHash = passwordHash;
    // Revoke every existing session for this account.
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    db.resetTokens = db.resetTokens.filter((t) => t.userId !== user.id);
    return user.id;
  });
  if (!userId) return error("This reset link is invalid or has expired. Request a new one.", 400);
  await audit("user.password_reset", userId);
  return json({ ok: true });
}
