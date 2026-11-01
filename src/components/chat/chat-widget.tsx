"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageCircle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fadeOnly, motionTokens, panelPop, springs } from "@/lib/motion";
import { CloseButton } from "@/components/ui/dialog";
import { STATIC_DEMO } from "@/lib/site";
import { searchFaqs } from "@/content/faqs";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: { id: string; q: string }[];
}

const STARTERS = ["How do EMD refunds work?", "Is Lelam linked to MSTC?", "What is GST under RCM?", "Do I need PCB documents?"];

/**
 * "Ask Lelam" assistant. Answers come from /api/chat (FAQ retrieval, optional server-side LLM).
 * No API keys are ever used in the browser.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi, I'm the Lelam assistant. Ask me about bidding, EMD, GST or how Lelam works." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const reduce = useSafeReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, busy, reduce]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Message[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    if (STATIC_DEMO) {
      // GitHub Pages build: answer from the bundled help centre in the browser (same retrieval as /api/chat).
      const hits = searchFaqs(question, 3);
      const answer = hits[0]?.a ?? "I couldn't find that in our help centre. Try the FAQ page, or email support for account and billing questions.";
      setMessages((m) => [...m, { role: "assistant", text: answer, sources: hits.slice(1).map((f) => ({ id: f.id, q: f.q })) }]);
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8).map(({ role, text: t }) => ({ role, content: t })) }),
      });
      const data = (await res.json()) as { answer?: string; sources?: Message["sources"]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "The assistant is unavailable right now.");
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? "", sources: data.sources }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: (err as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lelam-assistant"
        aria-label={open ? "Close assistant" : "Ask Lelam assistant"}
        whileHover={reduce ? undefined : { scale: motionTokens.scale.pop }}
        whileTap={reduce ? undefined : { scale: motionTokens.scale.press }}
        transition={springs.snappy}
        className="fixed bottom-20 right-4 z-[60] grid size-14 place-items-center rounded-full bg-ink text-paper shadow-lg lg:bottom-6 lg:right-6"
      >
        {/* Slow-rotating conic halo: signals "assistant" without a heavyweight WebGL scene */}
        <span
          aria-hidden
          className="absolute -inset-[3px] -z-10 rounded-full opacity-80 motion-safe:animate-[spin_6s_linear_infinite]"
          style={{ background: "conic-gradient(from 0deg, var(--brand), var(--copper), var(--brand))" }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="lelam-assistant"
            role="dialog"
            aria-label="Lelam assistant"
            variants={reduce ? fadeOnly : panelPop}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-36 right-4 z-[60] flex h-[min(560px,calc(100dvh-11rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lg lg:bottom-24 lg:right-6"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line bg-ink px-5 py-4 text-paper">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-paper/10">
                  <Sparkles className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ask Lelam</p>
                  <p className="text-xs opacity-70">Answers from our help centre</p>
                </div>
              </div>
              <div className="[&_button]:text-paper/80 [&_button:hover]:bg-paper/10 [&_button:hover]:text-paper">
                <CloseButton onClick={() => setOpen(false)} label="Close assistant" />
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: motionTokens.distance.sm }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.9rem] leading-relaxed",
                      m.role === "user" ? "rounded-br-md bg-brand text-on-brand" : "rounded-bl-md bg-paper-2 text-ink-2",
                    )}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.sources?.length ? (
                      <div className="mt-2 border-t border-line pt-2">
                        <p className="text-[0.7rem] uppercase tracking-wider text-muted">Related</p>
                        <ul className="mt-1 space-y-1">
                          {m.sources.map((s) => (
                            <li key={s.id}>
                              <Link href={`/faq#${s.id}`} onClick={() => setOpen(false)} className="text-[0.82rem] text-brand underline-offset-2 hover:underline">
                                {s.q}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex gap-1 px-2 py-2" role="status" aria-label="Assistant is typing">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-2 rounded-full bg-faint"
                      animate={reduce ? undefined : { y: [0, -5, 0] }}
                      transition={{ duration: motionTokens.duration.crawl * 0.8, repeat: Infinity, delay: d * motionTokens.stagger.loose }}
                    />
                  ))}
                </div>
              )}
            </div>

            {messages.length < 3 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[0.78rem] text-ink-2 transition-colors hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2 border-t border-line p-3"
            >
              <label htmlFor="chat-input" className="sr-only">
                Your question
              </label>
              <textarea
                ref={inputRef}
                id="chat-input"
                rows={1}
                value={input}
                maxLength={600}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask about EMD, GST, bidding…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="size-5" />
              </button>
            </form>
            <p className="px-4 pb-3 text-center text-[0.68rem] text-faint">Guidance only. Always confirm terms on the official portal.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
