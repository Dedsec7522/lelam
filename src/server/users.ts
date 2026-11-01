import "server-only";
import type { PlanId, Role } from "@/lib/types";
import { newId, read, write, type UserRecord } from "./store";
import { hashPassword } from "./password";

export async function findUserByEmail(email: string) {
  const e = email.trim().toLowerCase();
  return read((db) => db.users.find((u) => u.email === e));
}

export async function createUser(input: { name: string; email: string; password: string; role?: Role; plan?: PlanId; company?: string }) {
  const passwordHash = await hashPassword(input.password);
  const email = input.email.trim().toLowerCase();
  return write((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const user: UserRecord = {
      id: newId("u"),
      email,
      name: input.name.trim(),
      company: input.company,
      passwordHash,
      role: input.role ?? "buyer",
      plan: input.plan ?? "free",
      preferences: { categories: [], states: [], emailAlerts: true, keywords: [] },
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.notifications.push({
      id: newId("n"),
      userId: user.id,
      title: "Welcome to Lelam",
      body: "Set your categories and states in Profile to get matching auction alerts.",
      href: "/dashboard/profile",
      read: false,
      createdAt: user.createdAt,
    });
    db.audit.push({ id: newId("a"), actorId: user.id, action: "user.register", createdAt: user.createdAt });
    return user;
  });
}

export async function audit(action: string, actorId?: string, meta?: Record<string, string>) {
  await write((db) => {
    db.audit.push({ id: newId("a"), actorId, action, meta, createdAt: new Date().toISOString() });
    if (db.audit.length > 2000) db.audit.splice(0, db.audit.length - 2000);
  });
}
