import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "../auth-forms";
import { AuthHeading } from "../heading";

export const metadata: Metadata = { title: "Sign in", robots: { index: false }, alternates: { canonical: "/auth/login" } };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Welcome back" text="Sign in to your watchlist, tools and alerts." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
