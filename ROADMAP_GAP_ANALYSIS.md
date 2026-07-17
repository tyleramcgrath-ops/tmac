# RankForge — Roadmap Gap Analysis (Phase 11A)

**Date:** 2026-07-17

**Note on "roadmap":** the repository contains no roadmap document. The "Roadmap promise" column is sourced from the **capability claims RankForge actually makes to users** — the marketing site (`app/rankforge/**`), the site `<head>` metadata (`app/page.tsx`), the pricing/plan features (`pricing-cta.tsx`), and the Phase-11 pilot task specs (Business Intelligence, Decision Engine, Operator, GSC/GA4). Those are the promises a customer or a senior SEO would hold RankForge to. "Actual implementation" is code-verified (see `PRODUCT_REALITY_AUDIT.md`).

Estimated work is engineering-weeks for one experienced full-stack engineer, to a genuinely shippable (not demo) state. Priority: **P0** = required before any honest beta; **P1** = core differentiation; **P2** = later.

| Feature | Roadmap promise | Actual implementation | Gap | Est. work | Priority |
|---|---|---|---|---|---|
| **Crawl integrity** | "Full crawl in ~60s", technical audits | Real batched crawler, sitemap seeding, validated on github.com (643 found/43 crawled) — **but scores 4xx/5xx error pages as content** (`crawl/route.ts:114`) | Gate on `status>=400` like the scan path; add robots.txt + canonical dedup | 0.5 wk | **P0** |
| **Data persistence / accounts** | "Command Center", saved audits, "your projects" | None. 100% browser localStorage, no DB, no auth, no user | Build auth + Postgres + audit/project storage from zero | 3–4 wk | **P0** |
| **Project / site entity** | Manage multiple sites/clients | No project/portfolio/site model in either app | New data model + CRUD + UI | 2 wk | **P0** |
| **Rank tracking (over time)** | "Daily positions… volatility alerts", plan feature | Point-in-time SerpAPI lookup only, key-gated, no history | Add scheduled captures + time-series storage + trend UI | 2–3 wk | **P1** |
| **Scheduling / freshness** | "Daily crawls", "scheduled reports", "24/7 agent" | No cron/queue/recurrence at all; Autopilot is a localStorage toggle | Job scheduler + queue + worker | 2–3 wk | **P1** |
| **Backlinks** | "Backlink monitoring & gap finder" (Growth plan) | Root panel is static UI; seo-intel calls DataForSEO but `topAnchors` hardcoded `[]` | Wire DataForSEO end-to-end incl. anchors + gap logic | 1.5 wk | **P1** |
| **AI search visibility** | "AI search tracking", per-engine citation counts | Not measured. Marketing numbers fabricated; in-app per-engine bars are formulas over own crawl | Real AI-answer citation checking (or remove the claim) | 3–4 wk (hard) | **P1** |
| **Business Intelligence** | Understands what a company sells, money pages, customers | Does not exist; only fake counts in `sections.tsx` | Build inference (LLM over crawl) + validation | 2–3 wk | **P1** |
| **Decision Engine** | Prioritized, business-value-ranked recommendations | Rule-based prioritizer + modeled revenue with invented constants | Replace magic constants with a defensible value model; add risk/why-not | 2 wk | **P1** |
| **Operator / Daily Mission / memory / learning** | "Autonomous senior strategist", daily missions, learns | None exists (morning brief is on-demand single-site) | Large: needs persistence + scheduling + feedback loop first | 4–6 wk | **P2** |
| **WordPress verify + durable rollback** | "Deploy… nothing changes without approval" (implies safety) | Real write + client approval + fragile in-browser undo; no verify, no WP revision capture, empty-body hazard | Server-side apply log, post-write verify, WP revision snapshot | 1.5 wk | **P0** (safety) |
| **Local SEO heatmaps / GBP** | "Grid-based rank heatmaps… review velocity" (Growth plan) | Not implemented; fabricated in demo | Geo-grid rank API + GBP integration | 3 wk | **P2** |
| **White-label reports / client portals** | "Branded dashboards on your domain", "client portals" (Agency plan) | Not implemented; root reports = JSON blob + print. seo-intel has real PDF but no branding/portal | Report branding + portal auth + scheduling | 3–4 wk | **P2** |
| **GSC integration** | Implied by "command center replacing Looker Studio" + pilot spec | Not implemented; no OAuth/googleapis | Google OAuth + Search Console API + storage | 2 wk | **P1** |
| **GA4 integration** | Implied by "measured analytics" framing | Not implemented | GA4 Data API + OAuth + storage | 2 wk | **P2** |
| **Data fusion / measurement windows** | "One command center", measured outcomes | Not implemented (single-report scoring only) | Depends on GSC/GA4 + persistence first | 2 wk | **P2** |
| **Single-keyword competitor analysis** | Competitor gap analysis | ✅ Real in seo-intel (key-gated), solid | Minor: fold into main app, remove `topAnchors` stub | 0.5 wk | **P1** |
| **On-page audit + WordPress push** | Core audit + fix deployment | ✅ Real and working (with the crawl gate + verify caveats above) | Harden, test, add persistence | included above | **P0** |
| **Marketing/pricing truthfulness** | Sells ~6 nonexistent capabilities as delivered | Fabricated metrics + dead links + unbuilt plan features | Rewrite marketing+pricing to match built scope, or gate claims behind "coming soon" | 1 wk | **P0** (trust/legal) |

---

## Top 10 biggest implementation gaps

1. **No persistence / auth / accounts** — nothing a user does survives a browser refresh on another device. This alone makes every "platform", "tracking", "monitoring", and "portfolio" claim impossible. *(P0, 3–4 wk)*
2. **No scheduling / background jobs** — kills "daily crawls", "scheduled reports", "24/7 autonomous agent", and rank tracking over time. *(P1, 2–3 wk)*
3. **Crawl scores error pages as content** — critical data-integrity defect; produces confident fabricated audits for any WAF/Cloudflare-protected client site. Verified live. *(P0, 0.5 wk — cheap and urgent)*
4. **Business Intelligence engine does not exist** — the pilot's central premise (understanding what a business sells) is unbuilt. *(P1, 2–3 wk)*
5. **Operator / Daily Mission / learning / memory does not exist** — no recommendation memory, no feedback loop, no self-review. *(P2, 4–6 wk, gated on #1/#2)*
6. **AI search visibility is fabricated, not measured** — both marketing numbers and in-app per-engine bars. Highest-risk honesty gap because it looks measured. *(P1, 3–4 wk or remove)*
7. **No rank history / time series** — rankings are point-in-time; "volatility alerts" and trend claims are unbacked. *(P1, 2–3 wk, gated on #1/#2)*
8. **WordPress execution is unverified with fragile, non-durable rollback** — no post-write verification, rollback state lives in the browser, and seo-intel can append to a wrongly-empty body on a read failure. A safety issue for a tool that writes to live sites. *(P0 safety, 1.5 wk)*
9. **Backlinks / local / white-label / GSC / GA4 all absent** but sold on priced plans — a cluster of plan-feature gaps. *(P1–P2, ~12 wk combined)*
10. **Zero tests on the entire root app and all write/network paths** — the crawler, WordPress writes, and every integration are untested; only seo-intel's pure functions have coverage. *(P0, ongoing, ~1.5 wk to a safety baseline)*

## Top 10 strongest completed capabilities

1. **Real, validated crawler + on-page extractor** — sitemap seeding, redirect handling, SSRF guards, size/time caps; extraction matched manual ground truth on a live site.
2. **Deterministic, explainable scoring** — technical/content/schema/AI-readiness computed transparently from real signals, not a black box.
3. **seo-intel single-run competitor pipeline** — 8 real steps (SerpAPI → crawl → extract → PSI → gap analysis → DataForSEO → AI), the most production-grade code in the repo.
4. **Pervasive honest degradation** — every keyed integration says "connect X", never fakes numbers; scoring drops to neutral-50 with an explicit disclaimer when data is missing.
5. **Real WordPress read/write incl. AIOSEO** — genuinely reads and writes AIOSEO SEO title/description, with a human approval gate.
6. **Single-page scan correctly refuses blocked/error pages** — the right pattern (the crawl path just needs to copy it).
7. **Real PDF/CSV/JSON export (seo-intel)** — multi-section pdfkit report, proper CSV escaping.
8. **Modeled economics are transparently labeled** — revenue estimates say "Modeled estimate, not measured analytics" everywhere.
9. **Security hygiene** — AES-256-GCM encrypted key storage, keys never returned to frontend, WP app-password never persisted client-side, SSRF blocklists.
10. **Honesty guarantees are tested** — unit tests assert neutral-50 authority and nulls-not-fake PSI values, so the honest behavior can't silently regress.

## Recommended next build order

**Phase A — Truth & safety (do first, ~3 wk, all P0):**
1. Fix the crawl status-gate (0.5 wk) — stops fabricated audits immediately.
2. Rewrite marketing + pricing to match built scope; remove dead links and fabricated metrics, or clearly mark unbuilt features "coming soon" (1 wk) — removes the biggest trust/legal liability.
3. Harden WordPress execution: server-side apply log, post-write verification, WP revision snapshot, fix the empty-body hazard (1.5 wk).
4. Add a test safety baseline for crawler + WordPress write path (ongoing).

**Phase B — Foundation (~6–8 wk, P0/P1):**
5. Auth + Postgres + audit/project/site data model (the unlock for everything else).
6. Job scheduler + queue + worker (unlocks tracking, daily missions, scheduled reports).
7. Fold seo-intel's competitor pipeline into the main app; finish backlinks (remove `topAnchors` stub).

**Phase C — Intelligence (~8–10 wk, P1):**
8. Rank tracking over time (built on B's persistence + scheduling).
9. GSC integration (real measured data — replaces modeled estimates with truth).
10. Business Intelligence inference (LLM over crawl → what the site sells, money pages, conversion paths), with validation against the pilot's five industries.
11. Real Decision Engine value model (replace invented constants using GSC/analytics signal).

**Phase D — Platform (later, P2):** Operator/Daily Mission/memory/learning, GA4 + data fusion, local heatmaps/GBP, white-label reports + client portals.

**Guiding principle:** do not build Phase C/D intelligence on top of the current stateless base — it will be demo-only again. Persistence and scheduling (Phase B) are the true prerequisites for every "platform" claim, and truth/safety (Phase A) must come before selling any of it.
