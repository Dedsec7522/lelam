import { z } from "zod";
import { error, json, limit, parseBody, sameOrigin } from "@/server/api";
import { contactSchema, salesSchema } from "@/lib/validation";
import { newId, write } from "@/server/store";
import { sendEmail } from "@/server/mailer";
import { SUPPORT } from "@/lib/site";

const bodySchema = z.discriminatedUnion("kind", [
  contactSchema.extend({ kind: z.literal("contact") }),
  salesSchema.extend({ kind: z.literal("sales") }),
  z.object({ kind: z.literal("newsletter"), email: z.string().trim().toLowerCase().email("Enter a valid email address.") }),
]);

/** Contact form, enterprise sales enquiries and newsletter sign-ups. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "leads", 8, 10 * 60_000);
  if (limited) return limited;
  const parsed = await parseBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;
  const now = new Date().toISOString();

  if (data.kind === "newsletter") {
    await write((db) => {
      if (!db.subscribers.some((s) => s.email === data.email)) db.subscribers.push({ email: data.email, createdAt: now });
    });
    return json({ ok: true });
  }

  // Honeypot filled → pretend success, store nothing.
  if (data.website) return json({ ok: true });

  const lead = await write((db) => {
    const record = {
      id: newId("lead"),
      kind: data.kind,
      name: data.name,
      email: data.email,
      phone: data.kind === "sales" ? data.phone : undefined,
      company: data.kind === "sales" ? data.company || undefined : undefined,
      topic: data.kind === "contact" ? data.topic : "Enterprise sales",
      subject: data.kind === "contact" ? data.subject : undefined,
      message: data.message || "",
      createdAt: now,
    };
    db.leads.push(record);
    return record;
  });

  await sendEmail({
    to: data.kind === "sales" ? SUPPORT.businessEmail : SUPPORT.email,
    subject: `[${lead.kind}] ${lead.topic ?? ""} — ${lead.name}`,
    text: `${lead.name} <${lead.email}>${lead.phone ? ` · ${lead.phone}` : ""}${lead.company ? ` · ${lead.company}` : ""}\n\n${lead.subject ?? ""}\n${lead.message}`,
  });
  return json({ ok: true, reference: lead.id.slice(-6).toUpperCase() }, 201);
}
