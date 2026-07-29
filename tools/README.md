# Site clone tools

Captures a live site with Playwright (rendered DOM, styles, scripts, images,
fonts) and rebuilds it as a static, locally-servable theme.

```bash
cd tools
npm run setup     # installs deps + Playwright's Chromium, one time
npm run clone      # captures the live site into ./theme
```

By default it clones `https://truepointsystems.com/`. Override the target,
output directory, page limit, or crawl delay with env vars (or pass the URL
as the first argument):

```bash
npm run clone -- https://example.com
TARGET_URL=https://example.com OUTPUT_DIR=example-theme MAX_PAGES=10 npm run clone
```

## Output

- `theme/index.html`, `theme/<path>/index.html` — one file per crawled
  same-origin page, with all resource URLs rewritten to root-relative local
  paths (`/assets/...`).
- `theme/assets/` — downloaded CSS, JS, images, fonts, and icons. CSS files
  are rewritten so their own `url(...)`/`@import` references point at local
  copies too.
- `theme/<path>/screenshot.png` — full-page screenshot of each captured page,
  useful as a visual reference alongside the markup.
- `theme/manifest.json` — list of captured pages and asset count.

Root-relative asset paths mean the clone must be served over HTTP, not
opened via `file://`:

```bash
npx serve theme
```

## Scope

The crawler stays same-origin and only follows links that look like HTML
pages (skips PDFs, images, archives, etc.), up to `MAX_PAGES` (default 25).
It is a structural/visual capture, not a functional one — forms, backend
endpoints, and third-party scripts that depend on the original server will
not work against the static copy.
