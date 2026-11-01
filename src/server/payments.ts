import "server-only";

/**
 * Payment gateway boundary.
 * - "demo": no gateway; upgrades are recorded with a DEMO- reference (default outside production).
 * - "live": a real gateway (e.g. Razorpay orders + signature verification) — wire it here once
 *   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are provisioned. Not implemented in this build.
 * - "disabled": production without a gateway; paid checkout returns 503, trials still work.
 */
export function paymentsMode(): "demo" | "live" | "disabled" {
  const mode = process.env.PAYMENTS_MODE;
  if (mode === "demo") return "demo";
  if (mode === "live" && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "live";
  return process.env.NODE_ENV === "production" ? "disabled" : "demo";
}
