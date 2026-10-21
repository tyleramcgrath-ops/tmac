PRESCRIPTIVE POOL — RESORT LIVING 3.0

A WordPress theme built to match the Resort Living mockup: desert-sunset hero,
round logo badge, "Meet the owner" section, services band, new-customer offer
with service area, water CTA band and a dark green footer.

INSTALL
1. Appearance > Themes > Add New > Upload Theme > choose prescriptive-pool-resort.zip > Activate.
2. Appearance > Set up pages > "Create pages and set homepage".
   Creates Home, The Difference, Pool Care, Service Area and Request a Quote
   (existing pages with those slugs are kept) and sets Home as the front page.
3. Settings > Permalinks > Save (refreshes links).

SETTINGS (Appearance > Customize > Pool service settings)
- Phone number (default (623) 252-9889)
- New-customer monthly price (99) and offer length in months (3)
- Regular weekly service starting price (150)
- Quote request email (where the form is sent)
- Homepage hero photo and owner photo (optional replacements)

The logo badge uses the bundled white-text version of the new logo. To use a
different logo, upload it in Appearance > Customize > Site Identity (a version
with light text works best on the dark badge).

PAGES
Home (front-page.php), Our approach (page-difference.php), Services
(page-care.php), Service area (page-area.php), Request a quote (page-quote.php).
Anything typed into a page in the editor appears above the closing call-to-action.
If you build a menu and assign it to "Primary navigation", it replaces the
default header links.

QUOTE FORM
Sends with wp_mail to the quote email above. Includes nonce, honeypot,
validation and a one-minute per-visitor limit. Many hosts need an SMTP plugin
(e.g. WP Mail SMTP) for mail to reach the inbox — send yourself a test request
after launch.

FILES
assets/site.css, assets/site.js — styles and the mobile menu.
assets/img — photos and logos. assets/fonts — DM Serif Display/Text and Manrope (OFL).
