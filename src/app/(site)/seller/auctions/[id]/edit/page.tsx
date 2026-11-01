import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/session";
import { read } from "@/server/store";
import { canTouch } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { ListingForm } from "@/components/app/seller/listing-form";
import { ListingStatusBadge } from "@/components/app/seller/listing-status";
import { CATEGORIES, STATES } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["seller", "admin"], `/seller/auctions/${id}/edit`);
  const listing = await read((db) => db.sellerAuctions.find((a) => a.id === id));
  if (!listing || !canTouch(user, listing)) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Seller portal"
        title="Edit listing"
        description={
          user.role === "admin"
            ? "Admin edits keep the current status."
            : listing.status === "published"
              ? "Saving changes sends a published listing back for a quick review."
              : "Update the details and resubmit for review."
        }
        action={<ListingStatusBadge status={listing.status} />}
      />
      <ListingForm
        isAdmin={user.role === "admin"}
        categories={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
        states={STATES}
        initial={listing}
      />
    </>
  );
}
