EnVueMex Exact — Elementor Theme (v7.3 "Industrial Editorial Telemetry")

INSTALL
1. WP admin → Appearance → Themes → Add New → Upload Theme.
2. Activate. The theme auto-imports 12 pages (Inicio, Servicios, GPS, Dash Cams,
   Activos, Nosotros, FAQ, Eventos, Blog, Contacto, Privacy, Terms) and sets
   "Inicio" as the front page.
3. If pages don't import, visit /wp-admin/?envuemex_import_pages=1 once while
   logged in as an admin.

EDITING
- Each homepage section is its own editable Elementor widget under the
  "EnVueMex Sections" category. Open the Inicio page in Elementor to edit.
- The contact form ships as an Elementor widget too: edit copy/email/phone
  inline from the editor.
- Submissions are emailed to the site admin email by default and logged to
  the `envuemex_contact_log` option (last 200 entries). Filter the recipient
  with `add_filter('envuemex_contact_to', fn($email) => 'sales@yours.com');`.

REQUIREMENTS
- WordPress 5.8+
- PHP 7.4+
- Elementor 3.x (free is enough)

WHAT'S NEW IN 7.3
- Bold aesthetic direction: "Industrial editorial telemetry."
- Typography overhauled: Big Shoulders Display (display) + Manrope (body) +
  JetBrains Mono (telemetry labels). No more generic fonts.
- Navy-dominant palette with sharp green CTAs and electric cyan live-data
  accents — cyan replaces "decorative" usage; everything else is restraint.
- Hero gains a monospaced telemetry strip above the headline
  (SYS · LIVE / NODES · 10,234 / LAT 25.6°N) and an orchestrated page-load:
  staggered fade-up for eyebrow → headline → copy → CTAs → command panel.
- Command panel becomes a live dashboard mock with status indicator.
- Route strip is now a true marquee — continuously scrolling ticker that
  pauses on hover.
- Solution rows get gigantic monospaced /01 /02 /03 numerals (76px) that
  shift to cyan and slide on hover, with a cyan bar that wipes in.
- Difference cards rebuilt in an asymmetric 4-card editorial grid (wide /
  narrow / narrow / wide) with monospaced /01-style index chips.
- Dark sections gain a real SVG turbulence noise grain overlay + radial
  glows for atmosphere.
- Proof grid: oversized Big Shoulders numerals + monospaced position
  numbers (01, 02, 03, 04).
- Section labels become editorial "/ LABEL" style in monospace.
- Mobile drawer is now full-bleed navy with Big Shoulders nav items.

CARRIED FORWARD FROM 7.2
- Real mobile hamburger menu (auto-hidden links was a regression in v7.1).
- AJAX contact form widget with honeypot + nonce + persisted submission log.
- Per-page tailored content for all 12 imported pages.
- prefers-reduced-motion respected throughout.
- A11y: skip link, focus-visible, ARIA, aria-current on active nav.
