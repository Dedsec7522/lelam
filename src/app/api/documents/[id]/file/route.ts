import { promises as fs } from "node:fs";
import { error, requireApiUser } from "@/server/api";
import { read } from "@/server/store";
import { findUpload, UPLOAD_TYPES } from "@/server/uploads";
import { canTouch, featureDenied, hasFeature } from "@/server/workspace";

/** Auth-checked download of a vault file (owner or admin only). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  if (!hasFeature(auth.user, "documents")) return featureDenied("documents");

  const doc = await read((db) => db.documents.find((d) => d.id === id));
  if (!doc || !canTouch(auth.user, doc)) return error("Not found.", 404);
  const found = await findUpload(doc.userId, doc.id);
  if (!found) return error("No file is attached to this document.", 404);

  const data = await fs.readFile(found.file);
  const safeName = doc.name.replace(/[^\w.\- ]+/g, "").trim() || "document";
  const disposition = new URL(req.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": UPLOAD_TYPES[found.ext],
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `${disposition}; filename="${safeName}.${found.ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Uploaded files render in a sandbox: no scripts, no same-origin access.
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
