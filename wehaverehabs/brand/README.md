# We Have Rehabs — logo & brand kit

Vector redraw of the supplied lotus logo, with every version the website and print materials need.

## Files

| File | Use |
| --- | --- |
| `svg/logo-primary.svg` | Main logo (lotus over wordmark). Transparent background, for ivory/white. |
| `svg/logo-primary-reversed.svg` | Main logo for dark backgrounds and photos. |
| `svg/logo-primary-on-ivory.svg`, `svg/logo-primary-on-forest.svg` | Main logo with its background built in. |
| `svg/logo-horizontal.svg`, `svg/logo-horizontal-reversed.svg` | Lotus beside the wordmark — website header, email signature. |
| `svg/logo-mono-forest.svg`, `svg/logo-mono-white.svg`, `svg/logo-mono-gold.svg` | One-color versions for stamps, embroidery, foil, forms. |
| `svg/mark-lotus*.svg` | Lotus symbol on its own. |
| `svg/icon-forest.svg`, `svg/icon-ivory.svg`, `svg/icon-sage.svg` | Square app / social avatar artwork. |
| `svg/social-og-image.svg`, `social-og-image-1200x630.jpg` | Link-sharing image (Facebook, LinkedIn, iMessage). |
| `png/` | Transparent PNGs of each version at several widths (`name-WIDTH.png`). |
| `favicon.ico`, `apple-touch-icon.png`, `android-chrome-*.png` | Browser tab and home-screen icons. |

Text in every SVG is converted to outlines, so the files look the same on any computer without installing fonts.

## Colors

| Name | Hex | Use |
| --- | --- | --- |
| Forest | `#485848` | "WE HAVE", buttons |
| Sage | `#809070` | Lotus |
| Soft sage | `#A9B596` | Lotus highlights |
| Gold | `#BC9D6C` | "REHABS", divider lines |
| Deep gold | `#8C6E3E` | Small gold text on light backgrounds (meets contrast) |
| Deep forest | `#2F3A2F` | Dark sections, reversed backgrounds |
| Ivory | `#F7F5EE` | Page background |

## Fonts (all free on Google Fonts)

- **Cinzel** — logo lettering; small labels.
- **Cormorant Garamond** — headings and quotes.
- **Jost** (Light 300) — body text, navigation, buttons.

## Usage

- Clear space around the logo: at least the height of the center petal.
- Minimum width of the main logo: 160 px on screen / 35 mm in print. Smaller than that, use the horizontal logo or the lotus mark.
- Don't stretch, recolor the petals, add shadows, or put the full-color logo on busy photos (use the reversed version).

## Regenerating

`source/make_logo.py` builds every SVG from the Cinzel font (`pip install fonttools`):

```
python3 source/make_logo.py Cinzel-Regular.ttf svg
NODE_PATH=$(npm root -g) node source/render.js svg png logo-primary:600,1200,2400
```

`source/original-artwork.png` is the supplied reference artwork.
