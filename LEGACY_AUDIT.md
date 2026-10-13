# Sarochi source import audit

Source: https://sarochi.ir/ and its public category/shop/product archives. Research date: 2026-10-13. Original business observations and category hierarchy are recorded in [the source audit](docs/research/SAROCHI_SOURCE_AUDIT.md); supplied reference artwork remains internal research, not production media.

## Current persisted result

MySQL import job **5** is `REVIEW_REQUIRED`, with **400 unique product URLs**, **400 matching candidates**, **399 pending reviews** and **one previously committed product**. Thirty-six discovered category links were traversed. No customer/account/order data was collected. Staging did not publish the pending candidates.

The initial traversal made 87 archive requests. Reconciliation detected that `allproducts` redirects to the shop archive: its first-page result stated 400, but only 12 links were discovered because shop pagination was excluded. The adapter now follows `/shop/page/N/` for that observed alias. Resuming the existing job fetched its 34 pages, without re-fetching already-staged product details. The job records 121 archive requests including the repeated first page; the final shop archive has 400 distinct discovered URLs against its observed 400 count.

Category totals match discovered links where a numerical count is exposed. `vest` and `warm-jacket/warm-overcoat` each expose one product link but no verified numerical result count. Consequently `sourceTraversalComplete` remains false and inventory completeness remains **PARTIAL**. Category counts overlap and must never be summed into a global product total. Source prices and counts are observations at extraction time, not current-stock guarantees.

## Records and media

Product/variant prices, currency confidence, unknown numerical stock, source URLs, timestamps, hashes and review flags are persisted in candidates. Source category names and observed parent relationships are checkpointed in job metadata. Existing catalog categories and product families require explicit review/mapping; no inferred family relationship is silently approved.

The previously reviewed catalog product has five variants with unknown numerical stock. Its four source images now have locally persisted, checksummed originals and optimized WebP derivatives. Their camera angles remain `UNKNOWN` / `UNVERIFIED`; none is advertised as an authentic back. New approved commits use the same bounded persistent media pipeline. The other 399 staged candidates have gallery references, not downloaded or published media yet.

Publication requires review of real category mappings, source anomalies, original media/angles and product drafts. Missing prices/stock/back photography must remain explicitly unknown. No bulk approval, paid image generation, real checkout or payment occurred.

## Reproduce and continue

Run `pnpm import:reconcile 5` for the current SQL reconciliation. The same protected report is available at `/api/v1/admin/imports/5/report` and linked from `/admin/import`. It reports candidates, persisted products, unknown stock/prices, local versus external media, verified front/back gaps, and per-category count discrepancies.

An independently provisioned owner should review the pending candidates at `/admin/import`, approve real category/class mappings, commit selected drafts, inspect original front photographs and publish intentionally. Reconcile again after those commits. Do not blindly crawl all products again or claim that staged records equal a complete public catalog.
