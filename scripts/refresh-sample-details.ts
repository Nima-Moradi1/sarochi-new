import "dotenv/config";
import { pool } from "../src/db/client";
import { SourceHttpClient } from "../src/features/import/adapters/source-http";
import { parseSarochiProduct } from "../src/features/import/normalizers/sarochi-product";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mediaDirectory } from "../src/lib/storage/images";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

async function main() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT p.id,p.source_url FROM products p WHERE p.source_type='SAROCHI' AND p.status='PUBLISHED' ORDER BY p.id");
  const http = new SourceHttpClient();
  const cacheDirectory = path.join(mediaDirectory(), "source-details");
  await mkdir(cacheDirectory, { recursive: true });
  const report = { checked: 0, total: rows.length, enriched: 0, sizeGuides: 0, careGuides: 0, failed: [] as { productId: number; message: string }[] };
  for (const row of rows) {
    try {
      const hash = createHash("sha256").update(row.source_url).digest("hex");
      const cacheFile = path.join(cacheDirectory, `${hash}.html`);
      let html: string;
      try { html = await readFile(cacheFile, "utf8"); } catch {
        html = await http.html(row.source_url);
        await writeFile(cacheFile, html);
      }
      const product = parseSarochiProduct(html, row.source_url);
      report.checked++;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        // Lock the product so concurrent resumed runs cannot duplicate source guides.
        await connection.query("SELECT id FROM products WHERE id=? FOR UPDATE", [row.id]);
        let changed = false;
        if (product.descriptionFa) {
          const [result] = await connection.execute<ResultSetHeader>("UPDATE products SET description=? WHERE id=? AND (description IS NULL OR description='')", [product.descriptionFa, row.id]);
          if (result.affectedRows) { report.enriched++; changed = true; }
        }
        const [existingGuides] = await connection.query<RowDataPacket[]>("SELECT id FROM size_guides WHERE product_id=? LIMIT 1", [row.id]);
        if (product.sizeGuide && !existingGuides.length) {
          const guide = product.sizeGuide;
          const [result] = await connection.execute<ResultSetHeader>("INSERT INTO size_guides(product_id,title_fa,tolerance_cm,source_url) VALUES(?,?,?,?)", [row.id, guide.titleFa, guide.toleranceCm, product.sourceUrl]);
          for (const measurement of guide.measurements) {
            await connection.execute("INSERT INTO sizes(label,sort_order) VALUES(?,?) ON DUPLICATE KEY UPDATE label=label", [measurement.size, /^\d+$/.test(measurement.size) ? Number(measurement.size) : 100]);
            const [sizeRows] = await connection.query<RowDataPacket[]>("SELECT id FROM sizes WHERE label=?", [measurement.size]);
            await connection.execute("INSERT INTO size_measurements(guide_id,size_id,metric,value_cm) VALUES(?,?,?,?)", [result.insertId, sizeRows[0].id, measurement.metric, measurement.valueCm]);
          }
          report.sizeGuides++; changed = true;
        }
        const [existingCare] = await connection.query<RowDataPacket[]>("SELECT id FROM care_guides WHERE product_id=? LIMIT 1", [row.id]);
        if (product.care?.length && !existingCare.length) {
          await connection.execute("INSERT INTO care_guides(product_id,title_fa,instructions_fa,source_url) VALUES(?,?,?,?)", [row.id, "شستشو و نگهداری", product.care.join("\n\n"), product.sourceUrl]);
          report.careGuides++; changed = true;
        }
        if (changed) await connection.execute("INSERT INTO source_observations(product_id,source_type,source_url,source_url_hash,field,value,confidence,collected_at,approved_at) VALUES(?,'SAROCHI',?,?,'source_product_specs',?,'SOURCE',?,NOW())", [row.id, product.sourceUrl, createHash("sha256").update(product.sourceUrl).digest("hex"), JSON.stringify({ descriptionFa: product.descriptionFa, care: product.care, sizeGuide: product.sizeGuide }), new Date(product.collectedAt)]);
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    } catch (error) { report.failed.push({ productId: row.id, message: error instanceof Error ? error.message : "FETCH_FAILED" }); }
    await writeFile(path.join(mediaDirectory(), "sample-details-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checked: report.checked, enriched: report.enriched, failed: report.failed.length, total: rows.length }));
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "DETAIL_REFRESH_FAILED"); process.exitCode = 1; }).finally(() => pool.end());
