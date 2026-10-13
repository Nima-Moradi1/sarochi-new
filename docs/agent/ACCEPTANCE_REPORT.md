# Implementation acceptance and release gates

2026-10-13. Implementation is connected to MySQL; production catalog/release status is **PARTIAL**.

| Boundary | Fresh evidence |
|---|---|
| Application | Lint, strict typecheck, 31 unit checks and production standalone build passed. |
| Database | Migrations 0006/0007 applied; 26 domain tables; demo seed preserved existing owner settings and added missing DB presets. |
| Commerce | Real detail/variants/guides, stock/sale filters and stable price/newest cursors; all 25 published rows traversed without duplicates. Unknown stock cannot qualify as available or complete demo checkout. |
| Admin | Authenticated CMS/brand/guide save-to-public, owner upload/logo, original retention, metadata edits, logo role refusal, searchable audit and resource pagination passed against live MySQL. |
| Security | Byte/signature/decode/pixel limits, rights affirmation, origin/RBAC guards, 401/403/404/413 responses, shared persisted login throttling and mapping audit checks passed. |
| Styling | DB presets and per-variant class/color/preset mappings feed lazy real WebGL. Actual meshes, pause/manual turn, reduced motion, offscreen/context-loss fallback and conceptual labels are implemented. |
| Browser | Two API and four desktop/mobile E2E passed; additional 1440/390 admin/style screenshots inspected. Production mouse drag, touch swipe, wheel-X, ghost-click suppression and context-loss fallback passed. |
| Source | Job 5: 400 unique candidates, 399 pending, one committed; corrected shop alias matches observed 400 products. Two category counts remain unknown. See [LEGACY_AUDIT.md](../../LEGACY_AUDIT.md). |

All isolated QA accounts were disabled and sessions revoked. Temporary brand, CMS, guide, mapping and synthetic-media fixtures were restored/removed. Actual imported product images were retained in configured local media storage with their unverified angles.

## Remaining gates

- **Catalog review:** 399 candidates require explicit review, real category mapping, approved draft commits and inspected original front images. No invented stock, automatic grouping or fabricated backs may fill missing source data.
- **Production assets:** owner must supply authentic licensed logo/cutout/back images and approve business policies/contact information. Upload controls exist; QA images are not production assets or repository media.
- **Deployment:** configure Liara application/private MySQL, exact HTTPS `APP_ORIGIN`, and a persistent `MEDIA_STORAGE_DIR` volume owned by runtime UID 1001. Apply migrations explicitly, rebuild the Docker image and verify the target runtime/health/media persistence. Current shell lacks the Docker CLI; the latest production Next build passed, but no current Liara deployment is claimed.
- **Checkout:** deliberately a demo. No orders, payments, OTP, external payment keys or production-payment readiness are claimed.
- **Reference publication:** video, frames and screenshots stay local because public redistribution permission is not recorded. Their provenance documentation is published; `.env`, DB records, uploads, QA scripts and screenshots are excluded.

The next operational action is `pnpm import:reconcile 5`, followed by owner review in `/admin/import`. Exact commands and current task state are in [HANDOFF.md](../../HANDOFF.md).
