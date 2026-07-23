# North Star — Executive Headquarters (Phase 1, 3D)

> The architecture itself is the interface. The room is the product. The Core is the heart.

Engineering companion to the three sources of truth — the **Product & Design
Bible**, the **Visual Design Deck**, and the **Headquarters Architectural
Blueprint (Rev A)**. Where this document and those conflict, the documents win.

This build **replaces** the earlier SVG scene (rejected as an "SVG
illustration"). It is a genuine **WebGL / React Three Fiber** environment with
real geometry, PBR materials, physical lighting and reflections — rebuilt from
a blank composition per the Blueprint's construction requirements (§17).

## Scope — Phase 1 only

Headquarters shell, executive desk, North Star Core, environment, materials,
lighting, atmosphere, camera system and environmental motion (Blueprint §16).
**No** Mission Control, Digital DNA, Atlas, reports, agents, dashboards,
settings, automation, projects, workspaces, or business/telemetry data.

Route: **`/hq`** (client-only WebGL, `ssr: false`, cinematic loading veil).

## Why 3D (and why not the old SVG)

The Blueprint is explicit (§2, §17, Acceptance §18): a flat SVG scene, a SaaS
dashboard, a Figma mockup or an infographic is **rejected**. Materials must be
physically rendered, react credibly to light, and every object must have
foreground/midground/background, perspective and scale. That is a real-time 3D
brief, so the scene is built with Three.js via React Three Fiber, PBR materials,
physical lights, a reflective floor, and a bloom/tone-mapped post pipeline.

## Module layout

```
app/hq/
  layout.tsx        # institutional serif + operational sans, metadata
  page.tsx          # client dynamic import of the scene (ssr:false) + loading veil
  hq.css            # thin DOM layer only: loading, a11y narration, preview console

components/hq/
  Headquarters.tsx        # client host: Canvas, state (URL-driven), a11y, console, reduced-motion
  sceneContext.ts         # SceneModel + reduced-motion provided to scene children
  textures.ts             # procedural canvas textures (marble, walnut, brushed brass, engraving, glow) — no external assets (CSP/offline safe)
  StateConsole.tsx        # isolated demonstration harness (not product chrome)
  scene/
    Observatory.tsx       # assembles the scene + reflection Environment + postprocessing
    Room.tsx              # marble floor (reflective) + brass inlay rings, limestone wall, dome, brass ribs, skylight
    GlassWall.tsx         # ~180° curved smoked-glass wall + brass mullions/transoms
    Desk.tsx              # sculptural marble + walnut + brass desk with projection aperture
    Core.tsx              # the North Star Core: gimbal rings, engraved brass, crystal star, state motion
    Exterior.tsx          # sky (time-driven), stars, moon, North Star, ridges, rain/snow/fog/storm/aurora
    Lighting.tsx          # cove pools + directional key/fill + natural light through the glass
    Atmosphere.tsx        # dust motes in directional light
    Cameras.tsx           # five named cinematic cameras + subtle stabilised drift

lib/hq/state.ts           # pure, tested state engine → SceneModel (core, env, time, weather, sky, narration)
tests/hq-state.test.ts    # 26 unit tests
scripts/hq-screenshots.mjs# regenerates the gallery deterministically (SwiftShader-friendly)
```

## The build (Blueprint §3–§14)

- **Shell** — a circular observatory (~24 m across). Honed Italian black-marble
  floor with concentric brass inlay rings on the central axis; a limestone
  perimeter; a domed ceiling with 16 brass structural ribs converging to a
  central circular **skylight aligned directly above the Core**.
- **Glass wall** — ~180° of smoked architectural glazing with thin brushed-brass
  mullions and transom rails; controlled reflectivity, never mirror-like.
- **Desk** — ~12 ft × 5 ft × 30 in. Walnut waterfall body, visually seamless
  black-marble top, brass reveal and edge, and a concealed central projection
  aperture. Reflected in the polished floor. No visible electronics.
- **Core** — ~42 in, floating ~4 ft above the desk. Machined-titanium inner
  ring, smoked optical-crystal middle ring with warm embedded illumination,
  engraved brushed-brass outer ring, and a warm-white crystal star with
  controlled bloom. Three gimbals rotate on independent axes.
- **Lighting** — warm concealed cove pools + directional key/fill (so surfaces
  read at room scale without flat, uniform brightness) + natural light through
  the glass, colour and intensity by time and environment. Deep, readable
  shadows.
- **Reflections** — a reflective marble floor (soft, blurred, never a mirror)
  plus a controlled studio **environment map built from Lightformers** (no
  external HDR asset) gives brass, marble and glass believable reflections.
- **Exterior & atmosphere** — time-driven gradient sky, slowly drifting stars,
  the North Star in its correct clear-night position on the Core's axis, moon,
  sunrise glow, layered mountain silhouettes; rain, snow, fog, storm lightning
  and a rare aurora occur **outside** the glass. Dust motes drift in the light.
- **Cameras** — five named shots (hero, executive, conversation, atmospheric,
  boardroom), natural architectural perspective, never orthographic, with a
  slow stabilised idle drift.

## State engine (Bible §06, Blueprint §10)

`lib/hq/state.ts` is a pure function from **product truth** → `SceneModel`. It
never fabricates activity. Core states (idle, listening, thinking, speaking,
opportunity, concern, completion) drive ring rates, crystal cadence, warmth and
accent colour; environment states (confident, analyzing, uncertain, warning,
overnight, success) and weather (clear, rain, snow, fog, storm, aurora) drive
light, sky and exterior. Narration describes state, never feelings (enforced by
test).

## Performance

- Continuous animation is transform/rotation/opacity on the GPU; no per-frame
  allocation in the hot path. `dpr` is capped at 1.75; reduced-motion halts
  drift, rotation and weather.
- The reflective floor and post effects (bloom, SMAA, vignette, ACES tone
  mapping) are the main cost; on a real GPU this holds interactive frame rates.
- `/hq` prerenders only a lightweight loading shell; the scene is client-only
  and imported on demand, so no other route pays for the 3D bundle.

## Accessibility

- A visually-hidden `role="status"`/`aria-live` region narrates the current
  state in North Star's voice.
- `prefers-reduced-motion` (or the preview `motion` control) freezes drift and
  weather while preserving the full composition, materials and lighting — no
  meaning is carried by motion alone (Blueprint §17).

## Preview console — not product chrome

`StateConsole` is an explicitly isolated demonstration harness: closed by
default, labelled "drives the scene only — not connected to any project," and it
drives only visual state. It fabricates no telemetry (Bible §16 / Blueprint
§16). Toggle with the corner control, the backtick key, or `?console=1`.

### Preview parameters (`/hq?…`)

| Param | Values |
| --- | --- |
| `cam` | hero · executive · conversation · atmospheric · boardroom |
| `core` | idle · listening · thinking · speaking · opportunity · concern · completion |
| `env` | confident · analyzing · uncertain · warning · overnight · success |
| `time` | dawn · day · dusk · night |
| `weather` | clear · rain · snow · fog · storm · aurora |
| `motion` | reduced · full |
| `console` | `1` to open the console |

## Gallery

Regenerate with `node scripts/hq-screenshots.mjs` against a running build.

| View | File |
| --- | --- |
| Hero | `docs/hq-screenshots/01-hero.png` |
| Executive desk | `docs/hq-screenshots/02-executive-desk.png` |
| Core close-up | `docs/hq-screenshots/03-core-closeup.png` |
| Day | `docs/hq-screenshots/04-day.png` |
| Dusk (speaking) | `docs/hq-screenshots/05-dusk.png` |
| Night | `docs/hq-screenshots/06-night.png` |
| Storm / warning | `docs/hq-screenshots/07-storm-warning.png` |
| Success | `docs/hq-screenshots/08-success.png` |
| Reduced motion | `docs/hq-screenshots/09-reduced-motion.png` |
| Atmospheric (dome + skylight) | `docs/hq-screenshots/10-atmospheric-dome.png` |
| Boardroom | `docs/hq-screenshots/11-boardroom.png` |
| Aurora | `docs/hq-screenshots/12-aurora.png` |

## Blueprint §18 acceptance test — status

| # | Test | Status |
| --- | --- | --- |
| 1 | The room feels architectural rather than graphical | ✅ |
| 2 | Breathtaking with all interfaces disabled | ✅ (no UI in the scene) |
| 3 | The desk dominates and feels sculptural | ✅ |
| 4 | The Core is memorable, engineered, physically substantial | ✅ |
| 5 | Stone, walnut, brass, glass appear tangible | ✅ (leather seating: not in frame this phase) |
| 6 | Lighting creates depth, contrast, atmosphere, reflections | ✅ |
| 7 | The camera feels cinematic, not flat/orthographic | ✅ |
| 8 | Clear foreground/midground/background layers | ✅ |
| 9 | Appropriate for a CEO; premium enough to be permanent | ✅ |
| 10 | A single screenshot is recognizable as North Star without a logo | ✅ |
| 11 | Clearly matches the Concept A visual direction | ✅ |
| 12 | Nothing resembles the rejected PR #93 SVG illustration | ✅ (rebuilt in WebGL) |

## Unavoidable technical compromises

- **Software-rendered screenshots.** The gallery is captured in headless
  Chromium via SwiftShader (no GPU in CI). Frames are correct but softer/slower
  than a GPU; on real hardware the scene is sharper and runs at interactive
  rates.
- **Faux smoked glass** rather than physical transmission — chosen for
  controllable "smoked, restrained, never mirror-like" glass and to avoid an
  expensive transmission pass. Reads as architectural glazing.
- **Procedural (canvas) textures** for marble/walnut/brass instead of
  photographic PBR scans — the app runs under a strict CSP with no external
  image assets. Believable at scene scale; a future pass could swap in
  self-hosted scanned maps.
- **Reflection environment from Lightformers**, not a captured HDRI, for the
  same CSP/offline reason.
- **Leather seating** (Blueprint material schedule) is not yet placed — no
  seating is in the approved camera framings this phase.
- The repo's `pnpm lint` script (`next lint`) is broken independently of this
  work (removed in Next 16); `pnpm type-check` and `pnpm build` are green.

## Not in this phase

Everything downstream of the room and Core — Mission Control, Digital DNA,
Atlas, agents, reports, settings and any connected data. Explicit stop for
approval before Phase 2 (Blueprint §20).
