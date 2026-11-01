import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "../auth-forms";
import { AuthHeading } from "../heading";

export const metadata: Metadata = { title: "Create your free account", robots: { index: false }, alternates: { canonical: "/auth/register" } };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="Create your free account" text="Search every auction, save lots and get alerts. No card needed." />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
