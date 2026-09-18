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

## 2. Prices — deliberately empty

Every experience has an empty **Price from** field. No price was guessed.

Set them per experience under **Experiences → edit → Details**. Until a price is set, the card and
the booking card simply omit the price row rather than showing a placeholder — and the booking
plugin's quote falls back to zero, so a booking still captures correctly.

| Experience | Needs |
| --- | --- |
| Surf Lesson — Beginner | price per person |
| Surf Lesson — Intermediate | price per person |
| Private Surf Coaching | price per session |
| Fishing Charter | half-day and full-day price |
| Sunset Boat Tour | price per person |
| Estuary & Wildlife Trip | price per person |

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

Four real photos you supplied are in the theme and sideloaded into the Media Library on activation.
Every other slot renders a correctly-sized grey placeholder, so the layout is already final and
adding a photo changes nothing but the photo.

**Supplied and in use:**

| File | Used for |
| --- | --- |
| `group-lesson-beach.jpg` | Hero background, Beginner lesson, gallery |
| `instructor-popup-stance.jpg` | Intermediate lesson, split feature, gallery |
| `group-instruction-sand.jpg` | Private coaching, second split feature, gallery |
| `kayak-surf-tent.jpg` | Fishing charter, split inset, gallery |

**Still needed.** All four supplied photos are portrait 3:4, so wide slots currently crop them:

| Slot | Size | Ratio | What it should show |
| --- | --- | --- | --- |
| `hero-home` | 1920×1080 | 16:9 | **Landscape** hero frame. Currently a cropped portrait. Highest-impact fix. |
| `hero-video` | 1920×1080 | 16:9 | Optional 8–12s loop, under 4MB, muted |
| `exp-card-1/2/3` | 800×600 | 4:3 | Per-experience card photos — fishing, boat tour, wildlife have none |
| `split-2-offset` | 440×330 | 4:3 | Inset for the second split feature |
| `gallery-5`, `gallery-6` | 1200×1200 | 1:1 | Two more gallery tiles |
| `cta-bg` | 1920×900 | wide | Final call-to-action background |
| Instructor portraits | 800×1067 | 3:4 | One per guide, four seeded with no photo |

To add one: drop the file in `assets/images/src/`, then set `file` and `alt` for that slot in
`assets/images/manifest.json`. Or upload to the Media Library and set it as the featured image,
which wins over the bundled file.

Write real alt text for each — it is both accessibility and SEO.

---

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
