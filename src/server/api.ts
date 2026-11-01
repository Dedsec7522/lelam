import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validation";
import { getCurrentUser, type SafeUser } from "./session";
import { clientKey, rateLimit } from "./rate-limit";

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parses + validates a JSON body; returns a 400 with per-field errors on failure. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > 64_000) return { ok: false, response: error("Request too large.", 413) };
    raw = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, response: error("Invalid JSON body.") };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: error("Please fix the highlighted fields.", 422, { fields: fieldErrors(result.error) }) };
  }
  return { ok: true, data: result.data };
}

/** Same-origin check for state-changing requests (defence in depth on top of SameSite=Lax). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin navigations without Origin
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

type Guarded = { ok: true; user: SafeUser } | { ok: false; response: NextResponse };

export async function requireApiUser(req: Request): Promise<Guarded> {
  if (!sameOrigin(req)) return { ok: false, response: error("Cross-origin request blocked.", 403) };
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: error("Please sign in to continue.", 401) };
  return { ok: true, user };
}

// Local development and automated tests share one IP; give them headroom. Production stays strict.
const LIMIT_MULTIPLIER = process.env.NODE_ENV === "production" ? 1 : Number(process.env.RATE_LIMIT_MULTIPLIER ?? 25);

export function limit(req: Request, bucket: string, max: number, windowMs: number) {
  const r = rateLimit(clientKey(req, bucket), max * LIMIT_MULTIPLIER, windowMs);
  if (!r.ok) return error(`Too many attempts. Try again in ${r.retryAfter}s.`, 429, { retryAfter: r.retryAfter });
  return null;
}

/** Limiter keyed by an explicit value (e.g. an account) rather than the client IP. */
export function limitKey(key: string, max: number, windowMs: number) {
  const r = rateLimit(key, max * LIMIT_MULTIPLIER, windowMs);
  if (!r.ok) return error(`Too many attempts. Try again in ${r.retryAfter}s.`, 429, { retryAfter: r.retryAfter });
  return null;
}
