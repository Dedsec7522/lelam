/** Tiny client for the workspace JSON APIs; normalises `{ error, fields }` failures. */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fields: Record<string, string>; requiredPlan?: string };

export async function api<T>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", body?: unknown): Promise<ApiResult<T>> {
  try {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const res = await fetch(url, {
      method,
      headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: typeof data.error === "string" ? data.error : "Something went wrong. Please try again.",
        fields: (data.fields as Record<string, string> | undefined) ?? {},
        requiredPlan: typeof data.requiredPlan === "string" ? data.requiredPlan : undefined,
      };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "You appear to be offline. Check your connection and retry.", fields: {} };
  }
}

/** ISO → value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO (empty stays empty so the server can flag it). */
export function fromLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}
