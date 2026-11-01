import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-memory limiter. Good enough for a single instance;
 * use Redis/Upstash when running multiple instances.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/**
 * Client IP for rate limiting. Prefers the platform-set `x-real-ip`; otherwise uses the
 * right-most X-Forwarded-For hop (appended by our proxy), which a client cannot spoof by
 * prepending its own values.
 */
export function clientKey(req: Request, suffix = ""): string {
  const real = req.headers.get("x-real-ip")?.trim();
  const hops = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  const ip = real || hops?.[hops.length - 1] || "local";
  return `${ip}:${suffix}`;
}
