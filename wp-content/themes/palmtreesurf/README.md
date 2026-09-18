# Palm Tree Surf — WordPress theme

A classic (PHP template) WordPress theme for palmtreesurf.com. No page builder,
no required plugins, no build step: drop the folder into `wp-content/themes/`
and activate it.

## Status

The **structure, templates and admin surface are complete and working.** What is
not done is the **visual match to the live site**, because the live markup and
CSS were never available to this build — see [Porting the live design](#porting-the-live-design).

Colours, spacing and type scale in `assets/css/main.css` are placeholder tokens
chosen to be legible and accessible. They are not a reproduction of the current
site's palette.

## Install

1. Copy `palmtreesurf/` into `wp-content/themes/` on the target install.
2. Activate it under **Appearance → Themes**. On activation the theme registers
   the Packages post type, seeds the starter taxonomy terms and flushes
   permalinks, so `/packages/` resolves straight away.
3. Fill in **Appearance → Customize → Palm Tree Surf** (contact details, social
   links, booking URL, hero, analytics).
4. Create the menus under **Appearance → Menus** and assign them to the
   Primary, Footer and Legal locations.

Requires WordPress 6.0+ and PHP 7.4+.

## What the client can edit

| Area | Where |
| --- | --- |
| Page content and hero copy | Block editor per page; hero strings in Customizer → Front Page Hero |
| Surf packages and rates | Packages → Add New, with price, duration, group size, inclusions and booking link |
| Blog / news | Posts, with full index, single, category, tag, author, search and 404 templates |
| Booking and contact enquiries | Built-in form, or a plugin shortcode dropped into any page |
| Contact details, social, analytics | Customizer → Palm Tree Surf |

## Packages

`pts_package` is the bookable-product type: surf lessons, ocean tours and custom
experiences. Two taxonomies ship with it — **Package Types** and **Skill
Levels** — and both are seeded with starter terms on first activation, then left
alone so client edits are never overwritten.

Per-package fields live in the **Package Details** box: price, price suffix,
duration, group size, a one-per-line inclusions list, and an optional booking
link. All are registered with `register_post_meta`, so they are revisioned and
exposed to the REST API.

Booking buttons resolve in this order: the package's own booking link, then the
site-wide booking URL in the Customizer, then the enquiry form on the contact
page. Nothing ever renders a dead button.

## Enquiry form

`[pts_enquiry_form]` renders a booking enquiry form anywhere, and it is built
into the front page, the contact page template and every package page. It posts
to itself and is protected by a nonce, a honeypot field and a one-minute
per-IP throttle, then emails the Customizer contact address (falling back to the
admin email). Results are reported through a redirect flag, so a refresh never
resubmits.

To use Contact Form 7, WPForms or an existing booking system instead, put that
plugin's shortcode in the page and delete the `[pts_enquiry_form]` block.

## Analytics

The current site injects analytics from a `site_settings` record. This theme
replaces that with Customizer fields:

- **Google Analytics measurement ID** and **Meta Pixel ID** — enter the ID and
  the theme builds the tag. IDs are format-checked before anything is printed.
- **Custom Scripts** — raw markup for `<head>` and before `</body>`. This
  section is registered **only for users with the `unfiltered_html`
  capability**, and the sanitiser discards input from anyone else. That is the
  one place a stored value reaches the page unescaped, and it is deliberate.

## Structure

```
palmtreesurf/
├── style.css               Theme header only; the cascade lives in assets/css
├── functions.php           Constants, then loads inc/ in dependency order
├── inc/
│   ├── setup.php           Theme supports, menus, image sizes, widget areas
│   ├── enqueue.php         Inter webfont, main.css, main.js, editor styles
│   ├── template-tags.php   booking URL resolution, package details, social
│   ├── template-functions.php  body classes, excerpt, queries, analytics
│   ├── class-pts-nav-walker.php  Primary menu markup and submenu buttons
│   ├── post-types.php      Packages CPT, taxonomies, activation hooks
│   ├── meta-boxes.php      Package detail fields
│   ├── customizer.php      All site settings
│   ├── blocks.php          Editor palette, font sizes, starter patterns
│   └── forms.php           Enquiry form rendering and submission handling
├── template-parts/         content-*, card-package, section-hero
├── page-templates/         Full Width, Contact
└── assets/                 css/main.css, css/editor.css, js/main.js
```

Templates present: `front-page`, `index`, `page`, `single`, `archive`, `search`,
`404`, `searchform`, `sidebar`, `comments`, `archive-pts_package`,
`single-pts_package`.

## Porting the live design

palmtreesurf.com is a Vite-built React single-page app. Its served HTML is a
shell — `<div id="root"></div>` plus a script tag — so none of the real markup,
copy or CSS is in the page source. Fetching the JS bundle and reading the
compiled CSS is what remains.

To finish the visual match, three things are needed:

1. **The rendered DOM.** In the browser, let the page load, then in DevTools
   right-click `<div id="root">` → Copy → Copy outer HTML. One capture per
   template (home, a package page, about, contact).
2. **The compiled CSS**, `/assets/index-*.css`. The design tokens at the top of
   `assets/css/main.css` map to it directly.
3. **The image assets**, or the ability to re-upload them to the Media Library.

With those, porting is: replace the token values in `:root`, then move each
rendered section's markup into the matching template part. The template
hierarchy, post types, fields and forms below it do not need to change.

## Notes

- Text domain `palmtreesurf` throughout; `languages/` is ready for a `.pot`.
- Output is escaped at the point of use. The four `phpcs:ignore` comments in the
  codebase each mark a deliberate raw-output case and say why.
- No `screenshot.png` is included yet — add a 1200×900 PNG once the design is
  ported, and WordPress will show it on the Themes screen.
