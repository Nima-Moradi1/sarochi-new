import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pool } from "../src/db/client";
import type { RowDataPacket } from "mysql2";

async function main() {
  const input = JSON.parse(await readFile(process.argv[2], "utf8")) as { mediaId: number; angle: "FRONT" | "BACK" | "SIDE" | "DETAIL" | "LIFESTYLE"; primary?: boolean }[];
  const evidence: unknown[] = [];
  for (const review of input) {
    if (!Number.isSafeInteger(review.mediaId) || !["FRONT", "BACK", "SIDE", "DETAIL", "LIFESTYLE"].includes(review.angle)) throw new Error("INVALID_REVIEW");
    const [rows] = await pool.query<RowDataPacket[]>("SELECT p.id product_id,p.name_fa,p.source_url product_url,a.source_url image_url,a.sha256 FROM product_media m JOIN products p ON p.id=m.product_id JOIN assets a ON a.id=m.asset_id WHERE m.id=? AND p.source_type='SAROCHI'", [review.mediaId]);
    if (!rows[0]) throw new Error("MEDIA_NOT_FOUND");
    await pool.execute("UPDATE product_media SET view_angle=?,confidence='VERIFIED' WHERE id=?", [review.angle, review.mediaId]);
    if (review.primary === true) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute("UPDATE product_media SET is_primary=FALSE WHERE product_id=?", [rows[0].product_id]);
        await connection.execute("UPDATE product_media SET is_primary=TRUE WHERE id=?", [review.mediaId]);
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    }
    evidence.push({ ...rows[0], angle: review.angle, reviewedAt: new Date().toISOString(), method: "Visual inspection of original source photograph contact sheet; no inferred back" });
  }
  await mkdir("docs/research", { recursive: true });
  const output = "docs/research/SAMPLE_MEDIA_REVIEW.json";
  let previous: unknown[] = [];
  try { previous = JSON.parse(await readFile(output, "utf8")); } catch { /* First review. */ }
  await writeFile(output, JSON.stringify([...previous, ...evidence], null, 2));
  console.log(JSON.stringify({ reviewed: evidence.length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "REVIEW_FAILED"); process.exitCode = 1; }).finally(() => pool.end());
