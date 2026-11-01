"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "newsletter", email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not subscribe.");
      setState("done");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6" noValidate>
      <label htmlFor="newsletter-email" className="text-sm font-medium text-ink">
        Weekly auction digest
      </label>
      <div className="mt-2 flex h-11 items-center rounded-full border border-line-strong bg-surface p-1 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12">
        <input
          suppressHydrationWarning
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          disabled={state === "done"}
          className="h-full min-w-0 flex-1 bg-transparent pl-3.5 text-sm text-ink placeholder:text-faint focus:outline-none"
          aria-describedby="newsletter-status"
        />
        <button
          type="submit"
          disabled={state === "loading" || state === "done"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform hover:scale-105 disabled:opacity-70"
          aria-label="Subscribe"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: motionTokens.duration.fast }}
            >
              {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : state === "done" ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <p id="newsletter-status" role="status" className="mt-2 min-h-5 text-xs text-muted">
        {state === "done" ? "Subscribed. Check your inbox on Monday." : state === "error" ? <span className="text-danger">{message}</span> : null}
      </p>
    </form>
  );
}
