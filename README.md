# SAROCHI — The Living Atelier

A single Next.js App Router application for the Persian RTL Sarochi storefront, admin catalog, importer review, demo cart and conceptual WebGL styling room. Product, price, stock, media and CMS records are read from MySQL. Reference video and screenshots under `references/` are research material, not storefront media.

## Run locally

Requires Node 22+, pnpm 11, Docker Desktop and MySQL 8.4. From the repository root:

1. `pnpm install`
2. Copy `.env.example` to `.env`. Set different random MySQL root and app passwords; make `DATABASE_URL` use the app password. Set `APP_ORIGIN=http://localhost:3000` for local admin writes.
3. Start Docker Desktop, then `docker compose up -d mysql`.
4. `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:check`.
5. `pnpm dev`, then open `http://localhost:3000`.

`pnpm db:seed` inserts four rails and 24 clearly marked demo products. It does not invent product photos, prices or numerical stock. To verify persistence, run `docker compose restart mysql` followed by `pnpm db:check`. Do not run the seed against a production catalog without reviewing its demo content.

Create the first owner only after the migration succeeds. Set `SAROCHI_ADMIN_EMAIL` and a unique `SAROCHI_ADMIN_PASSWORD` of at least 12 characters in the current process environment, then run `pnpm admin:create`. The script does not have a default password and does not print the supplied password or hash. Remove those process variables after provisioning. Admin login is at `/admin/login`.

## Import and review

- `pnpm import:sarochi --dry-run --category=t-shirt --pages=1 --products=1` fetches public Sarochi HTML and writes nothing.
- `pnpm import:sarochi --stage --category=t-shirt --pages=1 --products=1` stores versioned candidates and a resumable cursor in MySQL. It does not publish products.
- If staging stops with a `BLOCKED` job, use `pnpm import:sarochi --stage --resume=<job-id>`. The original job limits and category set are reused.
- `pnpm import:reconcile <job-id>` reads SQL coverage, review, catalog and media counts without fetching source pages. The protected admin report is linked from the import screen.
- At `/admin/import`, an editor maps a candidate to existing categories and a garment class, records a review note, and approves or rejects it. Conflicts require an owner. An owner commits an approved candidate to a **draft** product. Review its category, price, media and variants in `/admin` before publishing it.

Imported numerical stock stays unknown; gallery angles stay unverified. A real back view must be inspected and tagged before it is represented as such. Reimport never silently overwrites an existing product. Import coverage is `PARTIAL` until source counts and persisted results are reconciled. Current source access and limitations are recorded in [`docs/agent/CATALOG_IMPORT.md`](docs/agent/CATALOG_IMPORT.md) and [`HANDOFF.md`](HANDOFF.md).

## Checks

Run `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm build`. `pnpm test:e2e:api` checks public and unauthenticated HTTP routes without a database fixture. It starts Next on port 3100 unless `E2E_BASE_URL` points at an already running server. `pnpm test:e2e:browser` needs a migrated and seeded MySQL database, Chromium installed with `pnpm exec playwright install chromium`, and `E2E_DATABASE_READY=1`. The browser suite checks the demo rack → product → styling path at desktop and mobile viewports.

## Deployment

The `Dockerfile` builds Next's standalone output and runs one Next.js server process as a non-root user. It does **not** include MySQL. Build with `docker build -t sarochi .`; connect the image to a separate persistent MySQL 8 service. Set runtime `DATABASE_URL` and `APP_ORIGIN` (the exact public HTTPS origin), and provide the platform's `PORT`. Run `pnpm db:migrate` from a trusted release environment against the target database before starting the new image. Provision the owner separately; never bake credentials or `.env` into the image. The image built locally on 2026-10-13; its health/catalog/styling routes and both API plus desktop/mobile browser E2E tests passed against a MySQL-backed container. Liara deployment and external database/storage remain unverified.

Set an absolute `MEDIA_STORAGE_DIR` before uploading owner garments/logos or committing imported media. JPEG/PNG/WebP uploads are bounded and decoded; original bytes remain in its private `originals/` directory, with checksummed WebP derivatives served through `/api/v1/media/:hash`. Runtime Docker defaults to `/data/sarochi-media`; mount a persistent volume there, with UID/GID 1001 access. Files must survive container replacement. Do not point this setting at bundled `public/` or `.next`. Uploads require the owner's publication-rights affirmation; logo delivery also checks its verified brand association.

Admin includes DB-managed brand copy/logo/theme/typography/contact/socials, styling presets, per-variant conceptual 3D mappings, searchable audit, care/size guides, catalog search/status and paged resource lists. Checkout remains a demo that creates no order or payment. Four images on the previously reviewed source product are persisted; 399 other candidates await review. Current coverage and release gates are recorded in [`LEGACY_AUDIT.md`](LEGACY_AUDIT.md), [`ACCEPTANCE_REPORT.md`](docs/agent/ACCEPTANCE_REPORT.md) and [`TASKS.md`](docs/agent/TASKS.md).
