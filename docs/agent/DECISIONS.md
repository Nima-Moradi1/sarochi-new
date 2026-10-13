# Architectural decision register (brief, append only when changed)

- **ADR-001 / 2026-10-13 / APPROVED:** One Next.js App Router Node deployment; use separate MySQL managed service only. Why: user's full-stack one-server requirement and Liara compatibility. No parallel Express backend.
- **ADR-002 / APPROVED:** MySQL 8 + Drizzle ORM with `mysql2`; authoritative catalog DB, server-only repos and typed DTOs. Why: admin-editability, proper relational integrity and user requirement. Never client JSON catalog.
- **ADR-003 / APPROVED:** video-accurate rail is DOM/SVG + Motion (2.5D perspective); R3F/Three.js for dedicated true 3D character scene. Why: sharp catalog images, accessibility and mobile GPU performance.
- **ADR-004 / APPROVED:** Sarochi brand retained; existing shop screenshots only for data/UI field identification, not visual reproduction. Creative direction: The Living Atelier.
- **ADR-005 / APPROVED:** No paid AI; procedural 3D avatars and garments, no visitor uploaded images; descriptive badge clarifies visualization approximates styling not exact fit.
- **ADR-006 / APPROVED:** Imported product media must carry original/derived/procedural provenance. Do not fake missing back as authentic; labeled concept rear optional.
- **ADR-007 / APPROVED:** Prefer authorized data export/WooCommerce API, fallback rate-limited allowed HTML scrape; dry-run staging + review + idempotent import. Never assume observed stale price/count as real-time.
- **ADR-008 / APPROVED:** Persian RTL primary, women's product categories data-driven **but no synthetic women's inventory** because current source audited as menswear.
- **ADR-009 / APPROVED:** Repo root `AGENTS.md` controls sessions. Task/handoff updated at each state transition; bounded cold-start document access minimizes token spending.
- **ADR-010 / APPROVED:** HeroUI v3 for controls, Tailwind v4 for tokens/layout; `globals.css` only bare app globals. Workhorse rack graphics may use a tiny scoped CSS module.
- **ADR-011 / APPROVED:** Cart may be functional in local MVP; checkout must explicitly remain demo, no fake confirmation or real payment/OTP APIs.
- **ADR-012 / 2026-10-13 / APPROVED:** Owner image uploads use a separately mounted durable directory, canonical SHA-256 WebP names, a controlled public route, and MySQL metadata/audit. Original bytes remain private and unchanged; metadata is stripped from public WebP derivatives. Local Docker needs a named volume at `/data/sarochi-media`; Liara must provide a persistent volume or an object-storage adapter before enabling uploads. Why: app container layers are ephemeral, and source URLs alone do not support owner-supplied authentic backs.

## Adding new decisions
`ADR-0XX / date / APPROVED|PROPOSED|SUPERSEDED: problem → chosen option → rationale → rejected alternative → files impacted.` Update only when a real decision affects another session; avoid speculative choices.
- **ADR-013 / 2026-10-13 / APPROVED:** Bounded brand settings in MySQL own identity, typography, themes and presentational avatar presets; variant styling mappings have an FK-backed table and conceptual-only fidelity. No runtime merchandising fixture or exact-fit claim.
- **ADR-014 / 2026-10-13 / APPROVED:** Login and expensive upload counters use atomic MySQL transactions, hashed keys and expiry, replacing process-only throttling; mutation body limits count streamed bytes even without Content-Length.
- **ADR-015 / 2026-10-13 / APPROVED:** Publish implementation/docs to the existing public GitHub repository; keep reference binaries local because redistribution rights are unrecorded. Secrets, local DB/runtime media and QA artifacts are excluded.
