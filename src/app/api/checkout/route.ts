import { error, json, limit, parseBody, requireApiUser } from "@/server/api";
import { checkoutSchema } from "@/lib/validation";
import { COUPONS, quoteFor } from "@/lib/billing";
import { PLAN_BY_ID } from "@/lib/plans";
import { newId, write } from "@/server/store";
import { createSession } from "@/server/session";
import { audit } from "@/server/users";
import { paymentsMode } from "@/server/payments";

/** GET ?coupon=CODE → validates a promo code without side effects. */
export async function GET(req: Request) {
  const limited = limit(req, "coupon", 20, 60_000);
  if (limited) return limited;
  const code = new URL(req.url).searchParams.get("coupon")?.trim().toUpperCase() ?? "";
  if (!code) return error("Enter a coupon code.");
  if (!COUPONS[code]) return error("That coupon code isn't valid.", 404);
  return json({ code, percent: COUPONS[code] });
}

export async function POST(req: Request) {
  const guard = await requireApiUser(req);
  if (!guard.ok) return guard.response;
  const limited = limit(req, "checkout", 10, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, checkoutSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const user = guard.user;

  if (input.coupon && !COUPONS[input.coupon]) {
    return error("That coupon code isn't valid.", 422, { fields: { coupon: "That coupon code isn't valid." } });
  }
  const wantsTrial = input.trial && input.plan === "business";
  if (wantsTrial && user.trialUsed) {
    return error("You've already used your free trial on this account.", 409);
  }
  if (user.plan === input.plan && user.planRenewsAt && Date.parse(user.planRenewsAt) > Date.now()) {
    return error(`You already have an active ${PLAN_BY_ID[input.plan].name} plan.`, 409);
  }
  if (!wantsTrial && paymentsMode() === "disabled") {
    return error("Online payments are not configured yet. Please contact sales to upgrade.", 503);
  }
  // Never activate a paid plan without a verified payment. Live gateway order creation and
  // signature verification are not wired yet, so live mode refuses rather than granting access.
  if (!wantsTrial && paymentsMode() === "live") {
    return error("Online payments are being set up. Please contact sales to upgrade.", 503);
  }

  const quote = quoteFor(input.plan, input.cycle, input.coupon || undefined);
  const days = wantsTrial ? (PLAN_BY_ID.business.trialDays ?? 30) : input.cycle === "yearly" ? 365 : 30;
  const renewsAt = new Date(Date.now() + days * 86_400_000).toISOString();
  const reference = `${wantsTrial ? "TRIAL" : paymentsMode() === "demo" ? "DEMO" : "PAY"}-${newId("x").slice(-8).toUpperCase()}`;

  const updated = await write((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (!u) return null;
    u.plan = input.plan;
    u.planCycle = input.cycle;
    u.planRenewsAt = renewsAt;
    if (wantsTrial) u.trialUsed = true;
    db.subscriptions.push({
      id: newId("sub"),
      userId: u.id,
      plan: input.plan,
      cycle: input.cycle,
      amount: wantsTrial ? 0 : quote.total,
      coupon: quote.coupon,
      gstin: input.gstin || undefined,
      reference,
      status: wantsTrial ? "trial" : "active",
      createdAt: new Date().toISOString(),
    });
    db.notifications.push({
      id: newId("n"),
      userId: u.id,
      title: wantsTrial ? "Your 30-day Business trial has started" : `${PLAN_BY_ID[input.plan].name} plan activated`,
      body: `Reference ${reference}. Renews ${renewsAt.slice(0, 10)}.`,
      href: "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    });
    return u;
  });
  if (!updated) return error("Account not found.", 404);

  await createSession(updated);
  await audit("billing.subscribe", user.id, { plan: input.plan, cycle: input.cycle, reference });
  return json({ ok: true, reference, plan: input.plan, renewsAt, amount: wantsTrial ? 0 : quote.total, mode: wantsTrial ? "trial" : paymentsMode() });
}
