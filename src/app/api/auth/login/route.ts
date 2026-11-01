import { error, json, limit, limitKey, parseBody, sameOrigin } from "@/server/api";
import { loginSchema } from "@/lib/validation";
import { findUserByEmail, audit } from "@/server/users";
import { DUMMY_HASH, verifyPassword } from "@/server/password";
import { createSession } from "@/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "login", 10, 10 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, loginSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password, remember } = parsed.data;
  // Per-account limit as well, so rotating IPs can't brute-force one mailbox.
  const accountLimited = limitKey(`login-account:${email}`, 10, 15 * 60_000);
  if (accountLimited) return accountLimited;

  const user = await findUserByEmail(email);
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return error("That email and password don't match an account.", 401);
  }
  await createSession(user, remember);
  await audit("user.login", user.id);
  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
}
