# SaySites

Tell it about your business; it builds a clean, fast website that ranks. See
`CMS_PLAN.md` at the repo root for the product plan.

This app is the **renderer**: the host picks the site, the path picks the page,
and `lib/render.ts` turns the page's element tree into one lean HTML document.

```
lib/schema.ts   the content model (zod): element tree, styles, site, page, redirect
lib/render.ts   element tree → HTML + per-page CSS, no client JavaScript
lib/seo.ts      structured data, pre-publish checks, sitemap, robots, redirects
lib/speed.ts    static half of the 95+ mobile PageSpeed gate
lib/sites.ts    host → site lookup (built-in sample site for now)
lib/sample.ts   the sample site: Rivertown Plumbing
app/            route handlers: every page, sitemap.xml, robots.txt
```

Any host that isn't `*.saysites.com` or a customer domain (e.g. the Vercel test
deployment) serves `SAYSITES_DEFAULT_SITE` (default: the sample site) and is
marked `noindex`.

Tests live at the repo root: `pnpm vitest run tests/saysites.test.ts`.
