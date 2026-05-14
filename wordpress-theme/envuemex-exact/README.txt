EnVueMex Exact — Elementor Theme (v7.2)

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

WHAT'S NEW IN 7.2
- Refined design: tighter typography rhythm, cleaner color palette, refined
  hero command panel, gradient stat numbers, hover micro-interactions.
- Real mobile hamburger menu with full-screen drawer.
- Scroll-reveal animations honoring prefers-reduced-motion.
- AJAX contact form with honeypot + nonce + admin-side log.
- Per-page tailored content (each inner page has real sections, not a stub).
- Accessibility: skip link, focus-visible rings, ARIA roles, aria-current.
