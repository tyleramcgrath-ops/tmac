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
