# Teddy Midnight — WordPress + WooCommerce theme

The same storefront as the static redesign (`../index.html`), as an installable WordPress theme.

## Install

1. In WordPress, install and activate **WooCommerce** (Plugins → Add New).
2. Appearance → Themes → Add New → **Upload Theme** → choose `teddy-midnight.zip` → Activate.
3. Appearance → **Teddy Setup** → **Install the Teddy store**. This creates all 18 products with photos and Cream/Brown or size variations, the Monogram Studio and Campaign pages, sets the home page and turns off WooCommerce's "Coming soon" mode. It skips anything that already exists, so it is safe to run again. (WP-CLI: `wp teddy setup`.)
4. WooCommerce → Settings → **Payments**: connect Stripe, PayPal or another gateway so checkout can take payment.

## What's included

- Every page from the static site: home (bear intro, marquee, manifesto, cities, campaign rail, Bear Club), shop with filters, a page per product, Monogram Studio, Campaign 01, plus styled Cart, Checkout, My Account, order confirmation and 404 pages.
- Real WooCommerce cart in the slide-out drawer (add, change quantity, remove, upsell), with checkout going to WooCommerce.
- Monogram Studio designs are added to the cart with the monogram fee, shown in cart and checkout, and saved on the order (Monogram, Lettering, Thread, Letter size) for whoever stitches it.
- Products are managed in WooCommerce: change prices, stock, photos or add new products and the storefront updates. Hats are products with `_teddy_kind = hat` meta; anything else shows as apparel, with size buttons from a "Size" attribute.
- Bear Club signups are saved under **Bear Club** in the admin menu, with a copy-all box for email tools.
- Customizer (Appearance → Customize → Teddy storefront): hero image, eyebrow and text, intro on/off, monogram fee, Instagram and FAQ links.

## Build

`assets/site.css` and `assets/site.js` are shared with the static site, and the home, shop, studio and campaign templates are generated from `../build.py`, so the two stay identical:

```bash
python3 redesigns/teddy-headwear/wordpress/build_wp.py   # writes teddy-midnight/ and teddy-midnight.zip
```

Hand-written PHP lives in `src/`.
