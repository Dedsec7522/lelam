import { json } from "@/server/api";
import { getCurrentUser } from "@/server/session";

export async function GET() {
  const user = await getCurrentUser();
  return json(
    { user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
