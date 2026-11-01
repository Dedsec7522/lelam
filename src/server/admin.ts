import "server-only";
import { requireApiUser } from "./api";
import { roleDenied } from "./workspace";

/** API guard: signed in, same-origin, and role === admin (re-checked on every call). */
export async function requireApiAdmin(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") return { ok: false as const, response: roleDenied(["admin"]) };
  return auth;
}
