import { describe, expect, it } from "vitest";
import { checkoutSchema, contactSchema, fieldErrors, loginSchema, registerSchema } from "@/lib/validation";

describe("registerSchema", () => {
  const ok = { firstName: "Asha", lastName: "Rao", email: "ASHA@Example.com ", password: "strongpass42", confirmPassword: "strongpass42", acceptTerms: true };

  it("normalises email and accepts valid input", () => {
    const r = registerSchema.safeParse(ok);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("asha@example.com");
  });

  it("rejects weak or mismatched passwords and unaccepted terms with field errors", () => {
    const r = registerSchema.safeParse({ ...ok, password: "short", confirmPassword: "different", acceptTerms: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      const f = fieldErrors(r.error);
      expect(f.password).toMatch(/10 characters/);
      expect(f.acceptTerms).toBeDefined();
    }
  });
});

describe("other schemas", () => {
  it("requires a password on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("validates contact topic and message length, and rejects a filled honeypot", () => {
    const base = { name: "A", email: "a@b.co", topic: "General enquiry", subject: "Hello there", message: "x".repeat(25), website: "" };
    expect(contactSchema.safeParse(base).success).toBe(true);
    expect(contactSchema.safeParse({ ...base, topic: "Hacking" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, message: "short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, website: "spam.example" }).success).toBe(false);
  });

  it("validates GSTIN and PIN format at checkout", () => {
    const base = { plan: "business", cycle: "monthly", billingName: "Acme", pincode: "560008", city: "Bengaluru", state: "Karnataka" };
    expect(checkoutSchema.safeParse({ ...base, gstin: "29ABCDE1234F1Z5" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...base, gstin: "29ABCDE1234F" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, pincode: "05600" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, plan: "enterprise" }).success).toBe(false);
  });
});
