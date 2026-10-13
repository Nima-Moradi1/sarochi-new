# Design system — SAROCHI / The Living Atelier

**Creative intent:** innovative, unforgettable, editorial, high-fashion atelier. Not a copy of the old store; not an exact replication of foreign brand art in the video. Dramatic *composition and object interaction*, disciplined visual restraint and actual usability. Build a personalized, recognizable SAROCHI visual language; a claim of absolute global uniqueness is not verifiable.

## Brand source vs new art direction

- Keep official `SAROCHI` logo/wordmark once actual licensed asset sourced. Owner screenshots show a monochrome serif-like Latin wordmark. Never rebrand under a made-up name.
- Current old screenshot has bright white retail layout and bright green discount badges; **DO NOT copy** these old visual motifs or card/sidebar layout. Preserve commercial functionality but redesign completely.
- Working palette **proposal** until owner approves: Porcelain `#F4F2ED`, Atelier Chalk `#E9EEE8`, Ink `#171B19`, Graphite `#343936`, Warm Wood `#9B765A`, Moss `#465B4F` only for understated highlights; avoid saturating interface. Palette is new identity proposal, not a claim of historical Sarochi official colors. Configure as tokens and admin-selectable bounded themes.
- Large editorial Latin type for `SAROCHI` and chapter titles (permitted font), Persian Vazirmatn for UI and product copy. Use self-hosted/open-license fonts where possible. RTL must support mixed Persian/Latin IDs/numerals correctly with `dir=ltr` isolated price/SKU where needed.
- Intro animation: seam reveal/soft moving shadow, product rail foreground. One focal animation per section; intricate character/garment physical response gives memorability, not arbitrary glowing blobs everywhere.

## Token structure

Implement centralized `src/design-system/tokens.ts`, `motion.ts`, `typography.ts` and theme CSS variables using Tailwind v4. Example **starting** tokens (tune against screenshot/video):

```
--surface-canvas: #F4F2ED;
--surface-rack: #E9EEE8;
--text-primary: #171B19;
--text-secondary: #666E69;
--accent-moss: #465B4F;
--hanger-wood: #9B765A;
--radius-control: 12px;
--radius-sheet: 24px;
--shadow-garment: 0 22px 50px rgba(0,0,0,0.09);
```

Never hardcode them in 30 components. Semantic aliases: `surface`, `surfaceMuted`, `textPrimary`, `textMuted`, `accent`, `borderSubtle`, `focusRing`, `sale`, `error` etc. Contrast must pass accessible tests; typography scaled using clamp, with 200% text resizing. Prefer icons from one consistent library, not emoji in production UI.

## Signature UI choreography

1. **Atelier portal:** substantial white space, centered owner SAROCHI identity, cropped stage glimpses and clear `کالکشن را کشف کنید`. No splash screen blocking the entire shopping journey.
2. **Rack world:** continuous metal rod at top third, authentic wooden hangers, one focused garment 15–45% larger depending width, grayscale/soft inactive items. Don't merely horizontally scroll product cards.
3. **Collection rail switch:** category title transitions with rail content and background lighting on shared motion timeline; maintain stable navigation affordance.
4. **Garment isolate:** selection detaches *visually into new focus* while hanger remains coherent; product image fills center, quiet metadata and color swatches.
5. **Commerce sheet:** mobile bottom drawer, expanded size/price/availability; every CTA has states. All buttons reachable by thumb, bottom safe-area respected.
6. **Mirror room:** quality lit neutral studio, non-objectifying model presets, orbit+idle; color/garment change with restrained crossfade; prominent conceptual preview label, no implied measurement guarantee.
7. **Alternate catalog:** polished modern grid/list only on accessible search/shop/fallback surfaces; the homepage should prioritize fashion rail experience.

## Component semantics and boundaries

- `Button`, `IconButton`, `FormField`, `Select`, `Dialog`, `Drawer`, `Tooltip`, `Navigation`, `Tabs`, `Toast`, `Skeleton`: HeroUI wrappers, not homebrew duplicates.
- Custom unique components: `GarmentRack`, `GarmentHanger`, `GarmentPreview`, `RailTrack`, `CollectionSwitcher`, `ProductIsolate`, `VariantColorSelector`, `AvatarViewport`, `OutfitPresets`.
- Auth, form and admin components must consume domain DTOs rather than import API clients deep from presentational leaf nodes.
- `src/app/globals.css`: ONLY `@import 'tailwindcss'` / HeroUI required setup, font faces/theme variables, minimal resets/focus/accessibility. NO page-specific body styles, keyframe dumping or massive `.rail > ...` selectors. Keyframe/compositor edge cases can live in scoped CSS Modules.

## Responsive compositions

- ≥1440: hero immersive wide stage, rack spans width, discrete controls.
- 1024–1439: less garment density, comfortable product panel, no cropped hangers.
- 768–1023: compact editorial stage with preserved drag and accessible nav.
- 360–767: mobile-designed hero, 2–4 visible hanging items + peeks, bottom product controls; touch swipes friction-limited; overlays safe-area aware.
- 320–359: condensed copy and stacked controls; never tiny fonts, clipped color buttons or horizontal page overflow.
- Landscape/short height: stage relative to viewport height, must allow page scroll; don't rely on fixed full-screen exclusively.

## Motion accessibility / polish checklist

- All core functions work with `prefers-reduced-motion: reduce` where transforms become near-instant/low-amplitude, no auto-orbit; focus ring visible; all controls with readable `aria-label`.
- 44px-ish touch target guideline; avoid forcing `cursor: grab` over tappable actions; generous edge safe zones.
- Use actual localized commerce words: `قیمت`, `انتخاب رنگ`, `سایز`, `نمای پشت` / `پشت واقعی موجود نیست`, `پرو سه‌بعدی تقریبی`, `افزودن به سبد`, `جستجو`, `موجودی نامشخص`.
- Use real owner product images; cropping/reflection/shadows should not distort fabric/detail; don't hallucinate branding, buttons or rear seams.
- Never hide essential size/price behind hover, fine mouse control or an unskippable scene. Test screenshots and video on mobile + desktop.

## Change control

Update this document only when design tokens, motion principles or component policies change. Changes to accepted brand identity require owner-approved asset. All actual designs must be tested in browser; pretty screenshots alone insufficient.
