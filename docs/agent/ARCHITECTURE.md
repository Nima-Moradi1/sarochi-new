# Architecture quick reference — implement, don't merely describe

## Execution boundaries

```
Browser (Persian RTL)
  ├─ App Router server pages/layouts and SEO         ──> Server-only read services
  ├─ Rack feature client island (Motion/DOM SVG)    ──> typed RSC DTO / fetch public API
  ├─ Admin client form widgets (HeroUI)              ──> protected Next route handlers
  └─ Lazy 3D room client island (R3F/Three)          ──> selected product/asset DTO
Next.js Node server (ONE app / ONE deployable)
  ├─ routes: Zod validate + auth + response
  ├─ services: business rules, permissions, import orchestration
  ├─ repos: Drizzle MySQL reads/writes
  ├─ media adapter: local dev / durable object storage production
  └─ background CLI scripts: import dry-run/commit within same repo
MySQL 8 (separate DB infrastructure, NOT another backend application)
```

## Suggested folder map (adopt coherent differences if existing app discovered)

```
src/
  app/[locale]/(store)/ page.tsx, shop/, product/[slug]/, rail/[slug]/, style/[slug]/, cart/
  app/[locale]/(admin)/admin/ products/, rails/, categories/, import/, settings/, audit/
  app/api/v1/catalog/{categories,products,rails,filters,search}/...
  app/api/v1/admin/{products,categories,rails,media,import,brand}/...
  app/api/health/route.ts
  features/atelier/{components,hooks,motion,state}/
  features/catalog/{components,api,server,schemas,types}/
  features/product/{components,server,schemas}/
  features/styling-room/{components,scene,assets,geometry,hooks}/
  features/cart/{components,server}/
  features/admin/{components,server,schemas}/
  features/import/{adapters,parser,normalizers,server,schemas}/
  components/ui/                  # small app abstractions around HeroUI
  design-system/{tokens,motion,typography,theme}.ts
  lib/{db,auth,cache,storage,security,i18n,errors}/
  db/{schema,migrations,seed}/
scripts/{import-sarochi,asset-audit,reconcile-import}.ts
public/{brand,demo-models,fonts}/
tests/{unit,integration,e2e,visual}/
```

No speculative 1-component-per-file explosion; boundaries matter more than folder count. Each feature exports stable public entrypoints. `server-only` guard where appropriate. User inputs validated on **server**, not just form. Never share Drizzle entities directly with client (serialized DTOs only).

## MySQL relational schema — normalized baseline

| Entity | Core fields / constraints |
|---|---|
| `brands` | `id,code,name_fa,name_en,logo_asset_id,settings_json,updated_at` |
| `cms_pages` | `id,slug,locale,title,body,visibility,updated_at`; stores public policy/help content |
| `categories` | `id,parent_id NULL,slug,name_fa,name_en,audience,sort_order,is_published,external_source_id` |
| `collections` | editorial groups/tags/season labels; categories and curated collections distinct |
| `products` | `id,slug,name_fa,description,garment_class,gender_audience,status,source_id,source_url,updated_at`; unique canonical slug/source identity |
| `product_categories` | join PK `(product_id,category_id)` |
| `product_families` | optional shared style model used to group legacy per-color listings only after review |
| `product_variants` | `id,product_id,sku,color_id,size_id,regular_price_toman,sale_price_toman,stock_qty NULL,stock_status,updated_at`; unique SKU if known, no floating prices, represent unknown stock separately |
| `colors` | `id,name_fa,slug,hex NULL,sort_order`; audited mapping of aliases, don't infer color truth from photo alone |
| `sizes` | `id,label,system,sort_order`; letter and numeric |
| `assets` | `id,path_or_url,mime,sha256,width,height,license,source_url,provenance,verification_status,created_at` |
| `product_media` | `id,product_id,variant_id NULL,asset_id,view_angle,sort_order,is_primary,confidence`; angle enum FRONT/BACK/SIDE/DETAIL/LIFESTYLE/UNKNOWN/CONCEPT; never pretend unknown means back |
| `rails` | `id,slug,title_fa,category_id NULL,collection_id NULL,editorial_copy,theme_id,order,published`; enable arbitrary admin-configured racks |
| `rail_items` | `rail_id,product_id,position,override_asset_id NULL`; uniqueness rail+product and rail+position |
| `size_guides` / `size_measurements` | guide applies by category/product, actual source measurement fields and tolerance |
| `cart_sessions` / `cart_items` | guest cookie token hashed/signed server side; variant id, qty, last validated quote; no paid order |
| `users` / `sessions` / `roles` | protected admin / salted Argon2 password / revocable sessions, unique email |
| `audit_events` | actor, entity, action, sanitized diff, timestamp; no secrets/PII dumps |
| `import_jobs` / `import_candidates` | state, page cursor, source ID/URL, hash, review flags, conflict records, counters and failures |
| `source_observations` | provenance for prices/stock and source crawl timestamp, confidence and last approved time |

Use MySQL transactions, foreign keys and indexes for publish / category filter / variant lookup / rail order / source identity; never trust numeric legacy variation IDs without checking. No deletions on transient import failure. `NULL stock_qty` means unknown, **not unlimited**. Store monetary values with denomination (TOMAN), avoid accidental rial conversion. Validate sale <= regular when both present. Product availability constraints handled at variant level.

## Contracts (server → UI)

**Public:**
- `GET /api/v1/catalog/rails?audience=MEN&category=...&cursor=...`: `rails[]` and ordered `items[]` with id/slug/media summaries, variant minimum price and availability.
- `GET /api/v1/catalog/products?category=...&color=...&size=...&minPrice=...&maxPrice=...&sort=...&cursor=...`: cursor paginated typed `ProductCardDTO[]`, accurate filter aggregations.
- `GET /api/v1/catalog/products/:slug`: `ProductDetailDTO` including `selectedVariantId, variants, colorOptions, sizeOptions, media {angle, sourceClass}, sizeGuide, price, stockStatus, policyRefs, related`.
- `GET /api/v1/catalog/categories` nested tree; `GET /api/v1/catalog/filters` source-driven facets; `GET /api/health` status (no sensitive env output).

**Mutation:**
- Admin route handlers protected with role checks/CSRF/origin validation and Zod; provide PATCH/POST/DELETE for categories, rails/order, brand, products/variants/media, CMS and import reviews. Return structured `fieldErrors`, `traceId`, `status`, NOT raw stack traces. Revalidate affected tags/routes on publish.
- Cart guest session endpoints with validated variant/stock and idempotent updates. `POST /api/v1/cart/items`; `PATCH /api/v1/cart/items/:id`; `DELETE`; checkout intentionally demo.

**Sample TypeScript DTO shape — illustrative types, NOT a fixture:**

```ts
export type ProductVisual = { id: string; url: string; angle: 'FRONT'|'BACK'|'SIDE'|'DETAIL'|'UNKNOWN'|'CONCEPT'; isOriginal: boolean; altFa: string };
export type VariantDTO = { id: string; colorId: string; sizeId: string; regularPriceToman: number | null; salePriceToman: number | null; stock: 'IN_STOCK'|'OUT_OF_STOCK'|'UNKNOWN'; media: ProductVisual[] };
export type RailItemDTO = { productId: string; slug: string; nameFa: string; garmentClass: string; featuredVisual: ProductVisual; variants: VariantDTO[]; position: number };
```

## Security & caching

- Privileged admin auth is essential even for MVP. Avoid hardcoded credentials, personal info, leaked error stacks. Validate ALL writes in server services, use same DB route privileges on client navigation.
- Public GET can be cached with revalidation; admin mutations need explicit invalidation / `revalidateTag` and `revalidatePath` version-appropriately. Do not cache admin sessions with public product HTML accidentally.
- Protect uploads with byte signature checks, size caps, filename sanitization and content-type allowlist. Original asset storage metadata & provenance DB.
- Missing asset = graceful fallbacks; error boundary; middleware should not block all public routes on DB outage. Form save state must reflect actual DB acknowledgement.

## Deployment

Docker multi-stage, `next.config` standalone, Node 22, pnpm pinned, nonroot, `HOSTNAME=0.0.0.0`, `PORT=3000`, health/readiness. Drizzle migrations as explicit release step, not every web request. MySQL credentials via env secrets, pooled connections and proper timezone; Liara private MySQL network only when configured. Image asset storage adapter supports local dev then durable bucket/volume in production; container filesystem is usually ephemeral. All app logic deploys as **ONE Next.js service**; MySQL and optional durable storage are paid/managed infrastructure possibilities. No AI tokens.

## Tests by boundary

Repositories → MySQL integration; validators/price logic → unit; authenticated writes → API integration; media fallback/3D mapping → isolated unit + visual; desktop/mobile rack and admin save→public reload → Playwright. Do not mark true 3D implemented based on a flat canvas poster.
Current concrete additions: owner logo POST /api/v1/admin/brands/:id/logo; authenticated guide GET/POST/PATCH/DELETE /api/v1/admin/guides; owner audit GET /api/v1/admin/audit; EDIT variant mapping PUT/DELETE /api/v1/admin/products/:id/variants/:variantId/styling; READ job report GET /api/v1/admin/imports/:id/report. Variant mappings FK to variants; presentation presets/identity use bounded brand JSON settings. Shared security_rate_limits counters are transactional. Public media serves linked published product files or verified currently associated owner brand logos; draft media is private to authenticated admins.

Owner correction: `RailItemDTO.cutoutUrl` derives from `rail_items.override_asset_id`, separate from unchanged product galleries. `SAROCHI_CUTOUT` public media requires a published rail linked to a published product. Storage primitives are Node-only `src/lib/storage`; admin entry remains server-only. `ProductDetailDTO.media.isPrimary` permits explicitly reviewed full-body source photographs in `SourceStyleRoom`. The public style route no longer loads the procedural R3F inspector. Sample/download/HTML caches are private runtime storage, never client fixtures or committed photos. Actual missing source care/size guides are enriched transactionally with provenance, leaving existing owner guides/content intact.
