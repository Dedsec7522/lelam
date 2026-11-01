import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/session-token";
import type { PlanId, Role } from "@/lib/types";
import { read, type UserRecord } from "./store";

const DAY = 86_400;

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  role: Role;
  plan: PlanId;
  planCycle?: UserRecord["planCycle"];
  planRenewsAt?: string;
  trialUsed?: boolean;
  preferences: UserRecord["preferences"];
  createdAt: string;
}

/** Paid plans lapse to Free once their renewal date passes (trials included). */
export function effectivePlan(u: Pick<UserRecord, "plan" | "planRenewsAt">, now: number = Date.now()): PlanId {
  if (u.plan !== "free" && u.planRenewsAt && Date.parse(u.planRenewsAt) < now) return "free";
  return u.plan;
}

export function toSafeUser(u: UserRecord): SafeUser {
  // Explicit allow-list: the password hash never leaves the server.
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    company: u.company,
    phone: u.phone,
    role: u.role,
    plan: effectivePlan(u),
    planCycle: u.planCycle,
    planRenewsAt: u.planRenewsAt,
    trialUsed: u.trialUsed,
    preferences: u.preferences,
    createdAt: u.createdAt,
  };
}

export async function createSession(user: Pick<UserRecord, "id" | "role" | "plan" | "sessionVersion">, remember = false) {
  const maxAge = (remember ? 30 : 7) * DAY;
  const token = await signSession({ sub: user.id, role: user.role, plan: user.plan, v: user.sessionVersion ?? 0 }, maxAge);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user (deduplicated per request). Always re-reads the store so plan/role changes apply. */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await verifySession(token);
  if (!claims) return null;
  const user = await read((db) => db.users.find((u) => u.id === claims.sub));
  // Reject sessions issued before the last password change/reset.
  if (!user || (user.sessionVersion ?? 0) !== claims.v) return null;
  return toSafeUser(user);
});

export async function requireUser(returnTo = "/dashboard"): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireRole(roles: Role[], returnTo: string): Promise<SafeUser> {
  const user = await requireUser(returnTo);
  if (!roles.includes(user.role)) redirect("/dashboard?denied=1");
  return user;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeRedirect(target: string | null | undefined, fallback = "/dashboard"): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}
