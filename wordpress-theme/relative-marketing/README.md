# Relative Marketing Agency (RMA) — WordPress Theme

A modern, conversion-focused WordPress theme that recreates the RMA mockups
pixel-for-pixel in standard WordPress templates (no page builder required).

## What's included

| Mockup page | Template file | How to use |
|---|---|---|
| Home | `front-page.php` | Auto-rendered on the static front page |
| Services | `template-services.php` | Page template **RMA — Services** |
| Service Details (AI Search Optimization) | `template-service-details.php` | Page template **RMA — Service Details** |
| About | `template-about.php` | Page template **RMA — About** |
| Case Studies | `template-case-studies.php` | Page template **RMA — Case Studies** |
| Blog | `index.php` | Set as the "Posts page" |
| Blog Post | `single.php` | Any post |
| Contact | `template-contact.php` | Page template **RMA — Contact** |
| Careers | `template-careers.php` | Page template **RMA — Careers** |
| 404 | `404.php` | Automatic |

Shared parts: `header.php`, `footer.php`, `template-parts/cta.php`,
`comments.php`, `searchform.php`, `page.php`.

## Installation

1. Zip the `relative-marketing` folder (it must be the top-level folder in the zip).
2. In WordPress: **Appearance → Themes → Add New → Upload Theme**, choose the zip, install and **Activate**.
3. On activation the theme automatically:
   - Creates the pages (Home, Services, AI Search Optimization, About, Case Studies, Contact, Careers, Insights/Blog) and assigns the correct templates.
   - Sets **Home** as the static front page and **Insights** as the posts page.
   - Builds and assigns the **Primary** navigation menu.

That's it — the site matches the mockups immediately. Everything is editable from the WordPress admin afterward.

## Customising

- **Logo:** Appearance → Customize → Site Identity (falls back to the `RMA` wordmark).
- **Menus:** Appearance → Menus (locations: Primary + three footer columns).
- **Content:** All page text lives in the page templates as translatable, sensible defaults; replace by editing the templates or wiring sections to Customizer fields/ACF as needed.
- **Colors / fonts:** edit CSS variables at the top of `assets/css/theme.css` (`--blue`, `--navy`, `--font`, etc.).

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Notes

Photographic areas (hero portrait, team photos, case-study thumbnails, office
shots) use styled placeholders so the theme renders cleanly with zero media.
Add a Featured Image to any post/page or drop real images into those blocks to
replace them.
