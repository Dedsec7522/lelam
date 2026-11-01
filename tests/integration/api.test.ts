import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// In-memory cookie jar standing in for next/headers in route handlers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

const dir = mkdtempSync(path.join(tmpdir(), "lelam-test-"));
process.env.LELAM_DB_PATH = path.join(dir, "db.json");

const { __resetStoreForTests, read } = await import("@/server/store");
const register = await import("@/app/api/auth/register/route");
const login = await import("@/app/api/auth/login/route");
const me = await import("@/app/api/auth/me/route");
const logout = await import("@/app/api/auth/logout/route");
const watchlist = await import("@/app/api/watchlist/route");
const leads = await import("@/app/api/leads/route");
const checkout = await import("@/app/api/checkout/route");
const intel = await import("@/app/api/auctions/[id]/intelligence/route");
const search = await import("@/app/api/auctions/search/route");
const { catalog } = await import("@/server/catalog");

let ipCounter = 0;
function req(url: string, body?: unknown) {
  ipCounter += 1;
  return new Request(`http://localhost:3000${url}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", "x-forwarded-for": `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const user = { firstName: "Asha", lastName: "Rao", email: "t1@example.com", password: "strongpass42", confirmPassword: "strongpass42", acceptTerms: true };
const signIn = () => login.POST(req("/api/auth/login", { email: user.email, password: user.password }));

beforeAll(() => __resetStoreForTests());
beforeEach(() => jar.clear());
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("auth flow", () => {
  it("registers, never exposes the password hash, and sets a session cookie", async () => {
    const res = await register.POST(req("/api/auth/register", user));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/scrypt|passwordHash/);
    expect(jar.has("lelam_session")).toBe(true);
    const stored = await read((db) => db.users.find((u) => u.email === user.email));
    expect(stored?.passwordHash.startsWith("scrypt$")).toBe(true);
  });

  it("rejects duplicate registration with a field error", async () => {
    const res = await register.POST(req("/api/auth/register", user));
    expect(res.status).toBe(409);
    expect((await res.json()).fields.email).toBeDefined();
  });

  it("returns 422 with field errors for invalid input", async () => {
    const res = await register.POST(req("/api/auth/register", { ...user, email: "nope", password: "x" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fields.email).toBeDefined();
    expect(body.fields.password).toBeDefined();
  });

  it("logs in with correct credentials only (email is case-insensitive)", async () => {
    expect((await login.POST(req("/api/auth/login", { email: user.email, password: "wrong-password1" }))).status).toBe(401);
    const ok = await login.POST(req("/api/auth/login", { email: "T1@Example.com", password: user.password }));
    expect(ok.status).toBe(200);
    expect((await (await me.GET()).json()).user.email).toBe(user.email);
    await logout.POST(req("/api/auth/logout", {}));
    expect((await (await me.GET()).json()).user).toBeNull();
  });

  it("blocks cross-origin state-changing requests", async () => {
    const res = await login.POST(
      new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ email: user.email, password: user.password }),
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe("watchlist & entitlements", () => {
  const someId = () => catalog().list()[0].id;

  it("requires sign-in", async () => {
    expect((await watchlist.POST(req("/api/watchlist", { auctionId: someId() }))).status).toBe(401);
  });

  it("toggles saved state and enforces the free plan limit", async () => {
    await signIn();
    const first = await watchlist.POST(req("/api/watchlist", { auctionId: someId() }));
    expect(await first.json()).toMatchObject({ saved: true, count: 1 });
    const again = await watchlist.POST(req("/api/watchlist", { auctionId: someId() }));
    expect(await again.json()).toMatchObject({ saved: false, count: 0 });

    const ids = catalog().list().slice(0, 11).map((a) => a.id);
    let last: Response | undefined;
    for (const id of ids) last = await watchlist.POST(req("/api/watchlist", { auctionId: id }));
    expect(last?.status).toBe(403); // 11th exceeds the free limit of 10
  });

  it("locks Bid Intelligence for free users and unlocks it after a Business trial (once)", async () => {
    await signIn();
    const id = someId();
    const ctx = { params: Promise.resolve({ id }) };
    expect((await intel.GET(req(`/api/auctions/${id}/intelligence`), ctx)).status).toBe(403);

    const body = { plan: "business", cycle: "monthly", trial: true, billingName: "Asha", pincode: "560008", city: "Bengaluru", state: "Karnataka" };
    const co = await checkout.POST(req("/api/checkout", body));
    expect(co.status).toBe(200);
    expect((await co.json()).reference).toMatch(/^TRIAL-/);

    const ok = await intel.GET(req(`/api/auctions/${id}/intelligence`), ctx);
    expect(ok.status).toBe(200);
    expect((await ok.json()).scenarios).toHaveLength(3);

    expect((await checkout.POST(req("/api/checkout", body))).status).toBe(409);
  });
});

describe("security regressions", () => {
  it("lapsed paid plans and trials fall back to Free", async () => {
    const { effectivePlan } = await import("@/server/session");
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(effectivePlan({ plan: "business", planRenewsAt: past })).toBe("free");
    expect(effectivePlan({ plan: "business", planRenewsAt: future })).toBe("business");
    expect(effectivePlan({ plan: "free" })).toBe("free");
  });

  it("bumping the session version revokes existing sessions", async () => {
    const { write } = await import("@/server/store");
    await signIn();
    expect((await (await me.GET()).json()).user).not.toBeNull();
    await write((db) => {
      const u = db.users.find((x) => x.email === user.email)!;
      u.sessionVersion = (u.sessionVersion ?? 0) + 1;
    });
    expect((await (await me.GET()).json()).user).toBeNull();
  });
});

describe("public endpoints", () => {
  const lead = { kind: "contact", name: "A", email: "a@b.co", topic: "General enquiry", subject: "Hello there", message: "x".repeat(30), website: "" };

  it("stores contact leads", async () => {
    const before = await read((db) => db.leads.length);
    expect((await leads.POST(req("/api/leads", lead))).status).toBe(201);
    expect(await read((db) => db.leads.length)).toBe(before + 1);
  });

  it("rejects a filled honeypot without storing anything", async () => {
    const before = await read((db) => db.leads.length);
    expect((await leads.POST(req("/api/leads", { ...lead, website: "spam.example" }))).status).toBe(422);
    expect(await read((db) => db.leads.length)).toBe(before);
  });

  it("searches with location in the body and respects the radius", async () => {
    const res = await search.POST(req("/api/auctions/search", { q: "near me", near: { lat: 19.08, lng: 72.88 }, radiusKm: 100 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.every((a: { distanceKm: number }) => a.distanceKm <= 100)).toBe(true);
  });

  it("validates coupons without side effects", async () => {
    expect((await checkout.GET(req("/api/checkout?coupon=launch10"))).status).toBe(200);
    expect((await checkout.GET(req("/api/checkout?coupon=nope"))).status).toBe(404);
  });
});
