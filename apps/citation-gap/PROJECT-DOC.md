# The Citation Gap — web app

**Live: https://citation-gap.vercel.app**
Vercel project `citation-gap`, team `team_6bNIz3y0Q62nzicOciNA6Q2w`. SSO off, publicly shareable.

## Use
Settings → paste a SerpApi key → **Save key** → enter URL + keyword → Run the scan.
Free tier 250 searches/month; a scan costs ~7, so ≈35 scans free.
**see a finished example** loads a real report with no key.

## Architecture
```
index.html      UI + scoring + prompt generation + scan history (browser-side)
api/serp.js     one Google query, normalized across SerpApi and Serper
api/page.js     3-line stub → api/page.impl.js (written at build time from a hash-verified staging URL, v10.5): fetch + parse any URL as served, zero dependencies
api/render.js   3-line stub → api/render.impl.js (same mechanism, v10.5): headless Chromium with real input; painted-text word counts via a shared paint library, gate self-check by identity, late-marker pass, script-attribution injection hook, probe=, html=1, parse=1
api/serp.js     shipped inline (small)
build.js        fail-closed assembler: verifies every file by sha256 before anything ships (v9); fetches the function bodies (v10.4) and the index patches from immutable preview URLs, or inlines them via `file:` when a fresh preview URL isn't reliably fetchable at build time (v10.5)
patches/        line-hunk patches applied to the staged index.html at build time; chain v9.1 → v10 → v10.1 → v10.2 → v10.3 → v10.4 → v10.5
test/           regression.js (145 checks incl. the frozen EnVue fixture), scan-flow.js (P9 reuse path), demo-flow.js — run with CHROME_PATH=/opt/pw-browsers/chromium
```
No framework. Only two npm deps (`@sparticuz/chromium`, `puppeteer-core`), used by `api/render.js`
alone. The browser orchestrates the scan one call at a time so no serverless function can hit a
timeout; the render call is the one slow step (5–10 s on a heavy page) and fails soft.

**Deploy constraint, and how it is now handled:** `deploy_to_vercel` replaces the ENTIRE
deployment; a partial or truncated payload used to take the site down (v6, v7, v8 below — every
pass). As of v9 that cannot happen: `build.js` verifies each file and the assembled `index.html`
against pinned hashes and **fails the build on any mismatch, leaving the previous production
deployment live**. See the v9 section for the mechanism and how to ship a change. Local working
copy: `/home/claude/cgweb` (session workspace; the live site plus the staged parts and patches are
the durable source of truth).

## v10.5 — Scanner Patch Spec v2, P10–P17 — and a production bug shipped, then caught (8 Sep 2026)

**Lead with what went wrong.** The first production deploy of this pass shipped a real
site-breaking bug: `/api/render` threw `ReferenceError: PAINT_SKIP is not defined` on any page
containing at least one `[hidden]` / `display:none` element — which is nearly every real-world
page, EnVue's included. It was live for the length of one verification cycle. It was caught not by
the build succeeding (it did, cleanly) but by actually calling `/api/render?url=https://envuetelematics.com`
against production right after deploy instead of assuming a clean build meant a working feature.
Root cause: the new P16 "attribute hidden content to the script that inserted it" code added a
diagnostic loop over `[hidden]`/`display:none` elements that referenced `PAINT_SKIP` — a variable
private to a different function's closure (`PAINT_INSTALL`, the paint-measurement library
installed once via `page.evaluate`) and never in scope inside the function that actually walks the
page (`INPAGE`, its own separate `page.evaluate` call). `INPAGE` already had its own equivalent
variable, `SKIP`, defined and correctly used two other places in the same function. One-line fix:
swap the bad reference for the right one. Verified against the full local test suite (unchanged
pass/fail before and after: regression.js 145/145, scan-flow.js real end-to-end OK, demo-flow zero
new console errors), regenerated the patch from the true pre-v10.5 baseline (not layered on the
buggy one), and redeployed. Confirmed live: the error is gone, `/api/render` on EnVue returns real
data again. Total window this was broken in production: one deploy-and-check cycle, caught before
being reported as fixed.

**What P10–P17 actually built**, all live and verified against the frozen EnVue fixture plus a
real render of the live page:

- **P10/P11 — a real paint library, not innerText.** `PAINT_INSTALL`, a self-contained function
  installed once via `page.evaluate`, replaces the old ad hoc visibility checks with one shared
  set of primitives (`isRendered`, `nodePainted`, `visibleText`/`visibleWords`, `measure`,
  `carousels`, `panels`, `snapshot`) used consistently everywhere a word or heading gets counted,
  instead of three slightly different visibility checks in three places.
- **P12 — measurement-basis assertion.** Every report now states explicitly whether it scored the
  **served** HTML or the **rendered** DOM, why (script-built pages must use rendered; static pages
  default to served for speed), and a `#renderAll` checkbox forces rendered scoring on demand.
  `BASIS_MISMATCH` is flagged when a competitor needed a different basis than the target — the
  comparison says so instead of silently mixing bases.
- **P13 — score attribution.** `attributeScore`/`attributionLines`: every point in the Rank/Answer
  score is now traceable to the specific signal that earned or cost it, printed as a line the
  report shows rather than a number Tyler has to reverse-engineer.
- **P14 — carousel accounting.** Reachable-vs-clone word counting now runs per carousel container
  (`carouselAccounting`): items, clones, painted, reachable, excluded, and the word count each
  bucket contributes, instead of one aggregate clone-vs-real number for the whole page.
- **P15 — severity from points-per-hour.** Task severity is computed from recoverable points
  divided by estimated effort hours, replacing the last hardcoded severity labels in the report
  and prompt generation.
- **P16 — script attribution via a mutation hook.** `INJECT_HOOK`, installed with
  `page.evaluateOnNewDocument` before any page script runs, wraps DOM-mutation methods and
  attributes inserted content back to the script that inserted it by inspecting the call stack at
  insertion time — this is the code whose diagnostic loop shipped the `PAINT_SKIP` bug above.
- **P17 / front-end** — `index.html`: `wordCheck`/`compositionLines` rewritten around the new
  paint-library fields, VOLATILE detection for findings whose numbers move scan-to-scan without a
  page change, the master-prompt and HTML-report templates updated to surface P12's basis
  assertion and P13's attribution lines.

**Live verification (post-fix), EnVue, real render:** `renderedWords.main` 566, `.page` 643 —
unchanged from the v10.4 figures, confirming the P10/P11 rewrite didn't move the number it's
supposed to reproduce exactly. `reachable.main` 326 out of 566 painted (the rest is carousel/feed
buckets, itemised in `carouselAccounting`). `gate.state` released 35/35, 0 residual. One item worth
flagging to Tyler that is **not** a scanner bug: the live render recorded a page-level JS error,
`elementorModules is not defined`, coming from EnVue's own page script, not from anything this
tool injects — worth a look on the site side if it's not already known.

**Deploy chain note for next time.** A brand-new single-file preview deployment created this pass
was fetched correctly by `mcp__Vercel__web_fetch_vercel_url` but returned corrupted/wrong-sized
content to `build.js`'s own plain `fetch()` running inside the Vercel build container — likely
Vercel Authentication blocking an unauthenticated build-time fetch of a brand-new deployment,
though older already-staged preview URLs kept fetching fine in the same build. Worked around by
shipping this pass's new content inline via `build.js`'s `file:` patch entries (read from the
deployment's own bundled filesystem, no network call, still sha-verified both sides) rather than
`url:`. The older `url:`-staged chain (page.impl.js, v9.1–v10.4) was left untouched and still
works. If a freshly-staged preview URL fails to fetch cleanly in a build again, reach for `file:`
before spending time on the network path.

**Verification.** `test/regression.js`: 145/145. `test/scan-flow.js`: real Chromium scan through
local fixtures with P13 attribution lines, P16 volatile tracking, P12 basis toggling (including a
run with `#renderAll` checked) and `BASIS_MISMATCH` on a script-built competitor fixture — all
internally consistent. `test/demo-flow.js`: one console error, traced to a pre-existing Google
Fonts `<link>` this sandbox's own Chromium can't reach (`ERR_TUNNEL_CONNECTION_FAILED`) — present
before this pass, unrelated to it, not a regression.

**Deploy.** Two production deploys this pass: one shipping the index.html v10.5 patch (live
index.html sha256 `9c209e4f17d49880568f83911d6dd56bb4d3aee8cdba9ea92c2b6a8a985452f3`, byte-verified
against the live site) and `dpl_HwoQcbWBd8SumqhQTuPM4yz7GEt3` (the `PAINT_SKIP`→`SKIP` fix in
`api/render.impl.js`, live sha256 `51ab73d7f3ee72af707e14149f360031ec681c33eb21c03461237055e953c612`),
both `readyState: READY`, both build logs read "integrity verified" — the second deploy's own
build log is the proof the fix shipped clean, and the live render call above is the proof it
actually works.

## v10.4 — Scanner Patch Spec v1, P1–P9 (4 Sep 2026)

Tyler's spec, fixture https://envuetelematics.com (fingerprint 3de55d96…). Deployed
`dpl_DnirkSjqheaGg4uaW7HAqyUoUaB6`; live `/` sha `99a81a8d…`, SCANNER_VERSION 10.4. What each
patch does and what the live fixture measures now:

- **P1 — rendered word count asserts visibility.** `innerText` was the wrong instrument: on EnVue
  it read 985/1,359 while real Chrome shows ~582. The renderer now walks text nodes and counts
  only *painted* text (every ancestor displayed, visible, opaque, not hidden/aria-hidden/inert,
  has client rects, inside the page, not parked outside an overflow-clipping ancestor).
  **Live: main 566, page 643** (Tyler's real-Chrome figure was 582 — a 16-word difference, from
  the headless viewport and slide position; innerText 1,359 and textContent 2,937 are printed
  beside it, never scored). Still 2,500 ms + scroll + settle.
- **P2 — clone log per selector.** Specific selectors (`.owl-item.cloned`, `.swiper-slide-duplicate`,
  `.slick-cloned`, `.splide__slide--clone`, `.ue-carousel-item.cloned`, `.uc_classic_carousel_placeholder`)
  then generic fallbacks (`[class*="--clone"]`, `[class$="-cloned"]`, …); every drop names the
  selector that caught it. **Honest note:** the served HTML of EnVue contains **no**
  `.owl-item.cloned` — Owl Carousel builds its 30 clones at runtime. Served side logs
  `22 × .uc_classic_carousel_placeholder (0 words)`, 0 by fallback; the *rendered* side logs
  60 Owl items / 30 cloned, 616 textContent / 374 innerText / **0 painted** clone words, and
  44 UE items 308/0. The spec's "30 by .owl-item.cloned in served HTML" is not reachable on this
  page; the report says where the clones actually live.
- **P3 — independent word check.** Served (regex, no JS) and rendered (painted) are measured
  separately; a ≤20% gap prints "counts consistent" (never "agree"); >20% prints
  "WORD COUNT LOW CONFIDENCE … Scored figure: rendered" and the rendered figure is what gets
  scored and gapped. EnVue: 985 vs 566 = 43% → LOW CONFIDENCE, gap to the 1,967 median = 1,401.
- **P4 — hidden containers re-checked after render, by identity.** Each served-hidden container is
  found again in the rendered DOM: HIDDEN, RELOCATED_VISIBLE (its headings now painted elsewhere)
  or GONE; RELOCATED_VISIBLE prints a "CONTAINER RELOCATED" warning and the "a visitor never sees
  them" wording is gone. EnVue: `.uc-template-wrapper` (display:none, 3 H3) → 0 headings after
  render; the same 3 H3 are painted in the Recent Articles loop grid at y≈6,600 while duplicate
  copies at y≈419 stay `visibility:hidden` (the loop widget's own placeholders). A **late pass**
  re-checks markers inserted after first paint (scroll to each, nudge, settle) and labels anything
  still hidden LATE/UNVERIFIED — never a hidden-content finding. Live this run: late count 0,
  hiddenContentCount 0.
- **P5 — competitor arithmetic closes.** requested = used + Σ dispositions, codes FAILED / GATED /
  BELOW_MIN_CONTENT / NOT_A_COMPETITOR / TIMEOUT / DEDUPED; UNACCOUNTED is printed and a scan-flow
  test fails the build if it is non-zero.
- **P6 — one whole-page figure** (the 1,071 vs 1,079 double print is gone; one source).
- **P7 — TEMPLATE duplicates get a widget task** (LOW · ~15 min · weight 3): "an editor cannot fix
  this in the page content — set the second feed's title tag to H4 or offset its query."
- **P8 — cross-refs resolved by task id at render time**; a clause whose target task is absent is
  dropped; a build assertion fails if any task's "Do this" equals its title.
- **P9 — unchanged scans short-circuit.** The page is fetched first; if its fingerprint matches
  the last scan (<7 days) the SERP calls are skipped, competitors/medians reused from that scan's
  `serpCache`, and the report opens with `## NO CHANGE SINCE LAST SCAN`. `#force` re-runs
  everything. scan-flow.js proves 0 SERP calls on the second scan.
- **Regression fixture frozen:** `test/fixtures/envue-home.served.html` (387,123 B),
  `envue-home.rendered.html` (458,716 B), `envue-home.render.json`. Expected values asserted:
  served 985 / textContent 2,937 / Owl 60/30 / 616/374 / UE 44 / 308/0 / wrapper 3→0 /
  loop containers 2 / tables 0 / FAQ 6 in schema, 0 in body / 3 TEMPLATE duplicates with
  1 hidden copy each. 125 checks, all green.

**Deploy architecture change (why the production payload is now ~45 KB):** `api/page.js` and
`api/render.js` are three-line stubs. `build.js` carries an `IMPL` table of
`{url, file, sha}`; each function body is fetched from an immutable preview `.txt`, `\uXXXX`-
normalised, sha-verified and written into `api/` during the build, where Vercel traces it into the
function bundle. Patches ship the same way (`PATCHES` entries with `url` + `name`). A production
deploy now sends only package.json, vercel.json, build.js, the three api entry files and the two
patches not yet staged (v9.1, v10.3). Any hash mismatch still fails the build with the previous
deployment left live. Staged sources: page.impl at `citation-6r07z65qj…/page.impl.txt`
(sha 11a85b52…), render.impl at `citation-4ttpqj1vs…/render.impl.txt` (sha 72f7d9a3…),
v10.4.json at `citation-iogtazxz9…/v10.4.json` (sha cac191cf…, result 99a81a8d…).

**Two things to say plainly to Tyler:** (1) painted main = 566, not the 582 ± 15 he measured; it
is inside the headless/real-Chrome noise and the rendered figure is what is scored, but the exact
acceptance number was missed by 1. (2) P2's served-side acceptance cannot pass on EnVue because
the Owl clones do not exist in served HTML; the rendered log shows them.

## v10.3 — round 6: a false RESOLVED is worse than a false WITHDRAWN (4 Sep 2026)

Tyler caught the scan marking "Remove 3 duplicated headings" RESOLVED when the three H3 pairs
were still on the page word for word. Root cause, in two halves, both fixed:

1. **The diff used "page changed" as proof.** `diffScans` marked every finding that dropped off
   the task list RESOLVED whenever the page fingerprint differed. The only edit between scans was
   clearing an entrance animation on one button — enough to move the fingerprint (marker count
   39 → 36), and that alone closed the task. Now every disappeared finding is **re-verified by its
   own check against the fresh fetch** (`recheckFinding`): the duplicate-heading detector re-runs
   on the current outline and reports each prior text as `still ×2` or `now ×1`; hidden content
   needs a render whose gate released; counters, schema items, title/H1/meta and tables are
   re-read; median-based tasks require the page's **own** figure to have moved in the right
   direction (a task that vanished because the competitor sample moved is a sample change). Four
   verdicts: **RESOLVED** (check clean AND page changed, evidence quoted), **WITHDRAWN** (check
   clean, page unchanged — or the scanner rule changed — a false positive this tool owns),
   **STILL PRESENT** (the task fell off the list but the items are still on the page — put back
   into the work order in its section with a CARRIED pill and the re-check quoted; never closed),
   **UNVERIFIED** (the check could not run this scan, e.g. no render — carried, with the reason).
   History now stores the full task (title, body, code, weights) so a carried task is rebuilt
   verbatim, and a `SCANNER_VERSION`; a finding that disappears across a version change is
   re-verified item by item and the CHANGES block says so.
2. **The rule change that made the task disappear.** v10.1 started dropping declared-hidden
   elements before counting — right for words, wrong for the heading census: the three duplicate
   copies sit in `<div class="uc-template-wrapper" style="display:none">` (an Unlimited Elements
   template wrapper, 181 words), so the served count went 19 → 16 and the duplicates vanished
   while Tyler still counted 19 in the source. Now **every served heading is counted** (19 on
   EnVue, matching his count); one inside a hidden container is labelled HIDDEN (`h3Hidden: 3`,
   `hiddenCopies: 1` per duplicate), never dropped. Word counts still exclude hidden text (985
   unchanged). The duplicate task says which copies live in a hidden container.

**What changed, itemised.** Each scan stores a snapshot (title, H1, meta, outline as level+text,
every count, schema types, animation markers, hidden containers, text hash). "Page content:
CHANGED" is now followed by `what changed:` lines — title old → new, headings added/removed by
text, each count old → new, and when only the fingerprint moved: "wording or markup changed
inside existing blocks (an attribute, a class, an animation setting, a sentence)". For Tyler's
case the line reads `entrance-animation markers: 39 → 36`, which is exactly the button edit.
Every METHODOLOGY block also lists the served HTML's **declared-hidden containers** (tag, class,
reason, words, headings inside) and the scanner version.

**Verification.** `test/regression.js` 93 checks (round-6 cases: duplicates still present on a
changed page → STILL PRESENT and carried, never RESOLVED; duplicates actually removed → RESOLVED
with `now ×1` and the H3 count change named; hidden content without a render → UNVERIFIED; the
hidden-container heading census and word count; work-order wording). `test/scan-flow.js` seeds
the browser history with a prior version and two findings and runs the real scan path: WITHDRAWN
with the re-run check quoted, rule-change note printed, zero JS errors. Live: `/api/page` on EnVue
19 H3 / 16 unique / 3 hidden / 3 duplicates each with one hidden copy in `.uc-template-wrapper`;
live `index.html` sha256 `d2bcfff29e2261421857c11a2e09d60bdfa81e65d7693a0f7d8b6057f6dde667`.

**Deploy.** Chain adds `patches/v10.3.json` (23 KB, 20 hunks); `dpl_32DBqNnVFsA65xhdwj71g6uoYEYb`
built "integrity verified" first time.

**Not changed, on purpose.** Tyler's 934-vs-985 word count is inside the stated 20% band and most
likely clone-selector coverage; the Crisp chat bubble that never mounted is a live-page question,
not a scanner one.

## v10.1 / v10.2 — round 5: exact residuals and honest word counts (3 Sep 2026)

Tyler's "Scanner feedback — round 5" reported two methodology bugs, both verified live, and asked
for them to be fixed before the next run. Both are fixed and live on every site the scan runs on.

**Bug A — "0 hidden after scroll" rounded away a real residual.** One element out of 36 (a "More
Info" CTA, `.elementor-element-e674c0c`) scrolled out of the viewport before its animation fired
and stayed hidden; the scan reported 0. Tyler fixed the element on the site; the scanner now
cannot make that mistake again. `api/render.js`: at first paint every marked element is tagged
with an id (`data-cg-gate`), the render scrolls **down** in half-viewport wheel steps and then
**back up** (a reverse pass gives late observers a second chance), settles, and re-reads the
computed style of **every originally tagged element by identity, regardless of scroll position or
what class it carries now**. The result is exact: `gate.summary` reads
`36 markers at first paint → 35/36 released, 1 still hidden ("More Info")`, with the residual
list (text, tag, reason, CTA text, whether the marker class is still present). "0 still hidden"
is printed only when the count is literally 0; a partial release is state `partial`, its residuals
are real findings (never "unverified"); only a release of nothing is `stuck`. The methodology
line states the method. Live today: `35 markers at first paint → 35/35 released, 0 still hidden`
(35 because Tyler already removed the animation from the CTA).

**Bug B — word counts inflated ~6× by a detached DOM.** The rendered count came from
`DOMParser` + `innerText` on a document that was never attached, which honours no CSS at all
(5,770 vs 985 / 1,481 / 1,356 from three tools). Fixed on all three of Tyler's options:
1. `renderedWords` is now read from the **attached, rendered DOM** (`innerText` after scroll +
   settle honours display, visibility and overflow), with the **same section boundary** as the
   served rule: the first `<main>`/`<article>` over 500 characters, otherwise `<body>` with nav /
   header / footer / aside / form hidden for the measurement.
2. The served-HTML rule (`WORD_RULE`, printed in every METHODOLOGY block) now states the source
   and the boundary explicitly, and drops `<template>`, `hidden` attributes and inline
   `display:none` / `visibility:hidden` elements with their contents.
3. **Word count check**: served vs rendered, same boundary; a disagreement over 20% is flagged
   **UNRELIABLE — treat the target as a range**, on the word-count task and in the baseline row.
   The served figure stays the scored one because every competitor is measured the same way.

v10.2 came out of verifying B live: with the attached-DOM count EnVue still read 985 served vs
1,359 rendered (28%, UNRELIABLE), and the gap turned out to be **30 Swiper clone slides carrying
374 words** — a loop carousel repeats every testimonial in the DOM. Clone slides
(`swiper-slide-duplicate`, `slick-cloned`, `owl-item cloned`, `splide__slide--clone`) are now
hidden for the rendered measurement and stripped by the served-rule parser, and the check says how
many were excluded. Live now: **served 985 · rendered 985 · rendered DOM under the served rules
985 — 0% apart**, exactly Tyler's own served figure.

**Competitor re-verification.** A competitor that looks unreadable when served (samsara.com "82
words / 8 headings") is no longer simply excluded: the scan renders it (`/api/render?parse=1`,
which runs the served-HTML parser over the serialised rendered DOM) and, if the rendered page
clears the floor, uses it with rendered counts, printing
`RENDERED samsara.com — served HTML gave 82 words (script-gated); rendered in a browser: 899
words, 8 headings. USED with rendered counts.` A page that stays thin after rendering is excluded
with both counts stated.

**Verification.** `test/regression.js` 82 checks (v10's 65 plus exact-residual wording, partial vs
stuck, attached-DOM counts, the 20% flag, hidden/template stripping, the explicit rule text,
`parse=1`, carousel clones in both parsers and in the report text, and the work-order lines);
demo flow and the fake-SERP scan flow (thin competitor excluded, script-built competitor rescued
via render, gate summary `1/2 released, 1 still hidden ("Get a Free Demo")`) with zero JS errors.
Live: `/api/render` on EnVue as above, four labelled counters; `/api/page` 985 words in `<main>`,
9 H2 / 16 H3, 4 counters; live `index.html` sha256
`e2009364f2668457a6ec65cea7233037be70d94aa7afa1311a89b3c020d36d0b`.

**Deploy.** Chain is now parts → v9.1 (file) → v10 (url) → v10.1 (file, 14.6 KB) → v10.2 (file,
0.8 KB), each hash-checked; `dpl_5c69Ha5n9Hjz7VHdmY3gXzpXSEDW` (v10.1) and
`dpl_882BKCh4H7BgezHDs5ix287YZ8kn` (v10.2) both built "integrity verified" first time. Note for
the next patch: `API_SHA` hashes the api files **raw** (their `` escapes survive transport),
while parts and patches are hashed after `unesc()`. `patches/mkpatch.py` (scratchpad) generates a
hunk patch and prints both hashes from a before/after pair of `index.html`.

## v10 — the second operator test: the render was the thing that was wrong (3 Sep 2026)

Tyler's follow-up spec ("SCANNER v4") after a live test of the v9 output. Everything v9 built
stays; this pass fixes what the test found. All live at `citation-gap.vercel.app`, all sites.

**1. The headless render was asserting a defect that was not there — confirmed and fixed.**
v9 reported 17–19 elements on envuetelematics.com still hidden after render. Tyler checked in a
real browser the same day: `.elementor-invisible` count 0, everything visible. He was right. The
v9 render scrolled with `window.scrollTo`, which is not user input; the page's entrance
animations never fired, and the scan called that "hidden content". Fix, in `api/render.js`:
- The render now behaves like a person: mouse move, a key press, and scrolling with real
  **wheel events** (`page.mouse.wheel`), at a 1366×900 viewport, with
  `prefers-reduced-motion: no-preference` explicitly emulated. Tested against the live EnVue
  page through a preview deployment before shipping: **36 animation markers at first paint →
  0 after scroll**, hidden content 0. Exactly what Tyler saw by eye.
- **Gate self-check**, as specified: markers are counted at first paint and again after scroll +
  settle; the result is `gate.state` = `released` / `partial` / `stuck` / `none`, with both counts
  and the interaction used. A `stuck` gate (nothing dropped) is reported in the METHODOLOGY block
  and in the diff as "GATE DID NOT RELEASE — may not reproduce in a real browser", the gated
  elements move to an UNVERIFIED list, and the only task they can produce is a "verify by eye"
  item — never a hidden-content assertion. Regression test covers the stuck case with a
  fixture whose gate only releases on real scroll.
- Counters are labelled by the adjacent caption or heading widget, not by their own value:
  live EnVue now reads "Reduction In Accidents shows 31", "Fewer accidents per million miles
  shows 21", etc.

**2. Bugs from the spec, all fixed in `api/page.js` / `index.html`**
- Counter count off by one: a counter without a usable caption was being dropped. Now every
  counter attribute is one counter (`counterCount` 4 on EnVue, `countersWithoutCaption` 1).
- Duplicate headings: normalised exact match, then >90% Levenshtein similarity, per level.
  `h3Unique` vs `h3Count` reported; a `dupHeadings` task lists each repeated text with its copy
  count and whether a copy sits in a feed. EnVue: 19 H3s, 16 unique, 3 duplicates, all feed
  clones — matches Tyler's count.
- Template vs editorial headings: headings inside post-feed / loop / carousel / `<article>`
  wrappers (Elementor posts, loop grid, WP latest-posts, Divi blog, Webflow dyn-list, swiper…) or
  carrying a post-title class are TEMPLATE. The H3 consolidation task now targets EDITORIAL
  headings only and states both counts ("Consolidate 16 editorial H3s … (19 total: 3 template/feed
  excluded)"). EnVue: 10 editorial, 9 template.
- Counts agree across the report: the diff's hidden count is the one number; Task 1 says how
  many of those it covers and how many plain-text elements it leaves aside, and why.
- Wording: "still in the DOM after render" replaced everywhere with "still carrying the marker
  class after render (the element never leaves the DOM; the class is removed)".

**3. Impact math is now auditable.** Tasks are in two explicitly ranked sections: **A —
OUT-OF-SCORE** (visitor-facing and integrity defects with a fixed weight, ranked by weight/hour,
hidden content pinned first) and **B — IN-SCORE** (recovers Rank/Answer table points, ranked by
points/hour). The work order states that ordering within a section is arithmetic and ordering A
before B is a judgement call.

**4. Competitor sample quality.** Minimum-content gate: a competitor under 300 main-content
words or with no headings is **EXCLUDED — UNREADABLE** with the reason, and the METHODOLOGY block
reports requested → used, plus every failed and excluded domain. The 82-word "competitor" can no
longer drag every median down.

**5. Confidence band on medians.** Leave-one-out now also records the range of every median
(word count, H2, H3, lists, stats, question headings). The baseline table has a MEDIAN RANGE
column; a task whose median moves when one competitor is dropped is marked **SOFT TARGET** with
the range and "the number may change on the next scan" — the 0→4 question-heading swing Tyler saw
between two scans is now labelled as exactly that.

**6. Vocabulary.** Two more filters in `entities()`: section-header boilerplate ("Takeaways",
"Overview", "Table of Contents"…) and language names ("French", "Español"…) are never vocabulary;
a term found only in headings / labels (Title-Case or under 6 words) needs 3+ occurrences; and a
stop word inside a capitalised run now SPLITS it instead of being deleted from the middle
("Fleet Fuel Theft: How Telematics Helps" no longer fuses into one fake phrase). Presence is
now checked against the served HTML **and** the rendered visible text: **PRESENT / PRESENT BUT
HIDDEN / ABSENT**, with PRESENT BUT HIDDEN scored as not covered and listed first in the
vocabulary task (only when the gate self-check passed; otherwise "visibility unverified").

**7. Scan-to-scan diff with WITHDRAWN.** History (browser localStorage, per URL+keyword) now
stores each finding's items and the gate state. The next scan of the same URL prints RESOLVED
(finding gone AND page fingerprint changed, with evidence), NEW, UNCHANGED, and **WITHDRAWN**
(finding gone but page unchanged — the earlier report was a render or sample difference, stated
as a false positive this tool owns). Tyler's Sept 2 scan predates the history feature, which is
why his Sept 3 scan showed no comparison; from now on every scan has one.

**Verification.** `test/regression.js`: 65 checks (v9's 46 plus 19 for this pass: gate states,
counter parity, template/duplicate headings, boilerplate filters, run splitting, competitor
exclusion, median ranges, three-state vocabulary, SOFT TARGET, section split, WITHDRAWN vs
RESOLVED, wording). Demo flow and full fake-SERP scan flow in Playwright: zero JS errors; the
scan flow now includes a thin competitor that is excluded and asserts the gate state and section
headers in the generated work order. Live after deploy: `/api/render` on EnVue — gate released
36→0, hidden content 0, four labelled counters; `/api/page` — 4 counters, 19/16 H3s, 3 duplicates,
9 template; live `index.html` sha256 `d439f5506ef7d553dad94c69cb2f46b42acc682dc7f7bfa40c32d6fd032a93b8`.

**Deploy.** Same fail-closed pipeline. `build.js` now accepts patches by URL as well as by file:
`patches/v10.json` (38 KB, 75 hunks on top of v9.1) is staged on preview
`citation-djibxg2ls…/v10.json` (verified byte-identical: CDN etag = local md5) and fetched at build
time; the chain is parts → v9.1 → v10, each step hash-checked. Production
`dpl_7KL5K2u1cLUeDfKzpCCd55CTCA19` built clean first time. To ship the next index.html change:
generate a hunk patch from the current chained result (apply parts + v9.1 + v10 from the sim
files first), stage it on a preview, add a `{url, sha, result}` entry to `PATCHES`, update
`API_SHA` for any changed api file, deploy the seven small files.

**Known limits added.** The render is still one headless browser: a page whose animation runs on
a signal we do not send (touch, a specific key) will read as `stuck` and be reported as
unverified, not hidden. Template-heading detection is class-based; an unfamiliar page builder's
feed reads as editorial. "Telematics Helps"-style fragments from a site's own repeated blog-title
pattern can still appear in that site's entity list (they rarely survive the cross-competitor
document-frequency filter).

## v9 — the operator-spec pass: render check, methodology, confidence (3 Sep 2026)

Tyler pasted a six-part "SCANNER IMPROVEMENT SPEC" written after two live scans of
`envuetelematics.com` for "telematics" on the same night, and asked for it to apply to every site
scanned. Everything below is live at `citation-gap.vercel.app` and applies to any URL.

**What every scan now does**

- **Renders the page in a real browser** (`api/render.js`: headless Chromium via
  `@sparticuz/chromium` + `puppeteer-core`, 60 s function). Loads to network-idle, waits, scrolls
  to the bottom in viewport steps so every IntersectionObserver fires, waits again, then reads
  computed styles for every element carrying text: display, visibility, opacity (inherited),
  bounding box, off-screen, clip-path. Each hidden element gets a **reason** (`visibility:hidden`,
  `ancestor display:none`, `opacity:0`, `positioned off-screen`…), a **kind** (call to action /
  price / statistic / heading / form / text) and — after a live test on EnVue found 94 "hidden
  CTAs" that were just dropdown-menu items — a **context**: `content`, `navigation`, `carousel`,
  `dialog`, `tab` or `screen-reader`. Only `content` (or anything inside a stuck entrance-animation
  wrapper) can become a finding; the rest is reported as "Hidden by design, NOT findings" with
  counts. On EnVue that is 17 real hidden content elements (award section, six industry captions,
  the Integrated Solutions links — all inside `.elementor-invisible` wrappers whose reveal never
  fired) versus 131 menu / carousel / screen-reader items correctly excluded. If the render fails
  (bot wall, timeout) the scan degrades gracefully and says so.
- **RENDERED-VS-SERVED DIFF** at the top of every work order: served-but-not-visible text (with
  "removed from the DOM by script" vs "in the DOM but hidden"), visible-but-not-served lines
  (script-injected, with a 3-word-shingle tolerance so browser re-flow of inline elements is not
  misreported), entrance-animation wrappers served / in DOM / still hidden, and each counter
  widget's rendered text next to its `data-to-value`. Hidden CTA / price / statistic / form is
  **Task 1**, weighted above every content task.
- **METHODOLOGY block** at the top of every work order: the exact word-count region and
  tokenisation rule, the sha256 of the counted text (a "Download counted text" button gives the
  exact string), the block definition, fetch policy (URL verbatim, `Cache-Control: no-cache`, no
  cache-busting parameter), sample size, spread min/median/max per metric, and a **confidence
  band** computed leave-one-out across the competitor set — "a move inside that band between scans
  is sample noise, not progress." This directly answers the 87→88 observation.
- **Bug fixes from the spec**: labels read from text nodes only (no more "31% clippath id");
  "JavaScript-only" is asserted only when a value is in neither served text, `data-*` attributes
  nor element text; word counts reproducible from emitted text; schema reports **top-level** types
  separately from **nested** ones and checks every FAQ question/answer, product/service name, offer
  price, review and rating **PRESENT/ABSENT** against visible text; "blocks" defined (outermost
  wrapper with text) and reported for served HTML and rendered DOM.
- **Vocabulary**: surface forms grouped into concepts (plural, sub-phrase, initials — IoT ≡
  Internet of Things) with one document frequency each, then bucketed **OWN STACK** (named
  anywhere on the site's own links/alt text — Geotab on a reseller is never a competitor) /
  **COMPETITOR** (a ranking domain) / **VOCABULARY**. A PARTNER bucket was deliberately not built:
  nothing in a page distinguishes a partner from own stack, so it would have been invented.
- **Question headings**: when the ranking-set median is 0, the task is demoted with the reason
  stated ("median says 0" vs "not applicable") instead of a silent floor of 3.
- **ROLLBACK SNAPSHOT** (title, meta, H1, outline, counts, text hash) and **effort math**
  (points recoverable / hours) printed per task.
- **CHANGES SINCE THE LAST SCAN**: scans are kept per URL+keyword in the browser (last 6). The
  next scan reports whether the page changed (fingerprint), score movement against the band, and
  every finding resolved / added / carried — nothing silently disappears.
- Prompts: the Step 0 gate is now render-aware, and every prompt keeps the anti-invention rule,
  parity-not-maximum, and the regression warning at high Rank Score.

**Verification**: `test/regression.js` — 46 checks covering all seven Part-5 regression items
(URL vs URL?x=1 identical; served value never called JS-injected; no attribute leak in labels;
word count reproducible; served vs rendered counts; schema PRESENT/ABSENT; scores of an unchanged
page fall inside the stated band) plus the hidden-by-design classification. Demo flow and a full
fake-SERP scan flow run in Playwright with zero JS errors. Live: `/api/render` on example.com
(`ok:true`, 2.5 s) and on envuetelematics.com (8.9 s, 17 content / 131 by-design hidden, 17/17
wrappers still hidden, counters 31/21/7/6 rendered visible).

**Deploy mechanism — now fail-closed.** The old "send everything, hope nothing truncates" path is
gone. `vercel.json` sets `buildCommand: node build.js`, `outputDirectory: public`. `build.js`:
1. sha256-checks every `api/*.js` file in the deployment against pinned hashes;
2. fetches `index.html` in three parts staged on immutable preview deployments
   (`citation-duuwsgxjh…/p1.txt`, `citation-4wmw92whc…/p2.txt`, `citation-isv9sero9…/p3.txt`),
   sha256-checks each, reassembles, checks the whole;
3. applies any line-hunk patches listed in `PATCHES` (`patches/v9.1.json` this pass — 4.5 KB
   instead of re-sending 156 KB), checking the patch hash and the result hash;
4. writes `public/index.html`. **Any mismatch exits 1, the build fails, and the previous
   production deployment stays live.**
So a production deploy is now ~60 KB (build.js, package.json, vercel.json, three api files, patch)
and cannot half-ship. Caveat: the deploy transport decodes `\uXXXX` escapes inside JS strings
into literal characters, so hashes are of the normalized text (`unesc()` on both sides) — the
deployed `index.html` has literal `•`/`—` where source has escapes; semantically identical. Small
index.html changes ship as a new patch entry (generate with difflib opcodes from the current
staged+patched base, record its sha and the result sha); large ones re-stage the three parts.

Deploy account, honest: first production build **failed closed** on all three parts (escape
normalisation + one duplicated boundary line in p2, found by a preview-only diagnostic build that
printed per-line byte mismatches) — nothing shipped, production untouched. Two follow-ups for
`/api/render`: `@sparticuz/chromium` and then `puppeteer-core` are ESM in Vercel's bundle, so both
must be loaded with dynamic `await import()`. Final deploys: `dpl_8VxTwgcVaifDpmTAfSu2Y4akrjTv`
(render working) and `dpl_AozdJZRfGGdnQVscjKKx5xRhWoW4` (hidden-by-design classification via patch
v9.1) — build log "integrity verified", live index.html sha256
`aa243f068ac39ee699f9061802b8337764482581cffba8763c077ed80478f47f` matches exactly.

**Known limits added**: render results are one browser at one moment (a carousel's current slide,
a cookie banner state); pages behind bot walls may render as a challenge page; the demo report's
render data is illustrative; history lives in one browser's localStorage, not an account.

## v8 — the real "Invalid option : option" bug (3 Sep 2026)

Tyler reported the v7 fix did **not** resolve the error: "doing the same thing, still getting the
error." A follow-up screenshot proved the v7 diagnosis was incomplete rather than wrong: with
Country/Language correctly set to USA/English, the scan log showed every step succeeding — all
competitor pages read, the target page read (990 words, 9 h2, 19 h3, schema listed), scoring run,
**RANK 87/100 and ANSWER 46/100 both computed and displayed** — and only *then* did it stop with
"Invalid option : option." That ruled out SerpApi/Serper entirely: the error fired after the whole
scan, including every paid API call, had already finished successfully. It also explains Tyler's
"there is still searches in the API" observation — quota was genuinely being spent every time, right
up until the crash on the last line.

**Root cause:** a native JavaScript `TypeError`, not an API error, that happens to produce the exact
string "Invalid option : option." The final `render()` call's `stamp:` field built its timestamp with
```js
new Date().toLocaleString(undefined,{dateStyle:'long',timeStyle:'short',timeZoneName:'short'})
```
Combining the `dateStyle`/`timeStyle` shorthand with an individual component option
(`timeZoneName`) is illegal per the `Intl.DateTimeFormat` spec, and V8 throws exactly this error —
reproduced byte-for-byte in Node. This combination was introduced in the v6 pass ("the audit
timestamp now includes a timezone") and has been breaking **every real scan's final render step**
since, on all inputs, regardless of country or language. It was invisible to v6's own
verification because the demo path (`loadDemo()`) uses a hardcoded static stamp string and never
calls this code at all — only a real, non-demo scan ever reaches the broken line.

**Fix:** replaced the shorthand+component mix with explicit component options:
```js
new Date().toLocaleString(undefined,{year:'numeric',month:'long',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})
```
which is spec-legal and produces equivalent output (e.g. "September 3, 2026 at 2:18 AM UTC"). The
v7 fix (`gl="gb"` instead of `"uk"`) was a real, separate bug and stays in place — it just wasn't
the cause of this report.

Deploy for this fix was unusually rough even by this project's own track record, worth logging
plainly: attempt 1 silently shipped a truncated `index.html` (composition cut off mid-file) with
**no API files at all**, taking production down further (both `/api/serp` and `/api/page` returned
404) — and, notably, this partial deploy was *not* caught by Claude Code's auto-mode classifier,
unlike every other partial attempt below. Attempt 2 (API files only, no `index.html`) was blocked
by the classifier. Attempt 3 (a deliberate maintenance-page placeholder for `index.html` plus both
API files) was also blocked. Attempt 4 (meant to send all three) self-truncated again before
`index.html` was ever composed, so only the two API files went out — blocked again. Attempt 5 sent
all three complete files with `index.html` ordered first in the payload, composed without
truncating, and was not blocked — deployment `dpl_3sZKaMkyzkjAXpn2wY68uQXVLcFT`, state `READY`,
aliased to `citation-gap.vercel.app`.

Post-deploy verification (via `web_fetch_vercel_url`, decoded from its JSON wrapper to avoid
escaping artifacts): live `index.html` is complete — closing `</html>`, `loadDemo` ×3,
`addEventListener` ×16, `</script>` ×4, all matching the local file exactly; `value="gb"` present
and `value="uk"` absent; the corrected `{year:...,timeZoneName:'short'}` options present and the
old `dateStyle`/`timeStyle` combination fully gone. The only textual diff against local was 8 lines
of pre-existing JS comments (non-functional, unrelated to this fix) plus em-dash
encoding artifacts from the fetch tool's JSON round-trip — nothing that affects behavior. `/api/page`
returns a correct parse of a live test URL; `/api/serp` responds with its expected 400 (no API key
configured) rather than 404, confirming the route is live again.

## v7 — Country dropdown bug fix (3 Sep 2026)

Tyler reported the scan failing partway through: "it says this Invalid option : option and wont
finish." Root cause found at the time: the Country dropdown's United Kingdom option had
`value="uk"`, but SerpApi's `gl` parameter requires the ISO 3166-1 code `gb`. Fix: changed the
option's value from `"uk"` to `"gb"` in `index.html` (display label unchanged).

**This fix was real but incomplete** — see v8 above. Tyler's error persisted after this shipped,
with country/language set correctly, because the actual cause was a separate JS bug that fired on
every real scan regardless of country/language. The `gb` fix is still correct and stays in place.

Deploy for this one-line fix also did not go cleanly, worth recording per this doc's own pattern:
the first attempt sent only a truncated `index.html` (composition error while manually
transcribing ~106KB, stopped partway through) with no API files at all, wiping both from
production; the second attempt sent both API files correctly but omitted `index.html` again. The
third attempt sent complete, verified content for all three files and succeeded — deployment
`dpl_C4EqpJz6JmPYU3How1Gcjhv3FuP5`, state `READY`, aliased to `citation-gap.vercel.app`.

## v6 — the critique-response pass (3 Sep 2026)

Tyler pasted a structural critique that claude.ai wrote after reviewing a generated work order
(Rank 87, Answer 65/48, EnVue dash-cams page). Six numbered issues plus smaller notes — all fixed
and verified.

1. **Vocabulary list was n-gram noise.** `entities()` in `api/page.js` was matching individual
   capitalized words, so "Internet of Things (IoT)" and "Global Positioning System (GPS)" produced
   eight junk fragments (`Things`, `Internet Things`, `Positioning`, `Global`...) plus stopword
   noise (`Key`, `Team`, `Beyond`, `Related`). Rewrote it to glue capitalized-word runs into whole
   phrases, break on parenthetical glosses (`Thing (Acronym)` → two clean entities, not one blob),
   exempt genuine sentence-initial acronyms (`OBD-II`) from the sentence-initial safety rule, and
   drop a wider stopword set. Verified against a synthetic paragraph built to match the critique's
   own example — output is now the ~8 real concepts, not 24 fragments. One bug caught and fixed
   during testing: an early version glued phrases across "and"/"or", which re-created the exact
   fragment problem being fixed; removed those from the glue set.
2. **Impact ordering contradicted the scores.** `buildFixes()` now ranks by recoverable points per
   hour of effort (`(weight - earned) / effortHours`), not a hardcoded severity label. Severity
   itself is now dynamic too — a signal that already has 40%+ of its category weight earned drops
   one tier, 65%+ drops two, so a page close to parity on a dimension doesn't get a false CRITICAL
   there.
3. **Task 8 (word count) violated the no-invention rule.** Rewrote it three places (fix body,
   prompt, task line) to drop the "~250 words per section" quota entirely. It now asks Claude to
   list the buyer questions the page leaves unanswered and answer each one at whatever length it
   genuinely takes, using only given facts — and to report honestly if that lands short of parity
   rather than padding to hit a number.
4. **Three measured signals now have tasks.** Added `h3Fragmented` (consolidate H3s toward the
   median, with old-to-new mapping, sequenced before any task that adds headings), `claimsAudit`
   (verify quantified claims already on the page rather than writing new ones, when the page
   already meets or beats the competitor median), and `schemaMismatch` (reconcile FAQPage JSON-LD
   against the actual visible question count, absorbing any headings other tasks add so the schema
   doesn't fall out of sync again).
5. **"7 or 10" inconsistency.** The median column header was hardcoded `TOP-10 MEDIAN` regardless
   of how many competitor pages were actually scanned. Now reads `TOP-<n> MEDIAN` dynamically, and
   matches the context-block and baseline-line wording.
6. **No do-no-harm clause.** Added a `## DO NOT MAKE THIS WORSE` section right after STEP 0: don't
   change the URL, don't touch the title tag or H1 without flagging exact before/after, record the
   current value before any edit so it's restorable. When Rank Score is ≥75 it adds an explicit
   note that regression, not stagnation, is the dominant risk at that point.

   Smaller notes: the animation-gate task now discloses truncation explicitly (`first 4 of 6`)
   instead of showing a heading count that doesn't match the list below it; the audit timestamp now
   includes a timezone (this is the change that introduced the v8 bug above); the table task's
   evidence line now leads with the extractability argument and frames minority adoption (2 of 7)
   as differentiation rather than reading like a case against itself.

**Verified:** unit tests on the new `entities()` logic, a Playwright run of `buildFixes` /
`scoreRank` / `scoreAnswer` / `masterPrompt` / `promptFor` against synthetic data matching the
critique's own scenario, and a full UI-driven demo-flow run (load demo → open report → expand every
prompt toggle → click every copy button) with zero console errors. **This demo-flow verification is
exactly what missed the v8 bug** — the demo path never calls the real-scan timestamp code, so a
defect only reachable from a real scan shipped unnoticed.

Deploy for this pass did **not** go cleanly — worth recording plainly rather than glossing over.
Despite the deploy-constraint warning already written in this doc, the v6 deploy sequence: (1) sent
only `api/serp.js`, wiping `index.html` and `api/page.js` from production; (2) sent `api/serp.js` +
`api/page.js` but still omitted `index.html`; (3) sent all three files but `index.html`'s payload
was accidentally the literal string `"PLACEHOLDER"`. The fourth attempt sent full, correct content
for all three files and succeeded — deployment `dpl_E4APxaDFXYMP4JXw2Lep8zmZp5gY`, state `READY`,
aliased to `citation-gap.vercel.app`.

## v5 — entrance-animation detection (3 Sep 2026)

Claude.ai's follow-up note: `visibility: hidden` on Elementor counters is almost always the
`elementor-invisible` class from an entrance animation whose IntersectionObserver never fires, so
the widget stays hidden forever.

That is a CSS fix on the WordPress site, not on this tool. But the diagnosis **corrected a
blind-spot claim made in v4**: `elementor-invisible` is a *literal class string in the served HTML*,
so it IS server-side detectable. The real blind spot is narrower than stated — a stylesheet rule
hiding something, not "any hidden content". (v9 closes that remaining gap with a real render.)

Shipped `animationGated()` in `api/page.js`: flags elements wrapped in
`elementor-invisible`, `wpb_animate_when_almost_visible`, `wow`, `animate__animated`, or carrying a
`data-aos` attribute, when the wrapper contains a statistic or a heading. Surfaces as the `animGate`
finding — HIGH, 15 MIN, tagged **HUMAN VISITORS** rather than RANK or ANSWER, because a never-firing
animation costs conversions, not crawler visibility.

The prompt frames it as **verify, not confirmed defect**, and orders the fix: (a) turn the entrance
animation off in the page builder, (b) scoped CSS override, (c) global
`.elementor-invisible{visibility:visible!important}` *with its cost stated* — plus a root-cause step
noting that a never-firing observer usually means a broken or deferred script.

Verified end to end in Chromium: animGate lands at position 2 in the impact-ordered fix list, three
pills render correctly, the master work order contains the task, no JS errors. Deployment
`dpl_ASThdxNG9hLKvzPtYTu4H7KhE7SS` verified live — `index.html`, `/api/page` (returns
`animationGated`), `/api/serp` all responding.

## v4 — the correctness pass (3 Sep 2026)

Tyler pasted the work order into claude.ai. **STEP 0 worked**: it refused to start Task 1 and
listed every disagreement instead of confabulating. Its objections were then checked, and it was
substantially right. Three genuine parser bugs found and fixed.

**Bug 1 — block boundaries destroyed before sentence splitting (the serious one).**
`stats` was computed by inserting `\n` after closing block tags, then calling `norm()` — which
collapses all whitespace, destroying those newlines. The entire page became ONE segment, and the
240-char cap then dropped it wholesale, statistics included. This silently corrupted
`statCount` on *every scan ever run*, and `stats` is 30% of the Answer Score.
Fixed with a `U+0001` delimiter, which is not whitespace and survives `norm()`.

**Bug 2 — counter labels were garbage.** The 900-char window after a counter attribute could end
mid-tag, leaving a dangling `<clipPath id` fragment that survived tag-stripping and was picked up
as the caption. That is where `31% clippath id` and `6% source sizes` came from. Fixed by cutting
back to the last complete `>`, plus label sanity guards (needs multiple words, vowels, no
attribute names, no repeated-character runs).

**Bug 3 — the JS-hidden-stats finding was a false positive on this page.** v3 assumed a counter
figure was invisible to crawlers. On the EnVue homepage the percentages are *also* printed in
caption sentences, so a non-JS crawler reads them fine. Now a counter counts as hidden only when
its value appears **nowhere** in the served text — checked, not assumed.

**Also:** a naked `31 %` lifted from a widget no longer counts as a separate claim from the
sentence beside it; `300+` style figures are now matched; the schema row says
"FAQPage / Product / Service" (the check always accepted Service/Offer, the label lied); the
master baseline now lists the exact schema types found; and the schema prompt tells Claude to say
so plainly when a page has no FAQ rather than marking up content that does not exist.

## v3 — the verification pass (2 Sep 2026)
Prompted by a run where claude.ai audited the wrong URL (homepage instead of `/dash-cams/`) and
then wrote "Confirmed against your baseline… All accurate" beside numbers that flatly contradicted
it. Added **STEP 0 — VERIFY BEFORE YOU DO ANYTHING**: open exactly this URL; compare; if any
figure differs, STOP and list every difference; never write "confirmed" beside numbers that do not
match; note that the scan runs without JavaScript. Plus a `SAMPLE DATA` guard on demo work orders
and honest bot-challenge reporting.

## Known limits
- AI Overviews are non-deterministic; treat one scan as directional — the confidence band (v9)
  says how much of a score move is sample noise.
- Served-HTML figures are read without JavaScript; the render step (v9) cross-checks them, but a
  render is one browser at one moment (current carousel slide, cookie-banner state). Its gate
  self-check (v10) says whether entrance animations actually fired; when they did not, nothing
  behind them is asserted as hidden.
- Sites behind bot protection (EnVue's own homepage, intermittently) may not be readable
  server-side and may render as a challenge page; the scan reports this rather than guessing.
- Schema detection is JSON-LD only.
- Word count is main-content only; a whole-page count reads higher (both are printed). Served and
  rendered counts are both measured on the same boundary (v10.1); a >20% disagreement is flagged
  LOW CONFIDENCE and the rendered (painted-text) figure is scored (v10.4). Carousel clone slides
  are excluded by named selector plus generic fallbacks (v10.2/v10.4); an unfamiliar library's
  clones would still be counted — the per-selector log shows what was caught.
- The rendered word count is one headless Chromium at 1366×900 after scroll + settle; real Chrome
  on EnVue read 582 where the scanner reads 566. Differences of that size are viewport and slide
  position, not a defect, but the exact number will not match a hand count.
- Vocabulary buckets are OWN STACK / COMPETITOR / VOCABULARY; a PARTNER bucket is not detectable
  from a page and was deliberately not invented.
- Scan history (CHANGES SINCE THE LAST SCAN) lives in the browser's localStorage, per URL+keyword,
  last 6 scans — not an account. Clearing site data clears it. RESOLVED is only ever claimed when
  the finding's own check re-runs clean (v10.3); a scan that predates 10.3 has no snapshot, so its
  "what changed" line says so and its findings re-verify from the page alone.
- The demo report's render/diff data is illustrative; the demo flow does not exercise the real-scan
  code path (v8 lesson) — a real scan must be checked too.
- Every score/measurement pass gets its own live-render check before being called done (v10.5
  lesson): a clean build is not proof a feature works — only calling it against a real page is.

## Next
- Custom domain **thecitationgap.com**
- Connect to GitHub so edits are a push — still worth doing, though the v9 fail-closed build has
  removed the outage risk that made this urgent
- Saved scans + score movement over time as an account feature (the retainer hook) — the
  browser-local history in v9 is the prototype
- Multi-keyword batch; weekly monitoring across the five tracked sites
</content>
