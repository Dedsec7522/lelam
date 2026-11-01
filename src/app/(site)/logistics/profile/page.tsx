import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { PageHeader } from "@/components/app/page-header";
import { PartnerProfileForm } from "@/components/app/logistics/partner-profile-form";
import { PasswordForm } from "@/components/app/dashboard/profile-forms";
import { STATES } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Company profile" };

export default async function LogisticsProfilePage() {
  const user = await requireRole(["logistics", "admin"], "/logistics/profile");
  return (
    <>
      <PageHeader
        eyebrow="Logistics portal"
        title="Company profile"
        description="Your company name is what buyers see next to your quotes."
      />
      <div className="grid gap-6">
        <PartnerProfileForm
          states={STATES}
          initial={{
            name: user.name,
            company: user.company ?? "",
            phone: user.phone ?? "",
            ...user.preferences,
          }}
        />
        <PasswordForm />
      </div>
    </>
  );
}
