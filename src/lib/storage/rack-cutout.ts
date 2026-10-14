import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mediaDirectory } from "./images";

/** Remove only near-white background connected to an image edge. No synthesized pixels. */
export async function makeRackCutout(input: Buffer) {
  const { data, info } = await sharp(input).resize({ width: 900, height: 1100, fit: "inside", withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  const enqueue = (pixel: number) => {
    if (visited[pixel]) return;
    visited[pixel] = 1;
    const offset = pixel * 4;
    if (Math.min(data[offset], data[offset + 1], data[offset + 2]) < 248) return;
    queue[tail++] = pixel;
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++];
    data[pixel * 4 + 3] = 0;
    const x = pixel % width, y = Math.floor(pixel / width);
    if (x) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }
  let left = width, right = -1, top = height, bottom = -1;
  for (let pixel = 0; pixel < width * height; pixel++) {
    if (!data[pixel * 4 + 3]) continue;
    const x = pixel % width, y = Math.floor(pixel / width);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left || bottom < top) throw new Error("EMPTY_SOURCE_CUTOUT");
  const image = await sharp(data, { raw: { width, height, channels: 4 } }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
  const hash = createHash("sha256").update(image.data).digest("hex");
  await writeFile(path.join(mediaDirectory(), hash + ".webp"), image.data);
  return { hash, url: "/api/v1/media/" + hash, width: image.info.width, height: image.info.height, removedPixels: tail };
}
