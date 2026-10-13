# HANDOFF - SAROCHI / The Living Atelier

**Last updated:** 2026-10-13T15:24:24.497Z
**Current task:** PUB-T01 / IN_PROGRESS
**Project state:** Implemented full-stack MVP; source review and production deployment remain separate gates.

## Current objective

Publish the current code in at least 50 professional feature-based commits on a dedicated GitHub branch. Existing public repository: Nima-Moradi1/sarochi-new. First action: review commit groups and secret/provenance exclusions; commit, push, verify remote SHA, then record publication result. Expected files: all approved source/config/docs and HANDOFF.md/TASKS.md. Reference binaries, .env, QA scripts, screenshots, DB contents and uploaded media stay local.

## Implemented

- One Next.js 16.4 / React 19.3 / strict TypeScript application, Persian RTL/Vazirmatn, Tailwind v4/HeroUI v3; Node 22 Docker target. Server-only services/repositories, MySQL/Drizzle authoritative records.
- 26 domain tables, migrations 0000-0007; current local catalog: 24 labeled demo products plus one previously reviewed Sarochi product, four seeded rails. No invented demo prices or stock.
- Hierarchical category breadcrumbs/rail grouping; pointer/touch rack, wheel-X, keyboard, reduced motion, isolation/Escape/focus return, verified front/back gate and labeled conceptual fallback. Central motion durations/springs.
- Real product detail/gallery/variant URL, care and size guides, shop text/category/color/size/price/stock/sale filters and stable newest/price cursor sorting. Demo cart requotes actual DB stock/price and never creates orders/payments.
- Argon2 admin, revocable hashed-token sessions, RBAC/origin guards and bounded byte readers. Shared MySQL login/upload throttling survives worker/process restarts. No default owner password.
- Admin catalog/category/rail/color/size/variant/brand/family/CMS CRUD; resource-specific server paging, product search/status, owner-only searchable audit, care/size guide editor, theme/editorial rail controls.
- Owner garment/logo uploads validate signature/decode/byte/pixel limits and publication rights. Original bytes remain private; SHA-256 WebP derivatives and metadata/audit persist in an explicitly mounted directory. Public logos require verified owner-logo provenance and current brand association.
- DB brand hero/footer/contact/social/typography/themes and styling presets. Lazy R3F avatar/garment geometry, pause/resume/manual turn/orbit, offscreen pause, reduced-motion and context-loss fallback. DB variant mappings drive class/color/preset; previews remain explicitly conceptual.
- Bounded robots-aware importer, cross-job fingerprints/conflicts, exact page/offset checkpoints, per-category observed counts and URL deduplication; protected review/owner commit produces drafts, stores original source media and never silently replaces admin data. Read-only reconciliation CLI/API exposes gaps.

## Fresh verification

- pnpm db:migrate: migrations 0006/0007 applied; pnpm db:seed idempotently added missing DB presets without replacing brand choices.
- pnpm lint, pnpm typecheck, pnpm test:unit: PASS (31 tests); focused adapter tests/typecheck also passed after the shop-alias correction.
- pnpm build: PASS, all application routes dynamic and standalone output generated. No repeated Docker build in this session; Docker CLI unavailable in current shell.
- Existing Playwright: 2 API + 4 desktop/mobile tests PASS. Additional 1440/390 admin guides/style screenshots inspected; actual WebGL mesh, pause/turn, no horizontal overflow or page errors. Supplementary production UI: mouse drag, CDP touch swipe, wheel-X, ghost-click suppression and context-loss fallback PASS.
- Live MySQL/API: brand/CMS/guide/preset/theme save-to-public, original upload retention/metadata edit/413 bound, logo/public footer/font refresh, editor logo refusal, audit search/resource paging, persistent login 5-attempt throttle PASS. Catalog sorting traversed all 25 published rows without duplicates; unknown stock excluded from in-stock filter.
- Variant mapping save/read/delete, DB-to-RSC, invalid input, 401/403/404/413 and audit PASS. All QA users disabled, sessions revoked; temporary brand/guide/mapping/media fixtures restored/removed.
- Previously external four images on reviewed product 25 now stored and checksummed locally; angles remain UNKNOWN/UNVERIFIED.

## Source import gate

- Job 5 is REVIEW_REQUIRED/PARTIAL: 400 unique source URLs fetched/matched, 399 staged pending review, 1 unchanged/previously committed, 36 categories.
- 121 archive fetches include the corrective 34-page shop traversal. allproducts redirects to /shop/: 400 discovered equals its observed 400 total. Two single-item categories (vest and warm-overcoat) expose no verifiable count; sourceTraversalComplete remains false. See LEGACY_AUDIT.md and docs/agent/ACCEPTANCE_REPORT.md.
- No bulk approval/publish occurred. Numerical source stock remains unknown. Owner must map real categories, review conflicts/data/angles, approve and commit drafts before public catalog release. Do not re-fetch all 400 products blindly; use pnpm import:reconcile 5 first.

## Next exact action

Finish PUB-T01 push/remote verification. Then open /admin/import with an independently provisioned owner, review job 5 and verified front images; run pnpm import:reconcile 5 after approved commits. Production requires Liara/MySQL origin/credentials and persistent MEDIA_STORAGE_DIR volume, migration release step and a rebuilt Docker image/runtime check. Payments remain intentionally demo.
