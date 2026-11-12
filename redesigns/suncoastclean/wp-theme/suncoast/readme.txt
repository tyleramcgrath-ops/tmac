=== Sun Coast ===
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
License: GPLv2 or later

The redesigned Sun Coast Cleaning and Restoration website as a WordPress theme. It works
with the pages and posts already in the site's WordPress; nothing has to be re-entered.

== Install ==

1. In WordPress go to Appearance -> Themes -> Add New -> Upload Theme, choose suncoast.zip,
   then Activate.
2. Settings -> Reading: "Your homepage displays" = A static page. Homepage: Home.
   Posts page: News. (Both pages already exist.)
3. Settings -> Permalinks: Post name (/%postname%/). Click Save even if it is already set;
   that registers the theme's redirects.
4. Appearance -> Customize -> Sun Coast details: check the phone, email and the address
   that estimate requests are emailed to. Blank fields use the values from the current site.
5. Optional: Appearance -> Menus. Without a menu the header shows the current site's own
   menu (About Us, Services with its dropdown, News, Locations, Contact Us). To change it,
   create a menu and assign it to "Main menu (header)". A second location, "Footer:
   Company", replaces the footer's Company column.

== What the theme does ==

* Home: photo hero with the estimate form, credentials, the Home page's own copy and the
  customer letters (read from the Home page content, so they stay editable), services,
  why Sun Coast, three steps, service area and a call band.
* Pages: dark header with breadcrumbs, the page's copy, a sidebar with the estimate form
  and the relevant list (services, areas, stain guides or recent news), and supporting
  sections built from the site itself (service areas, related news, a facts block).
* Get That Stain Out!: the index lists the 29 stain pages; each stain page shows the list.
* News: every post on one page grouped by year; posts have older/newer links.
* Estimate form: emails the request to the address in the Customizer (default: the site's
  admin email), with a honeypot and a nonce. No plugin needed.
* SEO: title, meta description, canonical, robots, Open Graph, Twitter and JSON-LD
  (LocalBusiness, Breadcrumbs, Service, Article, HowTo on stain guides) on every page.
  If All in One SEO, Yoast, Rank Math or SEOPress is active the theme steps aside and
  lets the plugin handle it.
* Redirects: old .aspx addresses and /home/ go to the right page with a 301.
* Content tidy-up: images from the old /filesimages/ folder (gone from the server) are
  hidden, old .aspx links point at the new pages, tables of towns and links become lists,
  phone numbers are tappable. The words are never changed.

== Before launch ==

* Replace the stock photos in assets/img with the company's own (same file names, or edit
  front-page.php).
* Send a test estimate from the live site and confirm the email arrives. If the host
  does not deliver mail reliably, install an SMTP plugin (for example WP Mail SMTP).
