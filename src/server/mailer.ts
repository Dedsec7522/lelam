import "server-only";

/**
 * Email delivery boundary. Without RESEND_API_KEY, messages are logged (development) so flows
 * like password reset are testable locally. With it, they are sent through Resend's HTTP API.
 */
export async function sendEmail(msg: { to: string; subject: string; text: string }): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Lelam <no-reply@lelam.co>";
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail:dev] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
    }
    return { delivered: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
    });
    if (!res.ok) console.error("[mail] send failed", res.status);
    return { delivered: res.ok };
  } catch (err) {
    console.error("[mail] send error", (err as Error).message);
    return { delivered: false };
  }
}
