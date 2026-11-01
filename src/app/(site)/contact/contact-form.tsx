"use client";

import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Copy, Send } from "lucide-react";
import { CONTACT_TOPICS } from "@/lib/validation";
import { SUPPORT } from "@/lib/site";
import { fadeOnly, motionTokens, panelPop, springs } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { SalesForm } from "@/components/forms/sales-form";
import { useJsonForm } from "@/components/forms/use-form";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

type Topic = (typeof CONTACT_TOPICS)[number];
type Values = { name: string; email: string; topic: Topic | ""; subject: string; message: string; website: string };
type Body = Omit<Values, "topic"> & { kind: "contact"; topic: string };

const EMPTY: Values = { name: "", email: "", topic: "", subject: "", message: "", website: "" };

export function ContactForm() {
  const reduce = useSafeReducedMotion();
  const [values, setValues] = useState<Values>(EMPTY);
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useJsonForm<Body, { reference: string }>("/api/leads");

  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    form.clearField(k);
  };

  async function copyRef() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {reference ? (
          <motion.div key="done" initial="hidden" animate="visible" exit="exit" variants={reduce ? fadeOnly : panelPop} role="status" className="py-10 text-center">
            <motion.span
              className="mx-auto grid size-16 place-items-center rounded-full bg-positive-soft text-positive"
              initial={reduce ? false : { scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.release}
            >
              <CheckCircle2 className="size-8" aria-hidden />
            </motion.span>
            <h2 className="mt-5 text-2xl font-semibold text-ink">Message received</h2>
            <p className="mx-auto mt-2 max-w-sm text-[0.95rem] text-muted">
              We will reply to {values.email} within one working day ({SUPPORT.hours}). Quote the reference below if you follow up.
            </p>
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-line bg-surface-2 py-1.5 pl-4 pr-1.5">
              <span className="text-sm text-muted">Reference</span>
              <span className="font-mono text-base font-medium text-ink">{reference}</span>
              <button
                type="button"
                onClick={copyRef}
                aria-label={copied ? "Reference copied" : "Copy reference"}
                className="grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-paper-2 hover:text-ink"
              >
                {copied ? <CheckCircle2 className="size-4 text-positive" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </button>
            </div>
            <div className="mt-8">
              <Button
                variant="secondary"
                onClick={() => {
                  setReference(null);
                  setCopied(false);
                  setValues(EMPTY);
                  form.setStatus("idle");
                }}
              >
                Send another message
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
            noValidate
            aria-labelledby="contact-form-title"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await form.submit({ ...values, kind: "contact" });
              if (r) setReference(r.reference);
            }}
            className="grid gap-5 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <h2 id="contact-form-title" className="text-xl font-semibold text-ink">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-muted">Fields marked * are required.</p>
            </div>
            <Input label="Your name" name="name" required autoComplete="name" value={values.name} onChange={set("name")} error={form.fields.name} />
            <Input label="Email" name="email" type="email" required autoComplete="email" value={values.email} onChange={set("email")} error={form.fields.email} />
            <Select label="Topic" name="topic" required value={values.topic} onChange={set("topic")} error={form.fields.topic} className="sm:col-span-2">
              <option value="" disabled>
                Choose what this is about
              </option>
              {CONTACT_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input label="Subject" name="subject" required value={values.subject} onChange={set("subject")} error={form.fields.subject} className="sm:col-span-2" />
            <Textarea
              label="Message"
              name="message"
              required
              rows={6}
              value={values.message}
              onChange={set("message")}
              error={form.fields.message}
              hint="Include the auction Ref ID or payment reference if it is about a lot or a charge."
              className="sm:col-span-2"
            />
            <div aria-hidden className="hidden">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
            </div>
            {form.message && (
              <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger sm:col-span-2">
                {form.message}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.8rem] text-muted">We use your details only to answer this request.</p>
              <Button type="submit" size="lg" loading={form.status === "submitting"} iconRight={<Send className="size-4" />}>
                Send message
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

type Mode = "support" | "sales";

/** Support / Sales switch. Keeps `?topic=sales` in the URL so the choice is shareable. */
export function ContactPanels({ initial }: { initial: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const reduce = useSafeReducedMotion();

  function change(next: Mode) {
    setMode(next);
    const url = new URL(window.location.href);
    if (next === "sales") url.searchParams.set("topic", "sales");
    else url.searchParams.delete("topic");
    window.history.replaceState(null, "", url);
  }

  return (
    <div>
      <Segmented
        label="Who do you want to reach?"
        options={[
          { value: "support", label: "Support" },
          { value: "sales", label: "Sales" },
        ]}
        value={mode}
        onChange={change}
        controls="contact-panel"
        className="[&_[role=tab]]:h-11"
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          id={`contact-panel-${mode}`}
          role="tabpanel"
          aria-label={mode === "sales" ? "Sales enquiry" : "Support request"}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          className="mt-6"
        >
          {mode === "sales" ? (
            <div>
              <p className="mb-4 text-[0.95rem] text-muted">
                Buying at volume, or need Enterprise features like a catalog specialist, custom indices or SSO? Leave your number and we will call you back.
              </p>
              <SalesForm tone="light" />
            </div>
          ) : (
            <ContactForm />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
