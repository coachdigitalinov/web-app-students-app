import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { STORAGE_DIR } from "./db";

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "application/pdf": { ext: ".pdf", magic: (b) => b.subarray(0, 4).toString() === "%PDF" },
  "image/jpeg": { ext: ".jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: ".png", magic: (b) => b.subarray(1, 4).toString() === "PNG" },
  "image/webp": { ext: ".webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
};

export const MAX_BYTES = 15 * 1024 * 1024;

export interface Saved {
  path: string;
  mime: string;
  name: string;
}

/** Validates (type, magic bytes, size) and stores an upload under storage/<folder>. Throws a user-facing Error. */
export async function saveUpload(file: File, folder: string): Promise<Saved> {
  const type = TYPES[file.type];
  if (!type) throw new Error("Only PDF, JPG, PNG or WEBP files are allowed.");
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_BYTES) throw new Error("Each file must be 15 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!type.magic(buf)) throw new Error("File contents do not match the file type.");
  const rel = path.join(folder, crypto.randomUUID() + type.ext);
  const abs = path.join(STORAGE_DIR, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return { path: rel, mime: file.type, name: file.name.slice(0, 120) };
}

export async function readStored(rel: string) {
  const abs = path.join(STORAGE_DIR, rel);
  if (!abs.startsWith(STORAGE_DIR + path.sep)) throw new Error("bad path");
  return fs.readFile(abs);
}

export const removeStored = (rel: string) => fs.rm(path.join(STORAGE_DIR, rel), { force: true });
