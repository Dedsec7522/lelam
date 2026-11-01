import { error, json, limit, parseBody, sameOrigin } from "@/server/api";
import { forgotSchema } from "@/lib/validation";
import { findUserByEmail } from "@/server/users";
import { randomToken, sha256 } from "@/server/password";
import { write } from "@/server/store";
import { sendEmail } from "@/server/mailer";
import { absoluteUrl } from "@/lib/site";

const TTL_MS = 30 * 60_000;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Cross-origin request blocked.", 403);
  const limited = limit(req, "forgot", 5, 15 * 60_000);
  if (limited) return limited;

  const parsed = await parseBody(req, forgotSchema);
  if (!parsed.ok) return parsed.response;

  const user = await findUserByEmail(parsed.data.email);
  if (user) {
    const token = randomToken();
    await write((db) => {
      db.resetTokens = db.resetTokens.filter((t) => t.userId !== user.id && Date.parse(t.expiresAt) > Date.now());
      db.resetTokens.push({ tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TTL_MS).toISOString() });
    });
    await sendEmail({
      to: user.email,
      subject: "Reset your Lelam password",
      text: `Use this link within 30 minutes to set a new password:\n\n${absoluteUrl(`/auth/reset-password?token=${token}`)}\n\nIf you didn't ask for this, ignore this email.`,
    });
  }
  // Same response either way, to avoid account enumeration.
  return json({ ok: true, message: "If an account exists for that email, a reset link is on its way." });
}
