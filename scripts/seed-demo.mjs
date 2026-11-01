#!/usr/bin/env node
/**
 * Creates demo accounts for each role (buyer, seller, logistics, admin) in the local JSON store.
 * Passwords are random per run and written to .data/demo-credentials.txt (gitignored) —
 * nothing is hardcoded. Re-running resets those accounts' passwords.
 *
 *   npm run seed:demo
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const dbFile = process.env.LELAM_DB_PATH ?? path.join(process.cwd(), ".data", "db.json");
const credFile = path.join(path.dirname(dbFile), "demo-credentials.txt");

const ACCOUNTS = [
  { email: "buyer@demo.lelam.test", name: "Demo Buyer", role: "buyer", plan: "business" },
  { email: "seller@demo.lelam.test", name: "Demo Seller", role: "seller", plan: "enterprise" },
  { email: "logistics@demo.lelam.test", name: "Demo Transporter", role: "logistics", plan: "free" },
  { email: "admin@demo.lelam.test", name: "Demo Admin", role: "admin", plan: "enterprise" },
];

async function hash(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

let db = {};
try {
  db = JSON.parse(await fs.readFile(dbFile, "utf8"));
} catch {
  /* fresh store */
}
db.users ??= [];

const lines = [`# Lelam demo accounts — generated ${new Date().toISOString()}`, ""];
for (const acc of ACCOUNTS) {
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await hash(password);
  const existing = db.users.find((u) => u.email === acc.email);
  if (existing) Object.assign(existing, { passwordHash, role: acc.role, plan: acc.plan });
  else
    db.users.push({
      id: `u_${randomBytes(8).toString("hex")}`,
      ...acc,
      passwordHash,
      planRenewsAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      preferences: { categories: [], states: [], emailAlerts: true, keywords: [] },
      createdAt: new Date().toISOString(),
    });
  lines.push(`${acc.role.padEnd(10)} ${acc.email.padEnd(28)} ${password}`);
}

await fs.mkdir(path.dirname(dbFile), { recursive: true });
await fs.writeFile(dbFile, JSON.stringify(db, null, 2));
await fs.writeFile(credFile, `${lines.join("\n")}\n`, { mode: 0o600 });
console.log(`Seeded ${ACCOUNTS.length} demo accounts. Credentials: ${credFile}`);
