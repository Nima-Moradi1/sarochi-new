# AGENTS.md — permanent repository-wide instructions for Codex

**Applies to ALL directories and every session in this project.** No code/task may bypass this file. If a deeper `AGENTS.md` is later created, it may clarify local patterns but MUST NOT relax these rules. Project: **SAROCHI — The Living Atelier**, a motion-heavy Next.js/TypeScript/Persian full-stack e-commerce MVP using MySQL, HeroUI/Tailwind, Three.js/R3F avatar, deployed later as ONE Next.js app on Liara.

## Mandatory start protocol (minimum-token cold start)
1. Read this `AGENTS.md` (small and stable).
2. Read `docs/agent/START_HERE.md` (file map), then `HANDOFF.md` (up-to-date state), then `docs/agent/TASKS.md` (next exact task).
3. Read `docs/agent/DECISIONS.md` *only relevant entries*. Read `docs/agent/ARCHITECTURE.md`, `docs/agent/DESIGN_SYSTEM.md`, `docs/agent/MOTION_CONTRACT.md` or full `SAROCHI_CODEX_MASTER_SPEC.md` *only if the current task touches that domain*. Use targeted file reads (`rg`, specific line ranges), not a repo-wide reread.
4. Before editing, inspect ONLY relevant source files and callers. Confirm existing implementations before adding abstractions. Never say a task is done based solely on a plan.
5. Start/finish/suspend/block of EVERY task MUST update `HANDOFF.md` and `docs/agent/TASKS.md`. Persist a concise, actionable state before context runs out. This is not optional.

## Absolute product/UX invariants
- Brand is **SAROCHI / ساروچی**; domain source `https://sarochi.ir/`. Owner screenshots show the old site's DATA and structure. **NEVER copy the old site's UI**; motion fidelity is governed by `references/video/interaction-reference.mp4` and the spec.
- Deliver a genuine working full-stack app; never a screenshot, decorative prototype alone, Figma-only handoff, static portfolio or hardcoded frontend JSON inventory. ALL business records from MySQL accessed via server-only repositories and typed API/RSC.
- Distinct hierarchical category rails, moving hangers, cutout garments, desktop hover/drag, front/back flip, selected garment isolation, mobile swipe/tap, real product detail, active color/size/stock, animated actual WebGL 3D avatar try-on approximation, admin CRUD, basic demo cart.
- Full mobile/tablet/desktop responsiveness, RTL Persian as default, progressive enhancement, keyboard and reduced motion support, no scroll trapping/ghost clicks.
- Missing back photographs are NOT generated automatically by a paid API. Conceptual backs/3D clothing must be clearly labeled; never market a fake back view/360° model as accurate original product imagery. No upload of visitor photos in MVP.
- Catalog import must discover/validate/persist real Sarochi data and produce completeness report; no invented prices or stocks; clearly state blockers and partial data. Observed source prices can change.

## Technical invariants
- TypeScript strict; Next.js App Router, React, Node 22 compatible, pnpm, Tailwind v4, HeroUI v3, Drizzle + mysql2 on MySQL 8, Zod validation, motion/react, Three.js + @react-three/fiber + drei loaded ONLY as required. Choose stable compatible versions; verify docs instead of assuming package API.
- One Next.js codebase/process for backend and frontend; separate *MySQL service* allowed; no second Nest/Express backend. Docker deployment target Liara. No paid AI key/API requirement. Production hosting/storage/DB may still cost money.
- Feature-based folders; route files are thin adapters, services and repositories isolated, DTO contracts typed; server-only module boundaries; do not leak secrets into client bundle.
- `globals.css`: imports, root font/theme tokens, reset, accessible base ONLY. Everything else: Tailwind tokens/utilities, small colocated CSS Modules for hard transforms, reusable custom components. Don't dump product-specific styles into globals or hardcode colors/motion durations across components.
- Keep actual domain and merchandising content in DB, never in runtime frontend fixtures. Static test/seed fixtures only for loading DB and testing.
- Use functional accessible real controls. Security: authenticated admin + RBAC, hashed password, secure session, authorization every mutation, origin/CSRF mitigation, rate limit, ownership/audit logs. Do not ship default admin password.

## Execution and updates: always, even mid-task
**On beginning a task:** update `TASKS.md` status `IN_PROGRESS`, add ownerless timestamp/session and `HANDOFF.md` current objective, exact files expected and first action. **On completing:** run relevant checks, update both files with `DONE` and actual results; link changed paths, test commands/status, decisions and next concrete task. **On failure/block:** mark `BLOCKED` with cause, reproduction and next workaround. **On interrupted/low context:** mark `PAUSED` with current command, modified paths, unfinished work, how to verify and next precise edit. Do not claim tests ran if not executed. Use one active task at a time. If no session ID, record ISO timestamp only.

## Context / token budget rules
- Cold start: read 3–4 compact agent docs, NOT 80+ KB master spec and entire tree by default.
- `rg --files src/features/<feature>` before `find .`; `rg -n pattern relevant/file`; bound `sed -n 'a,bp'`. Avoid dumping `node_modules`, lockfiles, build output or large logs. Summarize findings in one compact doc, do not paste long logs.
- Before writing code, inspect implemented components, then implement the minimum coherent vertical slice; avoid speculative factories or dozens of placeholder files.
- Save architectural decisions once in `DECISIONS.md`, API contracts in `ARCHITECTURE.md`, tokens in `DESIGN_SYSTEM.md`; do not duplicate across all docs. Keep `HANDOFF.md` concise (ideally <= 200 lines) and current, not a chronological transcript. Archive closed milestones in `docs/agent/PROGRESS_LOG.md` if necessary.
- Avoid repeating source website crawling for known facts; consult `docs/research/SAROCHI_SOURCE_AUDIT.md` and re-fetch ONLY for freshness/coverage/import QA.
- If unexpected repo changes exist, investigate/communicate; never wipe user modifications. Don't commit generated media without provenance/license record. Never print secrets or copy live customer data.
- Continue autonomously through defined phases when safe, but **do not fake import completeness or payment readiness**. If blocked, build usable fallback and document exact unblock condition.

## Per-task definition of done
Task is done only if implemented, connected end-to-end when applicable, lint/typecheck/tests appropriate to that change pass (or explicit failures recorded), UI verified at relevant viewport when visual, current docs updated and next task ready. Be direct about unfinished functionality.

## Default implementation priority
**0:** source research + repo + architecture, **1:** DB/typed full-stack vertical slice, **2:** Sarochi importer & review pipeline, **3:** rack physics and category navigation, **4:** product detail/filters/cart, **5:** admin CRUD, **6:** animated 3D styling room, **7:** visual polish, accessibility, E2E, deployment readiness. Optimize for a running application each phase, not distant perfect code.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
