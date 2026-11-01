import { z } from "zod";
import { error, json, limit, parseBody, sameOrigin } from "@/server/api";
import { FAQS, searchFaqs } from "@/content/faqs";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) }))
    .min(1)
    .max(12),
});

const FALLBACK =
  "I couldn't find that in our help centre. For account or billing questions, use the Contact page and we'll reply within one working day. For auction-specific terms, check the auction's STC on the official portal.";

/**
 * Assistant endpoint. Always grounded in FAQ retrieval; if an OpenAI-compatible LLM is configured
 * server-side (LLM_API_URL / LLM_API_KEY / LLM_MODEL), it rephrases using only that context.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "chat", 20, 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;

  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return error("Ask a question to get started.");
  const hits = searchFaqs(lastUser.content, 3);
  const sources = hits.map((f) => ({ id: f.id, q: f.q }));

  const llm = await askLlm(parsed.data.messages, hits.length ? hits : FAQS.slice(0, 4));
  if (llm) return json({ answer: llm, sources, mode: "llm" });

  return json({ answer: hits[0]?.a ?? FALLBACK, sources: sources.slice(hits.length ? 1 : 0), mode: "retrieval" });
}

async function askLlm(messages: { role: "user" | "assistant"; content: string }[], context: typeof FAQS): Promise<string | null> {
  const url = process.env.LLM_API_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!url || !key || !model) return null;

  const system = [
    "You are the Lelam assistant for an independent Indian auction-intelligence platform.",
    "Lelam is NOT affiliated with MSTC, BaankNet, GeM or any bank, never collects EMD and never bids for users.",
    "Answer in 2–5 short sentences using ONLY the reference notes below. If they don't cover the question, say so and suggest the Contact page.",
    "Never give legal, tax or investment advice beyond the notes; never invent auction data.",
    "Reference notes:",
    ...context.map((f) => `- Q: ${f.q}\n  A: ${f.a}`),
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, max_tokens: 350, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!res.ok) {
      console.error("[chat] LLM error", res.status);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[chat] LLM unavailable:", (err as Error).name);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
