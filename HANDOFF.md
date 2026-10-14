# HANDOFF — SAROCHI / The Living Atelier

**Updated:** 2026-10-14T06:50:57Z
**Current task:** PUB-T02 / DONE: corrective implementation published in categorized commits; final documentation accompanies this publication. FIX-R02 remains PAUSED at first actual garment-transfer proof. FIX-R01 DONE.
**Publication scope:** Source/storage/import, catalog/rack/styling, browser checks, existing generated Next.js type declaration and agent docs. Ignored local media, credentials and unfinished virtual-dressing gates are preserved.
**State:** Real source sample and corrected rack work locally. Exact virtual dressing for every garment is unfinished. Previous claims that the rejected silhouettes/procedural avatar fulfilled the owner's visual requirements are superseded.

## Latest owner requirements — authoritative

1. Use original products and all available gallery photos from https://sarochi.ir/shop/, up to 9 products per real category for this sample. Keep original bytes and source provenance; no invented prices, quantities or clothing illustrations.
2. Resting hanger AND garment hang sideways. Mouse hover / held touch moves neighbors apart and rotates the selected assembly to front. Leave / release returns it sideways. A zoom-only treatment is unacceptable. Preserve swipe/drag, vertical page scroll, keyboard, reduced motion and explicit detail/isolation controls.
3. Show back only when an inspected original back photo exists. Otherwise omit the back control and missing-back explanation entirely.
4. Show a real human wearing the exact selected garment/color. The old primitive avatar and generic black replacement are rejected. Source on-model photographs are acceptable real evidence but do not implement arbitrary virtual dressing. Do not call the remaining work complete.
5. Keep task/handoff resumable, favor implementation and focused verification; no repeated broad builds.

## Actual implementation / local data

- MySQL remains authoritative. 162 distinct SAROCHI products published, 36 real hierarchical category rails, 271 memberships. 24 demo products archived and four demo rails unpublished, without deleting them.
- 23 categories contain 9 products. Source has fewer in 13 categories: کت و شلوار 8، پافر 7، سویشرت 4، ژیله 1، بافت نیم زیپ 4، سلانیک یقه دار 4، جکت 2، شلوار کتان 6، شلوارک 6، کاپشن اور 1، کاپشن کتی 5، کاپشن کلاسیک 8، کت تک دبل برست 8. No duplicate/invented filler.
- 636 distinct original photo URLs downloaded; 656 product-gallery links. Private originals unchanged, public optimized WebP, separate edge-white cutout derivative. No generated photos or source-site UI copied. Background removal only handles white connected to the border; model/editorial backgrounds are not garment segmentation.
- Inspected all 21 gallery contact sheets. Classified 153 FRONT, 101 BACK, 49 SIDE, 25 LIFESTYLE, 12 DETAIL; 316 other photos remain conservatively UNKNOWN/UNVERIFIED. Real back button requires verified front+back. Review provenance/checksums are in `docs/research/SAMPLE_MEDIA_REVIEW.json`.
- Owner's exact example is product 102: شکت فلانل چهار جیب قهوه ای; 4 original photos / 6 variants; `/products/sarochi-e027a6c64b1d5f099de2`. It is prioritized in its source rails.
- 9 products have inspected actual source human photographs: IDs 109–116 (suits), 177 (coat). Full-body original selected as primary. `/style/[slug]` now uses `SourceStyleRoom`, these exact original photographs and a MySQL photographed wardrobe. No public primitive canvas, synthetic person, arbitrary black outfit or simulated fit/color replacement. Size choice preserves variant URL but cannot change the source photographed fit.
- Numerical stock stays NULL. Source observed prices/availability retained in variants/observations. This does not enable a real checkout; the cart remains a demo and refuses unknown quantity.
- Source guide enrichment finished: checked 162 / zero failures; imported 130 actual centimetre size guides, 162 care guides and 3,241 measurements. Existing 32 products without a verified centimetre table were not given invented guides. Existing curated descriptions were preserved; no new description found in the source's standard description blocks.

## Files / reproducible commands

- `scripts/sample-sarochi.ts`: resume-safe source sample from existing job 5; `--include=<normalized.json>` can prioritize an exact requested product. Downloads only approved source hosts with robots, bounded bytes, polite concurrency, retries and a durable cache. New sample publication is explicitly authorized by the latest owner request; unrelated full-catalog approval is not implied.
- `src/lib/storage/images.ts`, `rack-cutout.ts`: unchanged private originals + public derivatives; server-only admin wrapper retained. `rail_items.override_asset_id` carries a separate cutout, exposed as `RailItemDTO.cutoutUrl`. Controlled media route authorizes published rail/product linkage; drafts remain private.
- `GarmentRack.tsx` / module: actual media, side→front assembly rotation, neighbor clearance, leave/release reset, stable hit areas, center initial placement, timestamp-based ghost-click guard. Gallery and shop have no fake garment fallback.
- `SourceStyleRoom.tsx`, `server/wardrobe.ts`, style route: real source photos only. Old `AvatarScene`/`StyleRoomClient` survive for historical/admin inspector usage; public route no longer loads them. They do not satisfy FIX-R02.
- `sarochi-product.ts`, `scripts/refresh-sample-details.ts`: source care/size extraction, resumable private HTML cache, transactional missing-only guide enrichment. Never overwrite curated guides/description/prices.
- `scripts/inspect-sample-media.ts`, `review-sample-media.ts`: contact sheets and explicit visual angle/primary review; no automatic back inference.

Current ignored `MEDIA_STORAGE_DIR` is `.artifacts/owner-media` inside this workspace. Keep this directory and local MySQL; app records depend on it. `.env` contains the absolute directory and `APP_ORIGIN=http://localhost:3000`. No credentials are recorded here. Download/guide reports live in that media directory; private QA screenshots/scripts are in `.artifacts`.

```powershell
pnpm import:sample
pnpm import:sample:details
pnpm import:sample:inspect
```

Sample and guide imports are DONE, zero failures. Reports: `.artifacts/owner-media/sample-import-report.json` and `sample-details-report.json`. Details pass exec 6231 finished; all 162 source HTML pages cached privately. No running import remains and no need to re-fetch image galleries.

## Current verification — correction only

- Focused changed-file ESLint and `pnpm typecheck`: PASS. 5 existing normalizer/back-gating checks PASS. No production build run for this correction.
- Updated existing browser checks to actual DB products/photos, removing obsolete demo/WebGL expectations: 4 desktop/mobile Playwright checks PASS against the owner's existing server via `E2E_BASE_URL=http://localhost:3000`, `E2E_DATABASE_READY=1`.
- Additional browser proof at 1440/390: mouse hover, CDP held touch/release, neighbor transforms, return to side, real back flip, source human photographs, no primitive canvas, no broken images/page errors or horizontal overflow: PASS. Inspected `.artifacts/corrected-rest-1440.png`, `corrected-front-1440.png`, `corrected-model-390.png`.
- Live detail/API confirms example 102's 24 source measurements and 2cm source tolerance (size 48: chest 47, shoulder 42, sleeve 64, length 71), original care, 4 photos/6 variants/unknown numeric stock. All 36 public rails return 1–9 real source items with cutouts. `.artifacts/verify-guides.ts`: PASS. Final targeted lint also PASS; `git diff --check`: no whitespace errors.
- Existing localhost:3000 server PID 24568 is the owner's; do not kill it. Attempting a second Next dev server hit its normal instance lock; checks used the existing server. Refresh the browser to see changes.
- Preserved and committed the pre-existing user/dev change to `next-env.d.ts` separately as `4b1d52f`.
- Publication verification, 2026-10-14: `pnpm lint`, `pnpm typecheck`, all 31 `pnpm test:unit` checks and all 4 `pnpm test:e2e:browser` checks PASS. Browser tests used `E2E_BASE_URL=http://localhost:3000`, `E2E_DATABASE_READY=1`. Unit/browser child processes required sandbox escalation after Windows `spawn EPERM`. `git diff --check` PASS. No new production build or deployment performed.

## Exact next task / unfinished acceptance

FIX-R02: real human wearing **every** selected source garment exactly. Only the 9 actually photographed products have on-model evidence today; 153 other products display their own gallery, not a dressed person. Downloading an unrelated person does not solve garment transfer. Do not re-enable procedural bodies, paint a generic shirt, paste an unrelated outfit, synthesize missing backs or claim exact fit.

Next steps: (1) inspect existing source galleries/cache for any additional genuine on-model photos, (2) evaluate a legally usable local garment-transfer/model pipeline with real human source assets, no paid key and commercial-compatible checkpoint/license, (3) demonstrate one white garment preserving its actual outline/color/details on a complete human before integrating, (4) persist provenance, per-product coverage and honest fidelity, (5) replace the admin-only obsolete approximation controls when a working replacement exists. This capability is not yet selected or implemented; it must pass that concrete first-product proof before being called done. No visitor photo upload.

First candidate researched, not installed/approved: [FASHN VTON 1.5 upstream](https://github.com/fashn-AI/fashn-vton-1.5), [weights/model card](https://huggingface.co/fashn-ai/fashn-vton-1.5), [human-parser license](https://github.com/fashn-AI/fashn-human-parser/blob/main/LICENSE). Upstream permits person+garment inputs and documents CPU fallback; model is approximately 1.94GB plus pose/parser dependencies. This generates a transfer image, not an original product photo or a guarantee of unchanged clothing/person/fit. Verify all dependent licenses and actual fidelity before use. Local machine has Intel UHD 630, no `nvidia-smi`, Python 3.13.7 and about 32GB RAM; no CUDA proof, no weights installed, no inference run. Do not silently install it into this Next.js project or introduce a second web backend. A future offline asset-generation CLI could be evaluated separately, then only reviewed derivatives stored/served through the existing app.

Precise first experiment: use full-body source human photo M159/P110 and the actual white shirt M449/P182 (original URL/hash mapping is in `sample-download-cache.json` and MySQL). The source face/hands/legs and white shirt collar/cuffs/buttons must survive the same-output visual review. If this proof fails, retain source-only photographs and explicitly keep virtual dressing incomplete. No result for this experiment currently exists.

Pause checkpoint: all source/sample/guide commands finished, no pending terminal process. Remaining task is FIX-R02.3 above, not another catalog rebuild. Committed correction paths cover source media/storage/import scripts, typed rail/detail reads, rack, gallery/shop/style, browser expectation updates and the current agent docs. First resume action: read upstream installation/runtime/dependent-license requirements, then isolate a compatible offline Python environment and attempt the single source-person/white-shirt proof before writing any product-facing transfer integration. CPU execution time and fidelity are unknown; current site already uses only authentic source pictures. Existing supplementary QA command `node .artifacts/verify-correction.cjs` and `pnpm exec tsx .artifacts/verify-guides.ts` passed. Do not report arbitrary virtual dressing as complete.

Full inventory also remains PARTIAL: job 5 has 161 newly COMMITTED candidates, 238 PENDING_REVIEW, plus the previously unchanged product 25; observed source total 400. Do not re-crawl all 400 or mass-publish the rest. Stock quantities and two single-item category totals remain unknown. Liara deployment, persistent production media, business settings and real payment remain separate gates.

## Publication history

Verified public repository https://github.com/Nima-Moradi1/sarochi-new, branch `feature/living-atelier-mvp`. Prior 69 commits ended at historical baseline `9c98355`; seven corrective commits `02d0ac5` (media), `b1e4b3c` (import/review), `a23f4a0` (catalog), `630adb8` (rack), `c330dd9` (styling), `9d0bcd0` (browser tests), `4b1d52f` (Next declarations) were pushed on 2026-10-14. `git ls-remote` matched local implementation SHA `4b1d52fda655b2ae380146c87902573c53fa21f5` before the final documentation commit. No merge, force-push or deployment. Final documentation records the corrective acceptance and continuation; earlier history is in `docs/agent/PROGRESS_LOG.md`.
