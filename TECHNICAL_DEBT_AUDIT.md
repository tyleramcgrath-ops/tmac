# RankForge — Technical Debt Audit (Phase A9)

**Date:** 2026-07-17
**Method:** Repository sweep for hardcoded/fake data, stubs, dead code, and unbuilt-feature claims, cross-referenced with `PRODUCT_REALITY_AUDIT.md`. Items resolved in Phase A are marked ✅ RESOLVED; the rest are prioritized Critical → Low with the file location and the fix.

---

## Critical

| # | Item | Location | Status / Fix |
|---|---|---|---|
| C1 | Crawler scored error/WAF/proxy pages as real content — fabricated audits | `app/api/crawl/route.ts` | ✅ RESOLVED (A2): shared `page-validity.ts` gate; blocked URLs reported, never scored; 16 tests. |
| C2 | Fabricated per-AI-engine "visibility" scores implying citation measurement | `app/app/command.tsx` | ✅ RESOLVED (A7): replaced with "AI Readiness Estimate" from measurable signals, explicitly labeled non-measurement. |
| C3 | Marketing/pricing sold ~6 nonexistent capabilities as delivered | `app/rankforge/**`, `app/page.tsx` | ✅ RESOLVED (A1): claims match built scope; unbuilt items moved to labeled roadmap; dead links removed. |
| C4 | No persistence/auth — all state in browser localStorage | root app | ✅ RESOLVED (A4): auth + Postgres/file store + projects/scans/recommendations; localStorage no longer the source of truth on the server side. (UI migration onto it is Phase B.) |
| C5 | WordPress writes unverified, rollback lived only in the browser | `app/app/page.tsx`, `seo-intel/lib/wordpress.ts` | ✅ RESOLVED (A6): server-side apply with before-capture, re-read verification, durable `WpDeployment` record, verified rollback. Legacy stateless route remains until `/app` UI migrates (tracked C11). |

## High

| # | Item | Location | Fix |
|---|---|---|---|
| H1 | seo-intel `topAnchors` hardcoded `[]` while UI advertises anchor comparison | `seo-intel/lib/backlinks.ts:68` | Populate from DataForSEO anchors, or drop the anchor claim from the setup message. |
| H2 | Empty-body hazard: WP apply proceeds with empty content if the pre-read fails | `seo-intel/lib/wordpress.ts:133` | Abort the write when the before-read fails (the new foundation `wp-execution.ts` already does this — migrate `/app` and seo-intel onto it). |
| H3 | Root `/app` still uses `localStorage` as source of truth + legacy `/api/wordpress` | `app/app/page.tsx` | Migrate UI onto the foundation routes (Phase B). Until then two WP paths coexist. |
| H4 | Modeled revenue uses invented impact constants (0.05/0.02/0.006) | `app/app/command.tsx` | Replace with a defensible model once GSC/analytics data exists (Phase C); keep the "Modeled estimate" label meanwhile. |
| H5 | Demo mocks retain fictional AI-citation/local numbers | `app/rankforge/components/demo.tsx` | Now triple-labeled (sample banner + Planned tag + roadmap banner). Acceptable short-term; replace with real illustrations when built. |
| H6 | Two crawlers + two scoring implementations (drift risk) | root `analyze.ts` vs `seo-intel/lib` | Consolidate under test (ARCHITECTURE_REALITY.md path 4). |

## Medium

| # | Item | Location | Fix |
|---|---|---|---|
| M1 | Backlinks panel is static UI with a "what you'll get" checklist (implies delivered) | `app/app/page.tsx` (`Backlinks()`) | Gate behind a real provider or relabel as roadmap. |
| M2 | "SEO Autopilot" toggle persists but does nothing (no scheduler) | `app/app/command.tsx` | Honestly labeled "needs scheduler"; hide the toggle until Phase B scheduling exists. |
| M3 | README describes the Vibe Coding template, not RankForge | `README.md` | Rewrite for RankForge (ARCHITECTURE_REALITY.md path 1). |
| M4 | Leads endpoint only `console.log`s without a webhook configured | `app/api/leads/route.ts` | Persist leads to the foundation store, or document the webhook requirement clearly. |
| M5 | Dead template code ships in the product bundle | `app/studio/**`, `app/api/{chat,models,errors,sandboxes}`, `ai/tools`, `app/shorts/**` | Archive/remove after confirming no shared imports (ARCHITECTURE_REALITY.md path 3). |
| M6 | Model IDs hardcoded in constants | `ai/constants.ts` | Fine for now; revisit if model routing becomes configurable. |

## Low

| # | Item | Location | Fix |
|---|---|---|---|
| L1 | Sub-threshold findings surfaced (e.g. 61-char title vs 60 guideline) | `app/api/seo-scan/analyze.ts` `buildFixes` | Add a tolerance band so borderline items are info, not warnings. |
| L2 | robots.txt not consulted by the crawler | `app/api/crawl/route.ts` | Fetch and respect robots.txt (compliance). |
| L3 | Canonical duplicates now flagged but still individually scored | `app/api/crawl/route.ts` (A2 added `duplicateOf`) | Foundation recommendations already exclude duplicates; make the `/app` UI collapse them visually too. |
| L4 | `shorts/data.json` sample copy contains unsourced "science-backed 30%" stats | `shorts/data.json` | Cosmetic; part of the orphaned Shorts toy (slated for archive). |

---

## Summary

Phase A resolved all five Critical items (C1–C5) and established the persistence, auth, execution-safety, and honesty foundation. The remaining High items are consolidation and migration tasks (wire `/app` onto the foundation, converge the duplicate crawlers/scoring, remove the empty-body hazard everywhere) that belong to Phase B. No unresolved Critical debt remains. TODO/FIXME markers are effectively absent from product code — historically the debt lived in fabricated UI, which A1/A7 addressed.
