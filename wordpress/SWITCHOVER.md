# envuetheme v6 — switchover checklist

Install: WP Admin → Appearance → Themes → Add New → Upload → `envuetheme-final-v6.zip` → Activate.

The zip's folder is `envuetheme/` (v5's was `build/`). If v5 is installed as "build",
v6 installs alongside it as a separate theme; activate v6 and delete "build" afterwards.

## What's covered
- All 97 published pages on envuetelematics.com have a hardcoded template in the new design
  (verified by rendering every live slug on a local WordPress install: 200, one `<title>`,
  `#demo` CTA present, zero PHP warnings/notices from theme files, no horizontal scroll at 390px).
- Blog posts render through `single.php` in the new chrome. Posts built with Elementor keep
  Elementor's CSS (it's only stripped on hardcoded templates).
- `/news/` lists the "news" category; `/blog-articles/` lists all other posts.
- `/events-calendar/` (live URL) and `/events/` → `page-events.php`. Webinars hide themselves
  after their start time; add new ones to the `$webinars` array at the top of the file.
- Nav links to URLs with no WP page (`/solutions/`, `/company/`, `/geotab/`, `/events/`) serve the
  theme template instead of 404ing. Creating a real page with that slug takes over.

## Before / right after switching
1. **Keep WPForms active.** Forms used: 2958 (get-in-touch and several landing pages),
   2846 (NCTA RSVP), 3806 (Verizon).
2. **Keep AIOSEO active.** It keeps each page's title/description/noindex settings. The theme's
   own SEO tags only output when AIOSEO is inactive.
3. **Re-save Permalinks** (Settings → Permalinks → Save) once after activating.
4. Spot-check `/get-in-touch/` form submission, `/safety-assessment/`, and `/verizon/`.
5. Optional: create WP pages for `/solutions/` so AIOSEO includes them in the sitemap.

## Content issues found on the live site (not carried over / needs a decision)
- 37 internal links on live pages pointed to articles that don't exist (live 404s) — unlinked or removed
  (incl. the 30-item "Innovation Library" on /our-telematics-experts/).
- /reviews/ and /videos/ widgets were broken on live (CSS/JS printed as text); rebuilt. The reviews widget's
  testimonials were placeholder data (fictional companies, a Rick Roll video) and were not reproduced.
- /fleet-optimization-tools-resources/ and /our-telematics-experts/ calculators/quizzes were broken on live;
  rebuilt and working. The two pages are near-duplicates.
- /fleet-audit-discovery-request/ form never loaded and /claim-your-free-15-minute-fleet-audit/ had no form;
  both now use WPForms 2958.
- /postcards-landing/ has a custom HTML form that submits nowhere (same as live). Swap to WPForms 2958 if wanted.
- /safety-assessment/ Canva graphic still says "Call by 7/30 for special pricing!".
- /set-sail-with-envue-at-ncta/ event was July 2025; live copy says "Amelia Island, NC" (Amelia Island is in FL).
- Partner pages had wrong products in the old templates (Craig Safety, Xtract, Predictive Coach, Netradyne,
  LifeSaver) — corrected to match live.
- Several AIOSEO titles on live are truncated or belong to other pages (car-advise, sensata-technologies,
  fuel-management, industries, fleet-telematics-glossary) — fix in AIOSEO.

## v6.1 — photo cleanup
- Every inner-page hero now has its own real photograph (no two pages share a hero); AI-looking and copy-pasted
  photos inside pages were replaced with unique real photos. Homepage is unchanged.
- Photos are free-license Unsplash images served from Unsplash's CDN (images.unsplash.com) with responsive
  `srcset`, so nothing needs to be uploaded to the Media Library.
- Logos, product shots, app screenshots and partner graphics are unchanged.

## v6.4 — portable, ready for the live site
- No staging/dev URLs anywhere in the theme; every internal link is built from the site's own address
  (`home_url()`), so the same zip works on staging and on envuetelematics.com without edits.
- Page images reference `envuetelematics.com/wp-content/uploads/...` (already on the live site) or Unsplash's CDN;
  flags and the logo are bundled inside the theme. Nothing needs to be uploaded to the Media Library.
- Removed unused leftover files (old theme.js / theme.css / inner.css and 3 unused images).

### Going live on envuetelematics.com
1. Back up the live site (SiteGround → Backups) so you can roll back in one click.
2. Appearance → Themes → Add New → Upload `envuetheme-final-v6.4.zip` → Activate.
3. Settings → Permalinks → Save (no changes needed — this refreshes the URL rules).
4. Keep WPForms and AIOSEO active. Elementor can stay installed (the theme ignores it on its own pages).
5. Purge SG Cache (and any CDN cache), then spot-check: home, /get-in-touch/ (submit a test form),
   a partner page, a blog post, and a page on your phone.

## v6.5
- Fixed stretched images on the live site: SiteGround Speed Optimizer's "add missing image dimensions" stamps each
  file's pixel size onto <img> tags, which overrode the theme's sizing (homepage video card, Dash Cams lineup).
  One global rule now makes images size from CSS. Every page was re-scanned at desktop and phone widths with
  dimensions stamped on every image: no image changes size.
- Bottom "Get a Demo" sections are back to the original buttons (Get a Free Demo → /get-in-touch/, Call).
  WPForms stays only on pages that had a form before (Get In Touch, audit/landing pages, Verizon, NCTA).

## v6.6
- Homepage "Why EnVue" icons are forced to a fixed 28px size, so image lazy-loading (EWWW) can no longer shrink or blank them.
- Customer testimonials are now one swipeable slider (arrows, dots, keyboard, touch) with smaller stat text instead of two tall grids.
- Social links (LinkedIn, Facebook, X, YouTube) are in the header on wide screens, in the mobile menu, and in the footer.
- The homepage has exactly one H1 (the other hero slides use H2).

## v6.6.1
- Elementor Pro's header/footer hook is guarded so an Elementor Pro update can never crash the theme. (The 2026-09-23 outage
  was Elementor Pro itself; the theme does not need Elementor Pro, so it can stay deactivated.)

## v6.7 — SEO / AEO / schema
- Alias URLs (/gps/, /company/, /geotab/, /events/, /faq/, /blog/ …) now 301 to the real page instead of serving a duplicate.
- /solutions/ (no WP page) gets a proper title, description and og/twitter tags through AIOSEO.
- One FAQPage per page (the /faqs/ page had 5); FAQ questions are now H3 headings (better for answer engines).
  Removed a hidden homepage FAQ schema whose questions weren't visible on the page.
- /events-calendar/ now always uses the theme's Events template, even though the page is set to Elementor's template.
- Contact page LocalBusiness is linked to AIOSEO's organization (same @id); social links match AIOSEO's profiles.
- Elementor's front-end scripts no longer load on theme pages (faster); fixed an empty image request on About.

### AIOSEO settings to fix (can't be done from the theme)
1. Home page and Lytx page → AIOSEO → Schema tab: delete the FAQ schema (its questions aren't on the page; the theme outputs the visible FAQs).
2. Search Appearance → Global Settings → Knowledge Graph: email sales@et-envue.com, phone +1 800-201-1169, re-pick the logo from the Media Library.
3. Local SEO → Business Info: address "119 West Tyler Street, Suite 100", phone +1 800-201-1169, email sales@, remove the fax, type ProfessionalService.
   Check opening hours (Friday currently opens at 9:00, other days 8:00).
4. Home page → Schema tab → Service: remove the Offer with price 0.
5. Social Networks → Facebook and Twitter: set a default 1200×630 share image (most pages have no og:image); Facebook → Advanced: pages = "website".
6. /events-calendar/ and /coast-pay/ → Advanced tab: remove noindex; write real descriptions (current ones are auto-generated filler).
7. Titles over 60 chars: /faqs/ (also make it about FAQs), /news/, /blog-articles/, /privacy-policy/ ("Envue" → "EnVue"), /about-envue/.
8. Remove the duplicate google-site-verification tag (it's in AIOSEO Webmaster Tools and in a header-code snippet).
9. Posts → Categories: rename the "uncategorized" slug to general-fleet-insights, and add a 301 from the old URL in AIOSEO Redirects.
10. Optional: create a real WP page with slug "solutions" so it appears in the sitemap.

## v6.8 — articles
- Header: social icons now sit to the right of "Get a Demo".
- Blog posts / news articles redesigned:
  - reading-progress bar across the top of the screen while you scroll;
  - sticky share rail (LinkedIn, Facebook, X, email, copy link) beside the article on desktop, plus a share box at the end;
  - right sidebar: free-assessment CTA, recent articles with thumbnails, follow links, and a sticky "In this article"
    contents list (built from the article's H2 headings, highlights the section you're reading) with a Get a Demo button;
  - byline, reading time, "Updated" date when a post was edited later, tags, an EnVue author box, and a
    "More fleet insights" row of 3 related articles from the same category;
  - better article typography (larger intro paragraph, accent bars on headings, styled quotes, lists and tables).
- On tablets/phones the sidebar drops below the article and the share rail becomes the end-of-article share box.
