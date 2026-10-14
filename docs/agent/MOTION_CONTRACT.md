# Motion contract — derived from OWNER reference video

**Video:** `references/video/interaction-reference.mp4` (26.7s, 640×496, 30fps). Visual scan via `references/video/contact-sheet.jpg`; higher detail frames in `references/video/frames/`. Use the actual movement and source product photographs. The owner's 2026-10-13 correction supersedes procedural avatar/garment and conceptual-back approvals: real human, exact garment; see ADR-016 and FIX-R02.

| Timestamp | Video evidence | Required interaction/choreography |
|---|---|---|
| 0–3.5s | Fashion model/editorial montage | inspiration for cinematic rhythm only, not SAROCHI inventory/model identity |
| ~3.5–5.5s | Pale green dotted studio; line across upper area, many garments on wooden hangers | desktop rail presentation: slender graphite bar, believable hooks, fixed hanger anchor, cropped side garments |
| ~5.5–7.7s | Side-hung clothes, active garment turns frontal and neighbors clear space | Rest all hanger+garment assemblies sideways; hover/held touch shifts neighbors and rotates selected assembly to front; leave/release restores side. No zoom-only focus. Back button only for actual inspected original back; omit missing-back control/copy. |
| ~7.7–10s | Shift focus among garment items with spring-like composition; some caption text below | coherent horizontal continuous track, measured spring, caption not overlapping labels |
| ~12–14.8s | Another fashion UI shot then rail, black printed garment highlighted | multi-category racks + persistence, no fake new brand names from reference |
| ~15–18.5s | Solo hanger/product in center, others fade into background; side round controls; index bottom | `ISOLATING` stage: inactive fade+blur, selected to x0, enlarged; prev/next controls and meaningful counter |
| ~19–26.7s | Real human with selected outfit | Actual original on-model photographs are an interim supported view. Every-garment exact human dressing remains FIX-R02; no generic body/outfit substitution or claimed completion. |

## State machine (no imperative one-off spaghetti)

```
INITIALIZING -> BROWSING
BROWSING -> DRAGGING -> SETTLING -> BROWSING
BROWSING -> FOCUSED -> FLIPPING -> FOCUSED
FOCUSED -> ISOLATING -> DETAIL
DETAIL -> STYLE_ROOM (actual source photographs; true garment transfer pending)
ANY -> SWITCHING_RAIL -> BROWSING
DETAIL or STYLE_ROOM -> previous state (browser history coherent)
```

Event priorities: pointer capture and user cancellation, drag >8px suppress click, ignore tiny accidental drags, only one selected product. Focus and navigation stable during window resize; invalid/deleted product must revert safely. Don't dispatch setState for all garments on every pointer frame; use `motionValue`, transforms and one parent track.

## Motion defaults (tune by recording own browser and comparing reference)

| Element | Suggested initial timing/dynamics |
|---|---|
| Enter rack | 550–850ms ease + 35–70ms stagger visible garments |
| Drag inertia | controlled velocity, no runaway, no overscroll rebound that clips stage |
| Snap | spring stiffness 190–260, damping 25–34 |
| Highlight active product | Rotate side→front, move neighbors apart, preserve hanger hook anchor and constant garment scale; use centralized springs. |
| Hanger sway | pivot around top hook; low amplitude 2–5° damped based on drag velocity; no dizzy wobble |
| Front/back flip | 400–650ms real 3D `rotateY`; text not mirrored, swap correct face when crossing 90° |
| Rail switch | 300–550ms staged exit/enter; avoid full flash |
| Product isolation | 500–750ms fade/blur neighbors, centered hanger and isolated garment |
| Source human photograph | Stable original photo, accessible gallery controls; no fabricated avatar intro. |

**Must test 05.8, 07.7, 14.8, 17.2, 19.7s frames** and mobile equivalents. The animation values are design hypotheses, not measurements extracted with motion tracking.

## Pointer, wheel, swipe, accessibility

- Desktop hover turns the hovered assembly frontal and opens neighbor space; leave restores side. Click selects, explicit CTA isolates, keyboard Enter/Space may isolate. `نمای پشت` exists only with verified real front/back. Stable pointer hit boxes prevent hover jitter.
- Desktop drag in empty space or on clothing; wheel-X works; do NOT convert scroll-Y into forced horizontal scroll of entire page. Category rail carousel can be intentional, but preserve normal vertical page navigation.
- Held touch turns frontal and opens neighbor space, release/cancel restores side; swipe scrolls horizontally without isolation/ghost clicks. Vertical page scroll remains normal (`touch-action: pan-y`). Explicit CTA isolates; large touch controls and safe area remain.
- Keyboard: Tab to products/controls, Arrow controls with explicit RTL-aware visual direction, Home/End, Enter, Space and Escape. Bypass animation for reduced-motion mode; offer catalog grid fallback.
- Single hanger + garment should render with stable DOM identity, avoiding unmount/remount on every drag. For long racks render viewport window + overscan, but keep logical index stable and accessible.

## Real-human styling — replaces rejected 3D approximation

- Public route renders only actual exact-product source photographs. Prefer explicitly inspected full-body on-model originals; retain face, hands, legs and garment details/color. No procedural primitive, generic colored mesh or unrelated dressed model.
- Today 9 products have genuine source on-model evidence. For other products, own original gallery is an interim view, not a completed virtual dressing feature.
- FIX-R02 must prove a legally usable local garment-transfer/model pipeline on one actual white garment before integration. Person-photo download alone is insufficient. Source identity/fidelity, asset provenance and per-product coverage must be tracked; no paid key or visitor upload.
- No exact-fit or accurate-360 claim from source photographs; original backs cannot be synthesized or inferred as genuine.
