import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { hasFeature, requestTime } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { DocumentsClient } from "@/components/app/dashboard/documents-client";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await requireUser("/dashboard/documents");
  const header = (
    <PageHeader
      eyebrow="Document vault"
      title="Documents"
      description="Store the paperwork every auction asks for and get warned before anything expires."
    />
  );
  if (!hasFeature(user, "documents")) {
    return (
      <>
        {header}
        <UpgradePanel feature="documents" />
      </>
    );
  }
  const docs = await read((db) => db.documents.filter((d) => d.userId === user.id));
  return (
    <>
      {header}
      <DocumentsClient initial={docs} now={requestTime()} />
    </>
  );
}
