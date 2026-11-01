"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { springs } from "@/lib/motion";
import { useJsonForm } from "./use-form";

export function SalesForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [values, setValues] = useState({ name: "", email: "", phone: "", company: "", message: "", website: "" });
  const form = useJsonForm<typeof values & { kind: "sales" }, { reference: string }>("/api/leads");
  const [reference, setReference] = useState<string | null>(null);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    form.clearField(k);
  };

  return (
    <div className={tone === "dark" ? "rounded-3xl bg-surface p-6 text-ink shadow-lg sm:p-8" : "rounded-3xl border border-line bg-surface p-6 sm:p-8"}>
      <AnimatePresence mode="wait" initial={false}>
        {reference ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={springs.gentle} className="py-10 text-center" role="status">
            <CheckCircle2 className="mx-auto size-12 text-positive" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold">Thanks, we&apos;ll be in touch</h3>
            <p className="mt-2 text-sm text-muted">An auction specialist will call you within one working day. Reference {reference}.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0 }}
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await form.submit({ ...values, kind: "sales" });
              if (r) setReference(r.reference);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <h3 className="text-lg font-semibold sm:col-span-2">Talk to our team</h3>
            <Input label="Full name" required autoComplete="name" value={values.name} onChange={set("name")} error={form.fields.name} />
            <Input label="Work email" type="email" required autoComplete="email" value={values.email} onChange={set("email")} error={form.fields.email} />
            <Input label="Phone" type="tel" required autoComplete="tel" value={values.phone} onChange={set("phone")} error={form.fields.phone} />
            <Input label="Company" autoComplete="organization" value={values.company} onChange={set("company")} error={form.fields.company} />
            <Textarea label="What do you buy, and where?" className="sm:col-span-2" value={values.message} onChange={set("message")} error={form.fields.message} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} className="hidden" aria-hidden />
            {form.message && (
              <p role="alert" className="text-sm text-danger sm:col-span-2">
                {form.message}
              </p>
            )}
            <Button type="submit" size="lg" loading={form.status === "submitting"} iconRight={<Send className="size-4" />} className="sm:col-span-2">
              Request a callback
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
