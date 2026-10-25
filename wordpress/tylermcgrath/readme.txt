=== Tyler McGrath — North Star ===
Contributors: tylermcgrath
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A night-sky portfolio theme for tylermcgrath.com, built around a live 3D brass compass.

== Description ==

The Studio, as a WordPress theme:

* Entrance doors: "McGrath Private Studio" nameplate, shown once per visit, doors swing open.
* The studio room: the black marble office with its constellation ceiling, mouse parallax,
  twinkling stars and shooting stars in the windows.
* The North Star compass (Three.js, bundled locally): asleep until you press
  "Awaken the compass", follows the cursor, then glides from the desk to a corner dock as
  you scroll and changes mood for each section. Click the dock to return to the top.
* The portfolio as a constellation: every project is a star. Hover a card to light its
  star, click a star to jump to its card, filter by discipline.
* Dawn / day / dusk / night lighting from the visitor's clock (toggle in the header).
* About with count-up stats, What I do (SEO & AI Search, Marketing, Web Design),
  Four bearings process, journal, and a contact form.
* Respects "reduce motion", has a Pause button, works without WebGL (brass seal fallback)
  and without JavaScript.

== Installation ==

1. WP Admin → Appearance → Themes → Add New → Upload Theme → choose tylermcgrath.zip → Activate.
2. Settings → Reading → "Your homepage displays": a static page (any page) or latest posts.
   Either way the home page uses the Studio layout.
3. Settings → Permalinks → Save (once), so /portfolio/ URLs work.
4. Portfolio: the home page shows sample projects until you add your own.
   Use the "Import sample projects" button in the admin notice to turn them into
   editable posts, or add new ones under Portfolio → Add project.
   For each project: title, excerpt (the one-line description), featured image,
   Discipline (SEO & AI Search / Marketing / Web Design), and the Project details box
   (client, year, role, headline result, services, live URL). Use Order to sort.
5. Appearance → Customize → Tyler McGrath Studio: every line of copy, the portrait,
   stats, services, process steps, contact email and social links.
6. Appearance → Menus: optionally assign a "Primary menu". Without one, the header links
   to About, SEO & AI Search, Marketing and The portfolio.

== Contact form ==

Messages are emailed to the address in Customize → Contact & social and are also saved
under WP Admin → Messages, so nothing is lost if the host's email is misconfigured.
For reliable delivery, install an SMTP plugin (for example WP Mail SMTP).

== Credits ==

* Three.js r160 (MIT), bundled in assets/vendor.
* Bodoni Moda and Inter from Google Fonts (OFL).
* The studio room image is the North Star HQ environment plate.
