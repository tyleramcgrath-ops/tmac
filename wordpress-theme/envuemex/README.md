# Envue Mex — WordPress Theme

Bilingual (ES default / EN toggle) WordPress theme for Envue Mex, the Mexico
operation of TMAC. Telemática y videovigilancia para flotas. Elementor-ready.

The homepage is rendered by `front-page.php` from coded section templates so
it stays pixel-identical to the static design (custom SVG route + map,
glass-morphism dashboard mock, gradients). Additional pages can be built in
Elementor and inherit the theme's design tokens.

## Install

1. **Zip the theme folder.** From the repo:
   ```
   cd wordpress-theme
   zip -r envuemex.zip envuemex
   ```
2. In WP admin → **Appearance → Themes → Add New → Upload Theme** →
   choose `envuemex.zip` → **Activate**.
3. **Settings → Reading → Your homepage displays:** *A static page*.
   Create a blank page titled "Inicio" and select it as the homepage.
   (The theme detects this and renders `front-page.php` automatically — the
   blank page content doesn't matter.)
4. **Appearance → Customize → Envue Mex · Contact** — set email, phone,
   offices, TMAC USA URL. These flow into the contact section and footer.

## Elementor

The theme declares `add_theme_support('elementor')` and ships two custom
page templates:

- **Elementor Canvas (Blank)** — no header, no footer. Use for landing pages
  built end-to-end in Elementor.
- **Elementor (Header + Footer)** — keeps the theme's header/footer chrome,
  Elementor controls the body. Use for new marketing pages, services, etc.

When creating a page, pick the template from the **Page Attributes** panel.

**Color palette** — Brand purple `#4B2E83`, deep `#2E1A56`, light `#8A5CF6`,
lavender `#C9A4FF`, ink `#0B0712`, paper `#F7F4FB`. These are registered as
the editor color palette so Elementor and Gutenberg dropdowns match the
design system.

## Menus

Four menu locations:

- `primary` — header
- `footer-solutions`, `footer-company`, `footer-support` — footer columns

If you don't create menus, sensible bilingual fallbacks are rendered.

## Bilingual

The theme uses a lightweight `data-es` / `data-en` system with a JS toggle
in the header that persists via `localStorage` *and* a `envue-lang` cookie.
PHP reads the cookie to set `<html lang>` server-side, so each page request
already knows the right language for SEO and the document outline.

For more advanced needs (translated permalinks, separate post versions),
install **Polylang** or **WPML**. The theme is compatible — it'll defer to
`pll_current_language()` if Polylang is present.

## Contact form

The hardcoded form posts via `mailto:` and works without plugins. To use
**Contact Form 7** instead:

1. Install CF7, build your form.
2. Note the form ID (e.g. `42`).
3. In **Appearance → Customize**, expose a theme mod named
   `envuemex_cf7_id` (you can set it via WP-CLI: `wp option update
   theme_mods_envuemex --json` or add it to the customizer). The contact
   section will render the CF7 shortcode instead of the native form.

## File map

```
envuemex/
├── style.css                 theme header
├── functions.php             setup, enqueue, customizer, helpers
├── header.php                top nav + brand
├── footer.php                footer + JS hook
├── front-page.php            homepage (assembles section parts)
├── index.php                 blog index fallback
├── page.php                  default page template (Elementor-friendly)
├── single.php                single post
├── 404.php                   not-found page
├── search.php                search results
├── searchform.php            search form markup
├── comments.php              comments list + form
├── inc/
│   └── elementor.php         Elementor compat + page templates
├── templates/
│   ├── elementor-canvas.php  Template Name: Elementor Canvas (Blank)
│   └── elementor-blank.php   Template Name: Elementor (Header + Footer)
├── template-parts/
│   ├── section-hero.php
│   ├── section-trust.php
│   ├── section-soluciones.php
│   ├── section-industrias.php
│   ├── section-plataforma.php
│   ├── section-stats.php
│   ├── section-nosotros.php
│   ├── section-cta.php
│   └── section-contacto.php
├── assets/
│   ├── css/main.css          full design system
│   ├── js/main.js            lang toggle, sticky nav, reveal
│   └── img/favicon.svg
└── languages/envuemex.pot    i18n template
```

## Customization tips

- **Logo:** Customize → Site Identity → Logo. The header swaps the inline
  SVG for your uploaded logo automatically.
- **Stats numbers:** edit `template-parts/section-stats.php`.
- **Partner logos in trust strip:** edit `template-parts/section-trust.php`
  — currently text-only; replace `<li>Geotab</li>` etc. with `<img>` tags.
- **Reusing sections on other pages:** call e.g.
  `<?php get_template_part('template-parts/section', 'plataforma'); ?>`
  in any template.

## Compatibility

- WordPress 6.0+
- PHP 7.4+
- Elementor 3.x (free and Pro)
- Optional: Polylang, WPML, Contact Form 7
