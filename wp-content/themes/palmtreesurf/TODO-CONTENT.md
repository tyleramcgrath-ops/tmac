# Content to supply — Palm Tree Surf

Everything the build could not know. Nothing in this list was invented: where a real value was
unavailable it is either a `{{PT_*}}` placeholder or left empty, because a wrong price or a fake
review on a live booking page is worse than a missing one.

Placeholders are stored as Customizer defaults so you can see what to fill in, and the templates
**hide any value still holding a `{{...}}` token** — so a visitor never sees one.

---

## 1. Business facts — Customize → Palm Tree Surf

| Placeholder | Where it shows | Section |
| --- | --- | --- |
| `{{PT_PHONE}}` | Footer, contact page | Contact Details |
| `{{PT_WHATSAPP}}` | Floating button, footer, every "ask on WhatsApp" link | Contact Details |
| `{{PT_EMAIL}}` | Footer, contact page, booking notification recipient | Contact Details |
| `{{PT_HOURS}}` | Footer, contact page | Contact Details |
| `{{PT_IG}}` `{{PT_FB}}` `{{PT_TRIPADVISOR}}` | Footer social row, `sameAs` schema | Social Links |
| `{{PT_YEARS}}` | Hero trust row | Front Page Hero |
| `{{PT_CERT_BODY}}` | Hero trust row | Front Page Hero |
| `{{PT_RATING}}` `{{PT_REVIEW_COUNT}}` | Hero trust row | Front Page Hero |
| `{{PT_WAVE_SIZE}}` | Location section conditions table | Surf Conditions |

Address and water temperature are pre-filled with values safe to assume for Tamarindo — check them.

**Not set, and needed:** map embed URL (Contact Details) for the location section, and a booking
system URL only if you use an external platform. Leave the booking URL empty to keep bookings
on-site.

Find any remaining placeholder with:

```bash
grep -rn "{{PT_" wp-content/themes/palmtreesurf
```

---

## 2. Prices — made up, and flagged as made up

**This changed in v1.12.0.** Every experience now carries a price, and **none of
them came from you.** They were invented so the quote, the deposit and the Stripe
checkout could be built and tested end to end. They are not a suggestion of what
to charge.

Every made-up price is labelled. You will see it in three places, and all three
clear themselves as you save real rates:

- **Pricing** in the admin menu — a red *Made-up price* under each tour's name.
- A red warning at the top of that screen listing every tour still affected.
- The same warning on the Experiences list.

Set your real rates in **Pricing**. It is one screen with every tour, grouped by
category, and a **Save all prices** button. Editing a tour individually still
works — **Experiences → edit → Pricing** writes the same numbers.

Two ways to price a tour. Fill in one or the other, never both:

| | Use it for | Fields |
| --- | --- | --- |
| **Per person** | lessons, kayak tours, wildlife trips | Price per adult, Price per child |
| **Flat rate** | charters, private hire | Flat rate, People it covers, Extra person rate |

If a flat rate is set it wins and the per-person rates are ignored.

**Start time surcharges** are added once per booking, not per person, and only
when the customer picks that time. One per line, as `17:00 | 15`. The Sunset
Boat Tour ships with `17:00 | 10` as a worked example — replace or delete it.

The current made-up figures, so you know what to overwrite:

| Experience | Made-up rate |
| --- | --- |
| Surf Lesson — Beginner | 65 adult / 55 child |
| Surf Lesson — Intermediate | 75 adult / 65 child |
| Private Surf Coaching | 120 adult |
| Island Kayak Tour | 55 adult / 40 child |
| Mangrove Kayak Tour | 60 adult / 45 child |
| Estuary & Wildlife Trip | 70 adult / 50 child |
| Turtle Tour | 80 adult / 60 child |
| Sunset Boat Tour | 90 adult / 65 child, +10 at 17:00 |
| Fishing Charter | 650 flat for 4, 85 per extra guest |

---

## 3. Reviews — replace before launch

Three testimonials were seeded titled **"Sample Review — replace"**. They are obvious placeholders
on purpose: writing fake reviews for a real business would be both dishonest and, in most
jurisdictions, unlawful.

Replace each with a real guest quote (with permission), a real name and city, and a real rating.
Under **Testimonials**.

Review counts on the three surf lessons (4.9/342, 4.8/189, 5/127) came from your live site. Confirm
they are current — they feed the `AggregateRating` schema, which must reflect real reviews.

---

## 4. Photography

**Every photograph in the theme is the operator's own.** The stock and AI-generated plates that
shipped with earlier versions — the sunset hero, the reef turtle, the catamaran, the ATV waterfall,
the beach yoga, the snorkelling pair, the three polished surf-lesson shots and the two banners —
were removed in 1.11.0 and are not coming back. Twenty-six real photographs replace them.

| Group | Files |
| --- | --- |
| Surf | `group-lesson-beach`, `instructor-popup-stance`, `group-instruction-sand`, `surf-lesson-group-briefing`, `surf-students-with-boards` |
| Kayak, island | `kayak-guides-paddles`, `kayak-fleet-beach`, `kayak-group-guests`, `kayak-surf-tent` |
| Kayak, mangrove | `estuary-mangrove-kayak`, `estuary-mangrove-paddlers`, `estuary-kayaks-mangrove-shore` |
| Estuary wildlife | `estuary-crocodile`, `estuary-crocodile-surfacing`, `estuary-capuchin-monkey`, `estuary-capuchin-troop` |
| Fishing | `fishing-charter-boat`, `fishing-boat-headland`, `fishing-boat-rods-out`, `fishing-trolling-wake`, `fishing-sailfish-release`, `fishing-marlin-release`, `fishing-mahi-mahi`, `fishing-yellowfin-tuna`, `fishing-anglers-tuna`, `fishing-grouper` |

How they were prepared: EXIF stripped, which removes the GPS coordinates the phones recorded;
capped at 1600px; 480/768/1200/1600 variants generated so a phone never pulls a full-size file;
and `kayak-guides-paddles` cropped to remove an "Island Tour" caption burned into the corner.
No shipped photo carries baked-in text.

**Where they appear.** Each experience now carries its own photo set, shown below the booking form
through the same grid and lightbox as the main gallery — eight photographs on the fishing charter,
five on the estuary trip, four on each kayak tour and each surf lesson. The main gallery runs to
24 tiles. `pt_experience_photo_sets()` in `inc/experience-media.php` is the map.

**Still needed:**

| Slot | What it should show |
| --- | --- |
| Instructor portraits 1–4 | Deliberately empty. The supplied photos show guests and staff nobody has identified, and captioning someone as a named instructor needs their say-so. Send names against faces and they go straight in. |
| Turtle Tour | The tour exists; no turtle photograph does. Its card falls back to a generic experience photo. |
| Sunset Boat Tour | Borrows the fishing boat at anchor. It is the right boat and the right coast, but it is not a sunset cruise. |
| `tax-advanced` | No photograph of advanced surfing. Renders a brand panel. |
| `hero-video` | Empty on purpose — see below. |

**Video.** Two clips were supplied: 2.4MB at 848×480 running 24s, and 18MB at 1920×1080 running
14.5s. The smaller one ships as `assets/video/estuary-crocodile.mp4` and plays on the Estuary &
Wildlife Trip and Mangrove Kayak Tour pages. It is `preload="none"` behind a poster frame, so it
costs a visitor nothing until they press play, and it never autoplays.

The 1080p clip is **not** bundled: 18MB in a theme zip is more than the rest of the theme put
together, and theme files get re-uploaded and backed up repeatedly. Upload it to the Media Library
instead and paste its URL into the **Video URL** field on any experience — that field wins over the
bundled clip. The same applies to any future footage. `hero-video` stays empty because filling it
needs a clip trimmed to 8–12 seconds under 4MB, and no video tooling was available here to cut one.

## 5. Copy needing a real writer

| Page | Status |
| --- | --- |
| **About** | Placeholder paragraph only. Needs the real story: who runs it, how long on this coast, why trust you. |
| **Privacy Policy** | Stub. Must describe what the booking form collects and how long you keep it. |
| **Journal** | Empty. No posts seeded. |
| **Experience descriptions** | One-line excerpts only. Each needs a real body: what the session is actually like. |
| **Instructors** | Four seeded with generic titles ("Lead Instructor"). Needs real names, roles, bios, certifications. |
| **Fishing / boat / wildlife** | Structural starters. Durations and inclusions are plausible defaults — confirm them. |
| Location paragraph | Written from general Tamarindo knowledge. Check it matches how you describe your break. |

---

## 6. Schedules — check before taking bookings

Every seeded experience got a default schedule: **every day, 07:00 / 09:30 / 14:00, 6 guests per
slot, 12 hours minimum notice.**

That is a placeholder, not your real operation. Set the real days, times and capacity per experience
under **Experiences → edit → Availability & Schedule** before the form is live, or you will take
bookings for slots you do not run.

---

## 7. Also worth doing

- **Theme screenshot** — add `screenshot.png` at 1200×900 so the Themes screen is not blank.
- **Site icon** — Customize → Site Identity.
- **Logo** — the header falls back to a gradient dot plus the site name. Upload an SVG or PNG.
- **Fonts** — Inter loads from the Google Fonts CDN. Spec §4 asks for self-hosted WOFF2 in
  `assets/fonts/` to drop the third-party connection and the GDPR question. Not done.
- **Live-site bug** — the Pangas Beach Club card on the current site renders alt text instead of its
  image. Unrelated to this theme, but worth fixing there.

---

## 8. Added by the approved-redesign build (v1.2.0)

### Claims in the hero trust row — verify before launch

Customize → Palm Tree Surf → **Trust Row**. Four short claims sit under the hero. They default to
modest, factual phrasing. The design board shows "Best Price Guarantee" and "Support in English &
Español" — **neither is set**, because the brief is explicit that those may only be stated if they are
operationally true. Set them yourself if they are.

### Story banner statistics — empty on purpose

Customize → Palm Tree Surf → **Story Banner**. The board shows "200+ Local Experiences", "5,000+ Happy
Travelers" and "24/7 Local Support". Those are comp values and were **not** carried across. Each stat
is an empty field and the block hides its stats until you fill them with real numbers.

The "Watch Our Story" button only appears once a real video URL is set; until then it renders as a
normal link to the experiences archive.

### Images still needed for the redesign

| Slot | Size | Used by |
| --- | --- | --- |
| `hero-home` | 1920×1080 landscape | Homepage hero — currently a cropped portrait |
| `story-banner` | 2000×900 | Story band and the experiences listing hero |
| `cta-bg` | 1920×900 | Lifestyle closing band |

The reference crops in the redesign package are extracted from a generated design board. They are
useful for framing and composition and are **not** production photography, so none of them were
installed as site images.

### Marketplace verticals not built

Food delivery, events, transportation, gift vouchers, vendor onboarding and customer accounts appear
in the design board but are **not** part of this build, by your decision. Nothing was stubbed for
them: there is no restaurant data in this WordPress install, and inventing businesses, ratings or
inventory would have broken the brief's own rules. Adding a vertical later is a taxonomy term or a new
post type, not a rewrite.

---

## 9. Added in v1.5.0 — reviews, categories, logo, About

### The rating system is live, and starts empty

Visitors can now leave a star rating and a review on any experience. Reviews ride on WordPress
comments, so they arrive under **Comments** in wp-admin with a **Rating** column, and every one is
**held for moderation** — nothing publishes itself. The score, the distribution bars and the
`AggregateRating` schema are all computed from approved reviews only.

Two things follow from that:

- **A new experience shows no stars.** That is correct. It says "No reviews yet" until someone
  leaves one. Do not put numbers in the manual rating fields to fill the gap.
- **The manual `Rating` / `Review count` fields still work**, and are only for an aggregate you are
  carrying over from somewhere you already collect reviews. The moment one real review is approved,
  the real figure takes over. The three surf lessons still carry the figures from your old site —
  confirm they are current, or clear them and let the real reviews build.

To let reviews publish without moderation (not recommended), a plugin or child theme can filter
`pt_moderate_reviews`.

### Category pages

`/experiences/category/<name>/` used to fall through to the blog layout. They are now full pages:
photo header, the category's own description, an intro, highlights, a "good to know" panel, the
results grid with filters, an FAQ and links to the other categories.

- **The description under the title is editable** at **Experiences → Categories → edit**. The theme
  writes a starter description once, and never touches it again after you edit it.
- **The header photo is editable** on the same screen ("Header photo"). Leave it empty to use the
  photo the theme ships for that category.
- The intro, highlights, "good to know" and FAQ are theme copy keyed to the category slug. They are
  filterable (`pt_term_copy_map`) but are not in the admin — tell me if you want them editable there.

### The experiences hub

`/experiences/` is now a browsable hub: a sticky category bar, then one section per category. A
category link from the menu or the homepage jumps you to that section with everything else still
above and below, so nobody has to back out to a menu to look at something else. Each section links
on to the full category page.

### Logo

The logo package is bundled with the theme, so it is branded with no upload. The reversed version
shows over a hero, the full-colour one once the header sticks, and the favicons and the wp-admin
login screen use it too. Uploading a logo under **Customize → Site Identity** overrides all of it.

### About page

The About page is now a designed page (hero, story, a facts panel, the three booking steps, how
days are run safely, guides, an eight-question FAQ, location, CTA) instead of a column of
placeholder text. **The story itself is still yours to write** — the last section of the page body
says so. Everything above it is real and general; the specific history is the part that will
actually rank and convert, and only you have it.

### Still outstanding

- No photograph exists for **Fishing Charters**; its card and header reuse the beach-launch photo.
- No real guide portraits: the four guides render as brand panels. The second photo batch shows
  guests and unidentified staff, which is not the same thing as a captioned portrait.
- `exp-card-1..3` and `hero-video` slots are still empty.
- The trust row under the hero now reads "Book online in minutes / Local Tamarindo guides / Small
  groups / English & Español". **Confirm all four are true of how you operate** — they are claims,
  and they are editable under **Customize → Front Page Hero**.

---

## 10. Added in v1.7.0 — logo, gallery, blog, operators, Spanish, speed

### The logo was wrong, and why

The SVGs in the package set the wordmark as live `<text>` in Montserrat — a font
this site does not load — so every browser drew it in its own fallback and it
looked nothing like your artwork. The theme now ships the **PNG** versions,
which have the type baked in, trimmed of their padding. Full colour once the
header sticks, reversed over a hero, and reversed in the footer. Upload a logo
under **Customize → Site Identity** to override all of it.

### Gallery

Now a proper grid with a lightbox. **You can manage it**: add a Gallery block to
the Gallery page and those images take over, in your order. Leave the page empty
and it falls back to the photos bundled with the theme.

### Five blog posts, published

Under **Posts**, in a "Tamarindo Guides" category, each over 2,000 words with a
featured image, a short-answer summary, an FAQ and Article + FAQPage schema:

- Learning to Surf in Tamarindo: A Complete Beginner's Guide
- The Best Time to Visit Tamarindo: A Month-by-Month Guide
- Sport Fishing in Tamarindo: What You'll Catch, and When
- The Tamarindo Estuary: What You'll See, and Why You Go at Dawn
- Things to Do in Tamarindo: A Five-Day Plan

They are written from general knowledge of this coast and these activities. **No
post states a price, a guarantee or a certification**, because the theme does not
know yours. Read them before they go out — if anything does not match how you
operate, change it, they are ordinary posts.

WordPress's "Hello world!" sample post is moved to the trash on update, but only
while it is still the untouched default.

### Operator sign-up — **Operators** in the admin menu

`/list-your-tours/`. Companies submit their business, tours, capacity, languages,
insurance, permits and certifications. Applications arrive under **Operators** as
records you can review, with status and columns, not as an email that gets lost.
Applicants get an automatic acknowledgement; you get a notification with a link
straight to the application.

**Commercial terms are deliberately unanswered.** The FAQ says the terms are set
out in writing when you reply. Do not let the theme invent a commission rate —
edit that answer once you have decided, via the `pt_operator_faq` filter or by
telling me what it should say.

### Spanish — off until you switch it on

**Customize → Palm Tree Surf → Language → "Offer the site in Spanish".**

Once on: an EN/ES toggle in the header, the whole interface in Spanish, and a
**Español** box on every page, post and experience for the title, short
description and body. Categories get Spanish names on their edit screens.
Anything you have not translated shows in English rather than half-translated.
hreflang tags are emitted so both versions get indexed.

The interface translation is done. **The page and article bodies are not** —
those are yours, and there is an ES column on the Pages and Posts lists showing
what still needs doing. If you install Polylang or WPML, this switches itself
off and defers to them.

### Speed

Measured on a mobile viewport against the local build:

| Page | Before | After |
| --- | --- | --- |
| Home | 1,084 KB | 426 KB |
| Category | 603 KB | 282 KB |
| Blog post | 386 KB | 339 KB |

Third-party requests went from two hosts to **none**. What changed: fonts are
self-hosted (latin and latin-ext only, both variable, so four files cover every
weight), the hero is preloaded with the same srcset the page uses so it is not
downloaded twice, bundled photos ship at 480/768/1200/1600 as well as full size,
the originals were re-encoded and capped at 1920px, half-width card and portrait
crops were added so a phone stops downloading 800px images for 300px slots, and
WordPress's emoji script, oEmbed discovery, RSD/wlwmanifest links and the block
library stylesheet on non-block pages were removed.

**Media already in your library is refreshed on update** — the theme overwrites
the seeded files with the smaller versions and regenerates the crops, keeping the
same attachment IDs so nothing breaks.

### Still outstanding

- No photograph exists for **Fishing Charters**; its card and header reuse the
  beach-launch photo.
- No real guide portraits — the four guides render as brand panels.
- The hero trust row and the finder's "Free cancellation 24h" line are claims
  about how you operate. **Confirm all of them**, under Customize.

---

## 11. Added in v1.8.0 — new logo, page order, tiled experiences

### The logo you sent is now the logo

The swatch label ("6 / MINIMAL") is cropped off, the cream card background is
gone, and the artwork is delivered as transparent PNGs.

Your lockup is **stacked** — mark above a three-line wordmark. At a height a
navigation bar can carry, that wordmark would be a few pixels tall and
unreadable, so there are two lockups built from your artwork:

- **Header**: a horizontal version, mark left and the three lines right.
- **Footer**: the full stacked lockup, where there is vertical room for it.

Both in full colour and reversed-for-dark. The favicons and the wp-admin login
screen use the mark on its own.

### The About page — fixed, and why it was stuck

It was still showing *"Tell your story here: who runs Palm Tree Surf…"*. The
theme only rewrites a seeded page it can prove nobody has edited, and it
recognises that by matching known placeholder phrases. **That phrase was not in
the list**, so your page looked client-written and was skipped every update.
The list now covers every placeholder the theme has ever shipped, and the About
page picks up the full copy on this update.

### Information first, reading material second

Category and experience pages were front-loading editorial copy and pushing the
bookable content down the page. Reordered:

- **Category pages** — hero, finder, category bar, then **the results**. The
  highlights, the longer description, the FAQ and the other categories all sit
  below them. The hero lede is trimmed to one line and the hero itself is
  shorter.
- **Experience pages** — the excerpt, then **what is included and what to
  bring**, then **the booking form**. The full description, the itinerary and
  the FAQ follow underneath.
- **Contact** — the form first, the practical notes after it.
- **The hub** — the categories first, the editorial band and the FAQ after.

Nothing was deleted. Everything that was there is still there, further down,
where it still does its job for search.

### Experiences tiled together

`/experiences/` was one full-width section per category, which meant six screens
of scrolling to see what you sell. It is now a single dense grid — four across
on a wide screen, three on a tablet, two on a phone — so the whole offering is
visible at once.

The category chips now **filter that grid in place** rather than jumping you
down the page. With JavaScript off they stay ordinary links to the category
pages, so nothing breaks.

### Article width

The long-form pages were set to a 760px measure, which reads narrow on a desktop
screen. Guides, FAQs and the article body now run to 880px.

---

## 12. Added in v1.9.0 — the assistant, WhatsApp, and five unstyled components

### Your WhatsApp number is live

**+1 561 262 4570** is set as the default, so the floating WhatsApp button, the
footer link, the closing call to action and the contact page button are all
switched on. Change it under **Customize → Palm Tree Surf → Contact Details**.

### The booking assistant

A chat bubble, bottom right. It answers questions from **this site's own FAQs
and experience pages**, then sends people to the booking form or straight to
your WhatsApp with their question already typed.

**It is a matcher, not a language model, and that is deliberate.** It can only
ever repeat text that is already written on this site, so it cannot invent a
price, promise a departure time or make up a cancellation policy — which is
exactly what a chatbot pointed at a booking page will eventually do. It needs no
API key and costs nothing per conversation.

If you later want a real AI behind it, the seam is built: return a URL from the
`pt_assistant_endpoint` filter and the widget posts questions there first,
falling back to the local matcher if the request fails.

Controls are under **Customize → Palm Tree Surf → Booking Assistant** — switch it
off, or change the opening message.

### Five components had no CSS at all

An audit comparing every class used in the templates against the stylesheet
found five blocks that shipped with markup and no rules, so each fell back to
unstyled browser defaults:

- **The closing call to action** — this is the one you spotted. Its photograph
  rendered as a plain block *above* the text instead of behind it. The text now
  sits on the image with a scrim strong enough to stay readable over that
  bright sunset.
- **Split features** — images stacked at full size instead of sitting beside
  the prose with an inset.
- **The trust bar**, **the location section** and **the map placeholder** — all
  browser defaults.

`btn--large` was also a typo for the theme's `btn--lg`, so that button was
rendering at default size.

This is the same root cause as the gallery and the finder button in earlier
releases. The audit is worth re-running after any new component.

### Spanish

The assistant interface and the shared FAQ it answers from are translated, so
with Spanish switched on the bubble speaks Spanish. The category-specific FAQs
and the long-form articles are still English until written — the ES column on
the Pages and Posts lists shows what remains.

---

## 13. Fixed in v1.9.1 — the language toggle only worked one way

Clicking **ES** switched to Spanish; clicking **EN** did nothing.

The English link pointed at the plain URL with no `?lang=` on it, which looked
tidier and was wrong: with no parameter in the request the theme falls back to
the language stored in the visitor's cookie — still Spanish — so the site
switched to Spanish and could never switch back.

Both links now carry the parameter. Choosing English clears the stored
preference and redirects to the clean URL, so the English page stays canonical
and query-string free, which is what the hreflang tags point at.

Tested both directions and across page loads: Spanish sticks while browsing,
English sticks while browsing, and switching back works from any page.

---

## 14. Added in v1.12.0 — your photos, two new tours, prices, Stripe, full Spanish

### Every photo on the site is now one of yours

All stock and generated photography is gone. The gallery, the experience cards,
the category banners and the hero are built from the files you sent. Nine banner
crops were cut from your originals specifically for the wide strips at the top of
each page, which is what fixed the blurring and the bad alignment.

One image could not be used: the Pacific Lounge shot. It is a screenshot rather
than a photo, it carries a Google copyright notice, and the boat in it is another
operator's branded vessel (P-14097). Send the original file and written
permission and it goes in.

### Two new tours, and the kayak split

**Kayak Tours** is a new category holding **Island Kayak Tour** and **Mangrove
Kayak Tour**. **Turtle Tour** was added under Wildlife & Nature. All three have
copy, photos, prices and a booking form, and all three carry made-up prices —
see section 2.

### Ezekiel is the lead instructor

Listed as **Guide and Lead Instructor**. The portrait came through inline in
chat rather than as a file, so it could not be bundled into the theme. Upload it
under **Instructors → Ezekiel → Featured image** and it appears everywhere he is
shown.

### Photos and video on each experience page

Each experience page now has a gallery of its own photos below the description.
The Estuary & Wildlife Trip has a video.

Two 1080p clips you sent could not be bundled — they are too large to ship inside
a theme. Upload them to **Media**, then paste the URL into **Experiences → edit →
Video URL** and they play on the page.

### A live price on the booking form

As a customer picks a tour, party size and start time, the form shows a running
total with the breakdown, the deposit and a note that the figure is an estimate
confirmed on reply.

The price is always worked out on the server, never in the browser, so what a
customer is shown and what they would be charged cannot drift apart. With
JavaScript off the form behaves exactly as it did before.

### Stripe

**Settings → Stripe payments.** Paste a secret key and a webhook signing secret
and card payment is live; leave them empty and nothing changes — bookings stay
request-and-reply as they are today.

The webhook URL to paste into the Stripe dashboard is printed on that settings
page. Signatures are verified before anything is recorded, so a forged
notification cannot mark a booking paid.

Set your real prices before switching this on.

### One plugin, not two — **you must re-upload it**

Pricing and Stripe live in the booking plugin, not the theme, because they are
about taking money rather than about how the site looks. That means **Palm Tree
Bookings 2.0.0 replaces the copy you installed** — deactivate and delete the old
one, then upload the new zip. Your bookings, schedules and settings are stored in
the database and survive the swap.

### Spanish, properly this time

Switching to ES previously left tour descriptions, category text, form labels and
button text in English. Every one of those now translates.

This was measured rather than assumed: a script renders each page in both
languages and counts the lines that come back byte-identical. Across ten pages
that count went from 165 to 2, and both survivors are correct — one is the
Tamarindo address, which is the same in both languages, and the other is a
WordPress core string from the comment form.

That last one needs WordPress's own Spanish files, which only it can install.
There is a notice in the admin telling you the fix: **Settings → General**, set
Site Language to *Español de Costa Rica*, save, set it back to English. That
downloads the files once and the string follows the toggle from then on.
