import { SignJWT, jwtVerify } from "jose";
import type { PlanId, Role } from "./types";

export const SESSION_COOKIE = "lelam_session";

export interface SessionClaims {
  sub: string;
  role: Role;
  plan: PlanId;
  /** Session version; must match the user's current version (revocation on password change). */
  v: number;
}

type GlobalWithSecret = typeof globalThis & { __lelamDevSecret?: Uint8Array };

function secretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length >= 32) return new TextEncoder().encode(raw);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (32+ characters) in production.");
  }
  // Development only: an ephemeral per-process secret (sessions reset on restart).
  const g = globalThis as GlobalWithSecret;
  if (!g.__lelamDevSecret) {
    g.__lelamDevSecret = crypto.getRandomValues(new Uint8Array(48));
    console.warn("[auth] AUTH_SECRET not set; using an ephemeral development secret.");
  }
  return g.__lelamDevSecret;
}

export async function signSession(claims: SessionClaims, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ role: claims.role, plan: claims.plan, v: claims.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("lelam")
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "lelam", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role, plan: payload.plan as PlanId, v: typeof payload.v === "number" ? payload.v : 0 };
  } catch {
    return null;
  }
}
