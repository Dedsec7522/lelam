"use client";

import { useRef, useState } from "react";

export type FormStatus = "idle" | "submitting" | "success" | "error";

/**
 * Small helper for JSON forms posting to our API routes. Maps `{ error, fields }`
 * responses to inline field errors and a form-level message.
 */
export function useJsonForm<TBody extends object, TResult = unknown>(url: string, method: "POST" | "PUT" | "PATCH" = "POST") {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Guards against double submission (e.g. pressing Enter twice before the button disables).
  const inFlight = useRef(false);

  async function submit(body: TBody): Promise<TResult | null> {
    if (inFlight.current) return null;
    inFlight.current = true;
    try {
      return await send(body);
    } finally {
      inFlight.current = false;
    }
  }

  async function send(body: TBody): Promise<TResult | null> {
    setStatus("submitting");
    setFields({});
    setMessage(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> } & TResult;
      if (!res.ok) {
        setFields(data.fields ?? {});
        setMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return null;
      }
      setStatus("success");
      return data;
    } catch {
      setMessage("Network error. Check your connection and try again.");
      setStatus("error");
      return null;
    }
  }

  function clearField(name: string) {
    if (fields[name]) {
      setFields((cur) => {
        const next = { ...cur };
        delete next[name];
        return next;
      });
    }
  }

  return { status, fields, message, submit, clearField, setFields, setMessage, setStatus };
}
