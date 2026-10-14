import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pool } from "../src/db/client";
import { mediaDirectory } from "../src/lib/storage/images";
import type { RowDataPacket } from "mysql2";

async function main() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT p.id,p.name_fa,p.source_url,m.id media_id,m.view_angle,a.sha256,a.source_url image_url FROM products p JOIN product_media m ON m.product_id=p.id JOIN assets a ON a.id=m.asset_id WHERE p.source_type='SAROCHI' AND p.status='PUBLISHED' ORDER BY p.id,m.sort_order,m.id");
  const products = new Map<number, RowDataPacket[]>();
  for (const row of rows) { const items = products.get(row.id) ?? []; items.push(row); products.set(row.id, items); }
  const all = [...products.values()];
  await mkdir(".artifacts/media-inspection", { recursive: true });
  for (let page = 0; page * 8 < all.length; page++) {
    const group = all.slice(page * 8, (page + 1) * 8);
    const images: sharp.OverlayOptions[] = [];
    for (const [y, product] of group.entries()) {
      for (const [x, row] of product.slice(0, 6).entries()) {
        const bytes = await readFile(path.join(mediaDirectory(), row.sha256 + ".webp"));
        const thumb = await sharp(bytes).resize(160, 190, { fit: "contain", background: "white" }).jpeg().toBuffer();
        images.push({ input: thumb, left: x * 164, top: y * 220 });
        const label = Buffer.from(`<svg width="160" height="25"><text x="5" y="17" font-size="13">P${row.id} M${row.media_id} #${x + 1}</text></svg>`);
        images.push({ input: label, left: x * 164, top: y * 220 + 192 });
      }
    }
    await sharp({ create: { width: 984, height: group.length * 220, channels: 3, background: "white" } }).composite(images).jpeg().toFile(`.artifacts/media-inspection/sheet-${page + 1}.jpg`);
  }
  await writeFile(".artifacts/media-inspection/index.json", JSON.stringify(all, null, 2));
  console.log(JSON.stringify({ products: all.length, sheets: Math.ceil(all.length / 8), media: rows.length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "INSPECTION_FAILED"); process.exitCode = 1; }).finally(() => pool.end());
