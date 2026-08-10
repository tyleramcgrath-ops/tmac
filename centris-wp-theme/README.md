# Centris Combined — WordPress Theme

Bilingual contact center theme mirroring the combined static site. Dark navy palette, human-first AI brand, separate page templates for every service and industry.

## Install

1. Zip this directory: `centris-wp-theme.zip`
2. WordPress admin → Appearance → Themes → Add New → Upload Theme → choose the zip → Activate.
3. On activation the theme auto-creates these pages (one-time, idempotent):
   - **Home** (set as the static front page)
   - Services, Industries, Case Studies, About, Contact, Resources
   - 9 individual service pages (`/service-*`)
   - 6 individual industry pages (`/industry-*`)
4. Visit **Settings → Permalinks** and click *Save* to flush rewrites.

## Files

| Path | Purpose |
| --- | --- |
| `style.css` | Theme header (loads `assets/css/main.css`) |
| `functions.php` | Asset enqueue, menu registration, page bootstrap, image helper |
| `header.php` | DOCTYPE, head, body open, ambient blobs, nav with dropdowns |
| `footer.php` | Site footer + `wp_footer` |
| `front-page.php` | Fallback front page → home content |
| `index.php` | Default loop fallback |
| `page.php` | Default page template |
| `page-templates/front.php` | Full home — all sections |
| `page-templates/services.php` | Services listing grid |
| `page-templates/industries.php` | Industries listing grid |
| `page-templates/service-detail.php` | Single service detail (slug-driven) |
| `page-templates/industry-detail.php` | Single industry detail (slug-driven) |
| `page-templates/about.php` | About / company stats |
| `page-templates/contact.php` | Contact CTA + numbers |
| `page-templates/case-studies.php` | Case study grid |
| `page-templates/resources.php` | FAQ grid |
| `inc/data.php` | Slug-keyed content for service & industry detail pages |
| `template-parts/home-content.php` | Home page section markup |
| `assets/css/main.css` | All theme CSS (extracted from combined HTML) |
| `assets/js/centris.js` | Sophia stage, demo controller, scroll/reveal hooks |

## Images

Industry and location images are loaded from the project's GitHub Pages bucket:
`https://tyleramcgrath-ops.github.io/tmac/centris/<slug>.webp`

To self-host, upload the assets to WordPress Media and edit `centris_image_url()` in `functions.php`.
