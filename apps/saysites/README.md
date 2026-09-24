# SaySites

Tell it about your business; it builds a clean, fast website that ranks. See
`CMS_PLAN.md` at the repo root for the product plan.

One app, two jobs, split by host in `proxy.ts`:

- **saysites.com** (also www, the Vercel test address and localhost): the
  homepage, sign up / log in and the dashboard.
- **Customer websites** (`<name>.saysites.com`, `ss-<name>.vercel.app` for
  testing, `<name>.localhost` locally, or the customer's own domain): rewritten
  to `app/s-render/…`, where `lib/render.ts` turns each page's element tree
  into one lean HTML document. `/preview/<name>` shows any site from the main
  address.

```
lib/schema.ts   the content model (zod): element tree, styles, site, page, redirect
lib/render.ts   element tree → HTML + per-page CSS, no client JavaScript
lib/seo.ts      structured data, pre-publish checks, sitemap, robots, redirects
lib/speed.ts    static half of the 95+ mobile PageSpeed gate
lib/hosts.ts    host → main app or customer site
lib/sites.ts    host → site bundle (site, pages, redirects)
lib/serve.ts    path → page, sitemap, robots, redirect or 404
lib/store.ts    Postgres (DATABASE_URL) or in-memory "test mode"
lib/auth.ts     scrypt passwords, signed session cookie (SAYSITES_SECRET)
lib/starter.ts  a few facts about a business → a complete starter site
lib/sample.ts   the sample site: Rivertown Plumbing
app/            homepage, login, signup, dashboard, preview and s-render routes
```

Environment: `SAYSITES_SECRET` (32+ characters, required in production) and
`DATABASE_URL` (Postgres; without it the app runs in test mode and says so).

Tests live at the repo root: `pnpm vitest run tests/saysites.test.ts`.
