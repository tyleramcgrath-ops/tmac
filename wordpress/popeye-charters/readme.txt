=== Popeye Charters ===
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
License: GPLv2 or later

Custom WordPress theme for Popeye Charters (charlestonpopeyecharters.com), private
boat charters on Charleston Harbor. Rebuilds the original React site as a classic PHP theme
with the same design, copy and photos.

== Installation ==

1. Zip the `popeye-charters` folder, or upload the folder to wp-content/themes/.
2. Appearance → Themes → activate "Popeye Charters".
3. Open wp-admin once as an administrator. The content imports automatically on that
   first admin page load (it takes a few seconds), and a green notice confirms it. You can
   also re-run it from Appearance → Popeye Setup. It creates:
   * Pages: Home, Our Story, Elite Cruises, Blog, Gallery, Contact, Book a Charter (each with its page template)
   * The 8 charter Experiences with their durations, highlights, inclusions, galleries and quotes
   * All 45 blog guides with categories, tags, original dates, excerpts and cover photos
   * Primary and footer menus, static front page, posts page and /blog/%postname%/ permalinks
     (the original site's URLs) on a fresh site
   Cover photos are added to the Media Library as Featured Images over the next few admin
   page loads.
   Running it again skips anything that already exists.
4. Appearance → Customize → Popeye Charters: check the phone, email, inquiry inbox,
   homepage hero, footer text and Google Analytics ID.

== What's included ==

* Homepage: hero, stats bar, "A Boat With Character", featured experiences, gallery
  preview, guest reviews, FAQ accordion, the latest 3 blog posts, and a closing CTA.
* Experiences post type (/experiences/): archive and detail pages. Edit the details in the
  "Experience Details" box. Highlights take one "Title | text" per line, inclusions one item
  per line, and the gallery one "image URL | caption" per line. A Featured Image replaces
  the bundled hero photo.
* Page templates: Our Story, Elite Cruises, Gallery (filters + lightbox), Book a Charter,
  Contact. Any content typed into these pages in the editor also appears on the page.
* Inquiry forms (booking, contact, elite cruise) with a nonce and a honeypot field. Each
  submission is emailed to the inquiry address and saved under Inquiries in wp-admin.
  Configure SMTP (e.g. WP Mail SMTP) so the emails get delivered.
* "Book" buttons on experience pages open the booking form with that experience pre-selected
  (?charter=…).
* LocalBusiness + FAQPage JSON-LD on the homepage. A basic meta description is added and is
  skipped automatically when Yoast, Rank Math, AIOSEO or SEOPress is active.
* Sticky "Book a Charter" bar, back-to-top button, responsive mobile menu.

== Content not migrated by the theme ==

* The original site's AI chat widget and its /admin dashboard were part of the old app's
  backend and are not part of this theme.

== Editing static content ==

FAQs, testimonials, gallery photos and "What to Expect" items live in
inc/data/content.php. You can also change them with the `popeye_content_{key}` filters from
a child theme. Photos are bundled in assets/images.
