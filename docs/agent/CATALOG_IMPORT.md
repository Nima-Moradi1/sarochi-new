# Legacy SAROCHI catalog importer contract

**Website:** `https://sarochi.ir/`. This owner-provided legacy WordPress/WooCommerce-looking site is the **source of catalog truth at extraction time**, not the new visual direction. Detailed audited category tree, sample products, URL evidence and freshness warnings: `docs/research/SAROCHI_SOURCE_AUDIT.md`.

## Access ladder (do not invent credentials)

1. **Preferred**: authorized WooCommerce CSV product export from admin, with categorized media export; or official owner-approved REST API access. Verify scope/read-only. Never require secrets for the main app to run; import credentials optional at *import time*.
2. **If actually available/permitted:** public WooCommerce Store API with pagination and appropriate response semantics. Do not assume `wp-json` exists just because the site looks like WooCommerce; the current environment could not verify it.
3. **Fallback:** polite HTML parser using public category pages, canonical product links, product cards and per-product source pages, structured JSON-LD if present, exact `data-product_variations` where accessible, and image galleries. Check terms/robots as needed. Rate limit e.g. 0.5–1 request/s with bounded concurrency 1–2, explicit retry-after/backoff, abort on repeated blocks. Avoid collecting customer data, account sessions or orders.
4. If unavailable, document specific `BLOCKED` and request export. Never bypass CAPTCHAs, anti-bot, logins, paid API access or fabricate missing records.

## Steps and idempotent data flow

```
SOURCE (export/API/HTML)
 -> Discovery (category tree + next pages + unique product URLs)
 -> Read (product detail, all variants and available gallery)
 -> Normalize (Persian slugs, pricing denominations, parent/child, product family)
 -> Validate (Zod & invariants, media angle/provenance, duplicate detection)
 -> Stage (raw source evidence sanitized, imported candidates, report)
 -> Owner/admin review of conflicts and inferred family groups
 -> Commit (transaction-batched upsert by stable source ID or canonical URL)
 -> Reconcile (counts, images, variants and prices by source/category)
 -> Publish (create/update rails; revalidate cache; mark partial vs complete)
```

**No frontend fixture JSON as catalog.** JSON/parquet/CSV intermediary only for audited ingestion staged to MySQL. Ensure React pages read repository DTOs from DB. Import adapter interface:

```ts
interface LegacyCatalogSource {
  discoverCategories(): AsyncIterable<ExternalCategory>;
  listProducts(input: { categoryKey?: string; cursor?: string }): AsyncIterable<ExternalProductRef>;
  getProduct(ref: ExternalProductRef): Promise<ExternalProductDetail>;
  listMedia(detail: ExternalProductDetail): Promise<ExternalMediaRef[]>;
  getBrand(): Promise<ExternalBrandInfo>;
}
```

## Source field mapping and confidence

| Source data | Target | Validation/notes |
|---|---|---|
| Woo ID/canonical product URL | `products.source_id`,`source_url` | unique within source; slug may change; record redirects |
| category breadcrumb/menu | `categories` + join | nested hierarchy, aliases and case-normalization |
| title and text | localized product fields | sanitize HTML, don't overwrite curated admin changes without review |
| listed current/struck through price | `sale_price_toman`/`regular_price_toman` with observation | integer TOMAN; explicit currency, collect time, price confidence |
| size options | `sizes`+`product_variants` | do not assume size presence means in stock, numeric suit sizes supported |
| color property or separate color-named product | `colors`, `product_families`, variants | map only verified relationships, flag possible grouping |
| original gallery | `assets`,`product_media` | FRONT/BACK/SIDE/DETAIL/LIFESTYLE/UNKNOWN + verified provenance, remote image downloaded only when permitted |
| available qty | `stock_qty` | absent → NULL/UNKNOWN, never fake positive stock |
| care/size guide/returns | structured care + `size_guides` + CMS policy | preserve source and review for legal promise |
| tags/collections | `collections` | distinguish collection from category |

## Sample automated commands and state machine

```
pnpm import:sarochi --dry-run --pages=all
pnpm import:sarochi --commit --reviewed
pnpm import:sarochi --resume=<import-job-id>
pnpm import:sarochi --reconcile
```

Job states: `CREATED → DISCOVERING → STAGING → REVIEW_REQUIRED → COMMITTING → RECONCILING → COMPLETE` or `PARTIAL`, `FAILED`, `BLOCKED`. Persist page cursor, attempt counts, retryable failures, timestamp, source version/hash and duplicate IDs. Never re-run destructive replace automatically. Preserve override precedence `admin_approved > imported` except explicitly approved bulk update. Separate dry-run from writes; check version conflict before committing.

## Report requirements (exposed in admin/import and CLI)

```
job_id:
started_at, ended_at:
source_kind: CSV | REST | STORE_API | HTML
category_tree_count:
source_product_count: VERIFIED | UNKNOWN
unique_product_urls_seen:
products_fetched, staged, approved, written, skipped, failed:
variant_count, media_downloaded, missing_front, missing_back:
price_currency_conflicts, stock_unknown, possible_duplicates:
per_category: [{slug, observed_count, discovered_count, written_count, source_timestamp}]
pages_visited, retries, next_cursor, validation_errors:
completeness_status: COMPLETE_VERIFIED | PARTIAL | UNKNOWN
manual_review_items: [ids]
```

At audit time, shop old snapshot 267 was stale; category page snapshots 43 knits, 59 tees, 61 shirts, 57 jackets. **Do not use them as automatic expected authoritative totals**. If live site revisions differ, log evidence. Missing rear image is *not* an import failure when original source lacks it, but front must exist to publish the product visually; show `BACK_UNVERIFIED` to admin and a labeled conceptual view to consumer if produced.

## Media processing (zero paid AI)

- For each imported image: validate actual bytes and license, hash/size, persist original unchanged. Derive optimized WebP/AVIF thumbnails and transparent cutout ONLY with owner's authorization and locally available nonpaid image-processing pipeline (e.g. Python/Pillow, manual mask, optional legally licensed local segmentation package). No remote paid key.
- **Do not fabricate unseen rear print, pockets, stitching or logos.** If using a procedural SVG/illustrated approximate rear silhouette, visibly badge `تصویر مفهومی پشت لباس` and set DB angle `CONCEPT` not `BACK`. Product page can honestly say `تصویر پشت این محصول در دسترس نیست` and offer alternative detail photos.
- Even original source galleries with 4 thumbnails do not prove 4 camera angles; inspect and tag correctly.
- Production media must persist beyond app container redeploy (durable volume/object storage). Not globally write into `public/` or `.next` at runtime.

## Admin review and failure mode test suite

- Conflict: older import with stale price must not overwrite newer approved observation. Price anomaly flag; no checkout of unverifiable price/stock.
- Duplicate: same product reachable via archive and search must not double count.
- Network: 429/503 or connection reset mid-import resumes from exact cursor without duplicate records.
- Query: category with 5 pages fetches all pages, not first 12.
- Color: several differently named products are not automatically variations unless business logic + reviewer approve.
- Unverified rear: always labeled and transparent to shopper.
- Secure: no SSRF to local IP/file schemes, strict host allowlist (`sarochi.ir` and approved media host), max redirects/image bytes; prevent malicious HTML injection.
- Price parse: Persian/English digits, thousands separators, spacing and Toman/Rial recognized; no floating point or guessed conversion.

## Completion criterion

Only mark `P2-T04 DONE` after importer truly runs on a permitted source, SQL shows correct persisted catalog, source reconciliation is documented, stage statuses audited, at least one admin edit survives reimport, and public site reads those MySQL rows. If owner export/API is blocked, mark `PARTIAL` not `DONE` and record the reproducible next action in HANDOFF.
