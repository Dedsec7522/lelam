import { collectionRoute } from "@/server/crud";
import { documentsConfig, documentSchema } from "@/server/resources";
import { error, json, requireApiUser } from "@/server/api";
import { newId, write } from "@/server/store";
import { fieldErrors } from "@/lib/validation";
import { MAX_UPLOAD_BYTES, saveUpload, sniff } from "@/server/uploads";
import { featureDenied, hasFeature, isoNow, pushAudit } from "@/server/workspace";
import type { DocumentRecord } from "@/server/store";

export const { GET } = collectionRoute(documentsConfig);

/**
 * Creates a vault record. Accepts JSON (metadata only) or multipart/form-data with an optional
 * `file` (PDF/PNG/JPG, ≤ 5 MB, verified by magic bytes).
 */
export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  if (!hasFeature(user, "documents")) return featureDenied("documents");

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64_000) return error("Files must be 5 MB or smaller.", 413, { fields: { file: "Files must be 5 MB or smaller." } });

  let raw: Record<string, unknown>;
  let file: File | null = null;
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      raw = { name: form.get("name") ?? "", kind: form.get("kind") ?? "", expiresOn: form.get("expiresOn") ?? "" };
      const f = form.get("file");
      if (f instanceof File && f.size > 0) file = f;
    } else {
      raw = (await req.json()) as Record<string, unknown>;
    }
  } catch {
    return error("Could not read the upload.");
  }

  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) return error("Please fix the highlighted fields.", 422, { fields: fieldErrors(parsed.error) });

  let bytes: Uint8Array | null = null;
  let ext: ReturnType<typeof sniff> = null;
  if (file) {
    if (file.size > MAX_UPLOAD_BYTES) return error("Files must be 5 MB or smaller.", 413, { fields: { file: "Files must be 5 MB or smaller." } });
    bytes = new Uint8Array(await file.arrayBuffer());
    ext = sniff(bytes);
    if (!ext) return error("Only PDF, PNG or JPG files are accepted.", 422, { fields: { file: "Only PDF, PNG or JPG files are accepted." } });
  }

  const id = newId("d");
  if (bytes && ext) await saveUpload(user.id, id, ext, bytes);

  const item = await write((db) => {
    const rec: DocumentRecord = {
      id,
      userId: user.id,
      name: parsed.data.name,
      kind: parsed.data.kind,
      expiresOn: parsed.data.expiresOn,
      sizeKb: bytes ? Math.max(1, Math.round(bytes.byteLength / 1024)) : 0,
      createdAt: isoNow(),
    };
    db.documents.push(rec);
    pushAudit(db, "documents.create", user.id, { id, file: ext ?? "none" });
    return rec;
  });
  return json({ item }, 201);
}
