# Audit findings — palmtreesurf.com

**Status: visual audit received. Section 1 extraction still blocked from this sandbox, but three
homepage screenshots and four production photos were supplied directly, which unblocks the design
work.**

## ⚠️ The finding that changes the build

**palmtreesurf.com is not a surf school. It is a multi-vertical local marketplace.**

The site brands itself "Tamarindo's Complete Marketplace" and its H1 is
"Book Experiences. Order Food. Live Pura Vida." The primary nav carries seven destinations:

| Nav item | What it implies |
| --- | --- |
| Experiences ▾ | Surf lessons, boat tours, wildlife adventures — bookable, with instant confirmation |
| Food Delivery ▾ | Restaurant listings, menus, delivery **and** pickup, order tracking, online payment |
| Events | Nightlife and happenings listings |
| Transportation | Transfers / rides |
| 🎁 Gifts ▾ | Gift vouchers, purchasable |
| For Business ▾ | Vendor / partner portal — implies multi-vendor onboarding |
| Login / Sign Up | **Customer accounts** |
| EN / ES | **Bilingual site** |

`VISUAL-SPEC.md` §3 describes the target as a "boutique surf outfitter … premium surf lessons, ocean
tours, and custom water experiences." That is roughly **one of six verticals** on the real site.

Per §2, the live site wins on business facts and on "any section that exists on the current site but
is missing from this spec." Applied honestly, that rule does not produce a surf theme with extra
sections bolted on — it produces a different product. This needs a decision before more code is
written, and that decision is in the section at the bottom.

## Extracted design system

Sampled from the supplied screenshots. Treat as high-confidence for hue and role, approximate for
exact hex — confirm against `/assets/index-*.css` when it becomes available.

### Colour

| Role | Observed | Where it appears |
| --- | --- | --- |
| Coral / salmon — **the** CTA and accent | `#FF6F61`–`#F9705F` | Sign Up button, "Most Popular" / "Premium" badges, section eyebrow text, cuisine labels |
| Teal — primary action gradient | `#22C9C0` → `#16A6B8` | "Find Experiences" / "Find Restaurants" buttons |
| Teal — links and micro-accents | `#14B8A6` | "Explore →", "Browse →", "Instant Booking" badge |
| Dark navy — headings | `#12293F` | All H1/H2/H3 on light backgrounds |
| Cream / sand — alternating section | `#FAF5EC` | Experiences section background |
| White — cards and food section | `#FFFFFF` | Cards, filter panels, food section |
| Hero scrim | `rgba(16,42,56,.72)` over photo | Hero only |
| WhatsApp green | `#25D366` | Fixed bottom-right FAB |

The wordmark "Live Pura Vida." uses a horizontal **gradient**, teal → light green → yellow
(approximately `#5EEAD4` → `#86EFAC` → `#FDE047`). It is the single most distinctive brand element
on the page.

Note this **contradicts spec §4**, which specifies an ocean/sunset palette with
`--pt-sunset-500: #E2703A` as the only accent. The real accent is a pinker coral, and teal is a
co-equal action colour, not a tint. Live site wins per §2.

### Type

Headings are a heavy geometric sans, roughly 800–900 weight, tight negative tracking, very large
hero size. Body is a neutral UI sans. Consistent with the Inter family declared in the served HTML
`<head>`, with the hero likely at 900. No second display family is evident in the screenshots.

Eyebrows are uppercase, letterspaced, semibold, coral — matching spec §4's eyebrow treatment, but
coloured coral rather than ocean.

### Components observed

- **Header** — solid white, not transparent-over-hero. Logo left, circular search pill, nav with
  dropdown carets, EN/ES segmented toggle, text "Login", filled coral "Sign Up" pill.
- **Hero** — full-bleed photo, dark scrim, centred content, pill badge above H1, three-line H1 with
  the third line in gradient, one sub-line, then **four glass cards** (translucent, light border)
  each with emoji icon, title, one-line description, and a teal text link with a chevron.
- **Search / filter panel** — the conversion device on both Experiences and Food. White, rounded,
  bordered, soft shadow. Title left, status badge right ("⚡ Instant Booking", "🚚 Fast Delivery").
  Three labelled controls in a row, then a full-height gradient submit button. A trust row sits
  beneath a hairline divider: instant confirmation / free cancellation 24h / best price guarantee,
  and 25-35 min delivery / track your order / pay online securely.
- **Listing card** — image top with a corner badge, a **rating pill overlapping the image bottom-right**
  (★ score + review count in parentheses), then title, a coral category line for restaurants, a
  two-line description, and a meta row (time · price tier · delivery fee).

### Real content captured

Experiences: "Surf Lesson — Beginner" ★4.9 (342) · "Surf Lesson — Intermediate" ★4.8 (189) ·
"Private Surf Coaching" ★5 (127).

Restaurants: "Pangas Beach Club", Seafood & International, ★4.8 (892) · "Nogui's Sunset Café",
Seafood & Costa Rican, ★4.9 (1247) · "Seaside Restaurant", Mediterranean & Fusion, ★4.7 (456).
All show 25-35 min, `$$$`, $3.50 delivery.

URL pattern confirmed: `/restaurant/noguis-sunset-cafe`.

### Bug spotted on the live site

The "Pangas Beach Club" card renders its **alt text instead of its image** — a broken image source.
Worth fixing on the current site regardless of what happens with the rebuild.

## Photography

Four production photos supplied and committed to `wp-content/themes/palmtreesurf/assets/images/src/`:
group lesson on the beach with boards, kayak beside a "Pura Vida Costa Rica Surf & Beach" tent,
an instructor demonstrating the pop-up stance, and group instruction on the sand.

All four are authentic Tamarindo surf-school photography — real, not stock, which is what §3
demands. All are **portrait orientation (3:4)**, so they suit the instructor and split-feature slots
directly; the 16:9 hero and 4:3 card slots will need either a crop or a landscape frame. Logged in
`TODO-CONTENT.md`.

## Section 1 extraction — still blocked, unchanged

The ladder result from the previous pass stands. `palmtreesurf.com` is refused by the egress proxy
at CONNECT (`curl: (56) CONNECT tunnel failed, response 403`); headless Chromium fails identically
with `ERR_TUNNEL_CONNECTION_FAILED`, while a control request to github.com opens its tunnel and
fails later at TLS — which is what identifies this as a host-level policy denial rather than a
broken browser or a bot wall.

`extract.mjs` remains written and fixed. What the screenshots do **not** give, and a real extraction
still would: exact hex values, the type scale in pixels, spacing rhythm, the full page list, interior
page structure, and the real behaviour of the booking and ordering flows.

## The decision this audit forces

The rebuild cannot proceed sensibly until one question is answered:

**Is the WordPress site meant to replace the whole marketplace, or only the surf business?**

- **Whole marketplace** — food delivery with menus, carts, order tracking and payment; transport;
  events; gift vouchers; vendor onboarding; customer accounts; bilingual EN/ES. This is not a theme.
  It is a multi-vendor platform, and it is a fundamentally larger build than `VISUAL-SPEC.md`
  describes.
- **Surf and experiences only** — the spec is broadly right, the existing booking plugin fits, and
  the marketplace verticals either drop or become links out to the current app.
- **Marketing front, app behind** — WordPress owns the homepage, SEO pages, content and gift
  vouchers; the existing React app keeps ordering and booking. Cheapest path, and the one that best
  fits what has been built so far.

Until that is answered, the shared work is safe to continue: the real palette, the header, the hero,
the listing card, the filter panel, and the experiences section are common to all three answers.
