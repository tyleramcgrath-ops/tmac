# Sun Coast Cleaning and Restoration: full site redesign

The whole of https://suncoastclean.com/ (62 pages and 303 news posts) rebuilt in
one theme, with each page's own words kept exactly as they are on the live site.

- `site/` is the built website. Open `site/index.html` in a browser, or host the
  folder as static files. Every page is a flat `<slug>.html` that matches the
  live site's address (`/carpet-cleaning/` is `carpet-cleaning.html`), so a
  host with clean URLs keeps the old links working.
- `build.py` generates `site/` from `content/pages.json` and `content/posts.json`
  (the live site's content, pulled from its WordPress API on 2026-11-06) and
  `theme.css`. Run `python3 build.py` after changing any of them.
- `test.mjs` checks every built page: `node test.mjs site`. It confirms every
  internal link and image resolves, then loads all 365 pages in Chromium at
  1280px and 390px and fails on console errors, horizontal scrolling, missing
  titles, a wrong number of H1s, or an image that doesn't render.

## What the theme does with each kind of page

- **Home**: photo hero with the estimate form, credentials strip, the home
  page's own two sections of copy word for word, services grouped three ways
  (every service page linked), carpet feature, why Sun Coast, three steps, all
  ten customer letters in full, the service area, and the call band.
- **Services, locations, about, contact, privacy**: compact dark header, the
  page's copy, and a sidebar with the estimate form plus the relevant list
  (all services, areas we serve, or contact details).
- **Get That Stain Out!** and its 29 stain pages: the index page is empty on the
  live site, so it lists the 29 stains; each stain page keeps its steps and
  shows the full stain list beside it.
- **News**: one index of all 303 posts grouped by year with dates and excerpts;
  each post has its date, older/newer links and recent news in the sidebar.

## Content rules followed

- Words are never rewritten. Markup is tidied: Word leftovers removed, tables of
  links and towns turned into responsive lists, an in-content H1 demoted so each
  page has exactly one H1 (its title), phone numbers made tappable.
- Links to old `.aspx` addresses, all of which 404 on the live site, point at
  the matching new page (`carpet-cleaning-in-florida.aspx` → carpet cleaning,
  `careers.aspx` → the Now Hiring post, `spring-cleaning.aspx` → the spring
  cleaning tips post, the testimonials pages → the home page reviews or an
  email). `AddArticle.aspx` had nothing to point at, so that link became text.
- 13 images under `/filesimages/` and two on carpetcleangreen.com are already
  broken on the live site (404), so they are left out rather than shown broken.
- The YouTube video on the home page and the "Celebrating 25 years" post is a
  link card to YouTube (an embed can't run in the preview).
- Two posts share a slug with a page (`carpet-cleaning`, `jupiter-carpet-cleaning`);
  the page keeps the address, as on the live site, and the post is at
  `<slug>-post.html`.

## SEO

The live site runs no SEO plugin output at all: none of its 363 pages has a meta
description, robots tag or schema, only the theme's "Page – Suncoast Cleaning and
Restoration" title. Every page here now has:

- a title under 60 characters where the page's name allows, a hand-written meta
  description for the 33 main pages and a sentence-cut one for each post, all
  50–160 characters;
- a canonical URL in the live site's `/slug/` form, robots, Open Graph and
  Twitter tags, and article dates on posts;
- JSON-LD: LocalBusiness on every page, WebSite and an ItemList of services on the
  home page, BreadcrumbList everywhere, Service on service and location pages,
  Article on posts, HowTo (steps parsed from the page) on the 29 stain guides,
  AboutPage, ContactPage and CollectionPage where they apply;
- visible breadcrumbs, and supporting sections built only from the site itself:
  "Where we offer …" (links to the 11 town pages) and "News about …" on service
  pages, "Cleaning services in …" and "News from …" on town pages, "Related
  reading" and the services an article mentions on posts, and a "Sun Coast at a
  glance" fact block (each fact from the About or home page).

`seo-meta.csv` lists the URL, title, description and robots value for all 365
addresses, ready to paste into All in One SEO if the site stays on WordPress.

## No 404s

`content/live-urls.txt` is the live site's sitemap (363 addresses). The test
confirms every one of them maps to a built page. For hosting, `site/` carries
`.htaccess` (Apache / SiteGround), `_redirects` (Netlify, Cloudflare Pages) and
`vercel.json`, which serve `/slug/` from `slug.html`, 301 every old `.aspx`
address and the WordPress category, author and feed addresses, and send anything
else to `404.html` (a themed page with the services and a contact card). The
two posts shadowed by a page carry `noindex` and are left out of `sitemap.xml`;
`robots.txt` points at the sitemap.

## Facts used

Everything on the pages comes from the live site: (561) 747-8787 (call or text),
1-877-747-8787 on the hurricane page, brad@suncoastclean.com, Jupiter, FL 33478,
license #1988-09231, BBB since 1993, IICRC since 1998, "Established in 1988" (from
the logo), bonded/licensed/insured, Facebook and Twitter links from the live
footer. Star icons on the home page are decorative on the owner's own letters,
not a rating from any review platform.

## Before it goes live

- The estimate form has no backend; it opens an email to brad@. Wire it to a
  real form handler.
- Photos are free-license Unsplash stock (hero living room, tile bathroom, sofa,
  gloved spray bottle, carpet being vacuumed, closing band). The live site has
  no usable photos of its own work (275x76 thumbnails and 2016 banners with text
  baked in). Swap in real crew and before/after photos when the owner sends them.
- Logo: their own mark from the WordPress media library (`logo.png`,
  `logo-mark.png`), white background removed. Palette keeps the brand's indigo
  and sun yellow, calmed down.

## Preview build

`python3 build.py --artifact DIR` writes the same site with the CSS inlined, a
"redesign concept" banner on every page and the form switched off, for sharing
as a claude.ai artifact.
