# SAROCHI — legacy source audit (discovery evidence, 2026-10-13)

**Website:** https://sarochi.ir/ — provided by project owner. **Use old pages/screenshots ONLY for business facts, original media identification and product data. Never emulate old UI.** The site publicly presents itself as a menswear brand (`فروشگاه اینترنتی پوشاک مردانه`). The legacy logo appears as restrained Latin `SAROCHI` and footer states the store began in Persian calendar 1401. Source details may change; verify at import time.

## Verified URLs

- Home: https://sarochi.ir/
- Catalog: https://sarochi.ir/shop/
- Knit: https://sarochi.ir/product-cat/salonik-stitch/
- T-shirts: https://sarochi.ir/product-cat/t-shirt/
- Shirts: https://sarochi.ir/product-cat/shirt/
- Single blazer: https://sarochi.ir/product-cat/single-blazer/
- Pants: https://sarochi.ir/product-cat/pants/ (**public fetched result was a stale maintenance snapshot; re-test live**)
- Example detailed product: https://sarochi.ir/product/%d8%a8%d8%a7%d9%81%d8%aa-%db%8c%d9%82%d9%87-%d9%87%d9%81%d8%aa-%d8%b3%d8%a7%d8%af%d9%87-pink/

## Confirmed legacy navigation hierarchy (categories, actual source labels)

```
اکسسوری
  └─ کراوات
بافت-سلانیک
  ├─ بافت نیم زیپ
  └─ سلانیک یقه دار
پالتو
  ├─ پالتو دبل برست
  ├─ پالتو کژوال
  └─ پالتو کلاسیک
پیراهن
  ├─ پیراهن ساده
  └─ پیراهن طرح دار
تیشرت
  ├─ تی شرت یقه دار
  └─ تیشرت یقه گرد
ژیله
شکت-سافاری-جکت
  ├─ جکت
  └─ شکت
شلوار
  ├─ شلوار پارچه ای
  └─ شلوار کتان
شلوارک
کاپشن
  ├─ پافر
  ├─ سویشرت
  ├─ کاپشن اور
  ├─ کاپشن کتی
  └─ کاپشن کلاسیک
کت تک
  ├─ کت تک دبل برست
  ├─ کت تک کژوال
  └─ کت تک کلاسیک
کت و شلوار
کفش
کالکشن جدید (observed in one shop snapshot, may be collection/tag, re-check)
```

Legacy screenshots separately show `کفش`, `کت و شلوار`, `کت تک`, `کاپشن`, `شلوارک`, `شلوار`, `شکت-سافاری-جکت`, `ژیله`, `تیشرت`, `پیراهن`, `پالتو`, `بافت-سلانیک`, `اکسسوری`. Category hierarchy requires admin reclassification if live source differs. **Do not introduce unverified women's departments as actual Sarochi inventory.**

## Filter/attribute evidence

- Price range min/max, colors, sizes and sorting (popularity/rating/newest/price increasing/decreasing) are present in legacy catalog. Only preserve popularity/rating if real data supports them.
- Examples of observed colors: آبی، آبی روشن، بلو بلک، چند رنگ، بنفش، خاکی، ذغالی، زرد، سبز، سرمه‌ای، سفید، شیری، شتری، صورتی، طوسی، قرمز، قهوه‌ای، کرم، مشکی، نارنجی، نسکافه‌ای، نوک مدادی. These are **not** a single authoritative current list; import color taxonomy, de-duplicate aliases carefully.
- Letter sizing includes S, M, L, XL, XXL, XXXL. Single blazers have numeric sizing 46,48,50,52,54,56,58,60. Size availability is product/variant-specific, not universal.
- On 2026-10-13 the public category pages appeared as: knits 43 products, T-shirts 59, shirts 61, single blazers 57. A shop page last crawled ~3 months ago reported 267. **Never sum category counts into a site-wide count** (categories can overlap), and never assume a stale 267 is real current inventory. Store observed count with source/crawl timestamp.

## Human-auditable sample records (for import tests — NOT hardcoded production fixtures)

| Source category | Visible product | Price observed (Toman) | Original price (Toman) | Notes |
|---|---|---:|---:|---|
| بافت-سلانیک | بافت یقه هفت ساده Pink | 5,184,000 | 6,480,000 | Product page and category agree on this example; M/L/XL on category; image in screenshot looks red/pink — verify swatch label |
| بافت-سلانیک | بافت یقه اسکی ساده نارنجی | 5,576,000 | 6,970,000 | Later crawled category; older cached shop showed another price |
| بافت-سلانیک | بافت یقه اسکی ساده زغالی | 5,576,000 | 6,970,000 | Check source image angles |
| بافت-سلانیک | بافت یقه پنج سانت ساده خردلی | 5,576,000 | 6,970,000 | Check size stock |
| بافت-سلانیک | سلانیک یقه گرد ساده طوسی ملانژ | 5,344,000 | 6,680,000 | Available sizes must be per variant |
| بافت-سلانیک | سلانیک یقه گرد ساده مشکی | 5,344,000 | 6,680,000 | |
| تیشرت | پلوشرت جودون طرح قایق سبز | 2,576,000 | 3,680,000 | M–XXXL appears listed |
| تیشرت | پلوشرت جودون طرح قایق استخوانی | 2,576,000 | 3,680,000 | Grouping colors only after review |
| تیشرت | پلوشرت جودون طوسی | 2,436,000 | 3,480,000 | |
| پیراهن | پیراهن کلاسیک یقه نیم بک چهارخانه سفید آبی | 5,870,000 | — | |
| پیراهن | پیراهن کلاسیک یقه لانگ سرمه ای(یقه سفید) | 6,490,000 | — | |
| پیراهن | پیراهن کژوال پشمی آرنج مخمل سفید آبی | 5,890,000 | — | |
| کت تک | شکت فلانل چهار جیب سبز تیره | 12,870,000 | — | Listed under single-blazer path; trust source mapping, flag semantic mismatch for review |
| کت تک | ست اور شرت و شلوار مدل چهار جیب سبز سیج | 18,750,000 | — | Supports outfit/set product type |

**Prices are snapshot evidence, NOT current trading prices.** Store `collected_at`, page URL, confidence and price type. An older `/shop/` crawl contained `بافت یقه پنج سانت ساده خردلی` 2,490,000; another live-category crawl 5,576,000 — this is a temporal inconsistency, not a programmatic override. Approval must select newest verified source.

## Single product record study — "بافت یقه هفت ساده Pink"

Product page visibly presents:
- Product name, discount badge (20%), main media plus three more linked media slots; whether they include a **true rear photo is NOT verified**.
- Size selector, quantity, add-to-cart, category (`بافت-سلانیک`) and winter/autumn tags.
- Product main price observed 5,184,000 Toman (old 6,480,000).
- Care instructions: machine wash max 30°C low speed; ironing max 110°C; no bleach or tumble dry (verify exact text before importing CMS).
- Men's knit size chart S–XXXL with fields: chest width, shoulder, sleeve length, garment length. Example S: 51/41/61/70 cm; M: 53/43/63/70; L: 55/45/65/71; XL: 57/47/67/71; XXL: 59/49/69/72; XXXL: 61/51/71/72. Variation ±2 cm stated in source. Model as configurable size guide, not code constants.
- 7-day exchange/return terms and shipping policy text are visible on this page. Any sitewide claims need owner re-confirmation.
- SnappPay 4-installment promotion appears on old product page; **DO NOT** integrate, link or promise it in MVP without approved merchant integration; checkout remains explicit demo.

## Images / UI boundary

User-provided `references/legacy-screenshots/` contains:
1. A legacy desktop listing and navigation/price cards.
2. Category list.
3. Color facet list.
4. Size facet list.
5. Close-up product photo gallery.

They prove data fields and product photo presentation, **not new design**. A real garment rear view cannot be inferred from front by simple horizontal mirror or a pretend 360° animation. Preserve original photos; optional source media after licensing/owner authorization; transparent cutouts need quality checks.

## Public API reachability: evidence limits

- Public `/wp-json/` and `/wp-json/wc/store/v1/products?...` could NOT be verified from the current browsing tool; direct programmatic container network DNS also unavailable. **This is NOT proof that the API is universally disabled.** Codex should try authorized access from its own network environment, ideally request an owner WooCommerce export/token where needed.
- HTML product/category pages ARE discoverable with text retrieval, but complete paginated catalog + original image bytes were not batch copied into this documentation.
- `product-cat/pants` yielded an out-of-date maintenance page in one retrieved result. Revalidate, do not mark category empty/deleted.
- Importer must persist the **actual** records in MySQL and report coverage before the project can be marked fully migrated. Until then, name any visible catalog `import-in-progress` or `demo`, not “all products imported”.

## Scope provenance and provenance policy

Owner-supplied domain and screenshot/video references, audited 2026-10-13. Source site: `https://sarochi.ir/` product/category pages. Do not misrepresent this research snapshot as a live remote API export. Preserve `source_url`, `verified_on`, asset source, transformation history and owner approval. Never store customer identities or copy existing user orders during public product import.

## Implementation-session source check — 2026-10-13

- Direct Node `fetch` reached public `/robots.txt`, `/shop/` and `/product-cat/t-shirt/`. Windows `curl.exe` failed locally with a Schannel credential error; this is a client issue, not evidence of source outage.
- `robots.txt` currently disallows `/wp-admin/`, `/store/*` and `/*?*` for `User-agent: *`. The importer therefore avoids query pagination and Store API query URLs unless an authorized export/API arrangement supersedes public crawling. It uses path pagination such as `/product-cat/t-shirt/page/2/`.
- `/sitemap_index.xml` was advertised by robots but returned HTTP 404 in this check. Source discovery therefore starts at permitted public shop/category HTML paths.
- A bounded live `pnpm source:probe` run found 36 unique category links with usable labels on `/shop/`; first T-shirt page exposed 12 unique product URLs and a path cursor to page 2. These are discovery observations, **not imported or complete catalog counts**.
- `wp-json` through the browsing tool remained inaccessible. No authenticated CSV/API export was supplied, and no product/media record has been staged or imported.
- A later bounded product-detail probe parsed the first listed T-shirt as five source variation records and four original gallery URLs. These references have angle `UNKNOWN` pending review; a WooCommerce `max_qty` field is a purchase cap, so stock quantity remains NULL. The observed price was explicitly labeled Toman in the public page and is retained only as source evidence.
