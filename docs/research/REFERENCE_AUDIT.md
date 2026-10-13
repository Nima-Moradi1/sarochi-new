# Reference audit — 2026-10-13

The owner supplied a 26.7 second, 640 × 496 reference MP4, a contact sheet and timestamped frames. The timestamps below describe visible behavior in those frames; they are not evidence of the source site's implementation. The legacy Sarochi screenshots identify business fields only.

| Time | Visible evidence | Implementation cue |
|---|---|---|
| 03.6–05.8 s | Editorial collage yields to a pale mint rack stage. A narrow graphite rod spans the viewport; wooden hangers hold garments at uneven intervals, with neighbors cropped. | Keep a continuous horizontal rail and ample negative space. |
| 05.8 s | Black T-shirt lifts and enlarges below its hanger while neighboring garments remain in place; a small caption sits below. | One active garment at a time, connected to its hanger and readable name. |
| 07.7 s | The same area shows a black printed rear view. | Flip only when a distinct, verified rear asset exists; otherwise label the fallback. |
| 09.1 s | Green sweatshirt becomes the featured garment; neighbors stay visible. | Keep lateral movement and garment scale coherent across selections. |
| 14.8 s | White printed tee is centered and raised while garments remain on both sides. | Support variant silhouettes and active media without replacing the stage with cards. |
| 17.2 s | Selected sweatshirt is isolated on a hanger; other items soften away, left/right circles and a counter appear. | Detail transition preserves garment identity and provides controls, count and route. |
| 19.7–24.6 s | A separate live **2D** person preview and wardrobe panel change outfit. | The required WebGL avatar room is an extension, clearly described as approximate styling. |

The screenshots show Sarochi's category tree, color/size facets and product gallery, not a layout to reproduce. No frame is approved as live storefront media. Before claiming visual fidelity, capture the running page at desktop and phone sizes and compare active scale, hanger/rod anchors, spacing and isolation against these frames.

## First executable sequence

1. Bootstrap one strict Next.js App Router application with Tailwind v4 and HeroUI v3; prove lint, typecheck and build.
2. Add MySQL Compose, schema, migrations and seed; require a persisted read after restart before calling the DB slice complete.
3. Render a small database-backed catalog path, then build the living rail, detail/cart, admin, 3D styling room and import review in task order.

Environment observed: Node 24.18.0, pnpm 11.18.0, Docker CLI 25.0.3. Docker daemon was unavailable; `LEGACY_STORE_URL` is absent. `ffprobe` and Python OpenCV are absent, so MP4 metadata was not independently extracted this session. The supplied timestamp frames and contact sheet were visually inspected. The live source category page still showed 59 T-shirts on 2026-10-13; this is a page observation, not imported inventory.
