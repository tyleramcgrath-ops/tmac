# RankForge Phase 11 — Real Website Pilot Findings

**Date:** 2026-07-17
**Environment:** Claude Code remote sandbox. Outbound HTTPS is governed by a policy-enforcing
egress proxy with a domain allowlist. This materially constrained the pilot (see below) and is
itself part of the evidence: it let us test exactly how RankForge behaves when the network says no.

**Pilot targets (as directed):** `example.org`, `neverssl.com`, `wikipedia.org`, and one real
business website. The egress allowlist blocked the first three; `github.com` was reachable and
served as the real business website (SaaS/developer platform, Microsoft-owned).

**Ground rule applied throughout:** a blocked request, timeout, robots restriction, or network
failure is **never** evidence about the business. Only verified observations create findings,
opportunities, or recommendations. Unknown stays unknown.

---

## 1. Crawl success / failure

| Target | Network result | `/api/seo-scan` (single page) | `/api/crawl` (full site) |
|---|---|---|---|
| example.org | **Blocked** — egress proxy returned `403 Host not in allowlist` | Correctly refused: error + no score (`overall: null`, debug `via: failed, status: 403`) | **DEFECT:** scored the proxy's 403 error page as the website — overall 34, 12 fix recommendations |
| neverssl.com | **Blocked** — same 403 policy denial | Correctly refused | **DEFECT:** identical fabricated report (overall 34, same 12 fixes) |
| en.wikipedia.org | **Blocked** — same 403 policy denial | Correctly refused | **DEFECT:** identical fabricated report |
| github.com | **Reachable** — real 200 responses | Real scan: overall 74, real signals | Real crawl: **643 URLs discovered, 43 pages crawled and scored, all HTTP 200**, sitemap-seeded, done=true |

Important: the three "blocked" results say **nothing about those websites**. example.org and
wikipedia.org are famously accessible sites; the 403s came from this sandbox's egress policy
("Host not in allowlist: …"), not from the sites. No finding about those businesses is recorded,
and none should ever be derived from these fetches.

## 2. Evidence collected (all verified, none synthetic)

Raw JSON captured for every request (scan_*.json, crawl_*.json in the session scratchpad;
key numbers reproduced here).

**github.com single-page scan (`/api/seo-scan`, status 200, via browser UA):**
- Title 61 chars, meta description 186 chars, 4 H1s, 10 H2s, 1,192 words
- 24 images / 0 missing alt, 102 internal links, 36 external links
- HTTPS true, indexable true, viewport present, Open Graph present, no JSON-LD schema
- Overall 74 — Technical 100, Content 84, Schema 4, AI-readiness 60
- 6 fixes emitted (title length, multiple H1s, missing JSON-LD, meta length, breadcrumbs, FAQ)

**github.com full-site crawl (`/api/crawl`):**
- 643 URLs discovered (sitemap seeding + link discovery), 43 crawled in 4 stateless batches, 0 fetch failures
- Real schema detection verified: FAQPage JSON-LD found on 8+ marketing pages
  (features/issues, enterprise, codespaces, trust-center…), CollectionPage on resources/events —
  and correctly absent on the homepage
- Canonical extraction verified: all four `resources/articles?topic=…` faceted URLs correctly
  report canonical `https://github.com/resources/articles`
- Score spread is sane: strongest pages are deep marketing pages with FAQ schema (93);
  weakest is `/login` (63, 105 words)

**Manual ground-truth checks (fetched independently of RankForge):**
- `github.com/robots.txt` — the crawled marketing paths are not disallowed for `User-agent: *`;
  `/login` has no meta-robots noindex and its real title is "Sign in to GitHub · GitHub",
  matching the crawler's extraction exactly (title, 26 chars, word count plausible)
- The proxy's 403 body is a 16-word plain-text message ("Host not in allowlist…") — exactly the
  "16 words" the defective crawl reports scored

**Honesty paths exercised (no keys configured in this sandbox):**
- Competitor top-10 without `SERPAPI_KEY` → `available: false` + explicit "Connect a SERP API" note; zero fabricated competitors
- Rank tracking without key → `available: false` + honest note
- Backlinks → `available: false` + "Connect a backlink API" note
- PageSpeed Insights (googleapis.com blocked by egress) → `available: false, error: "PSI returned 429"` — reported unavailable rather than invented
- WordPress `test` with an unreachable site → honest "Could not reach the WordPress site" error; with no credentials → clear prompt for a site URL
- Keyword usage for "ai code review" computed only from the actually-fetched page (all placements false, density 0 — correct; the term isn't on the homepage)

## 3. What Scout can verify (demonstrated on a real site)

On a reachable site, the crawler genuinely verifies, from real HTTP responses:

- URL discovery via `sitemap_index.xml` / `sitemap.xml` / `wp-sitemap.xml` plus internal-link expansion, same-host scoping, asset filtering
- Per-page: HTTP status, redirect-followed final URL, HTTPS, title/meta lengths, H1/H2 counts,
  word count, image alt coverage, internal/external link counts, canonical URL, meta-robots
  indexability, viewport, Open Graph, JSON-LD schema types, mixed content
- Duplicate signals: canonical grouping of parameterized URLs (data captured correctly)
- Deterministic scoring computed only from those extracted signals
- Honest "not configured" states for every keyed integration (SERP, backlinks, PSI, WordPress)

These all reproduced against ground truth with no discrepancies found on github.com.

## 4. What remains unknown (and must stay unknown)

- **Anything about example.org, neverssl.com, wikipedia.org** — never reached; zero findings recorded
- **Whether Scout passes real-world WAF/bot defenses** (Cloudflare etc.) — the sandbox firewall
  intercepted before any real WAF could; the Googlebot-retry and `SCRAPE_API_TEMPLATE` proxy
  fallback paths exist in code but are unvalidated end-to-end
- **SERP/competitor/keyword-volume quality** — no `SERPAPI_KEY` in this environment and
  serpapi.com is egress-blocked; the entire Organic Intelligence claim is untested
- **PageSpeed data quality** — googleapis.com egress-blocked
- **WordPress deploy/verify/rollback on a live site** — no WordPress credentials exist here; only
  the error paths were exercised. Note the codebase has **no rollback mechanism at all** (write
  is one-way; "preview" is a client-side diff before apply)
- **GSC / GA4** — no integration exists in the codebase (no routes, no OAuth, no googleapis
  dependency). There is nothing to test and nothing shown to users as "blocked/not configured"
  because the surfaces don't exist
- **Business Intelligence, Decision Engine, Operator/Daily Mission** — these modules do not
  exist in the codebase. The only related artifact is hardcoded marketing copy with fake counts
  in `app/rankforge/components/sections.tsx`. They cannot be validated because there is nothing
  to validate. Validation-by-pilot of the "intelligence layer" is therefore **not possible yet.**
- **Multi-industry accuracy** (local service, law firm, ecommerce, agency) — one real site is
  one data point; the 5-category pilot still needs an environment with open egress

## 5. False-positive risks (observed, not hypothetical)

1. **CRITICAL — blocked pages are scored as real content** (`app/api/crawl/route.ts`).
   The batch crawler only skips a page when the response body is empty; a 403 with an error body
   is analyzed like a normal page. All three blocked sites received byte-identical reports:
   overall 34, "critical: Add a `<title>` tag", "critical: Add an H1", "Thin content (16 words) —
   expand to 600+" — recommendations generated from a firewall's denial message. In production
   this means any Cloudflare-challenged site produces confident, fully fabricated audits.
   The single-page path already gates on `status >= 400` (`app/api/seo-scan/route.ts`); the crawl
   path must do the same and label those URLs "blocked — unknown", never scored.
2. **No page-type awareness.** `/login` (a utility page) is told to expand content to 600+
   words, add FAQPage schema, and add contextual links. A senior SEO would reject all three. Any
   crawl containing cart/login/legal pages will generate confident low-value or harmful advice.
3. **Duplicate URLs individually scored despite captured canonicals.** All four
   `?topic=` variants were crawled and scored as separate pages even though their canonical was
   correctly extracted. Inflates page counts and would double-report the same "fixes" per variant.
4. **Template recommendations regardless of context.** "Add BreadcrumbList schema" and "Add an
   FAQ section" appear on nearly every page including the homepage and login — pattern-stamped,
   not reasoned.
5. **Borderline thresholds stated as findings.** Title 61 chars vs a 60-char guideline is
   emitted as a warning; a human would ignore it.
6. **robots.txt is never consulted by the crawler** (verified: no reference in `app/api/`).
   Not a false-positive generator on github.com (paths crawled were allowed), but a compliance
   and trust risk: Scout may crawl and score pages a site has asked bots to avoid.

## Scorecard (only what evidence supports)

| Dimension | Score | Evidence |
|---|---|---|
| Crawl mechanics (reachable sites) | 8/10 | 643 discovered / 43 crawled / 0 errors on github.com; sitemap seeding, canonical + schema extraction all matched manual ground truth |
| Crawl failure handling | 3/10 | Single-page path refuses blocked pages (good); full-site path fabricates complete audits from 403 bodies (critical) |
| Data honesty of integrations | 9/10 | Every unkeyed integration says "not available / connect X" with zero fabricated numbers, verified across SERP, backlinks, PSI, rankings, WordPress |
| Recommendation quality | 4/10 | Real findings present (missing JSON-LD on homepage, 4 H1s, meta length) but diluted by page-type-blind and template advice a professional would discard |
| Business understanding | 0/10 — not built | No module exists; nothing inferred about what GitHub sells, its money pages, or conversion paths |
| Organic/keyword intelligence | Unknown | SERP-dependent; key absent and endpoint egress-blocked. Not scored — unknown stays unknown |
| Operator / Decision Engine | 0/10 — not built | No such surfaces in code |
| WordPress execution | Partial / Unknown | Real REST write path exists in code; connect/apply untested (no credentials); **no rollback exists** |
| Overall product readiness | **Not ready for beta as an "intelligence" product** | The crawler/extractor layer is genuinely solid and honest about missing data, but the intelligence layers the pitch depends on (business understanding, decision engine, operator) do not exist, and the crawl path's blocked-page scoring would destroy strategist trust on the first WAF-protected client site |

**Answer to the phase question — would an experienced SEO professional trust RankForge
recommendations?** For on-page hygiene on an open, reachable site: partially — the extracted data
is accurate and the honest "not configured" posture is better than many tools. As a strategist's
decision layer: **no, not yet** — one Cloudflare-blocked client site currently yields a fully
fabricated audit, utility pages get boilerplate content advice, and the strategic modules the
product narrative promises are not implemented.

## Required fixes before beta (ordered)

1. In `/api/crawl`, treat any `status >= 400` (and status 0) as **blocked/unknown** — record the
   URL and status, never extract, score, or emit fixes. Mirror the seo-scan gate.
2. Add page-type classification (utility/legal/auth/cart vs. content/money pages) and suppress
   content-expansion and FAQ-schema advice on non-content pages.
3. Collapse canonical groups before scoring and reporting; report parameter variants as one page.
4. Fetch and respect robots.txt in the site crawler.
5. Gate template recommendations (breadcrumbs, FAQ) on page context; drop sub-threshold
   "findings" (e.g., 61-char titles).
6. Build (or remove from the narrative) the Business Intelligence, Decision Engine, and Operator
   layers — they are currently marketing copy only.
7. Re-run this pilot from an environment with open egress across the five business categories
   before any beta claim.
