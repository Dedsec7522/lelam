import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Document-vault file storage under `.data/uploads/<userId>/<docId>.<ext>`.
 * Files are never served statically; downloads go through an auth-checked route.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const UPLOAD_TYPES = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
} as const;
export type UploadExt = keyof typeof UPLOAD_TYPES;

const SAFE_ID = /^[a-z]+_[a-f0-9]{16}$/;

function root() {
  return path.join(process.cwd(), ".data", "uploads");
}

function userDir(userId: string) {
  if (!SAFE_ID.test(userId)) throw new Error("Unsafe user id");
  return path.join(root(), userId);
}

/** Detects the real type from magic bytes (the client-declared MIME type is not trusted). */
export function sniff(buf: Uint8Array): UploadExt | null {
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "pdf";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  return null;
}

export async function saveUpload(userId: string, docId: string, ext: UploadExt, data: Uint8Array) {
  if (!SAFE_ID.test(docId)) throw new Error("Unsafe document id");
  const dir = userDir(userId);
  await fs.mkdir(dir, { recursive: true });
  await deleteUpload(userId, docId);
  await fs.writeFile(path.join(dir, `${docId}.${ext}`), data);
}

export async function findUpload(userId: string, docId: string): Promise<{ file: string; ext: UploadExt } | null> {
  if (!SAFE_ID.test(docId)) return null;
  try {
    const entries = await fs.readdir(userDir(userId));
    const name = entries.find((e) => e.startsWith(`${docId}.`));
    if (!name) return null;
    const ext = name.slice(docId.length + 1);
    if (!(ext in UPLOAD_TYPES)) return null;
    return { file: path.join(userDir(userId), name), ext: ext as UploadExt };
  } catch {
    return null;
  }
}

export async function deleteUpload(userId: string, docId: string) {
  const found = await findUpload(userId, docId);
  if (found) await fs.rm(found.file, { force: true });
}
