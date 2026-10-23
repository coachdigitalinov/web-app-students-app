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

// A tiny, valid PDF used for every seeded demo file. The in-memory DB uses
// placeholder path prefixes (seed:…) which this short-circuits before touching disk.
const PLACEHOLDER_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<<>>>>endobj\n" +
  "4 0 obj<</Length 44>>stream\nBT /F1 20 Tf 60 80 Td (Digital Inov demo) Tj ET\nendstream endobj\n" +
  "xref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000098 00000 n\n0000000182 00000 n\n" +
  "trailer<</Size 5/Root 1 0 R>>\nstartxref\n266\n%%EOF\n",
  "utf8",
);

export async function readStored(rel: string) {
  if (rel.startsWith("seed:")) return PLACEHOLDER_PDF;
  const abs = path.join(STORAGE_DIR, rel);
  if (!abs.startsWith(STORAGE_DIR + path.sep)) throw new Error("bad path");
  return fs.readFile(abs);
}

export const removeStored = (rel: string) =>
  rel.startsWith("seed:") ? Promise.resolve() : fs.rm(path.join(STORAGE_DIR, rel), { force: true });
