import { error, json, limit, parseBody, sameOrigin } from "@/server/api";
import { registerSchema } from "@/lib/validation";
import { createUser } from "@/server/users";
import { createSession } from "@/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "register", 5, 15 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;
  const { firstName, lastName, email, password } = parsed.data;

  const user = await createUser({ name: `${firstName} ${lastName}`, email, password });
  if (!user) {
    return error("An account with this email already exists.", 409, { fields: { email: "This email is already registered. Try signing in." } });
  }
  await createSession(user);
  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } }, 201);
}
