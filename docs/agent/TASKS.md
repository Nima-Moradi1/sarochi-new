# Task registry — single active task; persist every transition

Statuses: `TODO` / `IN_PROGRESS` / `PAUSED` / `BLOCKED` / `DONE`. Only mark DONE with completed acceptance and evidence. **Update this file AND root HANDOFF.md whenever starting, finishing, pausing, resuming or blocking ANY task.** When detailed tasks are split, create numbered child subtasks here, one at a time. No silent implementation.

| ID | Status | Task / acceptance evidence |
|---|---|---|
| P0-T01 | DONE | Empty repo and dependencies inspected; timestamp audit and executable sequence in `docs/research/REFERENCE_AUDIT.md`; Docker daemon unavailable, MP4 tooling absent, live category verified. |
| P0-T02 | DONE | Next.js 16.4.0/React 19.3.0/HeroUI 3.2.6/Tailwind 4.3.3 shell, Persian RTL font, scripts and git repo; lint/typecheck/build passed (build elevated after sandbox spawn EPERM). |
| P0-T03 | DONE | Docker Engine 29.8.2; MySQL 8.4 Compose healthy, migrations 0000–0005 applied, demo seed succeeded, `db:check` returned brand SAROCHI/24 products/4 rails before and after container restart. |
| P1-T01 | DONE | Live MySQL: homepage 200, rails API 4 rails with 6 items in first, product API returned seeded items and filters returned 4 categories. Temporary rail-title edit appeared in both API and homepage, then was restored. |
| P1-T02 | DONE | Migrations applied to MySQL 8.4; information_schema shows 25 tables (including Drizzle journal), 30 FKs. Live published product→category→variant join returns 24 products, 4 categories and 24 variants. |
| P1-T03 | DONE | Live HTTP: 4 category facets; knitwear filter returns 6 items; two 3-item cursor pages have distinct IDs; minPrice excludes unknown prices; nonexistent color is empty; demo card has null price and UNKNOWN stock. |
| P2-T01 | DONE | Rate-limited, same-host, robots-aware public HTML category/product-page discovery with bounded bytes/redirects and probe. Live probe: 36 usable category links, 12 unique T-shirt links, page-2 cursor; 6 unit tests, lint/typecheck/build pass. Authorized CSV/API still preferred if supplied; no import performed. |
| P2-T02 | DONE | Bounded live `--stage --category=t-shirt --pages=1 --products=1` wrote job 1 and one PENDING_REVIEW candidate. MySQL payload has 5 variants with null stock quantities and 4 UNKNOWN angle media; job REVIEW_REQUIRED/PARTIAL, no invented stock or verified imagery. Source observations are written at approved commit. |
| P2-T03 | DONE | Bounded dry run reports PARTIAL/zero writes; live one-product stage persisted candidate/job, protected owner review/commit created draft and observations. Repeat live stage was unchanged (no duplicate); changed version entered CONFLICT and checkpointed job resumed. Full source coverage remains P2-T04. |
| P2-T04 | BLOCKED | Job 5 staged 400 unique products across 36 categories; shop alias/count reconciliation fixed. 399 candidates need explicit review/category mapping and inspected original media; source stock and two category totals remain unknown. Reconcile before publishing; never mark inventory complete from staging. |
| P3-T01 | DONE | Editorial RTL landing and DB identity; desktop/mobile viewport proof and 4 browser E2E pass. Earlier P7-T01 covers 1440/768/390/320 composition. |
| P3-T02 | DONE | DB rails/media/hierarchy plus physical hanger stage and scoped themes; seeded desktop/mobile rack/browser proof passed. Real cutouts still depend on reviewed owner media. |
| P3-T03 | DONE | Desktop drag, CDP touch swipe, wheel-X, keyboard/reduced motion, normal vertical scroll and ghost-click suppression passed; gesture unit checks pass. |
| P3-T04 | DONE | Isolation/Escape/focus return and category reset implemented; desktop/mobile browser proof plus verified front/back gate tests pass. Actual missing backs stay labeled. |
| P4-T01 | DONE | MySQL product/variant/detail/guide path, URL filters including stock/sale and stable price cursors connected. API traversed all 25 rows without duplicates; desktop/mobile product/style E2E pass. |
| P4-T02 | DONE | Live container/MySQL: imported variant quote is STOCK_UNKNOWN and checkout blocked; temporarily priced/stocked demo variant on mobile added to cart, quantity 2 repriced, demo checkout stated no order/payment, quantity 3 blocked. Original demo DB values restored. |
| P5-T01 | DONE | Live MySQL/HTTP with random local QA accounts: missing origin 403, wrong password 401, owner login/session/imports 200, viewer commit 403, logout 204, revoked session 401. QA accounts remain active only until P5-T03 import check, then will be disabled. |
| P5-T02 | DONE | Catalog/CMS/brand/family/media CRUD, durable owner images/logo, typography/theme/footer/presets, resource paging/product search, audit, care/size CRUD and variant 3D mapping delivered. Live protected save-to-public, RBAC/upload guards, lint/typecheck/31 tests/build pass. |
| P5-T03 | DONE | Protected owner review→commit produced SAROCHI draft product 25, five null-stock variants, four UNKNOWN media and five source observations; draft detail 404. Manual admin publish made listing/detail/page 200. Repeat source unchanged; changed version CONFLICT; resume works. Four ephemeral QA accounts disabled/sessions revoked; credentials deleted. |
| P6-T01 | DONE | Actual lazy WebGL avatar inspected at 1440/390; orbit/turn/pause, DB presets, reduced motion and fallback connected; build/browser proof passed. |
| P6-T02 | DONE | DB variant class/color/preset mappings and conceptual labels connected. Live mapping-to-RSC and actual WebGL proof pass; unknowns remain neutral. |
| P6-T03 | DONE | Rack-to-room transition/reduced-motion bypass and WebGL context-loss fallback implemented; dedicated context-loss and desktop/mobile navigation checks pass. |
| P7-T01 | DONE | Inspected homepage at 1440/768/390/320, imported and demo product detail, WebGL styling room, and isolation at 1440/390/320 against reference frames. Fixed tablet hero oval, rack RTL placement/dotted studio and mobile isolation overlap. Four desktop/mobile browser E2E, lint, typecheck and production build pass. Demo silhouettes remain labeled until verified cutout media is available. |
| P7-T02 | DONE | Fresh audit, bounded request bytes/images, MySQL throttles, protected roles/origins, mapping guards, cart unknown-stock handling and import preservation verified; 31 units/2 API/4 browser/lint/typecheck/build pass. |
| P7-T03 | BLOCKED | Current standalone production build passes; prior local Docker evidence exists, but current image rebuild and Liara/private MySQL/persistent media-volume deployment need the target environment. Docker CLI unavailable in current shell. No live deployment claim. |
| P7-T04 | DONE | LEGACY_AUDIT.md and docs/agent/ACCEPTANCE_REPORT.md record actual source traversal/reconciliation, provenance, fresh checks and explicit PARTIAL/production gates. |
| PUB-T01 | DONE | Published 68 categorized implementation commits plus final handoff to public Nima-Moradi1/sarochi-new, branch feature/living-atelier-mvp. Initial push local/remote SHA 00b74ca matched; no secrets/runtime data/reference binaries, no force-push or merge. |

## NOW / next action

P2-T04 is externally gated: run pnpm import:reconcile 5, then review pending candidates and inspected original front media at /admin/import with an independently provisioned owner. P7-T03 waits for a configured Liara/MySQL/persistent media environment.

## Latest transitions

- 2026-10-13T15:24:24.497Z - P5-T02 IN_PROGRESS -> DONE: connected all remaining admin controls and public consumers; fresh checks above pass.
- 2026-10-13T15:24:24.497Z - P2-T04 -> BLOCKED: staged/reconciled 400 source URLs; explicit owner review and unknown source fields remain.
- 2026-10-13T15:24:24.497Z - P7-T04 -> DONE: final honest implementation/acceptance report.
- 2026-10-13T15:24:24.497Z - PUB-T01 -> IN_PROGRESS: professional categorized commits and GitHub branch publication authorized.

Historical transitions: [PROGRESS_LOG.md](PROGRESS_LOG.md).

- 2026-10-13T15:31:58.134Z - PUB-T01 IN_PROGRESS -> DONE: native git push accepted; git ls-remote confirms local SHA 00b74ca; GitHub connector confirms owner/public repository and branch.
