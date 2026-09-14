#!/usr/bin/env python3
"""
Build the WordPress theme from the static site.

index.html and gps-tracking.html are the design source of truth. This script
slices them into WordPress partials so the theme can never drift away from the
static pages: change the HTML, re-run `python3 tools/build-theme.py`.

    envue.css / envue.js  ->  envue-theme/assets/{css,js}/
    index.html            ->  header.php + front-page.php + footer.php
    gps-tracking.html     ->  page-gps-tracking.php
"""

from pathlib import Path
import re
import shutil

ROOT  = Path(__file__).resolve().parent.parent
THEME = ROOT / "envue-theme"

GENERATED = ("<?php\n"
             "/**\n"
             " * GENERATED FILE — do not edit directly.\n"
             " * Source: {src}.  Rebuild with: python3 tools/build-theme.py\n"
             " */\n"
             "?>\n")


def slice_between(html, start, end, include_end=True):
    """Return the chunk of `html` from the `start` marker to the `end` marker."""
    i = html.index(start)
    j = html.index(end, i)
    return html[i:j + len(end)] if include_end else html[i:j]


def wp_links(chunk):
    """Rewrite static .html links into WordPress permalinks."""
    def repl(match):
        slug, anchor = match.group(1), match.group(2) or ""
        if slug == "index":
            path = "/" + anchor
        else:
            path = f"/{slug}/{anchor}"
        return 'href="<?php echo esc_url( home_url( \'%s\' ) ); ?>"' % path

    return re.sub(r'href="([a-z0-9\-]+)\.html(#[a-z0-9\-]+)?"', repl, chunk)


def build():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    gps   = (ROOT / "gps-tracking.html").read_text(encoding="utf-8")

    THEME.joinpath("assets/css").mkdir(parents=True, exist_ok=True)
    THEME.joinpath("assets/js").mkdir(parents=True, exist_ok=True)

    # ── shared assets ────────────────────────────────────────────────
    shutil.copyfile(ROOT / "envue.css", THEME / "assets/css/envue.css")
    shutil.copyfile(ROOT / "envue.js",  THEME / "assets/js/envue.js")
    for stale in ("assets/css/theme.css", "assets/css/inner.css", "assets/js/theme.js"):
        THEME.joinpath(stale).unlink(missing_ok=True)

    # ── header.php ───────────────────────────────────────────────────
    chrome = wp_links(slice_between(index, "<!-- ── TICKER", "</header>"))
    # the brand link becomes the WP custom logo when one is set
    chrome = chrome.replace(
        '<img src="https://eliteextra.com/wp-content/uploads/2023/06/'
        'EnVue2011-500x188-1-66904380e836a6105bae0e94a376d8ad.png" '
        'alt="EnVue Telematics" width="200" height="58">',
        "<?php envue_brand_image(); ?>"
    )

    header = (
        "<?php\n"
        "/**\n"
        " * GENERATED FILE — do not edit directly.\n"
        " * Source: index.html.  Rebuild with: python3 tools/build-theme.py\n"
        " */\n"
        "?>\n"
        "<!DOCTYPE html>\n"
        "<html <?php language_attributes(); ?>>\n"
        "<head>\n"
        '  <meta charset="<?php bloginfo( \'charset\' ); ?>">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "  <?php wp_head(); ?>\n"
        "</head>\n"
        "<body <?php body_class(); ?>>\n"
        "<?php wp_body_open(); ?>\n\n"
        + chrome + "\n"
    )
    (THEME / "header.php").write_text(header, encoding="utf-8")

    # ── footer.php ───────────────────────────────────────────────────
    footer_markup = wp_links(slice_between(index, "<!-- ── FOOTER", "</footer>"))
    footer_markup = footer_markup.replace(
        '<img src="https://eliteextra.com/wp-content/uploads/2023/06/'
        'EnVue2011-500x188-1-66904380e836a6105bae0e94a376d8ad.png" '
        'alt="EnVue Telematics" width="200" height="58" loading="lazy">',
        "<?php envue_brand_image( true ); ?>"
    )
    footer_markup = footer_markup.replace(
        "&copy; 2026 EnVue Telematics.",
        "&copy; <?php echo esc_html( date( 'Y' ) ); ?> EnVue Telematics."
    )
    footer = (GENERATED.format(src="index.html") + footer_markup +
              "\n\n<?php wp_footer(); ?>\n</body>\n</html>\n")
    (THEME / "footer.php").write_text(footer, encoding="utf-8")

    # ── front-page.php ───────────────────────────────────────────────
    main = wp_links(slice_between(index, '<main id="main">', "</main>"))
    cta  = wp_links(slice_between(index, "<!-- ── FINAL CTA", "</section>"))
    front = (GENERATED.format(src="index.html") +
             "<?php get_header(); ?>\n\n" + main + "\n\n" + cta +
             "\n\n<?php get_footer(); ?>\n")
    (THEME / "front-page.php").write_text(front, encoding="utf-8")

    # ── page-gps-tracking.php ────────────────────────────────────────
    gps_main = wp_links(slice_between(gps, '<main id="main">', "</main>"))
    gps_cta  = wp_links(slice_between(gps, "<!-- ── FINAL CTA", "</section>"))
    gps_tpl = ("<?php\n"
               "/*\n"
               " * Template Name: GPS Tracking\n"
               " *\n"
               " * GENERATED FILE — do not edit directly.\n"
               " * Source: gps-tracking.html.  Rebuild with: python3 tools/build-theme.py\n"
               " */\n"
               "get_header();\n"
               "?>\n\n" + gps_main + "\n\n" + gps_cta +
               "\n\n<?php get_footer(); ?>\n")
    (THEME / "page-gps-tracking.php").write_text(gps_tpl, encoding="utf-8")

    print("theme rebuilt from static source:")
    for f in ("assets/css/envue.css", "assets/js/envue.js", "header.php",
              "footer.php", "front-page.php", "page-gps-tracking.php"):
        print(f"  {f:32} {(THEME / f).stat().st_size:>7,} bytes")


if __name__ == "__main__":
    build()
