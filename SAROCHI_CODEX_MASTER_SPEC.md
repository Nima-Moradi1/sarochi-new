# SAROCHI — The Living Atelier | Motion-First Full-Stack Fashion & 3D Styling Room
## Codex implementation specification | Next.js full-stack MVP | 2026-10-13

> **Primary instruction for Codex:** Build a RUNNING, polished, interactive application, not a landing-page mockup, slideshow, Figma export, or pile of hardcoded product objects. Implement an end-to-end vertical slice with a real MySQL database, typed API, protected admin dashboard, motion-led clothing rail, real navigable product views, and a browser-rendered 3D avatar wearing an approximate version of the selected garment. Continue with all phases until the MVP works. Document limitations honestly.
>
> **Language:** This document is written in English for technical execution. **The storefront and admin UI default to Persian (`fa-IR`, RTL)** with clean, legible Persian copy; allow future EN/LTR support.
>
> **VERIFIED legacy brand and URL:** `SAROCHI` / `https://sarochi.ir/` (owner-supplied). **The new site MUST be SAROCHI branded, not an invented brand.** Public category/product pages and owner screenshots are available in `docs/research/SAROCHI_SOURCE_AUDIT.md` and `references/legacy-screenshots/`. The source site is DATA ONLY, never a design reference. Real catalog import must be implemented and validated; no claim of complete extraction before a successful counted import. Do not modify or overwrite the source site.

---

## 0. References, non-negotiables, and order of precedence

**Input visual reference:** `references/video/interaction-reference.mp4` — 26.7 seconds, 640 × 496, 30 fps. `references/video/contact-sheet.jpg` and selected timestamp frames live in `references/video/frames/` if the bundle was supplied. Analyze the original video yourself before implementing animation. Timecodes below are observations, not proof of the underlying site's implementation.

Priority when trade-offs arise:

1. Functional experience faithfully resembles the **observable interaction and movement** in the provided video.
2. Product/brand content stays driven by MySQL via Next.js server data access/API, not frontend JSON fixtures.
3. Fast, high-quality mouse, touch, keyboard, and responsive behavior; graceful fallback.
4. Genuine 3D, browser-rendered avatar styling preview with honest limitations, zero paid AI dependency.
5. Modular, composable and tested code; accessible, secure admin and reliable deployment.
6. Extra decorative effects only if they do not harm UX or performance.

Hard constraints:

- Next.js 16 App Router (or latest stable compatible minor at implementation), React 19, TypeScript strict, pnpm, Tailwind CSS v4, **HeroUI v3**, Node 22 LTS compatible.
- Frontend and backend in **ONE Next.js deployment/Node process**: App Router pages/RSC, route handlers, server-only services and repositories; Docker-ready for **Liara**. A separately managed MySQL database and optionally object storage are infrastructure services, NOT another application/backend service.
- **MySQL 8** and **Drizzle ORM + mysql2**, schema migrations, relation constraints, seeded database. No critical catalog data in hardcoded frontend arrays, public JSON, fake API handlers, runtime-memory stores, or SQLite as a stand-in.
- HeroUI v3 for admin/dialogs/forms, Tailwind utilities for layout and styling; specialized rack/motion components custom-built. **No excessive `globals.css` styling**; global file limited to Tailwind and HeroUI imports, shared font/theme tokens, baseline focus/accessibility rules. Use colocated CSS Modules only for unusually complex 3D/transforms if needed.
- **No paid AI APIs, API keys, image subscriptions, GPU inference servers, paid avatar services, or payment credentials** required to run the local MVP. Don't present fake AI as real. No user photo uploads or personal try-on pipeline in this version.
- Responsive desktop/tablet/phone, RTL aware, no browser-only APIs inside Server Components, no hydration mismatch, no blocking GL context on the entire storefront, no hover-only functionality.
- Code should be cohesive, feature-based, isolated and reusable: avoid giant components, global CSS hacks, giant API handlers, ad hoc event listeners, duplicated source-of-truth, and unnecessary dependencies.
- Do not silently discard requirements or substitute a basic product grid for the clothing rail. State a blocker precisely; ship a working fallback.

---

## 1. What the reference video actually shows (timecoded)

The video has **several different reference shots**, rather than one continuous web application. Respect which moments are editorial inspirations and which are concrete UI behavior.

| Time | Observation | MVP implementation requirement |
|---|---|---|
| 00:00–03:30 | Fashion editorial clips and a multi-view outfit/model collage in orange-blue patterned clothing | SAROCHI-specific editorial entrance/hero is mandatory (see addendum); do NOT hardcode that model/brand as the owner's actual brand. |
| ~03:30–05:50 | Transition to pale mint/gray dotted backdrop; very slim dark horizontal rack/rod; wooden hangers; garments hanging at varied x positions, partly cropped at edges; centered brand wordmark at top | Recreate restrained editorial visual language, rack geometry, wooden hanger pivots and garment silhouettes, controlled full-bleed horizontal composition. |
| ~05:50–09:50 | Cursor moves over shirts/sweatshirts; currently featured garment becomes significantly larger and more front-facing; lateral continuity preserved; readable small product label below | Hover/focus highlights garment with a deliberate rise/lift, enlarges, reveals readable name; rack keeps movement continuity, not jumps between independent cards. |
| ~06:50–09:00 | Featured T-shirt visibly reveals a printed reverse side and later another garment front, matching mouse movement/navigation | Support real FRONT/BACK garment media and an animated, intentional front↔back flip/transition. Do not use the same image pretending it is both views. |
| ~12:00–14:80 | Additional shots of fashion commerce UI and a different crop of the hanging rack; a white graphic tee is selected | Categories/collections must be navigable; avoid copying unrelated brands or imagery from the video. |
| ~15:00–18:50 | Isolated product on its own hanger takes center, background clothing fades/softens; discreet circular left/right controls, product counter near the bottom | Product focus/detail state needs a smooth background-to-foreground transition, navigable media/neighbor product, index, description, variants and CTA in responsive position. |
| ~19:00–26:70 | A separate **2D live virtual styling preview**: real woman on screen and a side panel with clothing grid/status; changing outfit is illustrated | The user's requested **3D orbitable animated avatar** is an expansion, **not a feature demonstrated as 3D in the video**. Build it as a dedicated 3D styling-room feature, WITHOUT claiming real-person AI try-on. |

### Visual style target

- Mood: art-directed, minimalist, contemporary fashion editorial; large negative space; premium restraint rather than a crowded online-store UI.
- Main stage: subtle desaturated mint/ivory backdrop with extremely low-contrast dot/texture; a thin black/graphite metallic bar near the upper third; warm wooden hangers; hanging apparel photos/cutouts with believable attachment/weight.
- Strong hierarchy: only one active garment is featured sharply; nearby garments remain a physical-seeming sequence and provide context.
- Avoid generic card grids on the main experience, heavy gradients, cartoon icons, spinning carousels that behave as independent cards, and excessive parallax.
- User's legacy branding, logo, type, palette, category naming and commercial details supersede reference's branding when provided.
- Use local Persian-compatible font (e.g. Vazirmatn, acquired under its license); also support editorial Latin headings only when justified by the legacy brand.

**Reference fidelity checklist**: compare a live screenshot/video of the build against at least 05.8s, 07.5s, 14.8s, 17.2s. Compare scale, anchor positions, x-distribution, hanger/rod proportions, fade choreography and motion duration. Do not claim pixel perfect without side-by-side verification; video compression and source resolution limit precision.

---

## 2. Business goal and functional scope

Create a database-driven fashion storefront with:

1. Brand-faithful homepage featuring a fully interactive, horizontally explorable clothing rail.
2. Admin-configured **multiple rails by category/collection** (men, women, T-shirts, hoodies/sweatshirts, jackets, pants, etc.). Categories are DATA, not conditional hardcoded UI routes; one product can appear in multiple rails.
3. Search/filter, navigation and direct link to a product; SKUs/variants, gallery with front/back/side when available, color selector and sizes/availability.
4. A **real** draggable/keyboard/touch rail state machine. Product detail transitions with cinematic yet controlled motion.
5. A separate styling-room screen where a male/female or other user-selectable illustrative avatar preview displays a category-matching 3D garment approximation in the chosen color, can idle/turn/walk-in-place and is orbitable/zoomable.
6. Admin back office with brand settings, categories, rails and their item ordering, products, color and size variants, imagery, 3D outfit mapping, publishing controls, import review, and audit history.
7. Minimal functional cart (add/remove/update/total) and checkout **clearly labeled demo / unavailable** unless an actual payment provider is configured. No fake payment confirmations.
8. One Dockerized application with accessible CRUD APIs and MySQL; asset abstraction for local development and later persistent object storage.

Not in MVP: accurate fabric simulation, physically exact garment fit, AI virtual try-on on an uploaded user photo, realtime video generative outfit swap, payment settlement, shipping integration, multi-vendor marketplace, realistic per-body measurement sizing. Leave extensibility seams for these.

### Core user stories

- As a visitor, I can drag/swipe across **many** garments on a real-seeming rack; motion is fluid with inertia, snapping, and sensible bounds.
- I can move between rails/categories without a page flash or losing navigation affordances.
- Hover/focus enlarges a shirt on desktop; on touch it is focusable/tappable instead of requiring hover.
- I can flip the hanging clothing view to its **actual** back photo if available, and see a clearly marked concept/fallback if missing.
- I can open a product detail, choose an available color and size and see media/price/stock update consistently.
- I can enter a styling room with the selected product and see a moving 3D character wearing a plausible corresponding garment **category, silhouette and color**.
- As an admin, I can add a new product/variant/rail, reorder products, save and publish, and the public site uses the changed MySQL state without code edits or rebuilds.
- As an admin, I can safely import existing site content while retaining source attribution and reviewing missing fields.

---

## 3. User experience, pages, and route map

### Public routing (Next.js App Router)

- `/` — fashion landing with working rack, collection switcher, optional editable editorial banner, accessible alternate list/grid view.
- `/collections` — browse all configured collections (editorial but functional).
- `/collections/[slug]` — dedicated rail for that category; URL/query encodes the selected rail and garment without breaking browser back navigation.
- `/products/[slug]` — directly linkable product detail with front/back/media, color/size and inventory selection, cross-sells from DB.
- `/style/[slug]?variant=...&avatar=...` — on-demand-loaded 3D styling-room view; optional product detail overlay.
- `/cart` — lightweight real cart state with totals and dummy/no-payment checkout notice.
- `/search?q=...` — searchable catalog, real DB query and empty/error states.
- `/admin/login` — secure login.
- `/admin` — metrics summary, import/publishing status, latest changes.
- `/admin/brand` — brand settings, design tokens, navigation, links, translated copy, SEO/social profile.
- `/admin/categories` — category tree, ordering, visibility.
- `/admin/rails` — rail management and drag-and-drop product sorting; rail visibility and featured state.
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]` — full CRUD and media, variant and product mappings.
- `/admin/assets` — uploaded/imported images and GLB models with preview, provenance and warnings.
- `/admin/avatars` — preset avatar management, garment mesh mapping, category/color default configuration.
- `/admin/import` — reviewable legacy-site import workflow (disabled/unconfigured until URL given).
- `/admin/audit` — record admin writes and filter by entity.

### State continuity

- Keep `selectedRailId`, `selectedProductId`, `selectedVariantId`, `selectedSize`, `viewSide`, `isDetailOpen`, `isStylingRoomOpen` explicit and typed.
- Persist selected rail/product in query parameters when it makes sense; back/forward must work without a reset to first garment.
- On category switch, transition the current rail **out**, wait for new asset readiness (with timeout and skeleton), then transition the new rail **in** with stable content.
- On product variant change, use actual variant media; preserve orientation if valid; fall back to front only if unavailable.
- On admin publish, revalidate public cached content (using appropriate Next.js cache tools) and avoid stale server/router content.

---

## 4. RACK: definitive animation and interaction choreography

### 4.1 DOM-first rail, authentic spatial perception

**Important architectural decision:** the **rack itself** should be rendered with lightweight DOM/SVG apparel imagery and CSS `transform`/`perspective` + `motion/react` for the observable reference. Use a real Three.js scene **only for the avatar/styling room and optionally advanced 3D inspection**. There is no benefit in requiring hundreds of transparent apparel image planes in a WebGL canvas if the video is fundamentally an editorial photographed 2D rail. Achieve precise visual fidelity, responsive text and accessible click targets first.

Physical illusion:

- A continuous 1–2px dark rod with subtle specular highlight across the stage width, positioned as a visual layer behind hangers.
- Each item has a hanger pivot, wooden hanger SVG/asset, garment front/back media with transparent background and optional shadow plane.
- Hangers appear to hang FROM the same rod; on movement, small physics-inspired sway around the hanger neck pivot (no chaotic independent flying).
- Each item has x coordinate derived from its sequence index, display density, scale, active state, and animated track offset.
- Items progressively compress/expand based on focal distance if needed, but never intersect excessively or become stretched.
- A focused garment moves visually forward (z/scale), stays on its hanger, and becomes front-on with readable details; inactive ones remain hanging in side-like silhouettes or rotated in perspective.
- Keep a continuous feeling of horizontal movement instead of teleporting or instantly replacing DOM nodes; maintain stable keyed identities.

**Initial motion tokens (tunable via central motion config; NOT magic numbers scattered in components):**

| Interaction | Initial spec | Test for |
|---|---|---|
| Rail enter | 550–850 ms cubic-bezier easing, staggering 35–70 ms across visible items | Not blocking first interaction; user reduced-motion preference respected |
| Horizontal drag | 1:1 pointer movement filtered through motion value; inertial deceleration, capped velocity | Predictable release and no overrun |
| Snap to item | spring stiffness ~190–260, damping ~25–34, depending on observed motion | Smooth stop with no jitter |
| Hover/focus lift | ~180–270 ms, scale about 1.15–1.45 by viewport | Product remains sharp and keeps hanger attachment |
| Front↔back flip | ~400–650 ms; 3D `rotateY` with face swapping at 90° | No mirrored brand graphics, backwards typography or flicker |
| Rail/category transition | ~300–550 ms soft staggered exit/enter | No blank flash; selected state reset/preserved intentionally |
| Product isolate | ~500–750 ms; inactive garments fade/defocus, selected centers | Exactly one active product remains the focal point |
| Avatar intro/idle | ~400–800 ms introduction, continuous subtle skeletal idle | Doesn't block input or trigger excessive rendering |

These values are starting points and **must be visually tuned against the uploaded video**. Store tokens at `src/design-system/motion.ts`. Never animate layout-critical `left`/`top` on each pointer frame; prefer compositor transforms and motion values.

### 4.2 Input model

**Desktop**

- Pointer hover: smoothly foreground nearest hovered item, show caption. After pointer settles ~200–350 ms it can show rear side preview if the user explicitly requests a flip / moves a clear pointer hotspot; expose a dedicated `نمای پشت` control so interaction is deterministic. Do not surprise-flip repeatedly while the pointer jitters.
- Click featured garment or `مشاهده محصول`: enter isolate/detail; double click is not required.
- Hold mouse down and drag **in free rack space** or on a garment; if movement exceeds threshold (e.g. 8 px), interpret as scrolling; suppress click after drag.
- Trackpad horizontal deltas scroll naturally. Wheel-Y to X conversion should only activate when the cursor is over the rack and a scroll affordance is expected; do **not** hijack normal vertical page scroll.
- Arrows visible on keyboard focus and touch; ArrowLeft/ArrowRight navigate visually correct RTL direction; Home/End, Enter and Escape supported. Tabbing focuses products in meaningful DOM order, not an endless offscreen virtualized list.

**Mobile / touch**

- Swipe horizontally moves the entire rail with inertial snap; vertical page movement continues normally (`touch-action: pan-y` on the appropriate drag region). Detect intent to prevent scroll lock.
- Single tap brings item into focus and reveals affordances; tapping the active item's clearly visible detail action opens the product. Optional second-tap-on-garment opens detail if unambiguous and consistent.
- Explicit front/back toggle, large-enough visible touch targets, next/prev rail arrows or simple bottom scrubber. Never depend on CSS `:hover` on iOS.
- Pinch/pan gestures belong to avatar scene, not page-wide listeners; disable camera page scroll conflicts and respect accessibility.
- Swipe rapidly and release: no accidental click, no stuck drag, no overscroll white space, no broken back behavior when changing category.

**State machine**

`IDLE → DRAGGING → SETTLING → IDLE`
`IDLE → FOCUSED → (FLIPPING ⇄ FOCUSED) → DETAIL_OPEN → STYLING_ROOM`
`ANY_NON_MODAL → RAIL_SWITCHING → IDLE`

Implement guards for concurrent pointer gestures and route transitions, cleanup listeners and animation frames, remove loading skeleton once ready. Test race conditions: click during snap, rapid category switches, `Escape` while flipping, invalidated deleted product, browser resize mid-drag.

### 4.3 Data-to-motion geometry

- Rail layout should be deterministic and data-driven, accounting for the actual number of products; no `index % 10` hacks.
- Use `ResizeObserver` to measure viewport and garment widths; support both natural image aspect ratio and transparent cutout bounds.
- Horizontal virtualization: render visible ~8–18 apparel items plus overscan, not 500 simultaneous cutouts; preserve x positioning from absolute indices and stable keys. If product count is small, just render all.
- `motionValue` drives a single track offset, derived nearest active index, visual focus, and parallax; a store updates selection only when nearest item changes, not 60 React renders/second.
- Compute RTL-safe interaction mapping explicitly: pointer displacement, logical index movement, arrow behavior and visual order are deliberately tested rather than globally reversing CSS transforms.
- Add a *meaningful* alternate catalog grid/list for users with reduced motion, assistive technology or disabled canvas/animations.

### 4.4 Product isolation and imagery

- Clicking focus starts transition: rail fades (opacity), shifts back (`translateZ`/scale), selected item animates into a centered product stage with adjacent arrows, `N / TOTAL`, title, price, sizes, colors and CTA.
- Prefer shared layout identity/FLIP between hanger slot and detail hero; if complex reparenting causes flicker, make a visually continuous crossfade/scale with an absolute ghost overlay.
- Flipping front/back needs two distinct tagged assets `FRONT` / `BACK` (and optionally LEFT/RIGHT/DETAIL). The back must not be simply mirrored front artwork.
- Allow hover on desktop to tilt/rotate a *view*; exact physical 3D inspection only when a corresponding licensed GLB model exists. A front/back photo flip is **not** a geometry-faithful 3D rotation.
- On close, focus returns to originating hanger in its previous rail offset; focus management and URL state restored.

---

## 5. Product imagery, missing back views, and truthfulness

Products imported from the old store may have only ONE flat photo or lifestyle photograph. The app MUST NOT silently fabricate a false representation of the item. This is both a trust issue and a technical impossibility without product-specific reference.

Required image strategy, in order:

1. Use owner's genuine FRONT/BACK/SIDE photos if available; associate with the correct color variant.
2. If the owner supplies front artwork/color but no back photo, allow admin to upload a new authentic back later.
3. For **demo-only** content, a deterministic offline design tool may construct a **conceptual** back silhouette/color and reusable garment shape. Watermark/label as `نمای پیشنهادی / شبیه‌سازی مفهومی` or `CONCEPT — NOT ACTUAL PRODUCT PHOTO`; record provenance in DB. Never pass it as actual catalog photography.
4. If an original item cannot be approximated reliably, show a neutral garment-shape rear preview with an obvious badge and an option for admin to upload the proper photo; do not duplicate the front print on the rear without evidence.
5. Optional local background processing with `sharp`, custom masks, SVG shapes, or opt-in offline model *if freely installable and practically runnable*. No cloud image editing calls, no dependency on local GPUs to serve the app. Processing jobs run in development/import scripts rather than every request.

**Image pipeline**: preserve original import copy in provenance; normalize formats, orientation, resolution and alpha; safely generate reasonable web-optimized variants, sizes and thumbnails; consider transparent cutout quality; verify copyrights/source URL and owner's authorization. Browser should never generate demo composites on the server on every page view. Background-removal artifacts should be surfaced in admin review.

Variant media source fields include `viewAngle`, `variantId`, `sourceType: ORIGINAL | OWNER_UPLOAD | DEMO_GENERATED | MODEL_RENDER`, `isVerifiedActualProduct`, `altText`, dimensions, blur placeholder and full URL/path. UI uses badges for non-verified media. No fake exact realism claims.

---

## 6. 3D STYLING ROOM: genuine 3D, offline, modular

### 6.1 Product expectation and boundaries

The video illustrates a 2D AI/live camera styling demo. The MVP requirement here is a **genuine WebGL 3D avatar with real 3D garment mesh**, not swapping the user's own photo nor costly generative inference.

The 3D demo must visibly:

- Load inside a scene from `@react-three/fiber` + `three` + `@react-three/drei`.
- Display a male/female optional archetype (admin configurable); ideally a legitimate **rigged glTF/GLB** with skeletal animation (`idle`, `turn`, light `walk-in-place`) sourced from original/local art or freely licensed reusable assets; record asset license and source.
- Provide pointer drag/orbit controls, zoom within safe limits, front/side/back views, reset camera, lighting and soft floor shadow.
- Equip a **separate garment mesh corresponding to selected product category**: T-shirt, long-sleeve/hoodie, jacket/coat, trousers. Toggle garment type, material color and simple print/decal approximation with product/variant changes; no universal painted-on shirt texture.
- Match selected color and silhouette as closely as curated meshes allow. Admin can map a SKU/color to a specific GLB, material and texture/decal. For non-mappable products, show `مدل تقریبی برای نمایش استایل` and a clean fallback, not a misleading exact try-on.
- Update avatar without tearing down the whole canvas when color/garment changes; dispose old geometries/materials/textures correctly if not cached; use local static GLBs, no runtime paid CDN dependency.
- Animate idle subtly (breathing/weight shift). Offer `Rotate left`, `Rotate right`, `Play/Pause`, `Front`, `Back`, `Reset` and camera orbit.

### 6.2 Archetypes are style presets, NOT statistical claims

For demo data, configure **illustrative** archetypes:

- `male-standard`: 175 cm, 78 kg, dark hair, dark eyes; neutral proportions and styling.
- `female-standard`: e.g. 165 cm, 60 kg, dark hair, dark eyes; explicitly a DEMO illustration, not a claim about average women in Iran.
- Optionally `neutral-standard` if accessible compatible asset exists.

These numbers are editable **presentation presets**, not body measurement predictions, not fit advice, and not market statistics. Avoid making assertions about demographics. Display `نمایش استایل تقریبی — سایز واقعی را از جدول اندازه بررسی کنید` near the 3D scene. Use non-objectifying and inclusive styling.

### 6.3 Implementation paths and fallback hierarchy

Preferred:

A. Bundle original or correctly licensed rigged avatar GLB(s) and four reusable garments built in Blender / adapted from compatible open-licensed assets. Run offline. Share skeleton-compatible materials/mesh attachment, or use separate pre-rigged clothing variants authored in Blender. Validate rig compatibility in exported GLBs.

B. If no suitable rigged asset/license available, build a **procedural low-poly/stylized 3D character** with real 3D primitives, rig/arm/leg group transforms and distinct garment geometry, plus minimal idle/turn animations. Must be genuinely 3D, orbitable and change clothing. Explicitly label this as a stylized MVP approximation rather than photo-realistic fit.

C. Only if WebGL unsupported/disabled, show a still poster/illustration and ordinary front/back clothing photos with an honest compatibility message. This should not be the primary implementation.

**Do not** claim that applying a front image to a generic mesh guarantees garment fit, back printing, folds, collar geometry or exact drape. If model images/texture sources exist, map them to the proper UV coordinates in an authored garment. A decal only indicates a simple print placement, not physical accuracy.

**Asset licensing policy:** glTF models, textures, HDRIs, avatars and animations must be made by the project or carry a license permitting inclusion in a commercial storefront. Record `author`, `license`, `sourceUrl`, `licenseFile`. Never scrape purchased/protected avatars from a commercial service. Avoid dependency on cloud model loaders with token keys.

### 6.4 Camera and resource budget

- Scene dynamically imported on `/style/[slug]` only (client-only canvas); prevent server rendering of WebGL-dependent objects.
- Cap device pixel ratio by performance tier (e.g. min(dpr, 1.5 high / 1 low)), no expensive postprocessing by default, keep mesh counts/texture sizes conservative, frustum culling where appropriate.
- Start/stop render loop based on visibility and animation needs (`frameloop="demand"` if feasible; default loop only while animated). Pause when tab hidden; release scene GPU resources on route change.
- Support rotation on touch while respecting page/back navigation. Add accessible alternative view selectors and descriptive text for assistive devices.

### 6.5 Future-proof WITHOUT building user-photo AI now

Expose a simple **disabled** capability contract `VirtualTryOnProvider` with a future `USER_PHOTO_TRYON` feature flag default false, but do not create upload UI, cloud provider, embeddings, camera capture, photo retention, biometric processing or AI API plumbing in this MVP. For now use `AvatarTryOnProvider` running locally in browser.

---

## 7. Design system, brand ingestion, reusable components

### 7.1 Brand and theme

`brand_settings` from DB controls store display name, wordmark/logo asset, color tokens, site favicon, typography choices, light/dark preference if applicable, social links, footer copy, contact/links, checkout modes, brand language, SEO metadata and editorial text.

The **original storefront is the brand source of truth** once URL arrives. First inventory its pages, logo/font/colors/category names, image rights and product details; propose only tasteful modernization. Until then label demo branding **`RACK / DEMO`** and make every brand asset replaceable in admin.

- Prefer Tailwind v4 theme tokens for primitive values and variant-driven component APIs.
- Map validated DB-brand tokens to a **whitelisted/sanitized CSS variable set** on a root layout wrapper (no arbitrary CSS injection). Use CSS variables `--brand-primary`, `--surface`, `--foreground`, `--muted`, `--font-ui`, `--rail-height`, etc.
- No hardcoded colors/sizes in 40 files, no scattered style conditions derived directly from product names.
- Reusable primitives built on HeroUI v3 as appropriate: `AppButton`, `AppDialog`, `AppDrawer`, `AppInput`, `FormField`, `ColorSwatch`, `MediaBadge`, `Skeleton`, `EmptyState`, `ErrorState`, `Price`, `ResponsiveDialog`.
- Rack/story and 3D scene are CUSTOM modular components, not shoehorned into HeroUI Card widgets.
- Proper focus ring, WCAG contrast, correct semantic labels, keyboard paths, visual hit targets. All forms Persian RTL; data may contain mixed-script SKUs/English words, isolate bidirectional text correctly.

`src/app/globals.css` should be very small: `@import "tailwindcss"; @import "@heroui/styles";` plus justified global tokens/font/reset/RTL basics. Place complex rack visuals in `features/rack/components` and optional colocated CSS Modules. **HeroUI v3 needs NO HeroUIProvider**; only add its `I18nProvider` if required for locale (verify live docs). Do NOT accidentally use outdated HeroUI v2/NextUI APIs or install both HeroUI and shadcn for duplicate controls.

### 7.2 Component boundary examples

```
<AppShell>
  <BrandHeader />
  <HeroIntro />
  <CollectionSwitcher categories={...} />
  <RackExperience>
    <RackTrack>
      <RailRod />
      <HangingGarment>
        <WoodenHanger />
        <GarmentView front={...} back={...} />
        <GarmentCaption />
      </HangingGarment>
    </RackTrack>
    <RackControls />
    <ProductFocusOverlay>
      <ProductImageCarousel />
      <VariantColorPicker />
      <SizePicker />
      <ProductActions />
    </ProductFocusOverlay>
  </RackExperience>
  <Footer />
</AppShell>

<StylingRoom>
  <AvatarScene lazyLoaded>
    <AvatarModel />
    <GarmentMesh />
    <CameraRig />
    <LightingRig />
  </AvatarScene>
  <AvatarPresetSelector />
  <StylePreviewControls />
  <SelectedProductSummary />
</StylingRoom>
```

Each component has narrowly typed props, meaningful responsibilities, colocated tests where valuable. Use skeletons/ARIA announcements for network and image load states.

---

## 8. Architectural design: ONE deployable Next.js app

### Layers

```
Browser
  ├─ Server-rendered pages: branding, catalog metadata, SEO
  ├─ Client motion islands: rack interactions, media transitions
  ├─ Client 3D island: styling room
  └─ Admin forms + session cookie
                │
                ▼
One Next.js Node runtime (Liara Docker later)
  ├─ App Router Server Components
  ├─ Route Handlers /api/v1/*
  ├─ Auth/session/authorization
  ├─ Zod validation & DTO mapping
  ├─ Domain services (brand/catalog/rails/media/import)
  ├─ Repositories (server-only)
  └─ Drizzle + mysql2 connection pool
                │
                ▼
Managed/external MySQL 8 database
                │
      Optional S3-compatible object storage (for durable admin uploads)
```

**Important distinction:** the user wants a *single frontend+backend application server*, not MySQL packed into the same ephemeral application Docker container. The database still needs a persistent, separately provisioned datastore. Object storage may be a separately billed service when deployed. Local Docker Compose can run both locally for free; Liara platform/DB/storage may incur costs later.

### Data access convention

- Query MySQL from server components through `CatalogService` directly for SSR/SEO; **do not perform unnecessary HTTP fetches from Server Components to the same Next.js server**.
- Provide typed `/api/v1/...` route handlers for client-side interactive reads, admin writes and future external integrations; both paths call the same domain services/repositories/validators.
- Client dynamic controls use TanStack Query if helpful for caching/mutations; no duplicated React state between server and client; Zustand only for short-lived rack/style interaction state, not as DB replacement.
- All DB, session secrets, file adapters and import logic in `server-only` modules. Do not import database code into client components.
- Read catalog in paginated/limited segments; seed demo data to MySQL and **remove runtime fixtures**. Static files for media and GLB assets are fine; JSON product arrays are NOT.
- Use Node runtime for mysql2, asset processing and secure admin APIs; never Edge runtime for MySQL driver.
- Cache public GETs deliberately; admin mutation invalidates affected paths/tags; authenticated responses must not leak through public CDN caches.

---

## 9. Suggested feature-based project tree

```
.
├── .env.example
├── .gitignore
├── AGENTS.md
├── HANDOFF.md
├── README.md
├── Dockerfile
├── compose.yaml
├── next.config.ts
├── drizzle.config.ts
├── drizzle/                        # committed schema migrations
├── public/
│   ├── demo-media/                 # LOCAL demo files only, no sensitive imports
│   ├── demo-models/                # licensed/created .glb assets + licenses
│   └── fonts/
├── scripts/
│   ├── seed.ts                      # inserts demo records into MySQL
│   ├── migrate-legacy.ts            # explicit import command after owner URL
│   ├── validate-assets.ts
│   └── verify-setup.ts
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── collections/[slug]/page.tsx
│   │   ├── products/[slug]/page.tsx
│   │   ├── style/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── search/page.tsx
│   │   ├── admin/(auth)/login/page.tsx
│   │   ├── admin/(protected)/layout.tsx
│   │   ├── admin/(protected)/products/...
│   │   ├── admin/(protected)/rails/...
│   │   └── api/v1/...
│   ├── design-system/
│   │   ├── tokens.ts
│   │   ├── motion.ts
│   │   ├── primitives/...
│   │   └── providers/...
│   ├── features/
│   │   ├── brand/{components,server,schemas,types}/...
│   │   ├── rack/{components,hooks,engine,schemas,types,tests}/...
│   │   ├── catalog/{components,server,schemas,types,tests}/...
│   │   ├── product-detail/{components,hooks}/...
│   │   ├── virtual-style/{components,scene,meshes,services,types}/...
│   │   ├── cart/{components,server,schemas}/...
│   │   ├── admin/{components,server,schemas}/...
│   │   ├── media/{components,server,adapters,schemas}/...
│   │   └── legacy-import/{server,adapters,schemas}/...
│   ├── server/
│   │   ├── db/{client.ts,schema,relations,seed-helpers}/...
│   │   ├── auth/{session.ts,permissions.ts,rate-limit.ts}/...
│   │   ├── services/...             # cross-feature orchestration if needed
│   │   └── config/env.ts
│   ├── shared/
│   │   ├── lib/{formatters,rtl,validation,errors}/...
│   │   ├── types/...
│   │   └── ui/...
│   └── middleware-or-proxy...       # verify correct Next.js 16 convention
├── tests/
│   ├── e2e/                        # Playwright desktop/mobile/tablet
│   ├── integration/                # MySQL real DB/API tests
│   ├── fixtures/                    # tests only; never app catalog runtime
│   └── visual/                      # reference-based snapshots and motion recordings
└── references/                     # reference bundle; excluded from production
```

This is a blueprint, not a demand for empty folders. Create files as necessary; keep dependencies acyclic. Use import boundaries, `server-only` and TS path aliases. Avoid abstracting everything prematurely; feature modules should remain navigable.

---

## 10. MySQL relational model — minimum viable normalized schema

Use Drizzle MySQL schema, migrations and explicit foreign keys/indexes/constraints. Use stable IDs (UUID/ULID or app-generated opaque IDs) for external references, unique slugs, dates/soft-delete where needed. DO NOT use frontend arrays as the source of truth.

Tables / recommended fields:

| Table | Important fields | Notes |
|---|---|---|
| `brand_settings` | id, nameFa, nameEn?, logoAssetId?, primaryColor, backgroundColor, foregroundColor, fontKey, locale, currencyCode, contactJson, seoJson, version, updatedAt | One active brand for MVP; JSON only for legitimate document-like settings, not relational product data |
| `categories` | id, parentId?, slug, nameFa, nameEn?, description?, sortOrder, isPublished, createdAt, updatedAt | Nestable/category hierarchy; indexes on slug/parent/order |
| `rails` | id, categoryId?, slug, titleFa, subtitleFa?, variant, orderIndex, isPublished, coverAssetId?, createdAt | Admin-created rails, including featured/multi-category |
| `rail_items` | id, railId, productId, orderIndex, isFeatured, isPublished | Unique railId+productId, sortable, joins |
| `products` | id, slug, titleFa, titleEn?, descriptionFa, detailsJson?, garmentType, genderPresentation, brandLabel?, status, baseCurrency, createdAt, updatedAt | `DRAFT/PUBLISHED/ARCHIVED`, simple searchable description; no model shape assumption |
| `product_categories` | productId, categoryId | Many-to-many |
| `colors` | id, nameFa, hex, swatchAssetId? | Shared color swatches; validate hex |
| `product_variants` | id, productId, sku, colorId, sizeLabel, priceMinor, compareAtMinor?, quantity, isActive, sortOrder | Unique SKU; uniqueness policy per product/color/size, transaction-safe availability |
| `media_assets` | id, storageProvider, storageKey, url?, mimeType, width?, height?, checksum?, altFa?, license?, sourceUrl?, sourceType, isVerifiedActualProduct, createdAt | Generic media inventory and provenance, not unbounded public external URLs |
| `product_media` | id, productId, variantId?, mediaAssetId, viewAngle, sortOrder, isPrimary | `FRONT/BACK/LEFT/RIGHT/DETAIL/LIFESTYLE`; product-level default when variant absent |
| `avatar_presets` | id, slug, titleFa, genderPresentation, heightCm, weightKg, hairColor, eyeColor, modelAssetId?, animationAssetId?, isDefault, isActive | Demo archetypes editable in admin |
| `garment_models` | id, garmentType, avatarPresetId?, modelAssetId, materialSlotsJson?, license, sourceUrl?, compatibleSkeletonId?, enabled | One base 3D garment per type/avatar; may be procedurally generated instead of asset |
| `variant_avatar_mappings` | id, variantId, garmentModelId, tintHex?, textureAssetId?, decalAssetId?, fidelityLevel, isApproved | SKU→3D approximation; `EXACT_AUTHORED/APPROXIMATE` badge |
| `admin_users` | id, email, passwordHash, role, isActive, createdAt | Admin only; salted Argon2id hash |
| `sessions` | id, userId, tokenHash, expiresAt, revokedAt?, createdAt | HttpOnly signed opaque session tokens; hash at rest |
| `cart_sessions` | id, anonTokenHash?, userId?, createdAt, updatedAt, expiresAt | Persistent anonymous cart; no payment needed |
| `cart_items` | id, cartId, variantId, quantity, createdAt | Price calculations server-side; do not trust browser totals |
| `import_jobs` | id, sourceSite, status, startedAt, finishedAt?, summaryJson?, errorJson? | Trace provenance, retry, review |
| `import_candidates` | id, jobId, sourceUrl, parsedDataJson, reviewStatus, matchedProductId? | Staging review, not storefront read path |
| `admin_audit_logs` | id, actorId, action, entityType, entityId, beforeJson?, afterJson?, createdAt | Key protected writes; redact credentials |

If direct MySQL check constraints are awkward, enforce additional invariants in Zod/domain services, while keeping indexes/FKs. Index `status+updatedAt`, `railId+orderIndex`, `productId+colorId+sizeLabel`, `productId+viewAngle`, unique `sku`, unique slugs. Use proper transaction boundaries and eager query loading to avoid N+1 media queries.

**Pricing convention**: store numeric `priceMinor` in canonical currency units determined by `currencyCode` and format in `fa-IR` with a clearly visible currency label. If the legacy site quotes toman but database uses IRR, convert exactly once at import with an explicit rule and test; never ambiguously divide/multiply prices throughout components.

### Example server-to-client DTO (illustrative API CONTRACT, not runtime fixture)

```ts
export type ProductDetailDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  garmentType: 'TSHIRT' | 'SWEATSHIRT' | 'HOODIE' | 'JACKET' | 'PANTS' | 'OTHER';
  presentation: 'MEN' | 'WOMEN' | 'UNISEX';
  variants: Array<{
    id: string;
    sku: string;
    color: { id: string; name: string; hex: string };
    size: string;
    priceMinor: number;
    currencyCode: string;
    inStock: boolean;
    media: Array<{
      id: string;
      url: string;
      angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'DETAIL' | 'LIFESTYLE';
      alt: string;
      sourceType: 'ORIGINAL' | 'OWNER_UPLOAD' | 'DEMO_GENERATED' | 'MODEL_RENDER';
      isVerifiedActualProduct: boolean;
    }>;
    avatarMapping?: { garmentType: string; fidelity: 'EXACT_AUTHORED' | 'APPROXIMATE' };
  }>;
};
```

No API response should trust user-supplied asset URL, IDs, price or inventory. Validate, sanitize, authorize and map from DB entities. This object is an illustrative API shape inside the Markdown **not** an instruction to dump sample data in `src/data/*.json`.

---

## 11. API contracts and server responsibility

### Public GET routes

| Endpoint | Parameters / result | Notes |
|---|---|---|
| `GET /api/v1/brand` | published brand DTO | Stable cache with invalidation |
| `GET /api/v1/categories` | published category list | Query DB |
| `GET /api/v1/rails` | published rail metadata | Order from admin |
| `GET /api/v1/rails/:slug/items?cursor=&limit=` | paginated ordered product summary + images | Cursor preferred for big rails; limit bounded |
| `GET /api/v1/products/:slug` | full variant/media DTO | Published only |
| `GET /api/v1/search?q=&category=&cursor=` | filtered published products | SQL indexes, bound inputs |
| `GET /api/v1/avatars/presets` | active public demo archetypes | No private/admin assets |
| `GET /api/v1/avatars/mapping?variantId=&presetId=` | approved 3D mapping + fidelity | URL allowlisting |
| `GET /api/v1/cart` | current server-identified cart | Anonymous secure session |

### Public writes

- `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/:id`, `DELETE /api/v1/cart/items/:id`: Zod validation, client rate limit, transactional quantity/stock checks, CSRF/origin guard appropriate to cookie auth.
- No payment or real order submission in demo mode; disabled action with explanatory text.

### Protected admin writes

- `POST/PATCH/DELETE /api/v1/admin/products/*`
- `POST/PATCH/DELETE /api/v1/admin/categories/*`
- `POST/PATCH/DELETE /api/v1/admin/rails/*`
- `PATCH /api/v1/admin/rails/:id/reorder` (transaction; validate all items belong to rail, no duplicates)
- `POST /api/v1/admin/media/*` / upload request / finalize (authenticated, MIME and size validation)
- `PATCH /api/v1/admin/brand`
- `POST /api/v1/admin/avatars/mappings`
- `POST /api/v1/admin/import/preview`, `POST /api/v1/admin/import/commit` (allowed only for whitelisted owner-controlled legacy source; staged review)
- `POST /api/v1/admin/publish` (publishes only validated entries, invalidates caches)

Use REST-like conventions consistently and meaningful 4xx/5xx errors with stable `code`, Persian user-facing `message`, `fieldErrors` when appropriate. Apply server-side authentication AND authorization inside every protected handler and service, never only middleware/proxy. Prefer **not** to expose admin secrets in URL or logs.

### Example API pipeline

```
Route Handler (thin)
  -> parse/validate Zod DTO
  -> authorize/requireAdmin
  -> CatalogService.updateProduct(...)  [transactions & business logic]
  -> ProductRepository.save(...)
  -> Drizzle / MySQL
  -> invalidate published cache if required
  -> return sanitized DTO
```

### Admin authentication

- Bootstrap a single owner/admin using a server-only CLI seed with explicit env inputs and Argon2id, never a published default password.
- Login protected via secure HttpOnly cookie (Secure in production, SameSite=Lax/Strict as appropriate), rotating random session IDs whose hashes are stored in MySQL, logout revokes.
- Rate limit login, handle generic failed login errors, session expiration; add real origin/CSRF protections for cookie-authenticated mutations.
- Role guard (`OWNER`, `EDITOR`) even if MVP seeds one owner. Audit sensitive admin changes.
- No public registration/customer account required for this MVP.

---

## 12. Admin dashboard: must be functional, not decorative

### Minimum screens and actions

**Brand** — edit public name/logo/colors/typography, footer/contact, homepage editorial banners (only owner-approved media), save and preview; live UI uses DB settings after publish.

**Categories** — create, rename, nest, reorder, publish/unpublish. Prevent slug collisions and deletion when dependent products exist, or soft delete with warning.

**Rails** — create category-specific or curated rails, drag/reorder rail garments, set featured rail, choose animation behavior and background theme from a bounded enum, publish; front page updates dynamically.

**Products** — list with search/pagination/status; add/edit product title, description, price, garment type, presentation, tags/categories; variants by unique color/size/SKU; manage quantity/in-stock; add/edit media angle/thumbnail; save drafts and publish. Inline checks for missing front image, missing back view, missing 3D mapping and outdated media.

**Assets** — upload original files, inspect formats/dimensions, choose assigned product + angle, mark verified; display warnings for generated concept assets and unsupported GLB; delete only unreferenced media, or soft-delete with explicit warning.

**Avatar mappings** — associate one product variant with garment category mesh, avatar preset, color, optional decals; preview front/back in controlled 3D inspector; mark fidelity and label visibly to consumers.

**Import review** — configured legacy URL, source metadata, fetch dry run, diff/preview before commit, count images, duplicate SKU detection, conflict resolution, repeatable upsert keyed by stable external source ID/URL. Never silently destroy manual product edits on subsequent imports.

**Audit** — searchable list of admin changes, source of import and publish statuses.

Admin can use HeroUI v3 robust form primitives plus custom reorder components. Give real loading, empty, error and successful save states; prevent double submits; support inline validation, optimistic updates with rollback if appropriate; maintain keyboard access and RTL table alignment.

---

## 13. Legacy storefront discovery and import (when URL is provided)

**The URL HAS NOW BEEN PROVIDED: `https://sarochi.ir/`. The importer is a REQUIRED MVP feature, not a postponed optional phase.** See the live-site audit, source screenshots, adapter strategy and acceptance gates in `docs/research/SAROCHI_SOURCE_AUDIT.md` and `docs/agent/CATALOG_IMPORT.md`. Do not make up inaccessible product details.

1. Owner has stated this is their own brand/store; inventory public pages and optionally authorized export/API. Prefer official export or API over crawling.
2. Review robots/terms and reasonable request rate; never bypass login/paywalls/anti-bot, do not collect customer personal data.
3. Create `LEGACY_AUDIT.md`: site map, header/footer/branding, logo/color/font, category tree, product count (only if verified), SKU/price/currency/stock, sizes/colors, image URLs/angles, pagination, responsive behavior, search, contact/social, SEO and any customer-facing policies.
4. Build an adapter `LegacyStoreAdapter` with methods `discoverCategories`, `listProducts(cursor)`, `getProduct`, `listMedia`, `getBrand` returning validated normalized ingest DTOs.
5. Dry-run import to `import_jobs/import_candidates`. Report duplicate URLs/SKUs, unverifiable attributes, missing back images, unsupported images, price conversion, licensing notes. Admin accepts per candidate or batch after inspection.
6. Stream image copies to approved persistent media adapter; never serve production storefront from untrusted external hotlinks; preserve provenance and original source URL.
7. Idempotent import (`sourceSystem + sourceId/url`), transaction batches, retry/backoff, incremental update policy that preserves approved manual overrides and doesn't delete data when source times out.
8. Produce a migration report; only then update the brand settings/public rails and test storefront.

**Observed platform evidence:** the publicly visible routes and product UI strongly suggest a WordPress/WooCommerce-style catalog, but do not assume the official Store API is accessible. Public `wp-json` paths could not be verified using the available browsing environment. Prefer authorized WooCommerce export/API if the owner can provide it; otherwise build a rate-limited, resumable parser for permitted public product/category HTML. Detect DOM/structured data rather than hardcoding selectors without verification. Never bypass protections.

---

## 14. Media and storage: local free, production durable

- `MediaStorage` interface: `put`, `getPublicUrl`, `remove`, `getMetadata`, optional `createPresignedUpload`.
- `LocalMediaStorage` for local dev, writing to a separately mounted writable local directory (not to code-managed `/public` at runtime). Support image serving in local dev via controlled route; seed demo media copied into public at build is OK as static committed demo assets.
- `S3CompatibleMediaStorage` for Liara-compatible S3/object storage later, configured only when credentials supplied. The *application backend remains Next.js*. Do not claim storage is free, or assume application container's filesystem is persistent.
- For production, do not save admin uploads into `.next/`, bundled `public/`, temporary container disks, or local files that disappear across deploys/restarts.
- Whitelist MIME type/extension, sniff file signatures (do not trust browser headers), limit sizes, reject scripts in SVG or sanitize carefully, strip EXIF location, canonicalize image filenames, avoid path traversal.
- Assets such as demo GLBs may ship as static files in `public/demo-models`; large product media should eventually use object storage/CDN. Ensure proper CORS and `next/image` settings without `remotePatterns: [{hostname:'*'}]`.

---

## 15. Design for desktop/tablet/mobile + motion accessibility

### Breakpoints (start points, tune visually)

| Width | Layout | Rail behavior | Product focus | 3D styling room |
|---|---|---|---|---|
| ≥ 1280px | Full-width editorial stage, rail prominent, floating brand/navigation | 8–12 visible hangers with context; wheel/drag; smooth focus | Product center; right/left info float or split pane | Large scene ~60–70% width; sticky control sidebar |
| 768–1279px | Condensed header, fewer hangers, bottom controls | 5–8 visible, touch + pointer | Centered focus; details bottom/side responsive | 60/40 split or stacked depending height |
| 360–767px | Strong mobile-first hierarchy, safe-area-aware header | 3–5 visible or proportionate count; swipe snap, tap focus | Full-width garment, bottom drawer for options/actions, visible flip/next controls | Tall scene with bottom control tray; pinching/orbit not breaking page navigation |
| 320–359px | Narrow phone safety mode | 2–3 visible, no overlapping CTAs | No clipped texts, buttons reachable | Stacked simplified controls; graceful reduced effects |

Check browser text resizing at 200%, small viewport heights, portrait/landscape and mobile bottom browser chrome. Use `dvh`, min/max and safe-area padding carefully. The product never disappears above viewport due to header. Animated controls must remain tappable even if dynamic toolbar changes height.

### Performance quality gates

- Aim for approximately 60fps on mainstream modern desktop, smooth 30+ fps degradable fallback on constrained mobile (measure on real devices; no universal guarantee).
- Lazy load avatar WebGL route and large assets, prefetch only adjacent rail images, virtualize long rails, avoid full product inventory in initial payload, reserve image box dimensions to prevent layout shift.
- No heavy blur filters on 40 elements; simulate soft focus using opacity/tiny blur/scale on *few visible* items. Reuse geometry/materials/textures for avatars.
- Use reduced-motion media preference and provide a one-click static browse mode.
- First load must not wait for all garment media or 3D assets; make meaningful progress skeletons/fallbacks.
- Set explicit budgets as goals, not false claims: LCP ~2.5s on reasonable test conditions, CLS <0.1, no long main-thread animation blocks, no React error/hydration warnings.
- Respect color contrast, focus order, alt text, announced active product and meaningful labels; avoid motion sickness from uncontrolled camera movements.

### Device testing requirements

Test at minimum: Chrome desktop mouse+trackpad, Safari iOS touch, Android Chrome touch, iPad/tablet touch, keyboard-only, desktop reduced-motion, WebGL-disabled scenario, slow network, offline refresh/error pages. Playwright browser projects with viewports: 375×812, 390×844, 768×1024, 1024×768, 1440×900; include both RTL and long Persian product text.

---

## 16. App configuration and Liara deployment

### Local setup (zero external API spend)

- pnpm; local Docker daemon; Docker Compose runs `app` and **MySQL 8** with persistent *local dev* volume.
- `.env.example` includes: `NODE_ENV`, `DATABASE_URL`, `APP_URL`, `SESSION_SECRET` (generated), `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` (seed only, not logged), `MEDIA_STORAGE_PROVIDER=local`, `LOCAL_MEDIA_ROOT`, `STORAGE_S3_ENDPOINT` and credentials as **optional production-only variables**, `LEGACY_STORE_URL` blank by default, `CHECKOUT_MODE=demo`, `ENABLE_USER_PHOTO_TRYON=false`.
- No generative AI API variables required. No real deployment secrets committed.
- Drizzle migrations: committed + repeatable; `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio` if safe, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`.
- DB migrations are an explicit deployment step, **not on every HTTP request** or concurrently in each application replica.

### Docker production

- Multi-stage Dockerfile Node 22 slim/bookworm as suitable, pnpm lockfile, cached dependency layer, non-root runtime, Next.js `output: 'standalone'`, static files copied to appropriate paths, `PORT=3000`, binding `0.0.0.0`, runtime env validated, basic `/api/health` liveness route (does not expose secrets). Avoid shipping source assets/tests into runtime stage unless needed.
- `compose.yaml` for **local** app + database; production Liara single **Next.js app** plus independently provisioned MySQL; optional S3-compatible storage only if needed. Don't run MySQL inside the same Liara app container.
- Document exact verified Liara CLI or dashboard steps only after checking current provider docs; do not invent flags. Include `LIARA_DEPLOYMENT.md` covering app config, DB host/access, secret envs, storage adapter, healthcheck, HTTPS/reverse proxy, migration command, rollback and backup procedure.
- No expectation of zero hosting cost when actually deploying to Liara. **Zero-fee requirement means the MVP code runs locally without paid AI services or other mandatory third-party APIs.** Liara compute, managed MySQL, domain, image storage and bandwidth are infrastructure charges and may not be free.

---

## 17. Security, reliability, internationalization

- Strict TS, Zod parse at every boundary; escape unsafe text and do not render imported arbitrary HTML.
- DB queries parameterized by Drizzle; identifiers validated; cursor limits capped; SQL full-text search or simple indexed LIKE for small demo catalog (upgradeable), not full scan on every animation frame.
- Use sane CSP and CORS, allow only configured media/model domains; admin authenticated, upload files validated, images processed server-side appropriately.
- Avoid leaking stack traces/database errors to browser; structured logging with request IDs, no secrets/personally identifying data in logs.
- Handle DB unavailable with nice error states and observability logs; cart and selection behave gracefully.
- Respect imported rights/licensing; no scraping of protected assets or customer data.
- Correct Persian pluralization, digits/currency, date formatting, semantic RTL with direction overrides for SKUs, URLs and hex strings; product angle terms translated consistently. Design for future i18n without introducing a heavy system unnecessarily.

---

## 18. Testing strategy and proof requirements

### Unit tests

- Rack nearest-index calculation, gesture threshold, momentum/snap math, RTL keyboard mapping, resize recalculation, front/back image selection and fallback provenance.
- DTO validation, price conversion formatting, variant selection logic, stock checks, admin publish guards.

### Integration tests (real test MySQL)

- `migrate → seed → GET category/rail/detail` returns expected relational joins.
- Admin login and protected writes; unauthorized 401/403; invalid color or repeated SKU rejected.
- Reordering rail items persists across fresh API request and page reload.
- Updating color/media variant persists; public UI picks new DB state.
- Import same source twice is idempotent and doesn't destroy manual approved edits.

### E2E tests (Playwright)

1. Home loads brand and at least one actual DB-generated rail.
2. Desktop: drag to a different garment, mouse/keyboard focus, click, detail state opens; `Escape` closes.
3. Desktop: front↔back uses separate media or concept label; no reversed text.
4. Mobile: swipe updates selected product; tap targets work; normal vertical page scroll still works.
5. Switch categories: correct product count and sequence, no data from previous category.
6. Switch product color/size: correct price/media/stock; add to cart; cart persists after refresh.
7. Styling room loads a genuine orbitable WebGL avatar where supported, changes clothing category/color, front/back camera, pause animation; fallback when WebGL unavailable.
8. Admin adds product, variant, two media angles, creates rail and publishes; storefront updates without rebuild.
9. Admin changes brand color/logo and sees public update.
10. No CSS horizontal overflow / hydration warnings / browser console exceptions at test viewports.
11. A 50–100-product seeded rail remains smooth and bounded; virtual rendering works; memory doesn't grow endlessly after navigation cycles.
12. Mobile/browser back returns to previously selected item and rail state.

### Visual verification

- Save reference comparison screenshots and short recorded interaction clips. Verify at least timecodes 05.8s, 07.5s, 14.8s, 17.2s, and explain deliberate deviations for Persian RTL, real product assets and touch UX.
- Screenshot differences must be judged on visual characteristics and motion continuity; **do not** promise automated pixel exactness from a compressed, low-resolution video.
- Provide an acceptance matrix with each requirement `PASS`, `PARTIAL` or `BLOCKED`, evidence/test and next fix.

---

## 19. Execution roadmap — 8 meaningful phases, each with a working deliverable

**Codex is expected to write actual code and run tests, not stop at planning.** Each phase should leave the repo in a runnable state. Do not attempt all advanced shaders before the data flow works.

### Phase 0 — Discover + inspect video + environment

- Read video and this document; create explicit `REFERENCE_AUDIT.md` with timestamp-based motion and UI descriptions.
- Inventory repo if one exists; otherwise initialize fresh Next.js 16 + TS strict + Tailwind v4 + HeroUI v3 + pnpm.
- Verify actual package APIs and peer dependency versions from official documentation before installation.
- Check presence of `LEGACY_STORE_URL`; if absent record unresolved, **do not block** demo build.
- Create README, `.env.example`, `AGENTS.md`, `HANDOFF.md`, scripts and quality gates.
- Deliver: booting Next.js UI and accurate high-level architecture document.

### Phase 1 — Persistent database and API vertical slice

- Local MySQL Compose, Drizzle schema/migrations, real seed of at least 4 category/rail types and 24 distinct demo products with varied views/colors (seed entries only, not imported legacy data; license/placeholder labels), avatar presets/mappings, brand settings.
- Build repositories/services/DTOs and public GET endpoints, errors, typed domain boundaries.
- SSR homepage loads rails and products from MySQL; at least one page test queries DB.
- Deliver: editing a record directly in DB and refreshing changes the UI.

### Phase 2 — Reference-fidelity rail and interactions

- Create custom rail/rod/hanger/garment/caption, focused state, front/back flip, gesture physics, arrows, RTL keyboard focus, reduced-motion fallback.
- Use actual distinct FRONT/BACK demo assets or transparently labeled concept previews.
- Make 2+ different rails with real DB-driven category switch and animated transitions.
- Tune to supplied video frames and capture proof screenshots.
- Deliver: tactile, visually faithful desktop + mobile horizontal rail.

### Phase 3 — Product detail and cart

- Implement isolated product transition, media gallery, front/back/side, selected SKU/color/size, price, stock and product URLs.
- Real persistent cart via DB sessions, server-side calculations; demo-only checkout message.
- Add SEO metadata, search and adjacent-product recommendations.
- Deliver: complete functional browse-to-cart journey.

### Phase 4 — Admin dashboard with security

- Session login, role guard, protected layout, admin tables/forms, brand editor, categories, rails and reorder, products/variants/media CRUD, publishing, audit logs.
- Make storefront reflect changes with cache invalidation; tests demonstrate no runtime fixtures.
- Deliver: site owner can operate store content without changing source code.

### Phase 5 — Genuine 3D avatar and outfit preview

- Create/load licensed GLB(s) or build procedural character and clothing meshes; scene camera lighting, animations, material and garment switching, configurable presets.
- Real typed link from selected product variant → garment model mapping and approximation status.
- Orbit/zoom/touch/keyboard camera + reduced motion/WebGL fallback.
- Deliver: at least 4 category shapes (T-shirt, sweatshirt/hoodie, jacket, pants) in preview, 2 distinct character presets, color mapping, visible movement and clear fidelity disclaimer. Do NOT integrate paid AI.

### Phase 6 — Legacy import adapter + asset stewardship

- Implement import interfaces, staging UI and validation with local fixture sources for tests; do not perform real import until legacy URL is known.
- Add media storage abstraction and local upload; review missing back views and concept generation provenance.
- If URL later given, perform legitimate site audit/brand import/source image migration after approval.
- Deliver: safe, testable import scaffolding, no fabricated legacy data.

### Phase 7 — Final polish, performance, deployment readiness

- Fix mobile Safari issues, tablets, keyboard, accessibility, reduced motion, liveness/error states and layout overflow.
- Stress rail with 100 items and test GPU memory leaks, canvas unmount, controlled animation state.
- Build standalone Docker image, validate Compose, confirm app actually runs in production mode, provide precise Liara readiness instructions.
- Playwright E2E, TypeScript, lint, DB tests; final acceptance matrix and video/screenshots.
- Deliver: runnable MVP and detailed truthful handoff.

### Phase exit condition

A phase is not complete just because components render. It is complete only if route loads, real DB/API state works, relevant tests pass, responsive interaction behaves as intended and `HANDOFF.md` is updated.

---

## 20. HANDOFF.md — mandatory context persistence after each phase

Update `HANDOFF.md` at the end of **EVERY** phase, and when approaching context exhaustion. Required fields:

```
# HANDOFF

## Current state
## What changed (file paths and behavior)
## Decisions and tradeoffs
## Reference-video fidelity observations
## Database/migration status
## Test results (commands and pass/fail)
## Discoveries
## Remaining work
## Blockers (e.g. unavailable WooCommerce API or verifiable product-back photographs)
## Next steps (precise first task)
## Important files
```

Be concise but precise. Never call an incomplete or mocked module done. Avoid a long narrative transcript. Ensure another Codex session can immediately resume and rerun the project without rediscovery.

---

## 21. Definition of done (MVP acceptance checklist)

**ALL of the following must be true:**

- [ ] `.env.example`, Compose, documented setup and `pnpm` commands actually start a local MySQL+Next full-stack app.
- [ ] At least 4 data-driven rails / categories, verified Sarochi import records (with explicitly labeled temporary demos only where import is blocked) in MySQL; no hardcoded runtime product/catalog JSON.
- [ ] Main hanging garments/rod/hangers evoke reference frame; clean focus lift, lateral movement, clear readable labels and front/back controls.
- [ ] Desktop drag, trackpad, mouse hover/click, keyboard and mobile swipe/tap behave fluidly; no ghost clicks and no scroll jacking.
- [ ] Detail transition/background fade/arrow controls match reference character and work on narrow phones.
- [ ] Actual color/size variant selection, stock, price and front/back photos are synchronized with DB.
- [ ] Missing rear images have clear conceptual preview badges or transparent fallback; **no fake product photography**.
- [ ] Interactive real 3D WebGL character with controllable camera, meaningful idle movement, gender/presentation presets and category-specific garment geometry/color; no AI key needed.
- [ ] Avatar approximation is honestly disclosed; no promise of exact drape/fit, no user photo uploads.
- [ ] Authenticated admin CRUD for branding, categories, rails, item order, products, variants, and media persists to MySQL and updates storefront without rebuild.
- [ ] Security baseline, migration strategy, reliable error states, admin/audit logs.
- [ ] Real cart CRUD, explicit demo checkout, no fake paid order.
- [ ] Mobile/tablet/desktop responsive, RTL Persian, accessible keyboard/reduced motion and practical WebGL fallback.
- [ ] Lint, typecheck, build, tests and E2E pass or failures explicitly logged with reproduced blockers.
- [ ] Multi-stage Next standalone Docker build documented; deployment assumptions/charges honest.
- [ ] `HANDOFF.md`, `README.md`, `REFERENCE_AUDIT.md`, `docs/research/SAROCHI_SOURCE_AUDIT.md` and a generated `LEGACY_AUDIT.md`, and final acceptance report up to date.

---

## 22. Instructions to Codex on first execution

**Start work immediately, rather than asking for new conceptual planning.**

1. Inspect provided reference video/assets and the repo. Read `AGENTS.md` and `HANDOFF.md` if present.
2. Make a short internal implementation plan, validate current official versions and choose the package stack specified here.
3. Begin Phase 0 and Phase 1 with executable app/database/API wiring, then build the rail. Prioritize the first working vertical slice rather than trying to write the whole repo in one massive untested pass.
4. If `LEGACY_STORE_URL` is absent, use replaceable demo brand and **seeded DB demo data** with honest labels. Do not ask to postpone the entire project.
5. Use original designs and properly licensed assets. Never copy the reference video brand as if it belonged to the owner.
6. Do not require payment, AI tokens, cloud endpoints, paid avatar assets or user photos. Ship functioning local animation/assets instead.
7. After each phase run checks, capture proof, keep `HANDOFF.md` current and commit meaningful changes if repository is configured.
8. Report exactly what works, what is approximate, what is pending source content, and the next runnable commands.

### Final delivery expected from Codex

- Actual working Next.js source code including admin/public pages and API routes.
- Database schema, migrations, seed script and seeded records.
- Video-faithful rail with responsive pointer/touch/keyboard interactions.
- Product detail, variants/cart, honest front/back imagery handling.
- Browser-based truly 3D avatar + 3D apparel category approximations.
- Protected admin content management and publish behavior.
- Multi-stage Docker and local Compose.
- Tests plus a small screen-recorded demonstration and reference comparison captures.
- Complete `README.md`, `HANDOFF.md`, `REFERENCE_AUDIT.md` and final status report.

---

## 23. Technical reference links (official docs, check for updates)

- Next.js docs: https://nextjs.org/docs/app ; self-host: https://nextjs.org/docs/app/guides/self-hosting ; standalone: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- HeroUI v3 quick start: https://heroui.com/en/docs/react/getting-started/quick-start ; framework integration: https://heroui.com/en/docs/react/getting-started/frameworks
- Drizzle MySQL with mysql2: https://orm.drizzle.team/docs/get-started/mysql-new
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber/getting-started/introduction ; package/version notes: https://github.com/pmndrs/react-three-fiber
- React Three Drei: https://github.com/pmndrs/drei ; reference examples: https://github.com/pmndrs/examples
- Motion for React: https://motion.dev/docs/react-motion-value ; drag: https://motion.dev/docs/react-drag ; spring: https://motion.dev/docs/react-use-spring
- Playwright: https://playwright.dev/docs/intro
- Liara provider: https://liara.ir/ — verify current managed DB, Docker, object-storage and CLI documentation before production deployment.

**End of implementation spec.**

---

# SAROCHI-specific binding requirements — authoritative addendum

> **This addendum overrides any earlier generic wording in this spec.** The owner has now supplied the live store, five screenshots and the video. Use this actual business context. Read `AGENTS.md` + `HANDOFF.md` + `docs/agent/START_HERE.md` before touching code. The attached website screenshots are documentation of the *OLD data/commerce model*, not a visual layout to reproduce.

## A. Identity and real source of truth

- **Brand:** SAROCHI / ساروچی; legacy website `https://sarochi.ir/`; current site presents itself as Iranian **menswear**. Preserve established brand name, real domain, Persian RTL, product names, categories, price and policy text subject to revalidation. Do not invent a new business name, logo, physical store, checkout terms, real reviews or social links.
- **Brand assets:** obtain legitimate original logo from the owner's existing site or authorized files; screenshot wordmark looks like a restrained black serif-style Latin `SAROCHI` wordmark. Treat this as a *visual observation* and reproduce with a permitted wordmark/vector only after reviewing source/owner asset. Do not copy the legacy green-sale treatment, old header, old filters sidebar, old WooCommerce cards or pagination as the new design.
- **Color/visual split:** the video is the **motion / object behavior reference**; old Sarochi screenshots and pages are the **business / taxonomy / media / product detail reference**. New art direction is specified below. Do not substitute video reference's other brands or models for SAROCHI.
- **Known source pages:** homepage, `/shop/`, `/product-cat/salonik-stitch/`, `/product-cat/t-shirt/`, `/product-cat/shirt/`, `/product-cat/single-blazer/`, `/product/%d8%a8%d8%a7%d9%81%d8%aa-%db%8c%d9%82%d9%87-%d9%87%d9%81%d8%aa-%d8%b3%d8%a7%d8%af%d9%87-pink/`; see source audit. Category `/product-cat/pants/` had an unusable old maintenance snapshot in public search and must be re-validated.
- **Inventory uncertainty:** a publicly retrieved `shop` page reported 267 results but was crawled about three months before this audit; current category pages show 43 knits, 59 T-shirts, 61 shirts, 57 single blazers. Different crawls and cached listings yield conflicting prices and product counts. Never assume 267 is today's truth or seed it as the true count. Require a current paginated scrape/API import, reporting discovered/processed/persisted/rejected/incomplete counts and freshness.
- **Gender segmentation:** the actual audited catalog is men's apparel. Support `audience = MEN | WOMEN | UNISEX` in the schema and avatar UI, but **do not invent women's merchandise**. Women's rails remain admin-configurable and display only if real assigned merchandise exists. Avatar presentation choices do not imply that clothes or styling advice match body measurements.

## B. The Living Atelier — signature homepage, not a generic e-commerce clone

Create an authored, immersive **SAROCHI / The Living Atelier** fashion experience (creative direction, not an unsupported claim that no other website has ever done it). Specific layout/behavior:

1. **Opening frame / “Door to the Atelier” (first screen):** nearly monochrome moonlight/ivory textile studio, a dramatic but lightweight animated seam/curtain opening, uppercase SAROCHI wordmark or owner logo, one meaningful invitation `ورود به کالکشن`. Main product rail begins interactable immediately or within first scroll; no hard-gated loader, no video autoplay or forced multi-second intro. Hero motion choreographed with one primary depth cue, restrained typography, no heavy template-style gradients.
2. **World-as-navigation:** the rod/rack is the spine of the page. Category changes adjust rail composition, backdrop tone, garment arrangement and editorial chapter counter; they must not reset the page into stock WooCommerce cards. Category labels use actual MySQL category names and optional admin-configured editorial copy.
3. **Physical rack reveal:** thin continuous graphite rod, wooden hangers, transparent-background garment cuts, depth-ranked garments (inactive angled/slender, active full frontal), believable pendulum hanger response to dragging, soft ambient shadows and tiny transient light glide. Product is sharp/clear while nearby garments are present and subordinate. Invisible oversized hit targets, active garment never detaches from hanger, no clipping at responsive sizes.
4. **“The garment leaves the rail”:** when a product is chosen, animate it toward viewer while other items recede/blur; hanger stays visually coherent, selected product resolves into a display-stage detail. Front/back turn uses true media or explicitly illustrated conceptual view. Color palette selection and size picker sit in a calm, persistent product UI; action to enter 3D Atelier is prominent and real.
5. **“Mirror room”:** a separate lazy-loaded 3D environment with rotating, animated illustrative avatar. Select product color, avatar style archetype, rotate body, see a product-type-matched garment silhouette and approximate selected tone; display label explaining illustrative—not size-accurate—preview. Crossfade from isolated product into mirror room, no jarring full reload.
6. **Chapter transitions:** an editorial trim/seam becomes a transition axis between visual spaces, driven by scroll-progress only when this improves navigation; no scroll-jacking, no zoom-on-every-event, no seizure-like effects. Provide mobile thumb-swipe first interaction and `prefers-reduced-motion` alternatives.
7. **Commerce utility layer:** subtle accessible floating controls for `جستجو`, `فیلتر`, `سبد خرید`, `دسته‌بندی‌ها` and `راهنمای سایز`; product stock/price are never obscured by fancy motion. Deep-link pages, indexable product metadata, grid fallback, canonical links, keyboard navigation and quick checkout demo are essential.
8. **Mobile-specific direction:** the hero is compositionally redesigned (not desktop scaled down), stage aspect ratio adapts dynamically, 2–4 central garments visible with edge peeks, lightweight textured background, bottom product information sheet with safe area, pointer-free flip controls, tactile snapping without hijacking vertical page scroll. 3D room interactive by one-finger orbit **only within dedicated scene**, pinch zoom capped; simple direction buttons as accessible alternative.

### Unique visual modules to build (reusable and configurable)

`AtelierPortal`, `EditorialChapter`, `RackWorld`, `RailSpine`, `Hanger`, `GarmentPlane`, `GarmentSway`, `RackSelectionHUD`, `RackCategoryTabs`, `GarmentReveal`, `GarmentBackFace`, `OutfitStage`, `MirrorRoomScene`, `CharacterRig`, `WardrobeMesh`, `FabricLightRig`, `SizeGuideDrawer`, `VariantSwatches`, `ProductCommercePanel`, `ContextualNavigation`, `CatalogGridFallback`, `ReducedMotionExperience`. These are architectural roles, not a demand for one-file-per-tiny-component. Implement isolated feature folders with tested compositional APIs.

**Technical honesty:** 2D photographs on DOM-3D-transformed hangers are a convincing *2.5D rail*; the dedicated animated avatar is actual GPU-rendered 3D. **Do not claim arbitrary imported front/back product photographs are automatically turned into a true 360° mesh.** An accurate cloth-on-body drape requires 3D garment assets or fitted simulation beyond this free MVP. Implement silhouette classes as stylized rig-friendly garment geometry; front-label print decals only when verified. Each media asset stores provenance `ORIGINAL_FRONT | ORIGINAL_BACK | ORIGINAL_DETAIL | CONCEPT_REAR | PROCEDURAL_3D` and show concept indicators wherever displayed as product imagery.

## C. Actual catalog / business capabilities that must migrate

1. Hierarchical categories, alias names, nested slugs; current examples documented in source audit. New rails should be curated collections from MySQL, not automatically equating every raw WooCommerce leaf to its own endless rack.
2. Product family/grouping: old site appears to represent several color options as separate products (e.g. several color-named polo shirts). Support `ProductFamily`, `ProductVariant`, `color`, `size`, `sku`, independent stock and pricing, with **admin-reviewable grouping**. Do not merge unrelated items just because their names look similar.
3. Distinguish **listed sale/current price** and **original/compare-at price**, store integer TOMAN (no float) + original currency metadata and extraction timestamp. Example from a recently crawled **category** page: `بافت یقه هفت ساده Pink` original 6,480,000 تومان, sale 5,184,000 تومان, sizes M/L/XL on that listing. See also source product page, screenshot, mismatch review; do not hardcode such examples as live prices.
4. Faceted filters: **category, price range, color, size, in-stock, sale, order** (newest, price low/high; optional popularity only if reliable), preserved in URL query strings. Numeric sizing (e.g. 46–60) for tailoring, letter sizing for knits; schema is generic `SizeOption` with sortable order. Render available filters based on real DB aggregates, not static visible filters.
5. Multi-angle product gallery with transparent garment cutout generation **only when reliable**. Original gallery images may include collage closeups, alternate angles, front-only or lifestyle photos; classify, do not fabricate a rear photograph. Preserve originals; create **derived** foreground cutouts separately. Free offline background segmentation may be optional and run as local tool only when installed; simpler clean CSS white/invisible background is acceptable without source tampering.
6. Product detail: title, selected color/size, availability, compare-at/sale price, descriptive content, shipping/returns policy, relevant measurements, cart CTA, related items. Example knit product source includes a 6-row men's knit size guide (S–XXXL; measurement fields: chest width, shoulder, sleeve, garment length) and care instructions. Such structured guides belong in DB/CMS and are displayed appropriately. NO invented size/stock/return policies.
7. Brand pages/help/contact/shipping/returns should use verified source content as reviewed CMS pages, never dummy address/phone/social integrations. Existing homepage mentions free/fast shipping, installment purchase, organization collaborations; display only if accurate and approved for new brand launch.
8. Basic cart with quantities and actual product variants; inventory check and idempotent admin updates. Checkout is **clearly demo-only** unless separately integrated; no SMS/OTP/payment calls in the free MVP.

## D. Import implementation: must actually ingest SAROCHI

**Three adapter strategies, in descending preference:** (1) owner-authorized WooCommerce product/category CSV export or REST endpoint, (2) publicly exposed WooCommerce Store API **only if accessible and permitted**, (3) permitted HTML category and paginated product pages. Each strategy must implement a single typed `LegacyCatalogSource` interface; data flow `fetch → parse → normalize → validate → stage → review → upsert to MySQL → reconcile → publish`. Never scrape customer accounts, orders, protected APIs or bypass bot defenses. Respect limits, no abusive concurrency.

Required CLI/UI commands (can vary naming but keep behavior):

```
pnpm import:sarochi --dry-run --pages=all
pnpm import:sarochi --commit --reviewed
pnpm import:sarochi --reconcile
pnpm import:sarochi --resume=JOB_ID
```

- URL/path-based stable external ID if upstream numeric ID absent. Store canonical source URL, source ID if available, normalized signature, extraction time, publish status, source hash. Preserve raw response **in safe development-only import evidence** for field debugging; no production API secrets in logs.
- Parse meta tags, JSON-LD/Product when present, WooCommerce HTML variation tables, galleries, optional availability. Paginate until an objectively verified endpoint (empty/no-next) and record duplicates; don't stop at the visible first 12 items.
- Price must carry `currency`, `amount`, `saleAmount`, `collectedAt`, `confidence`, `sourceUrl`; if rial-vs-toman ambiguity exists mark NEEDS_REVIEW instead of `*10` guessing. Gallery images must be downloaded via authorized hosting and verified; no runtime hotlink dependency.
- Flags `MISSING_IMAGE`, `MISSING_REAR`, `VARIANT_UNKNOWN`, `PRICE_CHANGED`, `STOCK_UNVERIFIED`, `POSSIBLE_DUPLICATE`, `POSSIBLE_COLOR_FAMILY`, `MEDIA_ANGLE_UNCERTAIN`, `IMPORT_CONFLICT`. The admin can approve, suppress or resolve. Never fabricate stock levels.
- Import is idempotent, paginated, resumable, transaction-batched, rate-limited, retry/backoff; on partial failure preserve completed work. Existing admin overrides remain unless explicitly reviewed. Imported data appears in source audit, coverage report and from real repository/API on the live UI.
- **Completeness gate:** compare per-category observed source counts with staged and persisted counts, including page counts, missing media, rejected entries. If blocked by anti-bot/export access, **STOP claiming full catalog migration** and present the exact missing rights/paths/approvals. Deliver fully functional architecture and a subset clearly marked `partial import`, not fictional completeness.

## E. Hard-coded content prevention and admin capabilities

Brand, menu, locale, categories, collection sections, ordering, product families, variants, prices, stock, palette color labels, image angles and URLs, shipping/care/size guides, and featured merchandizing slots live in MySQL (or durable configured asset storage references). Technical **design tokens, motion constants, SVG hanger shape, fallback shader constants** can live in version-controlled code. Initial seed files/fixtures are allowed **only to populate the DB**; never import product fixture JSON directly into client components. Include secure admin RBAC, strong password hashing, session rotation, Zod validation, CSRF/Origin protections for cookie-auth mutations, rate limiting, server-only env secrets, and audit log.

## F. Quality priorities; don't bury working commerce under graphics

- On desktop target 60fps interaction; on mid-tier phones design adaptive effects with a stable 30–60fps experience depending hardware. These are profiling goals, not guarantees. Avoid layout thrash and excess texture allocations; track interaction-to-next-paint, bundle size, Core Web Vitals and WebGL resource disposal.
- Isolate WebGL to styling route, avoid expensive three.js in critical hero chunk. Use motion values & transforms for rack without 60 React setStates per second. Skeleton and instant functional fallback are mandatory.
- Unit, integration with MySQL, Playwright E2E desktop/iPhone-like emulation, screenshot/video comparison to source frame references, and real API-backed admin→store smoke test must ship.
- Build `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `docker compose up --build`; reproducible in README. Test Liara compatible Docker standalone Node deployment, environment variables and connection pooling; **Liara hosting and MySQL may cost money**, although the app needs **zero paid AI API**.
- Every started, suspended, completed or blocked task must update `HANDOFF.md` and `docs/agent/TASKS.md` with atomic status. Work can pause cleanly on context exhaustion. Do not re-read the whole repository by default; follow startup protocol in `docs/agent/START_HERE.md`.

## G. Acceptance demonstrations (must be screen-recorded or test-evidenced)

1. From a fresh DB, an importer can fetch allowed Sarochi sources or import an authorized export into MySQL; categories and products are verified using SQL counts and coverage report.
2. Admin edits a category name / rail order / product color-price-size; public rail and product detail update without source change or rebuild.
3. Desktop: rack drag, hover, flip, focus isolation, detail, color & size selection, avatar scene; mobile: swipe, tap, flip, detail, avatar orbit without scroll conflict; keyboard and reduced-motion fallback.
4. Select an audited product from real MySQL; product images are genuinely from authorized SAROCHI content, missing backs indicated honestly; avatar displays stylized procedural matching category/color, not invented accurate cloth geometry.
5. Responsive tests 320, 375, 390, 768, 1024, 1440px and short-height landscape. No cut-off controls, overflow, stuck scroll, page-slowing WebGL, or accessibility traps.
6. `HANDOFF.md`, `AGENTS.md`, `docs/agent/*`, `docs/research/*`, `README.md`, `DESIGN_SYSTEM.md`, migrations and executable scripts accurate as of the latest commit; passing checks with proofs, and clearly marked partials.
