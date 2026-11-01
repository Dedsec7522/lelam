"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle2, Lock, Mail, MailCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionTokens, springs } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { useSession } from "@/components/session";
import { useJsonForm } from "@/components/forms/use-form";

/** Client-side mirror of the server's open-redirect guard. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/dashboard";
  return raw;
}

function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -motionTokens.distance.xs }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("redirect"));
  const { refresh } = useSession();
  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const form = useJsonForm<typeof values>("/api/auth/login");

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (await form.submit(values)) {
          await refresh();
          router.replace(next);
          router.refresh();
        }
      }}
      className="space-y-5"
    >
      <FormError message={form.message} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        leading={<Mail className="size-4" />}
        value={values.email}
        onChange={(e) => {
          setValues((v) => ({ ...v, email: e.target.value }));
          form.clearField("email");
        }}
        error={form.fields.email}
      />
      <div>
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          leading={<Lock className="size-4" />}
          value={values.password}
          onChange={(e) => {
            setValues((v) => ({ ...v, password: e.target.value }));
            form.clearField("password");
          }}
          error={form.fields.password}
        />
        <div className="mt-2 text-right">
          <Link href="/auth/forgot-password" className="text-[0.82rem] font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <Checkbox label="Keep me signed in for 30 days" checked={values.remember} onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))} />
      <Button type="submit" size="lg" className="w-full" loading={form.status === "submitting"} iconRight={<ArrowRight className="size-4" />}>
        Sign in
      </Button>
      <p className="text-center text-sm text-muted">
        New to Lelam?{" "}
        <Link href={`/auth/register${sp.get("redirect") ? `?redirect=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("redirect"));
  const { refresh } = useSession();
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
  const form = useJsonForm<typeof v>("/api/auth/register");
  const score = useMemo(() => strength(v.password), [v.password]);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setV((cur) => ({ ...cur, [k]: value }));
    form.clearField(k);
  };

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (await form.submit(v)) {
          await refresh();
          router.replace(next === "/dashboard" ? "/dashboard/profile?welcome=1" : next);
          router.refresh();
        }
      }}
      className="space-y-5"
    >
      <FormError message={form.status === "error" && !Object.keys(form.fields).length ? form.message : null} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First name" autoComplete="given-name" required leading={<UserRound className="size-4" />} value={v.firstName} onChange={set("firstName")} error={form.fields.firstName} />
        <Input label="Last name" autoComplete="family-name" required value={v.lastName} onChange={set("lastName")} error={form.fields.lastName} />
      </div>
      <Input label="Work email" type="email" autoComplete="email" required leading={<Mail className="size-4" />} value={v.email} onChange={set("email")} error={form.fields.email} />
      <div>
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          leading={<Lock className="size-4" />}
          value={v.password}
          onChange={set("password")}
          error={form.fields.password}
          hint="At least 10 characters, with a letter and a number."
        />
        {v.password && (
          <div className="mt-2 flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-200",
                    i < score ? (score >= 3 ? "bg-positive" : score === 2 ? "bg-warning" : "bg-danger") : "bg-paper-2",
                  )}
                />
              ))}
            </div>
            <span className="w-16 text-right text-[0.75rem] font-medium text-muted">{STRENGTH_LABELS[score]}</span>
          </div>
        )}
      </div>
      <Input label="Confirm password" type="password" autoComplete="new-password" required value={v.confirmPassword} onChange={set("confirmPassword")} error={form.fields.confirmPassword} />
      <div>
        <Checkbox
          checked={v.acceptTerms}
          onChange={set("acceptTerms")}
          aria-invalid={form.fields.acceptTerms ? true : undefined}
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="text-brand underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-brand underline underline-offset-2">
                Privacy Policy
              </Link>
            </>
          }
        />
        {form.fields.acceptTerms && (
          <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">
            {form.fields.acceptTerms}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full" loading={form.status === "submitting"} iconRight={<ArrowRight className="size-4" />}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/auth/login${sp.get("redirect") ? `?redirect=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const form = useJsonForm<{ email: string }, { message: string }>("/api/auth/forgot");
  const [sent, setSent] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={springs.gentle} className="rounded-2xl border border-line bg-surface p-6 text-center" role="status">
          <MailCheck className="mx-auto size-10 text-brand" aria-hidden />
          <p className="mt-3 font-semibold text-ink">Check your inbox</p>
          <p className="mt-1.5 text-sm text-muted">If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.</p>
          <Link href="/auth/login" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0 }}
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (await form.submit({ email })) setSent(true);
          }}
          className="space-y-5"
        >
          <FormError message={form.status === "error" && !form.fields.email ? form.message : null} />
          <Input label="Email" type="email" autoComplete="email" required leading={<Mail className="size-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={form.fields.email} />
          <Button type="submit" size="lg" className="w-full" loading={form.status === "submitting"}>
            Send reset link
          </Button>
          <p className="text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/auth/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export function ResetForm() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [v, setV] = useState({ password: "", confirmPassword: "" });
  const form = useJsonForm<{ token: string; password: string; confirmPassword: string }>("/api/auth/reset");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="font-semibold text-ink">This link is incomplete</p>
        <p className="mt-1.5 text-sm text-muted">Open the full link from your email, or request a new one.</p>
        <Link href="/auth/forgot-password" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return done ? (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={springs.gentle} className="rounded-2xl border border-line bg-surface p-6 text-center" role="status">
      <CheckCircle2 className="mx-auto size-10 text-positive" aria-hidden />
      <p className="mt-3 font-semibold text-ink">Password updated</p>
      <p className="mt-1.5 text-sm text-muted">You can now sign in with your new password.</p>
      <Link href="/auth/login" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">
        Sign in
      </Link>
    </motion.div>
  ) : (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (await form.submit({ token, ...v })) setDone(true);
      }}
      className="space-y-5"
    >
      <FormError message={form.status === "error" && !Object.keys(form.fields).length ? form.message : null} />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        value={v.password}
        onChange={(e) => setV((x) => ({ ...x, password: e.target.value }))}
        error={form.fields.password}
        hint="At least 10 characters, with a letter and a number."
      />
      <Input label="Confirm new password" type="password" autoComplete="new-password" required value={v.confirmPassword} onChange={(e) => setV((x) => ({ ...x, confirmPassword: e.target.value }))} error={form.fields.confirmPassword} />
      <Button type="submit" size="lg" className="w-full" loading={form.status === "submitting"}>
        Set new password
      </Button>
    </form>
  );
}
