# Current acceptance — owner correction

2026-10-13T16:33:00Z. Previous silhouettes, zoom-only treatment and procedural avatar were rejected. Prior passing builds/tests did not establish that those visuals fulfilled the request. This report covers the corrective implementation; full virtual dressing and production release remain **PARTIAL**.

| Boundary | Current evidence |
|---|---|
| Real source catalog | 162 distinct published source products, 36 hierarchical rails, 271 memberships. Up to 9/category; fewer where the source contains fewer. Demo products archived and demo rails unpublished. |
| Actual photographs | 636 source photo URLs downloaded, 656 gallery links. Original bytes private/unchanged, public WebP, separate edge-white cutout derivative. No AI garment/person generation. Source/inspection metadata in `docs/research/SAMPLE_MEDIA_REVIEW.json`. |
| Rack | All rest sideways; hover/held touch clears neighbor space and rotates selected hanger+garment frontal; leave/release restores side. Desktop/mobile actual interaction and screenshot proof pass. No zoom-only replacement. |
| Back view | Only inspected original front/back pairs enable flip. No fake back, absent-back control or missing-back copy. 101 original backs verified; other images conservatively classified. |
| Source details | Checked 162 / zero failures. 130 verified-centimetre size guides, 162 care guides, 3,241 measurements. Existing content preserved. Example product 102's 24 measurements / 2cm tolerance / 4 photos / 6 variants verified through public API. |
| Real human | 9 products have actual exact-product source on-model photos, with reviewed full-body primaries. Public style route uses them; no primitive canvas or generic black garment. Other products show their own galleries. This is not a completed arbitrary virtual try-on system. |
| Focused checks | Changed-file lint and strict typecheck pass; 5 existing normalizer/back tests and 4 updated desktop/mobile browser checks pass. Supplementary 1440/390 hover/touch/back/neighbor/image/person-photo checks pass. No fresh correction production build run. |

Local source reports, original images, cached HTML and screenshots are private under `.artifacts/owner-media` / `.artifacts`. MySQL is authoritative; none are runtime frontend fixtures. Existing localhost:3000 can be refreshed. Preserve its media directory and database.

## Unfinished acceptance

- **FIX-R02:** Exact garment transfer onto a complete real human for the other 153 products is unimplemented. First offline candidate and source-white-shirt/person experiment are documented in [HANDOFF.md](../../HANDOFF.md); no checkpoint installed or inference proved. An unrelated model photo, generic geometry or generated replacement cannot be counted as completion.
- **Full inventory:** 238 job-5 candidates remain PENDING_REVIEW, 161 newly COMMITTED plus one earlier unchanged product. Sample authorization does not bulk-approve the remaining catalog. Numeric stock and two category counts remain unknown; don't invent them.
- **Deployment:** No Liara deployment verified. Production MySQL, exact HTTPS origin, persistent media volume, image/runtime health and business settings remain separate gates. This session did not rebuild/deploy Docker or Next production output.
- **Checkout:** Demo only; unknown numeric stock cannot complete it. No payment/order/OTP readiness claim.

Earlier implementation/security/build evidence remains historical in [PROGRESS_LOG.md](PROGRESS_LOG.md). Current exact task/continuation is in [TASKS.md](TASKS.md) and root handoff. Corrective implementation was committed by category and pushed to the public GitHub `feature/living-atelier-mvp` branch on 2026-10-14; remote implementation SHA matched `4b1d52f` before this final documentation commit. Fresh lint/typecheck, 31 unit tests and 4 desktop/mobile browser checks PASS. Publication does not complete FIX-R02 or deployment.
