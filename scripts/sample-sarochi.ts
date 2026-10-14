import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/db/client";
import { storeOwnerImage, mediaDirectory } from "../src/lib/storage/images";
import { makeRackCutout } from "../src/lib/storage/rack-cutout";
import { SourceHttpClient, isAllowedByRobots } from "../src/features/import/adapters/source-http";
import { normalizedProductSchema, type NormalizedProduct } from "../src/features/import/normalizers/sarochi-product";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type Category = { key: string; parentKey: string | null; nameFa: string; url: string };
type Counters = { sourceCategories: Category[]; perCategory: { key: string; urlsSeen: string[] }[] };
type Stored = Awaited<ReturnType<typeof storeOwnerImage>>;
const source = new SourceHttpClient();
const cacheFile = path.join(mediaDirectory(), "sample-download-cache.json");
const reportFile = path.join(mediaDirectory(), "sample-import-report.json");
const cache: Record<string, Stored> = {};
let robots = "", nextRequestAt = 0;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const categorySlug = (key: string) => "source-" + (/^[a-z0-9/-]+$/.test(key) ? key.replaceAll("/", "-") : sha(key).slice(0, 20));
const json = <T,>(value: unknown): T => typeof value === "string" ? JSON.parse(value) : value as T;

function garmentClass(keys: string[]) {
  if (keys.some((key) => key.startsWith("t-shirt"))) return "TSHIRT";
  if (keys.some((key) => key.startsWith("salonik-stitch"))) return "KNIT";
  if (keys.some((key) => key.startsWith("pants") || key === "shorts")) return "PANTS";
  if (keys.some((key) => key === "shirt" || key.startsWith("shirt/"))) return "SHIRT";
  if (keys.some((key) => /blazer|jacket|overcoat|shacket|vest/.test(key) || decodeURIComponent(key) === "کت-و-شلوار")) return "JACKET";
  return "OTHER";
}

async function download(url: string): Promise<Stored> {
  if (cache[url]) {
    try { await readFile(path.join(mediaDirectory(), cache[url].hash + ".webp")); return cache[url]; } catch { /* Re-fetch only missing cached bytes. */ }
  }
  const parsed = new URL(url);
  if (parsed.origin !== "https://sarochi.ir" || !parsed.pathname.startsWith("/wp-content/uploads/") || parsed.username || parsed.password) throw new Error("UNAPPROVED_SOURCE_IMAGE");
  if (!isAllowedByRobots(robots, url)) throw new Error("SOURCE_MEDIA_DISALLOWED");
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = Math.max(0, nextRequestAt - Date.now());
    nextRequestAt = Math.max(Date.now(), nextRequestAt) + 1100;
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "SAROCHI-Atelier/0.2 (owner authorized sample media)", Accept: "image/jpeg,image/png,image/webp" } });
    if ([429, 503].includes(response.status)) { await response.body?.cancel(); if (attempt < 2) { await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1))); continue; } }
    if (!response.ok || !response.body) throw new Error("SOURCE_IMAGE_HTTP_" + response.status);
    if (Number(response.headers.get("content-length")) > 5 * 1024 * 1024) throw new Error("SOURCE_IMAGE_TOO_LARGE");
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let length = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > 5 * 1024 * 1024) { await reader.cancel(); throw new Error("SOURCE_IMAGE_TOO_LARGE"); } chunks.push(part.value); } } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks), signature = bytes.subarray(0, 12);
    const mime = signature[0] === 255 && signature[1] === 216 ? "image/jpeg" : signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" : signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "invalid";
    const stored = await storeOwnerImage(new File([bytes], "original-source", { type: mime }));
    cache[url] = stored;
    // Single event-loop synchronous snapshot prevents parallel workers losing a cache entry.
    await writeFile(cacheFile, JSON.stringify(cache));
    return stored;
  }
  throw new Error("SOURCE_MEDIA_BLOCKED");
}

async function main() {
  await mkdir(mediaDirectory(), { recursive: true });
  try { Object.assign(cache, JSON.parse(await readFile(cacheFile, "utf8"))); } catch { /* First run. */ }
  robots = await source.robots();
  const [jobs] = await pool.query<RowDataPacket[]>("SELECT counters FROM import_jobs WHERE id=5");
  const counters = json<Counters>(jobs[0]?.counters);
  if (!counters?.sourceCategories || !counters.perCategory) throw new Error("SOURCE_JOB_5_REQUIRED");
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id,payload,source_url FROM import_candidates ORDER BY id DESC");
  const byUrl = new Map<string, NormalizedProduct>();
  for (const row of rows) { if (byUrl.has(row.source_url)) continue; const parsed = normalizedProductSchema.safeParse(json(row.payload)); if (parsed.success) byUrl.set(row.source_url, parsed.data); }
  const includedFile = process.argv.find((argument) => argument.startsWith("--include="))?.slice(10);
  const included = includedFile ? normalizedProductSchema.parse(JSON.parse(await readFile(includedFile, "utf8"))) : null;
  if (included) byUrl.set(included.sourceUrl, included);
  const categoryIds = new Map<string, number>(), railIds = new Map<string, number>();
  const [brandRows] = await pool.query<RowDataPacket[]>("SELECT id FROM brands WHERE code='SAROCHI' LIMIT 1");
  if (!brandRows.length) throw new Error("SAROCHI_BRAND_REQUIRED");
  for (const [order, category] of counters.sourceCategories.entries()) {
    await pool.execute("INSERT INTO categories(slug,name_fa,sort_order,is_published,external_source_id) VALUES(?,?,?,true,?) ON DUPLICATE KEY UPDATE external_source_id=VALUES(external_source_id)", [categorySlug(category.key), category.nameFa, order, category.key]);
    const [found] = await pool.query<RowDataPacket[]>("SELECT id FROM categories WHERE slug=?", [categorySlug(category.key)]);
    categoryIds.set(category.key, found[0].id);
    await pool.execute("INSERT INTO rails(slug,title_fa,category_id,sort_order,is_published) VALUES(?,?,?,?,false) ON DUPLICATE KEY UPDATE category_id=VALUES(category_id)", [categorySlug(category.key), category.nameFa, found[0].id, order]);
    const [rails] = await pool.query<RowDataPacket[]>("SELECT id FROM rails WHERE slug=?", [categorySlug(category.key)]);
    railIds.set(category.key, rails[0].id);
  }
  for (const category of counters.sourceCategories) if (category.parentKey && categoryIds.has(category.parentKey)) await pool.execute("UPDATE categories SET parent_id=? WHERE id=?", [categoryIds.get(category.parentKey), categoryIds.get(category.key)]);
  const selected = new Map<string, { product: NormalizedProduct; keys: Set<string> }>();
  const report = { startedAt: new Date().toISOString(), state: "IN_PROGRESS", source: "https://sarochi.ir/shop/", ownerAuthorized: true, requestedPerCategory: 9, imported: 0, failed: [] as { url: string; error: string }[], perCategory: [] as { key: string; nameFa: string; available: number; selected: string[]; written: number }[] };
  for (const category of counters.sourceCategories) {
    const available = counters.perCategory.find((entry) => entry.key === category.key)?.urlsSeen ?? [];
    const prioritised = included?.categoryKeys.includes(category.key) ? [included.sourceUrl, ...available.filter((url) => url !== included.sourceUrl)] : available;
    const chosen = prioritised.filter((url) => byUrl.get(url)?.media.length).slice(0, 9);
    report.perCategory.push({ key: category.key, nameFa: category.nameFa, available: available.length, selected: chosen, written: 0 });
    for (const url of chosen) { const record = selected.get(url) ?? { product: byUrl.get(url)!, keys: new Set<string>() }; record.keys.add(category.key); selected.set(url, record); }
  }
  await writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ uniqueSelected: selected.size, categories: report.perCategory.length, cachedImages: Object.keys(cache).length }));
  const queue = [...selected.entries()];
  let position = 0;
  async function worker() {
    while (position < queue.length) {
      const [url, record] = queue[position++];
      try {
        const images: Stored[] = [];
        for (const media of record.product.media) images.push(await download(media.sourceUrl));
        const originalFront = await readFile(path.join(mediaDirectory(), images[0].hash + ".webp"));
        const cutout = await makeRackCutout(originalFront);
        const connection = await pool.getConnection();
        let productId: number;
        try {
          await connection.beginTransaction();
          const [existing] = await connection.query<RowDataPacket[]>("SELECT id FROM products WHERE source_url=? LIMIT 1 FOR UPDATE", [url]);
          if (existing.length) productId = existing[0].id;
          else {
            const [created] = await connection.execute<ResultSetHeader>("INSERT INTO products(brand_id,slug,name_fa,description,garment_class,status,source_type,source_id,source_url) VALUES(?,?,?,?,?,'PUBLISHED','SAROCHI',?,?)", [brandRows[0].id, "sarochi-" + sha(url).slice(0, 20), record.product.nameFa, record.product.descriptionFa, garmentClass([...record.keys, ...record.product.categoryKeys]), record.product.sourceId, url]);
            productId = created.insertId;
            for (const variant of record.product.variants) {
              let sizeId: number | null = null, colorId: number | null = null;
              if (variant.size) { await connection.execute("INSERT IGNORE INTO sizes(label,sort_order) VALUES(?,1000)", [variant.size]); const [sizes] = await connection.query<RowDataPacket[]>("SELECT id FROM sizes WHERE label=? LIMIT 1", [variant.size]); sizeId = sizes[0].id; }
              if (variant.color) { const slug = "source-" + sha(variant.color).slice(0, 20); await connection.execute("INSERT IGNORE INTO colors(slug,name_fa) VALUES(?,?)", [slug, variant.color]); const [colors] = await connection.query<RowDataPacket[]>("SELECT id FROM colors WHERE slug=?", [slug]); colorId = colors[0].id; }
              await connection.execute("INSERT INTO product_variants(product_id,sku,color_id,size_id,regular_price_toman,sale_price_toman,stock_qty,stock_status) VALUES(?,?,?,?,?,?,NULL,?)", [productId, variant.sku, colorId, sizeId, variant.regularPriceToman, variant.salePriceToman, variant.stockStatus]);
            }
            const [candidate] = await connection.query<RowDataPacket[]>("SELECT id,source_url_hash FROM import_candidates WHERE source_url=? ORDER BY id DESC LIMIT 1", [url]);
            if (candidate.length) {
              await connection.execute("UPDATE import_candidates SET review_status='COMMITTED',committed_product_id=? WHERE id=?", [productId, candidate[0].id]);
              await connection.execute("INSERT INTO source_observations(product_id,source_type,source_url,source_url_hash,field,value,confidence,collected_at,approved_at) VALUES(?,'SAROCHI',?,?,'owner_sample_import',?,'SOURCE',?,NOW())", [productId, url, candidate[0].source_url_hash, JSON.stringify({ authorization: "Owner explicitly requested up to nine real products/category", sourceStockQuantities: "UNKNOWN", variants: record.product.variants, originalMediaUrls: record.product.media.map((media) => media.sourceUrl) }), new Date(record.product.collectedAt)]);
            }
          }
          for (const key of record.keys) await connection.execute("INSERT IGNORE INTO product_categories(product_id,category_id) VALUES(?,?)", [productId, categoryIds.get(key)]);
          for (const [index, image] of images.entries()) {
            const sourceUrl = record.product.media[index].sourceUrl;
            const [existingMedia] = await connection.query<RowDataPacket[]>("SELECT m.id FROM product_media m JOIN assets a ON a.id=m.asset_id WHERE m.product_id=? AND a.sha256=? LIMIT 1", [productId, image.hash]);
            if (existingMedia.length) continue;
            const [asset] = await connection.execute<ResultSetHeader>("INSERT INTO assets(path_or_url,mime,sha256,width,height,source_url,provenance,license,verification_status) VALUES(?,?,?,?,?,?,'SAROCHI_SOURCE',?,'UNVERIFIED')", [image.url, image.mime, image.hash, image.width, image.height, sourceUrl, "Owner authorized source download; original bytes retained"]);
            await connection.execute("INSERT INTO product_media(product_id,asset_id,view_angle,sort_order,is_primary,confidence) VALUES(?,?,'UNKNOWN',?,?,'UNVERIFIED')", [productId, asset.insertId, index, index === 0]);
          }
          const [existingCutout] = await connection.query<RowDataPacket[]>("SELECT id FROM assets WHERE sha256=? AND provenance='SAROCHI_CUTOUT' LIMIT 1", [cutout.hash]);
          let cutoutId = existingCutout[0]?.id;
          if (!cutoutId) { const [asset] = await connection.execute<ResultSetHeader>("INSERT INTO assets(path_or_url,mime,sha256,width,height,source_url,provenance,license,verification_status) VALUES(?,'image/webp',?,?,?,?,'SAROCHI_CUTOUT',?,'UNVERIFIED')", [cutout.url, cutout.hash, cutout.width, cutout.height, record.product.media[0].sourceUrl, "Owner source photo; edge-white removal only; no generated garment"]); cutoutId = asset.insertId; }
          for (const key of record.keys) { const coverage = report.perCategory.find((entry) => entry.key === key)!; await connection.execute("INSERT INTO rail_items(rail_id,product_id,position,override_asset_id) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE override_asset_id=VALUES(override_asset_id)", [railIds.get(key), productId, coverage.selected.indexOf(url), cutoutId]); coverage.written++; }
          await connection.commit();
        } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
        report.imported++;
        console.log(JSON.stringify({ imported: report.imported, total: selected.size, productId, images: images.length }));
      } catch (error) { report.failed.push({ url, error: error instanceof Error ? error.message : "IMPORT_FAILED" }); console.log(JSON.stringify({ failed: url, error: report.failed.at(-1)?.error })); }
      await writeFile(reportFile, JSON.stringify(report, null, 2));
    }
  }
  await Promise.all([worker(), worker()]);
  // Reconcile exact selected membership in one transaction per owned source rail.
  // This also supports prioritising a newly supplied source product without position collisions.
  for (const coverage of report.perCategory) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("DELETE FROM rail_items WHERE rail_id=?", [railIds.get(coverage.key)]);
      let written = 0;
      for (const [position, url] of coverage.selected.entries()) {
        const [found] = await connection.query<RowDataPacket[]>("SELECT p.id,a.id cutout_id FROM products p JOIN assets a ON a.source_url=? AND a.provenance='SAROCHI_CUTOUT' WHERE p.source_url=? ORDER BY a.id DESC LIMIT 1", [byUrl.get(url)!.media[0].sourceUrl, url]);
        if (!found.length) continue;
        await connection.execute("INSERT INTO rail_items(rail_id,product_id,position,override_asset_id) VALUES(?,?,?,?)", [railIds.get(coverage.key), found[0].id, position, found[0].cutout_id]);
        written++;
      }
      coverage.written = written;
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }
  // Archive demo rows instead of deleting catalog records. Only real source rails go public.
  await pool.execute("UPDATE products SET status='ARCHIVED' WHERE source_type='DEMO' AND status='PUBLISHED'");
  await pool.execute("UPDATE rails r SET r.is_published=false WHERE EXISTS(SELECT 1 FROM rail_items i JOIN products p ON p.id=i.product_id WHERE i.rail_id=r.id AND p.source_type='DEMO') AND NOT EXISTS(SELECT 1 FROM rail_items i JOIN products p ON p.id=i.product_id WHERE i.rail_id=r.id AND p.source_type<>'DEMO')");
  for (const coverage of report.perCategory) if (coverage.written) await pool.execute("UPDATE rails SET is_published=true WHERE id=?", [railIds.get(coverage.key)]);
  report.state = report.failed.length ? "PARTIAL" : "DONE";
  await writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ state: report.state, imported: report.imported, failed: report.failed.length, categories: report.perCategory.length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "SAMPLE_IMPORT_FAILED"); process.exitCode = 1; }).finally(() => pool.end());
