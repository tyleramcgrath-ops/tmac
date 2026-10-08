# Palm Tree Surf — WordPress Theme Visual & Layout Spec

Paste this whole file into Claude Code as the build brief. Save it in the repo root as `VISUAL-SPEC.md` and reference it in `CLAUDE.md` so every session picks it up.

---

## 0. Read this first

You are rebuilding palmtreesurf.com as a custom WordPress theme. The current site is a JavaScript-rendered single-page app: a plain HTTP fetch returns only the `<title>` and meta tags, with no markup, no sections, no image URLs. That is why reading it with a normal fetch tool fails and why guessing from it produces nothing usable.

**You have a browser. Use it.** Section 1 is a required extraction step — render the live site yourself, dump its real DOM and computed styles, and screenshot it. Do that *before* writing a single line of theme code.

Order of operations, in full:

1. **Extract** the live site (section 1). Produce `audit/` artifacts.
2. **Reconcile** the extraction against this spec (section 2). Real brand values win; this spec's layout and structure win where the current site is thin or broken.
3. **Build** the theme to sections 3 through 12.
4. **Verify** against the definition of done (section 13).

Do not invent business facts. Prices, tour names, instructor bios, hours, phone numbers, and the booking system come from the extraction or stay as placeholder tokens (section 11) and get logged in `TODO-CONTENT.md`.

Photography arrives later. Build every image slot against the manifest protocol in section 10 so dropping in real photos is a file copy, not a refactor.

**Build target:** a classic PHP theme (not block/FSE), no page builder, no Elementor, no ACF Pro dependency unless stated. Everything registered in code so the whole site is version controlled.

---

## 1. REQUIRED FIRST STEP — extract the current site yourself

Run this before anything else. It is the whole reason earlier attempts stalled.

### 1.1 Render it

Use headless Chromium via Playwright. Install into a scratch folder outside the theme repo:

```bash
mkdir -p audit && cd audit
npm init -y && npm i -D playwright
npx playwright install chromium
```

Write `audit/extract.mjs` that, for each URL in the crawl set:

- Navigates with `waitUntil: 'networkidle'`, then waits an extra 2000ms for late hydration.
- Scrolls to the bottom in 400px steps with 150ms pauses so lazy-loaded sections and images actually mount, then scrolls back to top.
- Writes `audit/<slug>/dom.html` — `document.documentElement.outerHTML` **after** hydration, not the served HTML.
- Writes `audit/<slug>/text.txt` — `document.body.innerText`, for copy extraction.
- Screenshots full-page at three widths: 1440, 768, 375 → `audit/<slug>/shot-<width>.png`.
- Screenshots the top 1000px at 1440 separately → `shot-hero.png`.

### 1.2 Crawl set

Start at `https://palmtreesurf.com/`. Then collect every same-origin `href` from the rendered DOM, dedupe, drop anchors and query strings, and run the same extraction on each. Cap at 25 pages. Record the final list in `audit/sitemap.json` with each page's `<title>`, meta description, and H1.

If a route 404s or the SPA renders an empty shell for it, note it in `sitemap.json` rather than silently skipping.

### 1.3 Extract the design system

Still in the page context, dump to `audit/<slug>/computed.json`:

- **Colors** — walk every element, collect `color`, `background-color`, `border-color`, and any `background-image` that contains a gradient. Tally frequency. Output a ranked list of hex values with counts and one example selector each.
- **Type** — for every text-bearing element, collect `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`. Group by tag and by computed size, ranked by frequency.
- **Spacing** — collect `padding-block` and `margin-block` on every direct child of `<main>` and every `<section>`, so the real vertical rhythm is visible.
- **Radius and shadow** — tally `border-radius` and `box-shadow`.
- **Containers** — the computed `max-width` of the widest repeated wrapper.

Also write `audit/fonts.json`: every `@font-face` src URL and every font CDN request seen in the network log.

### 1.4 Inventory the structure

Write `audit/<slug>/structure.md` by hand from the DOM and the screenshots. For each section, top to bottom:

- Section name and its purpose
- Layout: column count at each of the three widths, alignment, whether it is contained or full-bleed
- Every element in it, in DOM order: eyebrow, heading, body copy, list, buttons with their exact label text, images with their aspect ratios
- The exact copy, verbatim
- Any interactive behavior you can observe: hover changes, carousels, accordions, sticky elements, scroll-triggered animation

### 1.5 Image manifest

Write `audit/images.json`: every `<img>` and CSS background image with its source URL, natural dimensions, rendered dimensions, aspect ratio, alt text, and which section it appears in. Download each to `audit/images/` for reference only — these are placeholders for reference, not assets to ship. Real photography is being supplied separately.

### 1.6 Behavior capture

Write `audit/behavior.md`: header behavior on scroll, mobile menu open and close, what the booking button actually does (on-site form, third-party platform, WhatsApp link — record the destination URL), form fields and validation, any lightbox or slider and its controls, and anything that animates.

### 1.7 If you "can't see" the site — troubleshooting, in order

Reporting that the site cannot be read is not an acceptable stopping point until every step below has been tried and the failure reported specifically, with the actual error text.

1. **Stop using the fetch tool.** A plain HTTP fetch of an SPA returns an empty shell by design. That is expected and is not evidence the site is unreachable. Switch to headless Chromium.
2. **Confirm network egress.** Run `curl -sSI https://palmtreesurf.com/ | head -5`. A `200` proves the host is reachable and the problem is rendering, not connectivity. A proxy `403`, a DNS failure, or a hang means the sandbox is blocking egress — report that exact error, and note that the run needs network access enabled.
3. **Check Chromium actually installed.** `npx playwright install chromium` can silently fail behind a proxy. If so, try a system Chrome via `channel: 'chrome'`, or `executablePath` pointed at an installed Chrome binary.
4. **Set a real user agent.** Some hosts serve nothing to headless defaults. Use a current desktop Chrome UA string and `viewport: {width:1440,height:900}`.
5. **Wait longer.** Some SPAs hydrate slowly. Try `waitUntil: 'load'` plus an explicit `page.waitForSelector` on any `<section>`, `<main>`, or `<img>`, with a 30s timeout, rather than `networkidle`.
6. **Check for a bot wall.** If the rendered DOM contains a Cloudflare challenge, a captcha, or a "checking your browser" string, say so explicitly — that is the real blocker and no amount of retrying fixes it.
7. **Try the raw source anyway.** `curl -s https://palmtreesurf.com/` and inspect it. Even an empty shell reveals the framework, the JS bundle URLs, and the meta tags. Fetch the main JS bundle directly and grep it for route paths, section headings, and image URLs — a compiled SPA bundle usually contains the copy and the route table in plain text. This alone can reconstruct much of the site map.

**If all seven fail, stop and ask for a manual capture.** Say precisely this, and do not proceed to build until it is provided:

> I cannot render palmtreesurf.com from here. The specific failure is: `<paste the real error>`. Please provide either (a) full-page screenshots at desktop and mobile widths, or (b) the rendered DOM: open the site in Chrome, right-click the page and choose Inspect, right-click the `<html>` element in the Elements panel, choose Copy → Copy outerHTML, and paste it into `audit/home-dom.html`. Option (b) is better — it gives me the real classes, copy, and image URLs.

Until that arrives, you may build sections 3 through 13 against this spec alone, with all business facts as placeholders. Do not stall the entire build waiting on the audit.

### 1.8 Report before building

Stop and output a summary: the page list, the extracted palette and type scale, the section inventory of the homepage, and — explicitly — **every place the current site conflicts with this spec.** Do not start the theme until that summary exists in `audit/FINDINGS.md`.

---

## 2. Reconciling the extraction with this spec

When the live site and this document disagree, resolve it this way:

**The live site wins on:**
- Brand colors, if the extraction shows a deliberate, consistently-used palette. Map the real values onto the token names in section 4 and keep the token names.
- Logo, wordmark, and any real brand typeface.
- All business facts: service names, prices, durations, group sizes, instructor names, address, phone, hours, social URLs, the real booking destination.
- All copy, as a starting draft.
- Any section that exists on the current site but is missing from this spec — keep it, and place it using this spec's section conventions.

**This spec wins on:**
- Page structure and section order.
- Layout mechanics, grid, spacing rhythm, responsive behavior.
- Component structure and states.
- Accessibility, performance, schema, and code-quality requirements.
- Anything the current site does that is measurably worse: layout shift, hover-only content, missing focus states, text over photo with insufficient contrast, render-blocking third-party scripts.

**Flag rather than decide:** if the current site has a section whose purpose is unclear, or a business fact that contradicts itself across pages, put it in `TODO-CONTENT.md` and use a placeholder. Do not guess.

---

## 3. Brand positioning that drives every visual decision

Palm Tree Surf sells premium surf lessons, ocean tours, and custom water experiences in Tamarindo, Guanacaste, Costa Rica. The visual target is **boutique surf outfitter**, not budget beach kiosk.

That means:

- Big photography, minimal chrome. Photos carry the sell, not gradients or illustration.
- Generous whitespace. Sections breathe.
- One accent color used sparingly so CTAs actually pop.
- Warm, sun-bleached palette. No neon, no tropical-cliche gradients, no palm-frond divider SVGs, no wave-shaped section separators, no stock "surfer silhouette at sunset" vector art.
- Zero AI-generated-looking imagery. Every photo slot is a real photograph.

Conversion priority order for every layout decision: **booking conversion → premium perception → SEO visibility → scalability.**

---

## 4. Design tokens

Define these once in `:root` in `assets/css/tokens.css` and use variables everywhere. No hardcoded hex values anywhere else in the codebase.

### Color

```css
:root {
  /* Core */
  --pt-sand-50:   #FBF8F3;  /* page background */
  --pt-sand-100:  #F4EDE3;  /* alternating section background */
  --pt-sand-200:  #E4D9C8;  /* borders, dividers */

  --pt-ink-900:   #14211F;  /* headings, near-black with a green cast */
  --pt-ink-700:   #2E3B38;  /* body copy */
  --pt-ink-500:   #5F6B67;  /* muted copy, captions, meta */

  /* Brand */
  --pt-ocean-700: #0B4F5C;  /* deep water — dark sections, footer */
  --pt-ocean-500: #10788B;  /* primary brand, links, icon accents */
  --pt-ocean-300: #7FC2CC;  /* tints, hover washes */

  --pt-sunset-500:#E2703A;  /* THE accent. CTAs only. Use sparingly. */
  --pt-sunset-600:#C55C2A;  /* CTA hover */

  --pt-white:     #FFFFFF;
}
```

Rules:
- `--pt-sunset-500` appears on primary buttons and almost nowhere else. If it shows up more than about three times on a screen, it has stopped working.
- Body text is `--pt-ink-700` on `--pt-sand-50`. Never pure black on pure white.
- Dark sections use `--pt-ocean-700` background with `--pt-sand-50` text.
- Every text/background pair must hit WCAG AA (4.5:1 body, 3:1 for large headings). Verify, do not assume.

### Type

Two families, loaded self-hosted as WOFF2 from `assets/fonts/` with `font-display: swap`. No Google Fonts CDN call — it costs a third-party connection and a GDPR question.

```css
--pt-font-display: "Cabinet Grotesk", "Poppins", system-ui, sans-serif;
--pt-font-body:    "Inter", system-ui, -apple-system, sans-serif;
```

Fluid scale using `clamp()`:

```css
--pt-h1: clamp(2.75rem, 6vw, 5rem);      /* line-height 1.05, letter-spacing -0.02em */
--pt-h2: clamp(2rem, 4vw, 3.25rem);      /* line-height 1.12, letter-spacing -0.015em */
--pt-h3: clamp(1.375rem, 2.2vw, 1.75rem);/* line-height 1.25 */
--pt-body-lg: 1.125rem;                  /* line-height 1.65 */
--pt-body: 1rem;                          /* line-height 1.7 */
--pt-small: 0.875rem;
--pt-eyebrow: 0.8125rem;                  /* uppercase, letter-spacing 0.12em, weight 600 */
```

Headings are display font, weight 700. Body is body font, weight 400, max measure `68ch`. Eyebrow labels sit above every section H2 in `--pt-ocean-500`.

### Space, radius, shadow, motion

```css
--pt-space-xs: 0.5rem;  --pt-space-sm: 1rem;   --pt-space-md: 1.5rem;
--pt-space-lg: 2.5rem;  --pt-space-xl: 4rem;   --pt-space-2xl: 6rem;
--pt-section-y: clamp(4rem, 9vw, 7.5rem);  /* vertical padding on every section */

--pt-container: 1240px;    /* max content width */
--pt-container-narrow: 760px; /* long-form text */
--pt-gutter: clamp(1.25rem, 5vw, 3rem);

--pt-radius-sm: 6px;  --pt-radius-md: 12px;  --pt-radius-lg: 20px;  --pt-radius-pill: 999px;

--pt-shadow-card: 0 2px 4px rgba(20,33,31,.04), 0 12px 32px rgba(20,33,31,.08);
--pt-shadow-hover: 0 4px 8px rgba(20,33,31,.06), 0 20px 48px rgba(20,33,31,.14);

--pt-ease: cubic-bezier(.22,.61,.36,1);
--pt-dur: 240ms;
```

Motion: fades and 16px upward translates on scroll-in only, via IntersectionObserver, staggered 60ms. Everything wrapped in `@media (prefers-reduced-motion: reduce)` that disables transforms and sets durations to `0.01ms`. No parallax, no scroll-jacking, no counters that tick up.

### Grid

12-column, `--pt-gutter` outside, 24px between columns, centered at `--pt-container`. Breakpoints: `480 / 768 / 1024 / 1280`. Mobile-first. Everything collapses to single column under 768px.

---

## 5. Global components

### 5.1 Header

- Transparent over the hero on the homepage, with white logo and white nav links, plus a subtle `linear-gradient(rgba(20,33,31,.45), transparent)` scrim so text stays legible over any photo.
- On scroll past 80px, it becomes solid `--pt-sand-50` with `--pt-shadow-card`, dark logo, `--pt-ink-900` links. Transition `--pt-dur --pt-ease`. Sticky from that point.
- On every interior page it starts solid. No transparent variant on interior templates.
- Height: 88px desktop, 64px mobile.
- Left: logo (SVG, two variants — light and dark — swapped by a class, never two `<img>` tags both loaded).
- Center or right: nav. Items: Surf Lessons, Tours, Camps, About, Gallery, Contact.
- Far right: one primary button, `Book Now`, pill radius, `--pt-sunset-500`.
- Mobile: full-screen overlay menu, `--pt-ocean-700` background, links at `--pt-h3`, staggered fade in, focus trapped, `Esc` closes, `aria-expanded` on the toggle, body scroll locked while open.

### 5.2 Buttons

Three variants only:
- **Primary** — `--pt-sunset-500` fill, white text, pill, 16px/32px padding, hover to `--pt-sunset-600` plus `translateY(-2px)` and `--pt-shadow-hover`.
- **Secondary** — 1.5px `--pt-ocean-700` border, transparent fill, `--pt-ocean-700` text, hover fills `--pt-ocean-700` with white text.
- **Ghost on photo** — 1.5px white border, transparent, white text, hover fills white with `--pt-ink-900` text.

All get a visible `:focus-visible` ring: `3px solid --pt-ocean-500`, `2px` offset. Minimum tap target 44x44.

### 5.3 Card

Used for tours, lessons, and blog. `--pt-white` background, `--pt-radius-md`, `--pt-shadow-card`, overflow hidden. Image at 4:3, `object-fit: cover`, scales to `1.04` over 500ms on card hover while the card itself lifts 4px and takes `--pt-shadow-hover`. Body padding `--pt-space-md`. Structure: eyebrow meta (duration · level) → H3 title → 2-line clamped description → footer row with price left and a text link right. The whole card is one link; do not nest interactive elements inside it.

### 5.4 Section wrapper

Every section gets `padding-block: --pt-section-y`, alternating `--pt-sand-50` and `--pt-sand-100` backgrounds so the page has rhythm without dividers. Section headers are centered by default: eyebrow, H2, and a `--pt-body-lg` sub-line capped at 60ch.

### 5.5 Footer

Dark, `--pt-ocean-700`, `--pt-sand-50` text. Four columns on desktop, stacked on mobile:
1. Logo (light variant), one-line positioning statement, social icon row.
2. Experiences — links to each lesson/tour CPT archive.
3. Company — About, Gallery, Blog, Contact, Privacy, Terms.
4. Visit Us — address, WhatsApp link, email, hours, embedded-map link.

Below: a thin `rgba(255,255,255,.12)` rule, then a bottom bar with copyright left and a small credit right. Include the LocalBusiness NAP here in text, matching the schema exactly.

---

## 6. Homepage, section by section

Build in this order. Each is its own template part in `template-parts/home/`.

### 6.1 Hero — `hero.php`

- Full viewport height with a floor: `min-height: min(100svh, 900px)`. Use `svh` so mobile browser chrome does not cause jump.
- Background: a muted, autoplaying, looping, inline `<video>` of a wave or a lesson in progress, with a `<picture>` poster fallback. Below 768px, serve the poster image only and do not load the video at all.
- Overlay: `linear-gradient(180deg, rgba(20,33,31,.55) 0%, rgba(20,33,31,.25) 45%, rgba(20,33,31,.65) 100%)`.
- Content bottom-left aligned on desktop within the container, centered on mobile. Sits above the overlay.
  - Eyebrow: `TAMARINDO · GUANACASTE · COSTA RICA`
  - H1 at `--pt-h1`, white, max 14 words.
  - Sub-line at `--pt-body-lg`, `rgba(255,255,255,.88)`, max 22 words.
  - Button row: Primary `Book Your Session` + Ghost-on-photo `View Experiences`.
  - Trust row beneath: three inline items with small icons — years operating, certification body, review count and star rating. Keep it to one line on desktop.
- Do not autoplay audio. Video must have `muted playsinline loop preload="metadata"`.

### 6.2 Trust bar — `trust-bar.php`

Slim strip directly under the hero, `--pt-white` background, `--pt-shadow-card`, pulled up 40px with a negative margin so it overlaps the hero edge. Four items, evenly spaced, icon above short label: certified instructors, all gear included, small group ratio, free photos of your session. Two-by-two grid on mobile.

### 6.3 Experiences grid — `experiences.php`

The commercial core of the page. Section header, then a 3-column card grid, 2-up at 1024px, 1-up at 768px. Pulls the three featured `experience` CPT entries. Each card shows photo, duration and skill-level meta, title, one-line description, price-from, and a link. Section-level Secondary button below the grid: `See All Experiences`.

### 6.4 Split feature — `split-feature.php`

Two-column, 50/50 at 1024px and up, stacked on mobile with image first. Image side is a single tall photo at 4:5 with `--pt-radius-lg`, plus one small offset photo overlapping its lower corner at about 55% width with a 6px `--pt-sand-50` border. Text side: eyebrow, H2, two short paragraphs, a four-item checkmark list, and a Secondary button. Build this as a reusable part that accepts a `reverse` flag, and use it twice on the homepage with the sides flipped the second time.

### 6.5 Gallery strip — `gallery.php`

Full-bleed edge to edge, breaking out of the container. Horizontally scrollable on mobile with `scroll-snap-type: x mandatory`; a 4-column masonry-ish grid on desktop where items one and four span two rows. Images lazy-loaded except the first. Clicking opens a lightweight lightbox — keyboard navigable, `Esc` to close, focus returned to the trigger on close. No lightbox library over 10KB gzipped.

### 6.6 Testimonials — `testimonials.php`

Dark section, `--pt-ocean-700`. Section header in white. Three quote cards in a row, `rgba(255,255,255,.06)` background with a `rgba(255,255,255,.14)` 1px border, `--pt-radius-md`. Each: 5-star row in `--pt-sunset-500`, quote at `--pt-body-lg` in white, then a footer row with a small round avatar, name, and origin city. Slides one-up on mobile with dot pagination. Pull from a `testimonial` CPT so they are editable.

### 6.7 Instructors — `instructors.php`

Section header, then a 4-column grid of portraits at 3:4 with `--pt-radius-md`. On hover, a `--pt-ocean-700` to transparent gradient rises from the bottom and reveals name, role, and a one-line bio. On touch devices the overlay is always visible — do not hide content behind hover only. Falls to 2 columns at 768px.

### 6.8 Location and conditions — `location.php`

Two columns. Left: H2, a short paragraph on Tamarindo's break and why it suits beginners, plus a small 3-row table of conditions (best season, wave size range, water temp). Right: a lazy-loaded map. Load the map iframe only after the user clicks a static map image — a facade pattern. This keeps Google's script off the initial load and protects LCP and privacy.

### 6.9 Final CTA — `cta.php`

Full-bleed photo background with a `rgba(11,79,92,.72)` overlay. Centered white H2, one sub-line, a Primary button, and a WhatsApp text link below it. Fixed height `clamp(360px, 45vw, 520px)`.

---

## 7. Interaction and behavior spec

Layout is half the build. This is the other half — exactly how every element behaves. Implement all of it; do not treat any of it as optional polish.

### 7.1 Header

| Trigger | Behavior |
|---|---|
| Page load, homepage | Transparent, position absolute over hero, light logo, white links, gradient scrim behind |
| Scroll > 80px | Adds `.is-stuck`: solid `--pt-sand-50`, `position: fixed`, `--pt-shadow-card`, dark logo, dark links. Transition background, box-shadow, and color over `--pt-dur --pt-ease` |
| Scroll back < 80px | Removes `.is-stuck`, reverses cleanly. No flicker, no re-trigger loop |
| Page load, interior | `.is-stuck` applied immediately, no transition on first paint |

Detect scroll with an IntersectionObserver on a 1px sentinel element placed at the top of the document. Do **not** attach a scroll listener. When the header becomes fixed, add equal `padding-top` to the body on interior pages so content does not jump.

Nav link hover: 2px underline in `--pt-sunset-500` that wipes in from left over 200ms. Current page gets that underline permanently plus `aria-current="page"`.

### 7.2 Mobile menu

Open: button `aria-expanded` flips to true, overlay fades in over 240ms while links stagger up 12px at 40ms intervals, focus moves to the first link, body gets `overflow: hidden` with the scroll position preserved so the page does not jump to top.

While open: `Tab` cycles only inside the overlay, `Shift+Tab` wraps backward, `Esc` closes.

Close: reverse the animation, restore body scroll and scroll position, return focus to the toggle button. The toggle is a hamburger that morphs to an X — animate the bars, do not swap icons.

### 7.3 Scroll reveal

One IntersectionObserver, `threshold: 0.15`, `rootMargin: '0px 0px -80px 0px'`. Elements with `[data-reveal]` start at `opacity: 0; transform: translateY(16px)` and transition to neutral over 600ms. Children of `[data-reveal-group]` stagger 60ms each. **Unobserve after firing** — reveals happen once, never again on scroll back up.

Everything above is disabled under `prefers-reduced-motion: reduce`: elements render at their final state with no transition. Ship that as the default in CSS and let the observer add motion, so a no-JS visitor sees fully visible content rather than a blank page.

### 7.4 Cards

Hover and focus-within together trigger: card lifts `translateY(-4px)`, shadow goes to `--pt-shadow-hover`, inner image scales to `1.04` over 500ms. The card is a single `<a>` wrapping the whole thing, or a stretched-link pattern — never nested interactive elements. `:focus-visible` on the card shows the same ring as buttons.

### 7.5 Booking flow

This is the money path. Get the real destination from the extraction in section 1.6 and wire it exactly.

- Every primary CTA points at the same booking destination. One source of truth, set in the Customizer as `{{PT_BOOKING_URL}}`.
- If booking is a third-party platform: link out with `rel="noopener"`, open in the same tab, and append UTM parameters identifying the source section so bookings are attributable.
- If booking is on-site: the experience single page's sticky card posts to it with the experience pre-selected via a hidden field.
- If booking is WhatsApp: build a `wa.me` link with a pre-filled message naming the experience.
- Track a `click` on every CTA with a `data-cta-location` attribute naming its section, so analytics shows which section converts.

### 7.6 Sticky booking card, experience single

Sticks at `top: calc(var(--pt-header-h) + 24px)` once its container's top passes the header. Stops sticking when it reaches the footer boundary — use `position: sticky` inside a grid column, not JS. Below 1024px it unsticks entirely and renders inline above the content. On mobile below 768px, replace it with a fixed bottom bar showing price and a book button, `env(safe-area-inset-bottom)` respected.

### 7.7 Accordion (FAQ)

Native `<details>`/`<summary>` styled, so it works with no JS and is accessible by default. Animate the open state with `grid-template-rows: 0fr → 1fr` on the content wrapper. Chevron rotates 180deg. Multiple can be open at once — do not force exclusivity. Each FAQ also feeds the `FAQPage` schema.

### 7.8 Gallery lightbox

Opens on click or `Enter`. Renders a `<dialog>` element so focus trapping and `Esc` are native. Arrow keys move between images, swipe works on touch, the current index is announced via `aria-live`. Closing returns focus to the thumbnail that opened it. Preload only the adjacent two images.

### 7.9 Forms

Labels always visible above inputs. On blur, validate that field and show an inline message below it in `--pt-sunset-600` with `aria-describedby` wiring. On submit: button enters a disabled loading state with a spinner, response renders in an `aria-live="polite"` region above the form, and on success the form is replaced by a confirmation block — do not just clear the fields. Preserve entered values on error. Honeypot field is visually hidden with CSS, not `display: none`, and paired with a submit-timestamp check.

### 7.10 States to implement everywhere

Every interactive element needs all five: default, hover, `:focus-visible`, active, and disabled. Every async action needs loading, success, and error. Every list needs an empty state. If a section has no content — no testimonials yet, no instructors added — it does not render at all rather than rendering an empty shell.

---

## 8. Templates to build

```
header.php, footer.php, front-page.php, index.php, page.php, single.php,
archive.php, search.php, 404.php, comments.php, functions.php,
single-experience.php, archive-experience.php,
page-templates/page-contact.php, page-templates/page-gallery.php,
template-parts/home/*.php, template-parts/components/*.php
```

### Experience single page layout
Compact hero (60vh, photo, title, meta row) → two-column body: left is long-form content at `--pt-container-narrow` with what's included, what to bring, itinerary, and an FAQ accordion; right is a sticky booking card that pins below the header at 24px offset and shows price, duration, group size, a date/people selector, and a Primary book button. The card unsticks and moves inline above the content at 1024px and below.

### Contact page
Two columns: form left, info panel right. Form fields are `--pt-white` with a 1.5px `--pt-sand-200` border, `--pt-radius-sm`, 14px/16px padding, focus ring in `--pt-ocean-500`. Real labels above inputs — no placeholder-only fields. Inline validation messages, success and error states that are announced to screen readers via `aria-live`. Honeypot plus a timestamp check for spam. No CAPTCHA.

---

## 9. Content model

Register in code, in `inc/post-types.php` and `inc/fields.php`. Use the native WordPress meta box API or ACF free — do not require ACF Pro.

**CPT `experience`** — slug `experiences`, supports title, editor, thumbnail, excerpt, page attributes. Taxonomy `experience_type` (lesson, tour, camp, private). Meta: `price_from` (number), `duration` (text), `skill_level` (select: beginner/intermediate/advanced/all), `group_size` (text), `includes` (repeater of text), `booking_url` (url), `gallery` (image IDs), `itinerary` (repeater of time + description), `faq` (repeater of question + answer).

**CPT `testimonial`** — title is the reviewer name. Meta: `quote`, `rating` (1-5), `origin`, `avatar`.

**CPT `instructor`** — title is the name. Meta: `role`, `bio_short`, `certifications`, `photo`.

Customizer panel "Palm Tree Surf" for global settings: phone, WhatsApp number, email, address, hours, social URLs, booking platform base URL, and the hero video and poster.

---

## 10. Images

- Register custom sizes: `pt-card` 800x600 cropped, `pt-hero` 1920x1080 cropped, `pt-portrait` 800x1067 cropped, `pt-gallery` 1200x1200 uncropped.
- Every `<img>` needs explicit `width` and `height` to reserve space and keep CLS at zero.
- `loading="lazy"` and `decoding="async"` on everything except the hero poster, which gets `fetchpriority="high"` and no lazy attribute.
- Serve AVIF with a WebP fallback and a JPEG last, via `<picture>`.
- Meaningful alt text on every content image; decorative images get `alt=""`.

### 10.1 Photography arrives later — build for the drop-in

Real photos are being supplied after the build. Never block on them, never substitute stock, never generate images. Build against this protocol so adding photos later is a file copy and one JSON edit, with zero template changes.

**Every image slot is declared in `assets/images/manifest.json`:**

```json
{
  "hero-home":        { "w": 1920, "h": 1080, "ratio": "16:9",  "role": "Homepage hero poster / video still", "alt": "", "file": null },
  "hero-video":       { "w": 1920, "h": 1080, "ratio": "16:9",  "role": "Homepage hero loop, mp4 + webm, under 4MB, 8-12s", "file": null },
  "exp-card-1":       { "w": 800,  "h": 600,  "ratio": "4:3",   "role": "Experience card thumbnail", "alt": "", "file": null },
  "split-1-primary":  { "w": 800,  "h": 1000, "ratio": "4:5",   "role": "Split feature tall image", "alt": "", "file": null },
  "split-1-offset":   { "w": 440,  "h": 330,  "ratio": "4:3",   "role": "Split feature overlapping inset", "alt": "", "file": null },
  "instructor-1":     { "w": 800,  "h": 1067, "ratio": "3:4",   "role": "Instructor portrait", "alt": "", "file": null },
  "gallery-1":        { "w": 1200, "h": 1200, "ratio": "1:1",   "role": "Gallery tile", "alt": "", "file": null },
  "cta-bg":           { "w": 1920, "h": 900,  "ratio": "auto",  "role": "Final CTA background", "alt": "", "file": null }
}
```

**A single helper renders every image slot.** Write `pt_image( $slot, $args )` in `inc/images.php`. It reads the manifest, and:

- If `file` is `null`, it outputs a placeholder `<div>` with the exact declared `width` and `height`, `--pt-sand-200` background, and the slot key plus dimensions printed in the center in `--pt-ink-500` monospace. The placeholder occupies the identical box the real photo will, so swapping in a photo causes zero layout shift and zero CSS change.
- If `file` is set, it outputs the real `<picture>` with AVIF, WebP, and JPEG sources, explicit width and height, lazy loading, and the manifest's alt text.

No template ever writes a raw `<img>` for a content photo. Every one goes through `pt_image()`. That is what makes the later drop-in a non-event.

**Handoff instructions**, written to `TODO-CONTENT.md` when the build finishes: for each slot, the key, the exact pixel dimensions, the aspect ratio, where it appears on the site, what the photo should show, and the alt text that needs writing. That file is what gets handed to whoever supplies the photography.

**When the photos arrive:** drop the originals into `assets/images/src/`, run the build script to generate AVIF/WebP/JPEG at the declared sizes, set each `file` and `alt` in the manifest. Nothing else changes.

---

## 11. Technical requirements

- No jQuery. Vanilla JS only, in small ES modules, enqueued with `defer`.
- Total CSS under 60KB uncompressed. No Tailwind, no Bootstrap, no framework.
- Targets on mobile: LCP under 2.0s, CLS under 0.05, INP under 200ms. Lighthouse performance 90+.
- Accessibility: semantic landmarks, one H1 per page, logical heading order, skip link, keyboard-operable everything, visible focus states, `prefers-reduced-motion` respected, color contrast verified.
- Schema in JSON-LD: `LocalBusiness` with `geo` and `openingHoursSpecification` sitewide, `Product` plus `Offer` on experience singles, `FAQPage` where an FAQ exists, `BreadcrumbList` on interior pages, `AggregateRating` only if real reviews exist.
- SEO: descriptive title tags, one canonical, clean permalinks, XML sitemap left to the SEO plugin, `og:` and `twitter:` tags with a per-page image fallback to a theme default.
- Enqueue everything properly with `wp_enqueue_*` and a version constant tied to `filemtime()` for cache busting. Nothing hardcoded in `header.php`.
- `theme.json` present for editor color and typography palettes matching the tokens, so blocks in the editor inherit brand values.

---

## 12. Placeholders

Use these literal strings for anything unconfirmed, so they are greppable:

```
{{PT_PHONE}} {{PT_WHATSAPP}} {{PT_EMAIL}} {{PT_ADDRESS}} {{PT_HOURS}}
{{PT_BOOKING_URL}} {{PT_PRICE_LESSON}} {{PT_PRICE_TOUR}}
{{PT_YEARS}} {{PT_REVIEW_COUNT}} {{PT_RATING}} {{PT_CERT_BODY}}
{{PT_IG}} {{PT_FB}} {{PT_TRIPADVISOR}}
```

At the end of the build, output `TODO-CONTENT.md` listing every placeholder, every image slot with its dimensions, and every copy block that needs a real writer.

---

## 13. Definition of done

Do not report the build complete until all of these pass:

1. Homepage renders every section from part 6 in order, with no PHP notices at `WP_DEBUG` true.
2. Site is tested at 375, 768, 1024, and 1440 widths with no horizontal scroll at any of them.
3. Keyboard-only pass: every interactive element reachable, focus visible throughout, mobile menu traps and releases focus correctly.
4. Lighthouse run on the homepage at mobile throttling scores 90+ on performance and 95+ on accessibility.
5. `grep` for hex codes outside `tokens.css` returns nothing.
6. `TODO-CONTENT.md` exists and is complete.
7. Theme activates cleanly on a fresh WordPress install with no fatal errors and no required plugins.
