import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { paymentsMode } from "@/server/payments";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CheckoutPage({ searchParams }: Props) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const plan = str("plan") === "individual" ? "individual" : "business";
  const cycle = str("cycle") === "yearly" ? "yearly" : "monthly";
  const user = await requireUser(`/checkout?plan=${plan}&cycle=${cycle}${str("trial") ? "&trial=1" : ""}`);

  return (
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.03em] text-ink">Upgrade your Lelam plan</h1>
      <div className="mt-10">
        <CheckoutForm
          initialPlan={plan}
          initialCycle={cycle}
          wantsTrial={str("trial") === "1" && plan === "business" && !user.trialUsed}
          trialUsed={!!user.trialUsed}
          name={user.company || user.name}
          email={user.email}
          currentPlan={user.plan}
          mode={paymentsMode()}
        />
      </div>
    </div>
  );
}
