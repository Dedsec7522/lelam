import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { requestTime } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { ListingForm } from "@/components/app/seller/listing-form";
import { CATEGORIES, STATES } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Create listing" };

export default async function CreateListingPage() {
  const user = await requireRole(["seller", "admin"], "/seller/auctions/create");
  const start = new Date(requestTime() + 7 * 86_400_000);
  start.setHours(11, 0, 0, 0);
  const end = new Date(start.getTime() + 3 * 3600_000);
  return (
    <>
      <PageHeader eyebrow="Seller portal" title="Create a listing" description="New listings are reviewed by our team, usually within one working day." />
      <ListingForm
        isAdmin={user.role === "admin"}
        categories={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
        states={STATES}
        initial={{
          title: "",
          category: "scrap",
          city: "",
          state: "",
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          emdPercent: 10,
          description: "",
        }}
      />
    </>
  );
}
