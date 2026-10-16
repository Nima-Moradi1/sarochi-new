# Task registry — current owner correction

**BRAND-T01 — DONE (2026-10-16T11:29:14+00:00):** Generic «فروشگاه پوشاک» identity, hanger logo/favicon/hero, public/admin metadata/copy, neutral legacy DB presentation text, and omitted merchant footer identity. Catalog/prices/source records and behavior untouched. Lint/typecheck/API 2/2 PASS; desktop 1440/mobile 390 visual/navigation/console/overflow checks PASS. MySQL unavailable, so real catalog/detail/modal/price runtime remains unverified; start existing DB then refresh, without re-import. See HANDOFF. FIX-R02 remains PAUSED.

Statuses: `TODO` / `IN_PROGRESS` / `PAUSED` / `BLOCKED` / `DONE`. One active task. Update this file AND root `HANDOFF.md` at every start/finish/pause/block. A passing build cannot substitute for the requested behavior.

**Current objective:** BRAND-T01 / DONE: generic clothing storefront presentation completed. Next verification requires the existing local MySQL service; next implementation remains FIX-R02.3 in HANDOFF.

## Owner correction — acceptance and exact continuation

| ID | Status | Implementation / unmet acceptance |
|---|---|---|
| FIX-R01 | DONE | Real catalog sample + authentic galleries + side-to-front rack connected and verified. Source care/size enrichment completed; evidence below. |
| FIX-R01.1 | DONE | 162 distinct SAROCHI products, 36 real categories/rails, 271 memberships; up to 9 per category, all available where fewer exist. 24 demo products archived, demo rails unpublished. Sample report DONE / zero failures. Explicit owner authorization applies to this sample. |
| FIX-R01.2 | DONE | Downloaded 636 original photo URLs; 656 gallery links. Preserve private originals, public WebP and separate non-generative cutout derivatives. All 21 contact sheets inspected; verified actual front/back/side/on-model tags stored with provenance. White garments are actual source photos, not SVG replacements. |
| FIX-R01.3 | DONE | Resting assembly sideways; hover/held touch opens adjacent gap and rotates selected garment AND hanger frontal; leave/release returns sideways. Desktop/mobile browser proof passed; stable hit areas, swipe/drag, keyboard, reduced motion, normal vertical scrolling preserved. |
| FIX-R01.4 | DONE | Actual back shown only with verified original front/back pair; missing back control and message omitted. Real gallery/detail/shop use source photos; no public fake garment fallback. |
| FIX-R01.5 | DONE | Checked 162 / zero failures: 130 actual size guides, 162 care guides, 3,241 measurements; source-unit verification, missing-only writes and private HTML cache. Live API confirms example 102's actual 24 measurements / 2cm tolerance / source care. |
| FIX-R02 | PAUSED | Every selected garment must appear exactly on a real complete human. Public geometric avatar removed; source photographed fallback exists for 9 products; transfer for the other 153 is unimplemented. First candidate research complete, runtime/weights/proof not executed. Exact source inputs and continuation in HANDOFF. |
| FIX-R02.1 | DONE | IDs 109–116 and 177 have exact-product original on-model photographs; full-body primary inspected. New public `SourceStyleRoom` and MySQL wardrobe; chosen product/variant preserved, no generic black mesh/color substitution. |
| FIX-R02.2 | DONE | All 21 source contact sheets inspected: 9 genuine on-model products identified. First candidate researched: FASHN VTON 1.5 upstream/model/license links in HANDOFF. Not installed/selected or proven; Intel UHD 630/no NVIDIA CUDA here, Python 3.13.7, ~32GB RAM. Upstream CPU fallback exists but runtime/fidelity/dependency licenses remain unverified. |
| FIX-R02.3 | TODO | Before integration, demonstrate one actual white garment on a complete realistic human preserving actual silhouette/color/details. Record original assets/license, transfer output/fidelity and limitations; never imply accurate size fit or fabricate an original photo. |
| FIX-R02.4 | TODO | Connect supported per-product/variant human imagery/transfer output, coverage state and actual controls; remove/rework obsolete admin-only procedural inspector when replacement exists. Verify white/colored garments and mobile/desktop. No visitor uploads. |

## Other outstanding boundaries

| ID | Status | Exact gate |
|---|---|---|
| P2-T04 | BLOCKED | Full source catalog is PARTIAL. Job 5: 161 newly COMMITTED + 238 PENDING_REVIEW, plus 1 prior unchanged product; 400 discovered total. This sample is published by owner request; the remaining 238 are not approved. Two single-item category totals and numerical stock remain unknown. Use `pnpm import:reconcile 5`; do not re-fetch all products blindly. |
| P6-T01 / P6-T02 / P6-T03 | PAUSED | Earlier procedural WebGL/variant mapping acceptance was rejected. Historical geometry/admin code exists but does not fulfill new real-human/exact-garment requirement. Replaced public route uses source photographs. FIX-R02 governs completion. |
| P7-T03 | BLOCKED | No Liara deployment verified; target MySQL/media persistence and production image/runtime still required. Earlier baseline build success is historical, not a fresh correction build. |
| PUB-T01 | DONE | Prior 69 categorized commits pushed to public Nima-Moradi1/sarochi-new / feature/living-atelier-mvp; historical baseline SHA 9c98355. |
| PUB-T02 | DONE | 2026-10-14: seven focused implementation/test/runtime commits pushed through 4b1d52f; remote SHA verified, final correction docs accompany publication. Public repository/branch verified. Lint, typecheck, 31 unit tests and 4 desktop/mobile browser checks PASS; no production build/deployment. |

Architecture, importer/security, admin CRUD, typed catalog/filter/detail/cart foundation have earlier implementation evidence. Per-task history is archived in [PROGRESS_LOG.md](PROGRESS_LOG.md); the rejected silhouettes/primitive avatar are not accepted deliverables. Real checkout/payment remains outside the demo.

## Fresh checks / next action

- Changed-file lint and strict typecheck PASS; 5 existing normalizer/real-back unit checks PASS.
- 4 updated existing browser checks PASS on desktop/mobile against owner's localhost:3000. Extra 1440/390 mouse/touch/neighbor/back/image/human-photo checks PASS. No repeated build.
- Exact example: `/products/sarochi-e027a6c64b1d5f099de2`, DB product 102, 4 source photos / 6 variants.
- Do not kill owner's Next dev PID 24568; refresh the current website. Preserve user `next-env.d.ts` edit and `.artifacts/owner-media`.
- Next: FIX-R02.3 first real-image experiment — source full-body M159/P110 + actual white-shirt M449/P182. Evaluate dependencies/licenses outside Next.js first; do not create a second backend or quietly present generated output as original/exact. No weights installed or inference run yet. Exact next steps and evidence paths are in HANDOFF.

## Latest transitions

- 2026-10-14T06:43:37Z — PUB-T02 IN_PROGRESS: review existing corrections and remote state; categorize, verify, commit and push at owner request. FIX-R02 remains paused.
- 2026-10-14T06:50:57Z — PUB-T02 DONE: seven correction commits pushed and remote implementation SHA verified; final agent docs preserve acceptance boundaries and next FIX-R02.3 experiment. Fresh lint/typecheck/unit/browser checks PASS.
- 2026-10-13T15:53:58.843Z — FIX-R01 IN_PROGRESS: owner rejected previous visual implementation; actual source sample and reference choreography required.
- 2026-10-13T16:26:00Z — FIX-R01.1–4 DONE: source download/import and rack/back behavior verified. FIX-R01.5 IN_PROGRESS. FIX-R02.1 DONE: exact source photos for 9 products; remaining virtual dressing unimplemented.
- 2026-10-13T16:33:00Z — FIX-R01.5 and FIX-R01 DONE: actual source guide API proof and final counts recorded. FIX-R02 IN_PROGRESS; FIX-R02.2 researched, first white-garment inference proof remains FIX-R02.3.
- 2026-10-13T16:36:00Z — FIX-R02 PAUSED at FIX-R02.3: current source-only website verified; no actual transfer output/runtime exists yet. Resume from the isolated single-white-garment experiment; no pending import or browser command.
