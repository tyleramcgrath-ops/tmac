# Teddy Headwear redesign

A full redesign concept for teddyheadwear.com: a static, multi-page storefront plus a brand vision board and a 60-day social launch package.

```bash
cd redesigns/teddy-headwear
python3 build.py            # regenerate pages after editing templates in build.py
python3 -m http.server 8000 # then open http://localhost:8000
```

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | Home: deep-shadow campaign hero, the 8 hats, a live Monogram Studio, campaign mosaic, apparel drop, hat details, lookbook, newsletter |
| `shop.html` | All 16 products with filters (`#hats`, `#cowboy`, `#fedora`, `#apparel`) |
| `product-<id>.html` | One page per product (8 hats, 8 apparel): gallery with zoom, color or size, quantity, add to cart, details, the city story, related products, sticky mobile buy bar, schema.org Product data |
| `studio.html` | Monogram Studio: type 1 to 3 letters, choose Script / Varsity / Serif / Western lettering, 6 thread colors, cowboy or fedora, cream or brown, letter size. The letters are drawn as an SVG "embroidery" on a blank-crown hat photo and go into the cart as a custom item |
| `campaign.html` | Campaign 01, "Four cities, one frontier": Jupiter, New York, Los Angeles, Texas |
| `vision.html` | Brand vision board |
| `social.html` | 60-day social package (reads `social/plan.json`; post graphics in `img/social/`) |

`assets/site.css` and `assets/site.js` are shared by every store page. `site.js` holds the product data, cart (localStorage), header/footer, the monogram engine and per-page logic.

## Images

- Product and original lifestyle photos come from teddyheadwear.com.
- `noir-*`, `hero-noir`, `scene-*`, `blank-*` and `apparel-*` (except `apparel-tee-black` and `apparel-trucker`, which are Teddy's own photos) are AI-generated from Teddy's real photos as references: deep-shadow editorial reshoots of the existing scenes, new campaign scenes, blank-crown hats for the Monogram Studio, and the apparel line.

## Placeholders to confirm before launch

- Apparel products and prices ($35 to $95) and the custom monogram fee (+$25) are proposals.
- Cart, checkout and newsletter are front-end only. Wire them to Shopify (Cart / Storefront API) and the email provider.
- Hat sizing isn't listed on the current site, so hat pages don't show a size selector yet.
