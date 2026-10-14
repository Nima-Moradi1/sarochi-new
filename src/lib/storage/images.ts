import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OutputInfo } from "sharp";

export class MediaStorageError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const maxUploadBytes = 5 * 1024 * 1024;
const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function mediaDirectory() {
  const value = process.env.MEDIA_STORAGE_DIR;
  if (!value || !path.isAbsolute(value)) throw new MediaStorageError("MEDIA_STORAGE_NOT_CONFIGURED", 503);
  return value;
}

export async function storeOwnerImage(file: File) {
  if (!file.size || file.size > maxUploadBytes) throw new MediaStorageError("INVALID_IMAGE_SIZE", 413);
  if (!allowedMimes.has(file.type)) throw new MediaStorageError("INVALID_IMAGE_TYPE", 415);
  const bytes = Buffer.from(await file.arrayBuffer());
  const signature = bytes.subarray(0, 12);
  const jpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const png = signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP";
  if (!((file.type === "image/jpeg" && jpeg) || (file.type === "image/png" && png) || (file.type === "image/webp" && webp))) {
    throw new MediaStorageError("IMAGE_SIGNATURE_MISMATCH", 415);
  }
  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).rotate().webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
  } catch {
    throw new MediaStorageError("INVALID_IMAGE", 415);
  }
  const hash = createHash("sha256").update(output.data).digest("hex");
  const originalHash = createHash("sha256").update(bytes).digest("hex");
  const directory = mediaDirectory();
  await mkdir(directory, { recursive: true });
  const originals = path.join(directory, "originals");
  await mkdir(originals, { recursive: true });
  const extension = jpeg ? "jpg" : png ? "png" : "webp";
  try { await writeFile(path.join(originals, `${originalHash}.${extension}`), bytes, { flag: "wx", mode: 0o640 }); }
  catch (error) { if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error; }
  try { await writeFile(path.join(directory, `${hash}.webp`), output.data, { flag: "wx", mode: 0o640 }); }
  catch (error) { if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error; }
  return { url: `/api/v1/media/${hash}`, hash, originalHash, width: output.info.width, height: output.info.height, mime: "image/webp" };
}

export function readStoredImage(hash: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new MediaStorageError("INVALID_MEDIA_ID", 400);
  return readFile(path.join(mediaDirectory(), `${hash}.webp`));
}
