import "server-only";
import type { z } from "zod";
import type { Feature } from "@/lib/plans";
import { error, json, parseBody, requireApiUser } from "./api";
import type { SafeUser } from "./session";
import { read, write, type Db } from "./store";
import { canTouch, featureDenied, hasFeature, pushAudit } from "./workspace";

/**
 * Route-handler factory for per-user collections. Every handler:
 * requireApiUser → entitlement → ownership (owner or admin) → zod validation → write.
 */

export type OwnedKey = "bids" | "documents" | "reminders" | "inventory" | "vendors" | "quotes";
export type RecordOf<K extends OwnedKey> = Db[K][number];

/** Throw inside `build`/`apply` to return a 422 with inline field errors. */
export class FieldError extends Error {
  constructor(public fields: Record<string, string>) {
    super(Object.values(fields)[0] ?? "Invalid input.");
  }
}

export interface CrudConfig<K extends OwnedKey, S extends z.ZodObject> {
  collection: K;
  feature?: Feature;
  schema: S;
  /** Builds a new record from validated input. */
  build: (input: z.infer<S>, user: SafeUser, db: Db) => RecordOf<K>;
  /** Applies a validated partial update (defaults to shallow assign of defined keys). */
  apply?: (record: RecordOf<K>, input: Partial<z.infer<S>>) => void;
  sort?: (a: RecordOf<K>, b: RecordOf<K>) => number;
  /** Optional hook after delete (e.g. remove an uploaded file). */
  afterDelete?: (record: RecordOf<K>) => Promise<void>;
}

export type IdContext = { params: Promise<{ id: string }> };

function list<K extends OwnedKey>(db: Db, key: K): RecordOf<K>[] {
  return db[key] as unknown as RecordOf<K>[];
}

function defaultApply<T extends object>(record: T, input: Partial<T>) {
  // Only keys present in the validated body are applied; an emptied optional field clears it.
  Object.assign(record, input);
}

async function guard(req: Request, feature?: Feature) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth;
  if (feature && !hasFeature(auth.user, feature)) return { ok: false as const, response: featureDenied(feature) };
  return auth;
}

export function collectionRoute<K extends OwnedKey, S extends z.ZodObject>(cfg: CrudConfig<K, S>) {
  async function GET(req: Request) {
    const g = await guard(req, cfg.feature);
    if (!g.ok) return g.response;
    const items = await read((db) => list(db, cfg.collection).filter((r) => r.userId === g.user.id));
    if (cfg.sort) items.sort(cfg.sort);
    return json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  }

  async function POST(req: Request) {
    const g = await guard(req, cfg.feature);
    if (!g.ok) return g.response;
    const parsed = await parseBody(req, cfg.schema);
    if (!parsed.ok) return parsed.response;
    try {
      const item = await write((db) => {
        const rec = cfg.build(parsed.data, g.user, db);
        list(db, cfg.collection).push(rec);
        pushAudit(db, `${cfg.collection}.create`, g.user.id, { id: rec.id });
        return rec;
      });
      return json({ item }, 201);
    } catch (e) {
      if (e instanceof FieldError) return error(e.message, 422, { fields: e.fields });
      throw e;
    }
  }

  return { GET, POST };
}

export function itemRoute<K extends OwnedKey, S extends z.ZodObject>(cfg: CrudConfig<K, S>) {
  const patchSchema = cfg.schema.partial();

  async function PATCH(req: Request, ctx: IdContext) {
    const { id } = await ctx.params;
    const g = await guard(req, cfg.feature);
    if (!g.ok) return g.response;
    const parsed = await parseBody(req, patchSchema);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data as Partial<z.infer<S>>;
    try {
      const item = await write((db) => {
        const rec = list(db, cfg.collection).find((r) => r.id === id);
        if (!rec || !canTouch(g.user, rec)) return null;
        if (cfg.apply) cfg.apply(rec, input);
        else defaultApply(rec as object, input as Partial<object>);
        pushAudit(db, `${cfg.collection}.update`, g.user.id, { id });
        return rec;
      });
      if (!item) return error("Not found.", 404);
      return json({ item });
    } catch (e) {
      if (e instanceof FieldError) return error(e.message, 422, { fields: e.fields });
      throw e;
    }
  }

  async function DELETE(req: Request, ctx: IdContext) {
    const { id } = await ctx.params;
    const g = await guard(req, cfg.feature);
    if (!g.ok) return g.response;
    const removed = await write((db) => {
      const arr = list(db, cfg.collection);
      const idx = arr.findIndex((r) => r.id === id);
      if (idx < 0 || !canTouch(g.user, arr[idx])) return null;
      const [rec] = arr.splice(idx, 1);
      pushAudit(db, `${cfg.collection}.delete`, g.user.id, { id });
      return rec;
    });
    if (!removed) return error("Not found.", 404);
    if (cfg.afterDelete) await cfg.afterDelete(removed);
    return json({ ok: true });
  }

  return { PATCH, DELETE };
}
