# RankForge — Product Reality Audit (Phase 11A)

**Date:** 2026-07-17
**Method:** Full code audit of the repository (four parallel deep audits: route/module inventory, placeholder/fabrication sweep, seo-intel pipeline audit, root-app audit), corroborated by the live crawl evidence in `PILOT_FINDINGS.md`. Every classification below was verified by reading code, not filenames or docs. This is a truth-finding document: nothing here is aspirational.

**Legend:**
✅ Production Functional 🟡 Partial 🔴 Not Implemented ⚪ Documentation/UI/Test Only

---

## Repository reality: what this repo actually is

The repo contains **four distinct products** fused together, at very different maturity levels:

| Product | Where | Reality |
|---|---|---|
| RankForge marketing site | `app/rankforge/**`, served at `/` | Static marketing pages with **fabricated live-looking metrics** (see Second Audit) |
| RankForge working app ("/app Command Center") | `app/app/**`, `app/api/{crawl,seo-scan,wordpress,forge,rankings,pagespeed,leads}` | Real crawler + real analytics + real WordPress writes; **zero server persistence** (all localStorage), no auth, no DB |
| seo-intel | `seo-intel/**` (separate Next.js app) | The most mature piece: real 8-step pipeline (SerpAPI, crawler, extraction, PSI, DataForSEO, Claude/OpenAI), Postgres/file persistence, 55 unit tests, real PDF/CSV export |
| Template remnants | `/studio`, `app/api/{chat,models,errors,sandboxes}`, `ai/tools/**`, `/shorts` | Leftover Vercel "vibe-coding platform" starter + a standalone Shorts toy. Orphaned (nothing links to them). Dead weight for RankForge |

**There is no roadmap document in the repository.** The README is still the upstream template's ("Vibe Coding Platform"). The only capability promises live in the marketing site copy and in the phase task specs. `ROADMAP_GAP_ANALYSIS.md` maps those promises against code.

**There is no database, auth, user, project, or portfolio entity in the RankForge app.** The only durable entity anywhere is seo-intel's single-run `reports` table (+`settings`). All RankForge state is per-browser localStorage (`rf_app_domain`, `rf_app_pages`, `rf_app_wp` — password deliberately not persisted, `rf_app_biz`, `rf_autopilot`, `rf_app_events`).

---

## System-by-system audit

### Intelligence

**Organic Intelligence Engine — 🟡 Partial**
- Files: `seo-intel/lib/serp.ts`, `compare.ts`, `keywords.ts`; root `app/api/seo-scan/route.ts:238-326`
- Routes: `seo-intel /api/analyze`; root `/api/seo-scan` (keyword mode)
- DB: seo-intel `reports` (per-run snapshot only)
- Tests: `serp.test.ts` (parse only), `keywords.test.ts`, `scoring.test.ts`
- Actually works: real SerpAPI top-10 + full competitor-page crawl + deterministic content/schema/technical gap analysis — **for one user-typed keyword per run**, only with `SERP_API_KEY`
- Missing: keyword discovery beyond PAA/related-searches capture, search volumes, topic clustering, any cross-run intelligence
- Dependencies: `SERP_API_KEY` (hard requirement — pipeline aborts without it)
- Production readiness: good as a single-keyword competitive snapshot; not an "engine"

**Business Intelligence Engine — 🔴 Not Implemented (⚪ marketing copy only)**
- No file, route, model, or function anywhere infers what a company sells, its customers, money pages, or conversion paths. The only trace is hardcoded copy with fake counts in `app/rankforge/components/sections.tsx:488-561` ("Add FAQ block to 5 money pages", count: 6/12/9/…).

**Content Intelligence — 🟡 Partial**
- Files: `seo-intel/lib/compare.ts` (content gap: missing terms/phrases/questions/heading topics, word-count recs, 0-100 gap score), root `analyze()` in `app/app/page.tsx:75-123` (dup titles/metas, thin pages, H1 issues)
- Actually works: deterministic term/phrase frequency vs. competitors; real duplicate/thin detection from crawl
- Missing: the promised "NLP-driven briefs" and "entity coverage" — it is n-gram frequency math, not NLP; no brief-generation workflow (AI layer produces suggested outlines when keyed)
- Tests: `scoring.test.ts` covers gap builders

**Knowledge Graph — 🔴 Not Implemented.** No graph structure, no entity linking, nothing.

**Entity Engine — 🔴 Not Implemented.** Only JSON-LD/microdata *schema type* extraction exists (`extract.ts`); no entity extraction/coverage analysis.

**Topic Engine — 🔴 Not Implemented.** `topPhrases()` n-grams are the closest artifact; no clustering, no topic model, no cluster→page mapping.

**Keyword Discovery — 🔴 Not Implemented (🟡 trace).** User must type the keyword. The only expansion captured is SerpAPI's People-Also-Ask + related-searches within a run. No volumes, no keyword universe, no multi-keyword runs.

**Competitor Intelligence — 🟡 Partial**
- seo-intel: crawls all top-10 competitor pages and produces side-by-side gap analysis — genuinely good, key-gated
- Root app: top-3 comparison in scan (`seo-scan/route.ts:238-326`), key-gated
- Missing: competitor tracking over time, backlink gap (DataForSEO summary only; `topAnchors` is hardcoded `[]` — `backlinks.ts:68`), "Competitor War Room" (marketing fiction with fake data, `sections.tsx:272-281`)

### Decision Making

**Decision Engine — 🟡 Partial (rule-based prioritizer, not an engine)**
- Files: `seo-intel/lib/recommendations.ts` (deterministic prioritized action plan, impact/difficulty, critical-first sort at `prioritize:190`); root `buildFixes()` + `buildPriorities()` (`app/app/command.tsx:91-108`)
- Tests: `scoring.test.ts` (priorities sequential, critical-first)
- Actually works: real issues in, static severity/category heuristics out
- Missing: everything that would make it a decision engine — no business-value model, no cross-option tradeoffs, no learning

**Business Value scoring — 🟡 Partial (modeled, honestly labeled).** `command.tsx:91-108`: `SEV_IMPACT` fractions (0.05/0.02/0.006) × user-entered `monthlyVisits` × `valuePerVisit`. Explicitly labeled "Modeled estimate* … not measured analytics" (`command.tsx:213,238,270`). Honest, but the fractions are invented constants.

**SEO Opportunity scoring — 🟡 Partial.** Severity/category heuristics (`CAT_META` hardcoded `command.tsx:83-89`; impact/difficulty in `recommendations.ts`). Real inputs, invented weights.

**Strategic Alignment — 🔴 Not Implemented.**
**Expected Return — 🟡 Partial** (same modeled-revenue math as Business Value; no measurement loop to validate it).
**Risk scoring — 🔴 Not Implemented.**
**Time-to-win — ⚪ UI Only.** "Minutes" estimates are hardcoded per-category constants rendered as if computed.
**Why Not analysis — 🔴 Not Implemented.**
**Consultant review — 🔴 Not Implemented.**
**Confidence auditing — ⚪ UI Only.** "Confidence" percentages come from the same hardcoded `CAT_META` table.

### Operator

**Operator Core — 🔴 Not Implemented.** No such module.
**Daily Mission — 🟡 trace / 🔴.** The Command Center "morning brief" (`command.tsx:262-272`) generates real lines from the latest crawl — but it is on-demand, single-site, and there is no "daily" anything (no scheduler exists).
**Portfolio Mission — 🔴 Not Implemented.** No portfolio entity exists.
**Recommendation memory — 🔴 Not Implemented.** Every run is stateless; nothing remembers what was recommended or done (except a client-side localStorage event log).
**Learning system — 🔴 Not Implemented.**
**Self-review — 🔴 Not Implemented.**
**Judgment layer — 🔴 Not Implemented.**
**User feedback learning — 🔴 Not Implemented.**

### Execution

**Execution Engine — 🟡 Partial.** WordPress is the only executor; no generalized execution framework.

**WordPress deployment — ✅ Production Functional (with caveats)**
- Files: `app/api/wordpress/route.ts` (test/posts/pages/get/apply; real AIOSEO read+write via `aioseo_meta_data`, lines 124-126/166-169); `seo-intel/lib/wordpress.ts` (test/find/propose/apply)
- Actually works: real REST writes over Application Passwords; `get` even live-fetches the public URL and re-analyzes it
- Tests: **zero** — the entire write path is untested
- Missing: server-side audit trail (nothing records what was deployed), multi-CMS

**Preview — 🟡 Partial.** Client-side proposed-value display with edit step (`Optimizer`, `page.tsx:636-696`). No before/after diff of what will be replaced; seo-intel shows proposed values only, never current ones.

**Approval — 🟡 Partial.** Real client-side confirm gate ("Deploy N changes to your live site?"). No server-side workflow state, no record of who approved what.

**Verification — 🔴 / 🟡 trace.** Root app: none — trusts REST 200, no re-fetch (`page.tsx` Optimizer `done` state). seo-intel: verifies only the AIOSEO meta description by reading it back (`wordpress.ts:170-179`); title/FAQ/short-answer are hardcoded `applied:true` (`:167-169`).

**Rollback — 🟡 Partial (fragile).** Root app "Undo" re-POSTs previously captured values (`page.tsx:661`; schema injection reversible via HTML comment markers `:632-633`). But: capture lives only in browser memory/localStorage — close the tab and rollback is gone. seo-intel has **no rollback at all**, and has a real hazard: if the pre-write content read fails, it proceeds with empty content ("appends will still work" `wordpress.ts:133`), which can append to a wrongly-empty body. No WP revision capture in either app.

**Autonomous execution — 🔴 Not Implemented.** "SEO Autopilot" is a localStorage toggle (`rf_autopilot`) gating a manual button; 4 of 8 listed automations are marked `ready:false` "needs scheduler" (`command.tsx:330-367`). Marketing claims an "autonomous agent … ships fixes … 24/7" (`sections.tsx:178-180`) — nothing behind it.

**Policy engine — 🔴 Not Implemented.**

### Data

**Crawl engine — ✅ Production Functional (one critical defect)**
- Files: `app/api/seo-scan/analyze.ts` (fetchHtml with Googlebot retry + optional scrape-proxy fallback; extraction; scoring), `app/api/crawl/route.ts` (batched full-site, sitemap seeding, 300-page cap), `seo-intel/lib/crawler.ts` (redirect-chain, SSRF guard, size caps)
- Live-validated in Phase 11: 643 URLs discovered / 43 pages crawled on github.com; extraction matched manual ground truth (titles, schema types, canonicals)
- **Critical defect (verified live, still unfixed):** `/api/crawl` gates only on `!r.html` (`route.ts:114`) — 403/500 pages with an HTML body are scored as real content. Three blocked domains produced byte-identical fabricated audits. The single-page path gates correctly on `status >= 400` (`seo-scan/route.ts:81`)
- Also missing: robots.txt consultation, JS rendering, canonical dedup before scoring
- Tests: seo-intel extraction well-tested; **the crawlers themselves have zero tests**

**Keyword Universe — 🔴 Not Implemented.** One keyword per run; no lists, volumes, or storage.
**Ranking system — 🟡 Partial.** `app/api/rankings/route.ts`: real SerpAPI position lookup, key-gated, honest without key. **Point-in-time only** — no history, no time series (a seo-intel "rerun" creates an unlinked new report).
**GSC — 🔴 Not Implemented.** No OAuth, no googleapis dependency, no route. Nothing stubbed.
**GA4 — 🔴 Not Implemented.** Same.
**Data Fusion — 🔴 Not Implemented.** Sources combine only within one report's scoring.
**Scheduling — 🔴 Not Implemented.** No cron/queue/recurrence anywhere. `scheduleBackground()` is a serverless keep-alive, not a scheduler. The Autopilot UI honestly labels these "needs scheduler."
**Freshness — 🔴 Not Implemented.**
**Measurement windows — 🔴 Not Implemented.** No date-range concept exists.

### Product

**Project management — 🔴 Not Implemented.** No project/site/client entity in either app.
**Portfolio dashboard — 🔴 Not Implemented.**
**Today page — 🟡 Partial.** Command Center morning brief + "Today's highest-impact tasks" — real crawl issues with modeled economics; on-demand, single-site.
**Opportunities — 🟡 Partial.** `buildPriorities()` output: real issues, hardcoded difficulty/minutes/confidence, modeled revenue.
**Executive Mode / Command Center — 🟡 Partial.** Exists and runs on real crawl data (`command.tsx`, honest header comment). Weakest element: **per-AI-engine "visibility" bars** (ChatGPT/Claude/Gemini/… with magic offsets like `-7`, `command.tsx:117-126`) — formulas over your own crawl scores presented under engine names, implying citation measurement that does not exist.
**Search — 🔴 Not Implemented.** Domain-input field only; no search over data (there is no stored data).
**Reports — 🟡 split.** Root app: client-side JSON blob + `window.print()` only. seo-intel: ✅ real PDF (pdfkit), CSV, JSON export, stored + stateless routes. Nothing white-label, nothing scheduled, no client portal.

---

## Second audit: placeholders, fabrications, and honesty map

### Fabricated data presented as real (the bad list)

1. **The entire marketing surface renders invented metrics as live product output:**
   - `hero.tsx:87-136` fake KPIs (SEO Score 92, 1,284 keyword wins…) under a blinking **"Live crawl"** badge (`:160-167`); fake trend bars and "▲ 31.4%" (`:148,214`); fake "#1 / cited / top 3" wins (`:238-247`)
   - `sections.tsx:272-281` fake competitor war-room; `:362-368` fake AI-citation counts ("Cited in 41 prompts"); `:488-561` fake fix lists with invented page specifics ("Fix LCP on /pricing (3.8s → <2.5s)"); `:706-741` fake agency client results (+38% traffic)
   - `demo.tsx:500-870` — the entire 8-chapter product tour is scripted fiction (fake live-activity feed, fake rank tables, fake local grids, fake GBP stats)
2. **Priced plans sell unbuilt features as delivered** (`pricing-cta.tsx:18-54`): "Google + AI rank tracking" (key-gated point lookup only), "AI search visibility tracking" (not measured anywhere), "Local SEO heatmaps", "Competitor War Room", "Backlink monitoring", "White-label dashboards & PDFs", "Scheduled reports", "Client portals" — the last six **do not exist in code at all**. Footer/nav links including Privacy/Terms/Security are dead `href="#"` (`:181-253`).
3. **"Autonomous AI SEO Agent … ships fixes … 24/7"** (`sections.tsx:178-180`) — no autonomy, no scheduler exists.
4. **Working-backend fabrication:** `/api/crawl` scores error pages (`route.ts:114`, verified live in Phase 11).
5. **Per-engine AI visibility bars** (`command.tsx:117-126`) — pseudo-derived numbers under real engine names.

### Honest degradation (the good list — this pattern is genuinely strong)

- Rankings/competitors/backlinks/PSI all return `available:false` + "connect X" notes; zero invented numbers (`rankings/route.ts:44-46`, `seo-scan/route.ts:246-253,331-333`, `pagespeed/route.ts:32,50`, `seo-intel/lib/backlinks.ts:14`, `scoring.ts:72,126,146` — authority score drops to a neutral 50 with an explicit "does not reflect real data" note)
- Single-page scan refuses to score blocked/error pages (`seo-scan/route.ts:81-92`)
- Modeled revenue is labeled "Modeled estimate* … not measured analytics" everywhere it appears
- Unbuilt automations are greyed out with "needs scheduler" tags
- seo-intel's AI fallback generates template copy but never fake metrics (`ai.ts:195-247`; prompt explicitly forbids inventing data `:108-112`); tests **assert** the honesty guarantees (neutral-50 authority, nulls-not-fake PSI values)
- WordPress creds: app password deliberately never persisted client-side

### TODO/stub markers

Product code is clean of TODO/FIXME/HACK markers — the incompleteness is not flagged in comments; it lives in the fabricated marketing UI above. (Only hits: a tooling validator and prose in PILOT_FINDINGS.md.)

### Dead weight

Orphaned template code, deletable without product impact: `app/studio/`, `app/api/{chat,models,errors,sandboxes}/`, `ai/tools/`, `ai/messages/`, `app/{chat,file-explorer,preview,logs,header,state,actions}.tsx`, most of `components/`, plus the standalone `/shorts` toy. Keep `ai/gateway.ts` + `ai/constants.ts` (used by Forge). The README describes this template product, not RankForge.

### Test-only artifacts

None — no feature exists only in tests. Inverse problem instead: **zero tests** for the root app, the crawlers, the WordPress write path, and all network integrations. seo-intel's ~55 unit tests cover parsing/extraction/scoring/validation well.

---

## Beta readiness assessment

**Beta readiness score: 3.5 / 10** — as "RankForge, the AI SEO command center" sold by the marketing site and pricing page.

What supports it (the real ~40%): a validated, honest crawler/extractor/scorer; a working single-site dashboard computed from real crawls; real WordPress writes with a human approval gate and (fragile) undo; a genuinely mature single-run competitor-analysis pipeline in seo-intel; and a consistently honest not-configured posture for keyed integrations.

What blocks beta: no persistence/auth/projects (nothing survives a browser), no scheduling or history (so "tracking", "daily", "monitoring" claims are all impossible), one critical data-integrity defect in the crawl path, an unverified/untested execution path with no durable rollback, none of the promised intelligence/operator layers, and a marketing+pricing surface that sells at least six nonexistent capabilities — a trust liability worse than any missing feature.

The honest identity of what exists today: **a solid one-shot SEO audit tool with WordPress push and an optional single-keyword competitor snapshot** — not an autonomous SEO platform.
