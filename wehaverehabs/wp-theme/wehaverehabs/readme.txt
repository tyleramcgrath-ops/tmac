=== We Have Rehabs ===
Requires at least: 6.3
Tested up to: 6.8
Requires PHP: 7.4
License: GPLv2 or later

Boutique directory theme for holistic mental-health and recovery sanctuaries worldwide.

== Install ==

1. WordPress admin → Appearance → Themes → Add New → Upload Theme → choose wehaverehabs.zip → Install → Activate.
2. Settings → Permalinks → choose "Post name" → Save.
3. Tools → Import listings → "Use the included listings" → Start import, to add the real facilities.
4. Optional: Appearance → Demo content → "Import demo content" to fill the site with the example
   sanctuaries, destinations, pages and photos from the design. Remove them later with one click.

== What the theme adds ==

* Sanctuaries (wp-admin → Sanctuaries): one listing per retreat or clinic, with price, stay
  lengths, guests, languages, license details and check date, inquiry email, WhatsApp, gallery,
  a day's schedule, therapies, team, rooms & rates, inclusions and a guest reflection.
* Taxonomies: Destinations (country → region), What we help with, Care levels (Retreat /
  Clinical program / Medically supervised), Ways of healing, Settings.
* Destination guides: edit a destination (Sanctuaries → Destinations) to add its hero photo,
  tagline, story, "at a glance" facts, reasons, "before you go" travel notes and FAQ.
* Search: /sanctuaries/ with filters for destination, need, care level, setting, budget and stay,
  and sorting. Sponsored listings appear first and are always labeled.
* Inquiries: the form on each sanctuary emails the sanctuary's inquiry address (or the site admin)
  and keeps a private copy under wp-admin → Inquiries. "List your sanctuary" requests land there too.
* Real facilities: 21,842 treatment facilities in 65 countries ship with the theme
  (data/listings.jsonl.gz). Tools → Import listings → "Use the included listings" → Start import
  (or `wp whr-import bundled`). Each is an unclaimed public listing showing its source.
* Plans:
    Public listing — imported facts only, attribution, "Claim this listing" form.
    Essential (free) — claimed & verified: owner keeps facts and a short description up to date,
      "Verified" badge, guest inquiries go straight to them.
    Signature (paid) — full profile: photos, story, daily rhythm, therapies, team, rooms & rates,
      WhatsApp button; ranked above free listings.
    Featured (paid) — Signature + top of search, homepage rotation, "Sponsored" label.
* Claims & owner accounts: claims land in Inquiries. Hover a claim → "Approve claim": the claimant
  gets a Facility owner login (they can edit only their own listing and photos; placement,
  verification and billing stay with you) and an email to set their password.
* Payments (Stripe): create a monthly Payment Link for Signature and for Featured in Stripe, then
  paste both links, the prices and the webhook signing secret in Appearance → Customize → We Have
  Rehabs. Add the webhook endpoint shown there (…/wp-json/whr/v1/stripe) with the events
  checkout.session.completed, invoice.paid and customer.subscription.deleted. Paying turns the plan
  on, renewals extend it, cancelling returns the listing to Essential. You can also set a plan and
  "paid until" date by hand on any listing (Plan & billing box). Sanctuaries → Plans & upgrades
  lists paying listings.
* Facility photos from Google Maps: add a Google Places API key (Places API (New)) in Appearance →
  Customize → We Have Rehabs. Listings without photos of their own then show the facility's Google
  Maps photo with its photographer credit — on its page and on its cards in search results —
  fetched live as it scrolls into view (Google does not
  allow copying or storing these photos; only the Place ID is saved). Google bills per lookup after
  its monthly free allowance; "most lookups per day" (default 2000) caps it. If a listing shows the
  wrong place, edit its "Google Place ID" field (type none to hide the photo).
* Destination photos: after the listings import, the site adds a landscape photo to each country
  and region in the background, from Wikimedia Commons ("Landscapes of <place>", freely licensed
  CC BY / BY-SA / CC0 / public domain), with the photographer credit shown on the photo. Regions
  without one use their country's. Listings without photos show their region's landscape, credited
  "Photo of <place>". Replace any photo on the destination's edit screen.
* Journal: 10 in-depth guides (2,500–3,600 words each, with photos) ship with the theme in
  content/posts and publish themselves the first time you open wp-admin after installing or updating:
  choosing a rehab, holistic rehab, rehab in Costa Rica, inpatient vs outpatient, dual diagnosis,
  medical detox, paying for rehab, rehab abroad, helping a loved one, and aftercare. They live at
  /blog/<article>/ under a "Journal" page (created if you don't have one; the homepage stays the
  same), with a contents list, related reading, and Article + FAQ structured data for Google.
  Edit or delete them like any post — edited or deleted articles are never brought back.
  (`wp whr-blog` publishes them from the command line.)
* Page template "For sanctuaries (listing & plans)" for the owners' page.
* Appearance → Customize → We Have Rehabs: homepage text and photos, care-team WhatsApp,
  book-a-call link, contact email, crisis-line text, helplines link, plan prices.
* Logo, favicon, app icons and social sharing image built in (assets/brand).

== Recommended plugins ==

* WP Mail SMTP (or your host's email service) so inquiry emails reliably reach inboxes.
* An SEO plugin (Yoast SEO or Rank Math). The theme steps back from Open Graph tags when one is active.
* Polylang for English / Spanish versions; the header shows its language switcher automatically.
* A backup and security plugin from your host.

== Editing tips ==

* Multi-line fields use one line per item, with " | " between columns, e.g. the schedule:
  6:30 | Sunrise meditation | Gentle movement on the shala.
* A sanctuary's first two gallery photos sit beside its story; the next five form the gallery strip
  and illustrate the rooms.
* Tick "Feature on the homepage" on up to two sanctuaries for the large editorial rows.
* Only publish guest reflections you have permission to use, and only list a license check date
  once you have actually checked the license.

== Credits ==

Photos in assets/img are from Unsplash (free to use under the Unsplash License) and are used for
demo content and fallbacks. Fonts: Cinzel, Cormorant Garamond and Jost via Google Fonts (OFL).
