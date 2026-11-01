import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const name = z.string().trim().min(1, "Required.").max(80);
const phone = z
  .string()
  .trim()
  .regex(/^(\+?\d[\d\s-]{7,15}\d)$/, "Enter a valid phone number.");
export const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
  remember: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    firstName: name,
    lastName: name,
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: "Please accept the terms to continue." }),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ token: z.string().min(20).max(200), password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const CONTACT_TOPICS = [
  "Payment failed / money deducted",
  "Payment & EMD question",
  "Subscription & billing",
  "Bidding & auction help",
  "Account & access",
  "Catalog / listing issue",
  "Bug report",
  "General enquiry",
] as const;

export const contactSchema = z.object({
  name,
  email,
  topic: z.enum(CONTACT_TOPICS, { message: "Choose a topic." }),
  subject: z.string().trim().min(3, "Add a short subject.").max(140),
  message: z.string().trim().min(20, "Tell us a little more (20+ characters).").max(4000),
  // Honeypot: real users never fill this.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const salesSchema = z.object({
  name,
  email,
  phone,
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const checkoutSchema = z.object({
  plan: z.enum(["individual", "business"]),
  cycle: z.enum(["monthly", "yearly"]),
  trial: z.boolean().optional().default(false),
  coupon: z.string().trim().toUpperCase().max(24).optional().or(z.literal("")),
  billingName: name,
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || GSTIN_RE.test(v), "GSTIN should look like 22AAAAA0000A1Z5.")
    .optional()
    .or(z.literal("")),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code."),
  city: z.string().trim().min(2, "Required.").max(60),
  state: z.string().trim().min(2, "Required.").max(60),
});

export const profileSchema = z.object({
  name,
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  categories: z.array(z.string().max(40)).max(10).default([]),
  states: z.array(z.string().max(60)).max(20).default([]),
  keywords: z.array(z.string().trim().min(2).max(40)).max(15).default([]),
  emailAlerts: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Flattens zod issues to { field: message } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
