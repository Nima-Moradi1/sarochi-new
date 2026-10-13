# SAROCHI / THE LIVING ATELIER — CODEX BOOTSTRAP

**Give this entire folder to Codex at the root of its repository.** This is an implementation-specification-and-reference bundle, NOT a prebuilt app. App must be coded and validated end-to-end.

## First prompt to Codex (copy verbatim)

> Implement the SAROCHI full-stack MVP according to `SAROCHI_CODEX_MASTER_SPEC.md` and root `AGENTS.md`. Read `docs/agent/START_HERE.md`, `HANDOFF.md` and `docs/agent/TASKS.md` first. Study the owner video at `references/video/interaction-reference.mp4` and old-site screenshots only as source facts; website `https://sarochi.ir/` is existing brand/data source, not design. Build real database-backed Next.js + MySQL, the Living Atelier animated rack, mobile gestures, genuine browser 3D styling room and secure admin. No paid AI APIs. Implement tasks sequentially and keep a runnable vertical slice. On EVERY task start/finish/pause/failure immediately update BOTH `HANDOFF.md` and `docs/agent/TASKS.md`; never fake test results or full catalog import. Optimize token usage by reading only current-session agent docs and relevant files. Begin P0-T01 now and keep going through MVP phases as possible; do not merely write another plan.

## Main deliverables in this bundle

- `SAROCHI_CODEX_MASTER_SPEC.md` — complete detailed implementation plan, including video analysis, modules, DB, API, animation and acceptance criteria (English for Codex precision).
- `AGENTS.md` — permanently binding repo-wide engineering/context rules.
- `HANDOFF.md` — current state and exact continuation point, initially **NOT STARTED**.
- `docs/agent/START_HERE.md`, `TASKS.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `MOTION_CONTRACT.md`, `CATALOG_IMPORT.md` — compact targeted session guides.
- `docs/research/SAROCHI_SOURCE_AUDIT.md` — catalog/category findings from public legacy site and original page links; explicit uncertainty where full import not yet completed.
- `references/video/` — actual owner reference MP4 + contact sheet + key frames.
- `references/legacy-screenshots/` — 5 owner screenshots only for category/filter/detail reference (NOT new UI).

## Realistic limits for prototype

- No external paid AI inference/token/API required. A stylized procedural avatar can be genuinely three-dimensional, but **not a photographic accurate garment fit**. Unseen rear images cannot be accurately recovered from front-only photography: concept back must be explicitly labeled.
- MySQL local via Docker Compose can be free to develop; Liara production hosting, MySQL and durable media storage **may carry charges**.
- Current bundle includes researched public categories/product examples, **NOT all live Sarochi catalog images or products**; importer/owner export reconciliation is a required implementation task. Old and recent prices differ, so source-time verification is essential.
- Avoid claiming pixel-perfect recreation of video until the implemented prototype is filmed and tested against reference frames; aim close observation-backed behavior.
