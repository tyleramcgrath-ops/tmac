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
