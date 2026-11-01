"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanId, Role } from "@/lib/types";

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanId;
}

interface SessionState {
  user: ClientUser | null;
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionCtx = createContext<SessionState | null>(null);

/**
 * Client view of the session. Fetched after hydration so marketing pages stay statically
 * rendered; every protected page and API still verifies the session on the server.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: ClientUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json() as Promise<{ user: ClientUser | null }>)
      .then((data) => alive && setUser(data.user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setStatus("ready"));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ user, status, refresh, signOut }), [user, status, refresh, signOut]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
