RMA Marketing Agency v7 — WordPress theme

INSTALL
1. Appearance > Themes > Add New > Upload Theme, choose rma-marketing-agency-v7.zip, Install, Activate.
2. Settings > Permalinks > Save Changes (refreshes the page routes).
3. Optional: Settings > General, change Site Title from "My WordPress" to "Relative Marketing Agency".
   Until then the theme shows the agency name in browser tabs anyway.

Switching back to v6 is safe: v7 leaves the v6 page-template settings alone.

WHAT IT RENDERS
- front-page.php          the homepage
- template-parts/intro    the website-history intro (once per browser session; skipped for
                          visitors with reduced motion turned on)
- page.php                every other page. The 13 pages v6 created (Services, Case Studies,
                          About, Insights, Contact, and the 8 services) get the RMA layout.
                          Any other page shows its editor content.

EDITING COPY
- Service names, one-line summaries, and tags: inc/data.php (rma_services).
- To replace the built-in copy on any RMA page, type content into that page in the WordPress
  editor. When the editor has content, it's shown instead of the built-in essay.
- Pages built with Elementor are left to Elementor.
- Logo: Appearance > Customize > Site Identity > Logo. Without one, the bundled RMA mark is used.

FORMS
The Contact page form and the footer newsletter sign-up email the address in Settings > General >
Administration Email Address, using wp_mail(). If mail doesn't arrive, SiteGround's SMTP settings
or an SMTP plugin is the usual fix.
