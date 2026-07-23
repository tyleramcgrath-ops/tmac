# North Star — Headquarters (Phase 1)

> The room is the product. The Core is the heart.

This document records the architecture and design decisions for **Phase 1** of
North Star: the Concept A **headquarters shell** and the **North Star Core**.
It is the engineering companion to the _North Star Product & Design Bible_
(the constitution) and the _Visual Design Deck_ (the visual source of truth).
Where this document and those conflict, the Bible and Deck win.

## Scope of this phase

The Deck's Claude Handoff (slide 16) is explicit:

> Build only the Concept A headquarters shell and North Star Core first. Do not
> implement Mission Control, Digital DNA, Atlas, reports, agents, or workspace
> UI yet… Stop after the headquarters and Core are implemented.

So this phase ships **only** the environment, the room, the desk and the Core,
with the full state language wired through them. There is **no business
functionality, no dashboard, no data**. The next phase (Mission Control) is
deliberately not started.

### The old room is not reused

The Bible §14 requires implementation to begin "in a new scene module and
route." The previous experience under `app/north-star/` (the `ExecutiveOffice`
and its compass) is a **reference only** and is neither imported nor patched.
Phase 1 is a blank composition at a **new route, `/hq`**, with its own layout,
fonts and stylesheet. Nothing from the old room leaks in.

## Route & module layout

```
app/hq/
  layout.tsx        # scene chrome: institutional serif + operational sans, metadata
  page.tsx          # server component → <HeadquartersScene/>
  hq.css            # scene-scoped design tokens, materials, motion, states, a11y

components/hq/
  HeadquartersScene.tsx  # orchestrator: state → SceneModel, camera, stage scaling, a11y
  Environment.tsx        # exterior: sky, stars, North Star, moon, sunrise, ridges, clouds, weather
  Architecture.tsx       # room shell: arched window, columns, ribs, walls, floor + reflections
  Desk.tsx               # the sacred desk + flush projection base
  Core.tsx               # the North Star Core (astrolabe dial, gimbal rings, star, crystal, filaments)
  StateConsole.tsx       # isolated demonstration harness (not product chrome)

lib/hq/
  state.ts          # pure, testable state engine (product truth → SceneModel)

tests/hq-state.test.ts # 22 unit tests over the state engine
scripts/hq-screenshots.mjs # regenerates the state gallery deterministically
```

## The layered scene (Bible §14)

Everything is authored on a single **1920×1080 stage** and the whole stage is
scaled to _cover_ the viewport. This is the Bible's "one shared spatial
coordinate system" — the Core is never an absolutely-positioned image pasted
over a background; it lives in the same coordinate space as the desk it floats
above, the window behind it and the reflection below it, so depth, occlusion,
scale and reflection always agree.

Paint order top-to-bottom establishes occlusion:

1. **Environment** — sky/weather/time, drawn beneath everything and only ever
   visible through the true window apertures (the wall is a single
   even-odd path with the arch and slit windows cut out of it).
2. **Architecture** — arched celestial window, radial brass mullions,
   flanking columns and pilasters, ceiling ribs, entablature, polished floor
   with a mirrored window pool and column reflections.
3. **Desk** — dark walnut top, black-stone body, one brass alignment line, and
   the projection base integrated flush into the surface.
4. **Core** — the instrument, its projection beam, desk glow, suspended
   particles, and its reflection in the lacquer.
5. **Finishing** — state tint, vignette and a faint film grain.

## The North Star Core (Bible §04–05)

The Core is built as layered **SVG + CSS**, not WebGL. Rationale:

- The Core is fundamentally a precision instrument of concentric engraved rings
  and faceted star geometry. Vector rendering stays razor-sharp at 1440p/4K
  ("precision watchmaking detail") with no asset pipeline.
- It keeps the whole scene in one DOM/coordinate space, is trivially
  reduced-motion friendly, is deterministic for screenshots and tests, ships a
  tiny bundle, and avoids the "game-like" look the Bible explicitly forbids.

Composition: an outer **astrolabe dial** (engraved minute track, cardinal
lozenges) concentric with an eight-point **star** (four dominant, four
secondary faceted points) over a dark **obsidian body**, a controlled central
**crystal** (warm-white, never blown out), thin **energy filaments** from the
crystal through the points to the dial, and two **gimbal rings** on independent
axes with light beads that travel their circumference and duck behind the body.

### One implementation note worth remembering

SVG groups rotate/scale about the instrument's true centre using
`transform-box: fill-box; transform-origin: center`, and each animated group's
geometry is kept symmetric about the origin (the orbit groups carry an
invisible symmetrizer circle). `fill-box` is used rather than `view-box`
because the CSS minifier (Lightning CSS) silently drops the newer `view-box`
value — which otherwise detaches the dial from the star the moment it animates.

## State engine (Bible §06, §16)

`lib/hq/state.ts` is a pure function from **product truth** to a `SceneModel`.
It never invents activity: the room "changes with meaning, not mood theater."

- **Core states** (§05): `idle`, `listening`, `thinking`, `speaking`,
  `opportunity`, `concern`, `completion` — each expressed through ring rate,
  alignment, crystal cadence, warmth and scale.
- **Environment states** (§06): `confident`, `analyzing`, `uncertain`,
  `warning`, `overnight`, `success` — expressed through light temperature,
  brass luminance, sky wash, weather and the exterior.
- **Time of day** is derived from the local clock; a night sky reveals the
  actual North Star on the room's central axis, aligned with the Core.

Copy describes state (confident, investigating, blocked, completed) and
**never claims the system has feelings** — enforced by a unit test.

## Accessibility (Bible §13, §14)

- A visually-hidden `role="status"` `aria-live` region narrates the current
  state in North Star's voice; the stage carries an `aria-label`.
- **Reduced motion** (`prefers-reduced-motion`, or the preview's `motion`
  control) freezes every loop at its resting/aligned frame. No meaning is
  carried by motion alone — state stays legible through alignment, colour,
  contrast and tint. `data-motion="full"` can force motion on for capture.
- Keyboard: the preview console is reachable and toggle-able; focusable
  controls use native buttons.

## Performance

- Continuous animation touches only **transform / opacity / filter** so the
  compositor carries it at 60fps; no layout or paint in the animation loop.
- The scene is a **static prerender** (`/hq` builds as static content); there
  is no client data fetching in Phase 1.
- No WebGL context, no large raster assets — the scene is vector + CSS, so the
  route's payload is small and there is nothing to lazy-load beyond fonts.

## The preview console is not product chrome

The Deck requires speaking-, warning- and reduced-motion screenshots, so the
scene needs a way to exercise states. `StateConsole` is an **explicitly
isolated demonstration harness**: closed by default, labelled "drives visual
state only — not connected to any project," and it drives nothing but the
visual state. It is not a dashboard, not a sidebar, and it fabricates no
telemetry (Bible §16). Toggle it with the corner control, the backtick key, or
`?console=1`.

## Preview parameters

`/hq` accepts URL parameters for deterministic inspection and capture:

| Param     | Values                                                                 |
| --------- | ---------------------------------------------------------------------- |
| `core`    | idle · listening · thinking · speaking · opportunity · concern · completion |
| `env`     | confident · analyzing · uncertain · warning · overnight · success      |
| `time`    | dawn · day · dusk · night                                              |
| `shot`    | (default full room) · `close`                                          |
| `motion`  | `reduced` · `full`                                                     |
| `console` | `1` to open the preview console                                        |

## State gallery

Regenerate with `node scripts/hq-screenshots.mjs` against a running build.

| State | Frame |
| --- | --- |
| Full room (night, confident) | `docs/hq-screenshots/01-full-room.png` |
| Core close-up | `docs/hq-screenshots/02-core-closeup.png` |
| Speaking (dusk) | `docs/hq-screenshots/03-speaking.png` |
| Concern / warning | `docs/hq-screenshots/04-warning-concern.png` |
| Reduced motion | `docs/hq-screenshots/05-reduced-motion.png` |
| Thinking / analyzing | `docs/hq-screenshots/06-thinking-analyzing.png` |
| Opportunity / success | `docs/hq-screenshots/07-opportunity-success.png` |
| Preview console | `docs/hq-screenshots/08-preview-console.png` |

## Acceptance tests (Bible §16) — status

| Test | Status |
| --- | --- |
| A logo-less screenshot is unmistakably North Star | ✅ |
| Premium executive observatory, not a generic office | ✅ |
| Desk is clean, centered and visually important | ✅ |
| Core is a dimensional star/astrolabe artifact (not orb/flat compass/overlay) | ✅ |
| Core occupies ~15–20% of the room at rest | ✅ (~18%) |
| No text/navigation/hologram overlaps the Core in the default state | ✅ |
| Exterior and reflections move subtly | ✅ |
| Speaking/thinking/concern/completion change both Core and room | ✅ |
| Reduced-motion preserves all meaning | ✅ |
| Retains hierarchy and cinematic depth at 1440p/4K | ✅ |
| Digital DNA / Atlas connected and evidence-backed | ⏳ later phase (out of scope) |

## What is intentionally not here

Mission Control, Digital DNA, Atlas, agents, reports, approvals, settings and
any connected data. Per the build sequence these come only after the room and
Core are approved.
