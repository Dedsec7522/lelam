import type { Metadata } from "next";
import { ForgotForm } from "../auth-forms";
import { AuthHeading } from "../heading";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Forgot your password?" text="Enter your email and we'll send a link to set a new one." />
      <ForgotForm />
    </>
  );
}
