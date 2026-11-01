import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { PageHeader } from "@/components/app/page-header";
import { PasswordForm, ProfileForm } from "@/components/app/dashboard/profile-forms";
import { Card } from "@/components/ui/primitives";
import { CATEGORIES, STATES } from "@/lib/taxonomy";
import { PLAN_BY_ID } from "@/lib/plans";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile & alerts" description="Your details, the auctions you want to hear about, and your password." />
      <div className="grid gap-6">
        <ProfileForm
          initial={{
            name: user.name,
            company: user.company ?? "",
            phone: user.phone ?? "",
            ...user.preferences,
          }}
          categories={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          states={STATES}
        />
        <PasswordForm />
        <Card className="p-5 text-sm text-muted sm:p-6">
          <p>
            Signed in as <span className="font-medium text-ink">{user.email}</span> · {PLAN_BY_ID[user.plan].name} plan · member since{" "}
            {formatDate(user.createdAt)}
          </p>
        </Card>
      </div>
    </>
  );
}
