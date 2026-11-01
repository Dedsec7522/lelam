import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "../auth-forms";
import { AuthHeading } from "../heading";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Set a new password" text="Choose a strong password you don't use elsewhere." />
      <Suspense>
        <ResetForm />
      </Suspense>
    </>
  );
}
