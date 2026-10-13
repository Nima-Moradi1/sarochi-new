# Motion contract — derived from OWNER reference video

**Video:** `references/video/interaction-reference.mp4` (26.7s, 640×496, 30fps). Visual scan via `references/video/contact-sheet.jpg`; higher detail frames in `references/video/frames/`. This is a montage of different inspiration sources, **not** a single functioning site to clone wholesale. Use only object movement, interaction patterns, transitions as behavioral targets; respect Sarochi brand and actual images. Video's last real-person preview is 2D; owner explicitly wants a separately implemented true 3D virtual model.

| Timestamp | Video evidence | Required interaction/choreography |
|---|---|---|
| 0–3.5s | Fashion model/editorial montage | inspiration for cinematic rhythm only, not SAROCHI inventory/model identity |
| ~3.5–5.5s | Pale green dotted studio; line across upper area, many garments on wooden hangers | desktop rail presentation: slender graphite bar, believable hooks, fixed hanger anchor, cropped side garments |
| ~5.5–7.7s | Black top expands into active foreground, reverses/back print; adjacent clothes remain | hover focus with front/back face labels, perspective compressed neighbors, hover + click and explicit flip; rear must have verified image or visible concept notice |
| ~7.7–10s | Shift focus among garment items with spring-like composition; some caption text below | coherent horizontal continuous track, measured spring, caption not overlapping labels |
| ~12–14.8s | Another fashion UI shot then rail, black printed garment highlighted | multi-category racks + persistence, no fake new brand names from reference |
| ~15–18.5s | Solo hanger/product in center, others fade into background; side round controls; index bottom | `ISOLATING` stage: inactive fade+blur, selected to x0, enlarged; prev/next controls and meaningful counter |
| ~19–26.7s | Different interface, real woman with outfit swap in video | create *new* 3D mirror room with generic stylized avatars and garment representations; no claim of AI video try-on |

## State machine (no imperative one-off spaghetti)

```
INITIALIZING -> BROWSING
BROWSING -> DRAGGING -> SETTLING -> BROWSING
BROWSING -> FOCUSED -> FLIPPING -> FOCUSED
FOCUSED -> ISOLATING -> DETAIL
DETAIL -> MIRROR_ROOM (3D, lazy loaded)
ANY -> SWITCHING_RAIL -> BROWSING
DETAIL or MIRROR_ROOM -> previous state (browser history coherent)
```

Event priorities: pointer capture and user cancellation, drag >8px suppress click, ignore tiny accidental drags, only one selected product. Focus and navigation stable during window resize; invalid/deleted product must revert safely. Don't dispatch setState for all garments on every pointer frame; use `motionValue`, transforms and one parent track.

## Motion defaults (tune by recording own browser and comparing reference)

| Element | Suggested initial timing/dynamics |
|---|---|
| Enter rack | 550–850ms ease + 35–70ms stagger visible garments |
| Drag inertia | controlled velocity, no runaway, no overscroll rebound that clips stage |
| Snap | spring stiffness 190–260, damping 25–34 |
| Highlight active product | 180–270ms; active scale 1.15–1.45 responsive; maintain physical hanger anchor |
| Hanger sway | pivot around top hook; low amplitude 2–5° damped based on drag velocity; no dizzy wobble |
| Front/back flip | 400–650ms real 3D `rotateY`; text not mirrored, swap correct face when crossing 90° |
| Rail switch | 300–550ms staged exit/enter; avoid full flash |
| Product isolation | 500–750ms fade/blur neighbors, centered hanger and isolated garment |
| Avatar intro | 400–800ms, idle breathing/weight shift, deliberate turn transition |

**Must test 05.8, 07.7, 14.8, 17.2, 19.7s frames** and mobile equivalents. The animation values are design hypotheses, not measurements extracted with motion tracking.

## Pointer, wheel, swipe, accessibility

- Desktop hover active item; clicking selects/isolates; clear `نمای پشت` flip button; proper cursor and pointer hit boxes. Do not repeatedly flip automatically due to micro jitter.
- Desktop drag in empty space or on clothing; wheel-X works; do NOT convert scroll-Y into forced horizontal scroll of entire page. Category rail carousel can be intentional, but preserve normal vertical page navigation.
- Touch swipe horizontal inside rack; vertical page scroll unaffected (`touch-action: pan-y` and gesture intent). Tap focuses, touch CTA isolates; no hover dependence. Large controls, `safe-area-inset-bottom` and snap for variable item widths.
- Keyboard: Tab to products/controls, Arrow controls with explicit RTL-aware visual direction, Home/End, Enter, Space and Escape. Bypass animation for reduced-motion mode; offer catalog grid fallback.
- Single hanger + garment should render with stable DOM identity, avoiding unmount/remount on every drag. For long racks render viewport window + overscan, but keep logical index stable and accessible.

## 3D mirror contract

- Implement on dedicated dynamic module with React Three Fiber, drei OrbitControls/CameraControls only on its scene, optional rigged GLB with proper license. Prefer procedural stylized mesh avatar (head, limbs, torso) and category-specific shirts/knits/outerwear/pants as REAL geometry, animating subtle idle/walk-in-place and orbit.
- Product selected `garment_class` and selected `color` map to garment mesh material. Real 3D avatar is distinct from the rail's DOM perspective effect. Material color can reflect chosen color but fabric/print is not accurate unless verified 3D source assets exist.
- Default culturally neutral avatar presets; men/women are **presentational editable archetypes** (not demographic statistical facts or fit predictions). If source product is menswear, start suitable masculine archetype; UI can offer alternative looks without pretending compatibility/size guarantees.
- Mobile cap DPR/performance, compressed textures, proper dispose on unmount, render pause when hidden and `prefers-reduced-motion` disables continuous idle. Provide 2D fallback if WebGL unavailable.
- Accessibility copy `پیش‌نمایش سه‌بعدی تقریبی است و جایگزین پرو یا راهنمای سایز نیست.`
