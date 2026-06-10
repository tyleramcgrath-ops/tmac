# SEO Competitor Intelligence Tool

A production-quality SEO competitor analysis web app. Enter your page URL and a target keyword — the app pulls the **live top 10 Google organic results** (via a compliant SERP API), crawls your page and every competitor page, and produces a precise side-by-side gap analysis with a prioritized action plan.

Built with Next.js (App Router) · React 19 · Tailwind CSS v4 · PostgreSQL (or zero-config file store) · Claude / OpenAI for AI recommendations.

## What it does

1. **SERP collection** — top 10 organic results, featured snippets, People Also Ask, related searches (SerpAPI; no direct Google scraping).
2. **Page crawling** — your page + all competitors, with redirect-chain tracking, timeouts, size caps, and graceful handling of blocked pages.
3. **SEO extraction** — title/meta, headings, canonical, robots, indexability, word count, images & alt text, internal/external links, Open Graph/Twitter cards, JSON-LD + microdata schema (with required-property validation), FAQ detection, author/dates, CTAs and conversion elements.
4. **Keyword analysis** — placement (title, meta, H1, H2s, URL, first 100 words, alt text), density, top terms and phrases per page.
5. **Comparison engine** — content gap (missing topics, terms, questions, recommended word count, 0–100 gap score), schema gap (with ready-to-paste JSON-LD), heading structure, technical SEO audit.
6. **Page speed** — Google PageSpeed Insights: Lighthouse categories + LCP/CLS/INP/FCP/Speed Index for your page and top competitors.
7. **Backlinks/authority** — DataForSEO integration (optional); shows an honest setup notice instead of fake numbers when not connected.
8. **Scoring** — eight 0–100 scores (overall, content, technical, schema, authority, speed, intent match, AI readiness), each with a plain-English explanation. Scores are deterministic and computed from real data; unavailable data is labelled, never faked.
9. **AI recommendations** — Claude (preferred) or OpenAI analyzes the *extracted* data only (prompts forbid inventing data) and produces an executive summary, improved titles/metas, a recommended heading outline, content sections, FAQ suggestions, and AI-search (GEO/AEO) recommendations. Without an AI key, a clearly-labelled rule-based engine produces the same structure.
10. **Reports** — stored history (reopen / re-run / delete), live progress tracker while a scan runs, and PDF / CSV / raw-JSON export.

## Quick start

```bash
cd seo-intel
pnpm install            # or npm install
cp .env.example .env    # add at least SERP_API_KEY
pnpm dev                # http://localhost:3000
```

The only **required** key is `SERP_API_KEY` ([serpapi.com](https://serpapi.com) — free tier available). Everything else degrades gracefully.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SERP_API_KEY` | **Yes** | SerpAPI key for live Google top-10 results |
| `ANTHROPIC_API_KEY` | Recommended | Claude-powered recommendations (model: `claude-opus-4-8`) |
| `OPENAI_API_KEY` | Optional | Fallback AI provider |
| `PAGESPEED_API_KEY` | Recommended | Raises PageSpeed Insights rate limits (works without, slowly) |
| `DATAFORSEO_API_KEY` | Optional | `login:password` — enables backlink/authority comparison |
| `DATABASE_URL` | Optional | PostgreSQL connection string; omit to use the local `.data/` JSON store |
| `APP_SECRET` | Optional | Enables saving keys from the Settings UI (AES-256-GCM encrypted at rest) |
| `NEXT_PUBLIC_APP_URL` | Optional | Public URL of the app |
| `PSI_COMPETITOR_LIMIT` | Optional | Competitor pages to run PageSpeed against per report (default 3) |

API keys are resolved **environment-first**; keys saved from the Settings page are stored encrypted and are never sent to the frontend (only a configured/not-configured flag is exposed).

## Database setup

**Zero-config (default):** reports are stored as JSON under `.data/` — perfect for local use and demos.

**PostgreSQL (production):** set `DATABASE_URL` (e.g. `postgres://user:pass@host:5432/seo_intel`). Tables (`reports`, `settings`) are created automatically on first use. Works with Supabase — use the connection string from *Project Settings → Database*.

## Running tests

```bash
pnpm test        # 55 unit tests: URL validation, SERP parsing, extraction,
                 # schema validation, keyword analysis, scoring, recommendations,
                 # AI response parsing, PSI parsing
pnpm type-check  # strict TypeScript
pnpm build       # production build
```

## Deploying

Any Node 20+ host works:

- **Vercel**: import the repo, set the root directory to `seo-intel/`, add env vars. Note: analyses run as background work after the API responds; on serverless platforms set a generous function duration (≥ 300s) or deploy to a long-running Node host.
- **Docker / VM / Railway / Render**: `pnpm build && pnpm start`. Use `DATABASE_URL` for persistence (the file store needs a persistent disk).

## Architecture

```
app/
  page.tsx                     # Dashboard: new analysis + recent reports
  reports/page.tsx             # Report history
  reports/[id]/page.tsx        # Live progress + full report view (polls)
  settings/page.tsx            # API key status + encrypted key storage
  api/reports/                 # POST create / GET list
  api/reports/[id]/            # GET / DELETE / rerun / export?format=pdf|csv|json
  api/settings/                # Key status (booleans only) + save
lib/
  pipeline.ts                  # Orchestrator (8 steps, per-step progress persisted)
  serp.ts                      # SerpAPI fetch + testable parser
  crawler.ts                   # Manual-redirect crawler, SSRF guard, size/time caps
  extract.ts                   # Cheerio extraction of every on-page signal
  keywords.ts                  # Keyword placement, density, term/phrase frequency
  compare.ts                   # Content gap, schema gap, technical audit
  scoring.ts                   # Deterministic 0–100 scores
  recommendations.ts           # Prioritized action plan (data-derived)
  ai.ts                        # Claude/OpenAI insights + rule-based fallback
  pagespeed.ts / backlinks.ts  # PSI + DataForSEO integrations
  db/                          # Store interface: Postgres + JSON file store
  export/                      # CSV + PDF generation
components/                    # Dashboard, progress tracker, report sections
tests/                         # Vitest unit tests
```

### Accuracy principles

- Real SERP data, real crawled HTML — the AI only sees extracted data and is instructed not to invent anything.
- Actual data and AI-generated suggestions are visually separated in the report; the AI provider (or rule-based fallback) is always labelled.
- Unavailable data (blocked crawls, missing API keys, PSI failures) is surfaced as explicit warnings — never silently replaced with fake values.
- The full raw crawl/analysis JSON is downloadable per report for inspection and debugging.

## Troubleshooting

| Problem | Fix |
|---|---|
| "No SERP API key configured" | Add `SERP_API_KEY` to `.env` or the Settings page (requires `APP_SECRET` for UI saving). |
| Competitor shows "crawl blocked/failed" | The site blocks bots (403/timeout). Its SERP data is still compared; on-page data is partial. |
| PageSpeed errors / rate limits | Add `PAGESPEED_API_KEY`; competitor PSI is limited by `PSI_COMPETITOR_LIMIT` to keep runs fast. |
| Backlink section shows setup notice | Expected without `DATAFORSEO_API_KEY` — the app never fabricates authority data. |
| Saving keys from the UI fails | Set `APP_SECRET` (e.g. `openssl rand -hex 32`) and restart. |
| Report stuck in "running" after a server restart | The in-process job died with the server; use **Re-run**. For production-scale resilience, move the pipeline to a queue (see below). |

## Future improvements

- Job queue (BullMQ/pg-boss) for resumable analyses and horizontal scaling
- JS rendering for crawls (Playwright) to handle client-side-rendered competitors
- Ahrefs/SEMrush/Moz adapters behind the existing backlink interface
- Scheduled re-runs and rank tracking over time
- Multi-user auth (the Settings/api-key model is already per-deployment)
