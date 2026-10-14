# Teddy Headwear redesign

A standalone redesign concept for teddyheadwear.com: one static `index.html` plus product and lifestyle photos in `img/` (taken from the live site and converted to WebP).

Open it with any static server:

```bash
cd redesigns/teddy-headwear && python3 -m http.server 8000
```

## What's on the page

- Announcement ticker and a sticky header that turns solid on scroll, with a live cart count
- Full-bleed hero ("A new frontier.") with two CTAs: shop the collection, or build your monogram
- Shop grid of all 8 hats with cream/brown swatches, hover color swap, and quick add; filter by Cowboy ($150) or Fedora ($140)
- "Build yours" picker: silhouette, monogram (T / F / NY / LA) and wool color, showing the exact product photo and price, with add to cart
- Cowboy and Fedora collection tiles
- "The details" section: hotspot pins on the photo, linked to an accordion of the four construction details
- Horizontally scrolling lookbook where each look has its own add-to-cart button
- "Snapbacks are coming" waitlist signup
- Cart drawer with quantities, a "complete the set" upsell, subtotal and checkout; a toast on every add; a sticky "Build yours" bar on phones

The cart and waitlist are front-end only (the cart is kept in localStorage). For launch, connect them to Shopify's Cart/Storefront API and to the newsletter provider.
