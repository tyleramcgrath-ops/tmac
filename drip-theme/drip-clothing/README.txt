DRIP Clothing Co. — WordPress theme (v1.0.0)

INSTALL
1. Appearance > Themes > Add New > Upload Theme, choose drip-clothing.zip, Install, Activate.
   (WooCommerce stays as it is: products, orders, payments and settings are untouched.)
2. Settings > Permalinks > Save Changes.
3. Optional: Settings > General, change Site Title from "DRP" to "DRIP".
   Until then the theme shows DRIP in browser tabs anyway.
4. Your pages are built with Elementor today. The homepage is drawn by the theme
   (front-page.php), so the Elementor "New Drip Home" page is not shown while this theme is
   active; it is not deleted, and switching back to Inspiro brings it back.

WHAT IT RENDERS
- front-page.php                 the homepage: hero, the drop, story, black/white, next swell, cap
- woocommerce/archive-product    the shop and category pages
- woocommerce/single-product     product pages (WooCommerce's own add-to-cart form, so
                                 variations, stock and quantity rules still work)
- page.php                       About and Contact get the DRIP layout; Cart, Checkout and
                                 My account keep WooCommerce's blocks, styled to match;
                                 any other page shows its editor content (or Elementor's)
- index.php / single.php         the journal (blog) and search

WHERE THE HOMEPAGE GETS ITS PRODUCTS
- "The drop": the 8 newest priced products.
- "Next swell": products with no price yet (RIDE, FLOW, WAVE today), shown as coming soon.
- Black / White panels and the color filter read "Black" or "White" from the product name.
- The cap feature: the newest product with "cap" in its name.
- Products in the "Details" and "Mockups" categories are kept off the homepage and out of the
  category chips (the add_filter hook 'drip_hidden_categories' changes that list).

EDITING
- Menu: Appearance > Menus, assign one to "Primary menu". Without one, the header lists
  Shop all, each product category, Story and Contact.
- Logo: Appearance > Customize > Site Identity > Logo. Without one, the drawn drop + DRIP
  wordmark is used.
- To show the About or Contact page's own editor content instead of the built-in layout:
  add_filter( 'drip_builtin_page', '__return_false' );

FORMS
The Contact form and the "drop list" sign-up email the address in Settings > General >
Administration Email Address, using wp_mail(). If mail doesn't arrive, SiteGround's SMTP
settings or an SMTP plugin is the usual fix.
