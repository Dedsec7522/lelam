import "server-only";

/** Request-time clock for server components (kept out of render bodies for purity lint and testability). */
export function serverNow(): number {
  return Date.now();
}
