# RankForge Phase A — Foundation, Truth, Safety Report

**Date:** 2026-07-17
**Objective:** Turn RankForge from "a powerful single-run SEO tool" into "a trustworthy foundation capable of becoming a persistent SEO operating system." No feature claims functionality that does not exist; no UI implies data that is not measured.

**Status:** Phase A complete. All work committed to branch `claude/rankforge-phase-11-pilot-hop710` (PR #58). 33 tests pass; `tsc --noEmit` clean; production `pnpm build` succeeds with all new routes registered.

---

## 1. Product truth cleanup (A1)

Rewrote every customer-facing surface to match built scope. Verified by grep: zero remaining "Live crawl" badges, zero fabricated KPI numbers (1,284 keyword wins etc.), zero "Autonomous"/"24/7" agent claims, zero dead `href="#"` links.

- **hero.tsx:** fake live dashboard → "Illustrative product preview — sample data" with real metric names; "~60s" → "up to 300 pages".
- **sections.tsx:** "autonomous 24/7 agent that ships fixes" → "Forge — AI SEO assistant, you approve"; real capabilities under "Available today", unbuilt ones under a distinct "On the roadmap — not available yet" grid; fake competitor/citation tables labeled "Sample data".
- **pricing-cta.tsx:** plan features limited to real capabilities; unbuilt items in a muted "Coming soon" list; phantom footer links (Privacy/Terms/Security/Blog/Customers) removed; "replace Semrush/Ahrefs" → "consolidates your core SEO workflow".
- **demo.tsx:** persistent "sample data — not live measurements" banner; roadmap chapters flagged "Planned".
- **rankforge-site.tsx / nav.tsx / scan.tsx:** trust marquee, nav, and widget upsell aligned to real scope.

Judgment calls: demo AI-citation/local mocks retain illustrative numbers but under triple labeling (banner + "Planned" tag + roadmap banner); pricing dollar amounts and money-back terms left as business terms, not feature claims.

## 2. Crawler integrity fix (A2)

Root cause: `/api/crawl` skipped a page only when the body was empty, so a 403/500/WAF page *with* a body was scored as real content — fabricating audits (three blocked domains previously produced byte-identical "overall 34" reports).

Fix: a shared `app/api/seo-scan/page-validity.ts` gate now rejects, before any analysis:
- HTTP status ≥ 400 (and status 0)
- WAF/bot challenges even at status 200 (Cloudflare "Just a moment", Imperva/Incapsula, PerimeterX, DataDome, "Attention Required")
- Egress/proxy denial bodies ("Host not in allowlist")
- Empty responses, non-HTML payloads, and trivially small documents
- Extraction failures (caught and reported, never scored around)

`/api/crawl` now returns blocked URLs in a separate `blocked[]` array (reason + detail) and flags canonical duplicates (`duplicateOf`) so variants aren't double-counted. `/api/seo-scan` gained the same challenge detection.

**Verified live:** example.org (blocked) → refused with "No audit was generated — blocked pages are never scored"; github.com (real) → 7 pages scored unchanged. 16 unit tests cover error/WAF/proxy/empty/valid/extraction-failure cases, including the critical assertion that a page merely *mentioning* WAF/CAPTCHA in its content is still accepted (no false rejects).

## 3. Architecture reality (A3)

`ARCHITECTURE_REALITY.md` documents: the four products fused in the repo (RankForge marketing, RankForge tool, orphaned Vercel template, orphaned Shorts toy); duplicate systems (two crawlers, two scoring modules, two WP writers, two persistence layers); and a disposition: **RankForge Core** = the product; **seo-intel** = extract its `lib/` into a shared library and retire the standalone app; **dead/template code** = archive out of the deployment. Includes an ordered consolidation path and migration risks (scoring drift, localStorage cutover, legacy WP route removal, `APP_SECRET` now load-bearing).

## 4. Foundation: auth + database + persistence (A4)

New `lib/foundation/` + API routes. localStorage is no longer the server-side source of truth.

- **Store** (`store.ts` + `postgres.ts` + `filestore.ts`): pluggable `FoundationStore` — Postgres (`pg`, auto-schema, JSONB) when `DATABASE_URL` is set, else a durable atomic JSON file store. Entities: users, organizations, members/roles, projects, scans, recommendations, WordPress connections, deployments, audit logs.
- **Auth** (`crypto.ts` + `auth.ts` + `app/api/auth/*`): scrypt password hashing, jose HS256 HttpOnly session cookies, signup/login/logout/me. `APP_SECRET` required — fails closed with no hardcoded fallback.
- **Authorization:** org-membership + role gate (`owner` > `admin` > `member`) on every project route. **Tenant isolation returns 404, not 403**, for out-of-tenant resources (existence not disclosed).
- **Project model:** real website/client entity — domain, industry, business profile, goals, notes, plus scan history.

## 5. Testing foundation (A5)

Root app had zero tests; now 33 (vitest, `pnpm test`):
- `page-validity.test.ts` (16): the A2 integrity gate.
- `foundation.test.ts` (14): password hashing, session round-trip + tamper rejection, secret encryption, store CRUD + cross-instance persistence (survives "restart"), duplicate-email rejection, audit scoping, **tenant isolation (404) and role enforcement (403)**, recommendation provenance, and WordPress deployment-record durability + rollback data.
- `auth-routes.test.ts` (3): signup→session→me→login through the real handlers, input validation, and cross-tenant project read returning 404.

## 6. WordPress safety hardening (A6)

`lib/foundation/wp-execution.ts` + `app/api/projects/[projectId]/wordpress/route.ts`:
- **Before-capture:** reads current title/meta/content from the live site first; if that read fails, the deploy aborts (no change without rollback data — closes the seo-intel empty-body hazard).
- **Durable record:** every change stores before, after, approver, approved-at, reason (required), deployment ID, verification, and result — server-side, surviving browser close / session expiry / device change.
- **Verification:** re-reads the post after applying and compares — never trusts the write response; status becomes `verified` or `verify_failed` with per-field detail.
- **Rollback:** re-applies captured before-values and verifies the rollback took; records who/when.
- Credentials encrypted at rest (AES-256-GCM); deploy/rollback require the `admin` role; every action writes an audit-log entry.

## 7. Honest AI visibility (A7)

Removed the fabricated per-engine "visibility" bars (ChatGPT/Claude/Gemini/… with magic offsets like `-7`) that implied citation measurement. Replaced "AI Authority Score" with **"AI Readiness Estimate"**: the same crawl-derived composite, but its breakdown now shows only measurable signals (structured-data coverage, indexability, content depth, content quality, technical health, HTTPS coverage) each with the underlying fact, labeled "Estimate from crawl signals only — not a measurement of AI-engine visibility or citations."

## 8. Real Decision Engine foundation (A8)

`lib/foundation/recommendations.ts` derives stored recommendations from a persisted scan. Every recommendation answers the five required questions and stores them:
- **Why:** prevalence-based reasoning ("6 of 7 crawled pages exhibit this").
- **Evidence:** affected URLs + facts (which scan, which rule).
- **Confidence:** deterministic — rule certainty × prevalence — with the formula stored in `confidenceBasis` (no model output, no magic constant presented as measurement).
- **Expected impact:** which score category improves + qualitative size (no invented dollars).
- **Risk:** low/medium/high with rationale (content changes riskier than additive markup).

Canonical duplicates are excluded so one issue isn't counted per URL variant; identical fixes are grouped across pages; status transitions are validated and append to an immutable history. **Verified live:** a real github.com crawl produced 9 recommendations with full provenance.

## 9. Technical debt audit (A9)

`TECHNICAL_DEBT_AUDIT.md` prioritizes Critical → Low. All five Critical items (error-page scoring, fabricated AI scores, dishonest marketing, no persistence, unverified WP execution) are ✅ RESOLVED in Phase A. Remaining High items are Phase-B consolidation/migration tasks (wire `/app` onto the foundation, converge duplicate crawlers/scoring, remove the empty-body hazard everywhere, finish backlinks). No unresolved Critical debt remains.

---

## Updated beta readiness

### A10 criteria

| Criterion | Status | Evidence |
|---|---|---|
| Users exist | ✅ | `app/api/auth/signup`, scrypt, sessions; tested |
| Organizations exist | ✅ | personal org on signup; members/roles |
| Projects persist | ✅ | `Project` entity + store; live-verified |
| Data survives refresh | ✅ | server-side store; cross-instance persistence test |
| Crawl is trustworthy | ✅ | A2 integrity gate; 16 tests; live-verified |
| WordPress execution is auditable | ✅ | durable `WpDeployment` records; approver/reason/verification |
| Rollback survives sessions | ✅ | rollback data stored server-side; durability test |
| Recommendations persist | ✅ | `Recommendation` store; live-verified (9 recs) |
| Recommendation history exists | ✅ | append-only status history; validated transitions |
| Root tests exist | ✅ | 33 tests, `pnpm test` |
| No fabricated metrics | ✅ | A7 (per-engine) + A1 (marketing) removed; grep-verified |
| Customer-facing claims match reality | ✅ | A1 rewrite; roadmap items labeled |

**All twelve A10 gates: PASS.**

### Scored readiness (evidence-based)

| Dimension | Before (Phase 11A) | After (Phase A) | Basis |
|---|---|---|---|
| Product completeness | 3 | 5 | Foundation exists; intelligence/operator still Phase C/D |
| Reliability | 4 | 7 | Integrity gate + 33 tests + green build |
| Recommendation quality | 4 | 6 | Now evidence-backed with confidence/risk; still rule-based |
| Execution capability | 5 | 8 | Server-side verify + durable rollback + audit trail |
| Data integrations | 3 | 4 | Persistence added; GSC/GA4/backlinks still absent |
| UX | 6 | 7 | Honest labeling; `/app` UI not yet on the foundation |
| Security | 7 | 8 | scrypt, AES-GCM, tenant isolation tested, fail-closed secret |
| Scalability | 2 | 6 | Real DB + accounts + orgs; scheduling still Phase B |

**Overall: 3.5 → 6.4 / 10.**

### Verdict: FOUNDATION READY — not yet a general-availability beta

Phase A achieved its goal: RankForge now has a truthful, reliable, persistent foundation. The A10 gates all pass, and the product no longer claims anything it can't do. What remains before a public beta is **integration and scope**, not truth or safety:

1. **Wire the `/app` UI onto the foundation** (it still uses localStorage + the legacy WP route in the browser layer — the server foundation exists and is tested, but the existing dashboard screens aren't pointed at it yet). This is the top Phase B task.
2. **Scheduling** (for any "monitoring"/"daily" capability) and **GSC/GA4** (to replace modeled estimates with measured truth) remain unbuilt — correctly labeled as roadmap.
3. **Consolidate** the duplicate crawlers/scoring and remove dead template code per `ARCHITECTURE_REALITY.md`.

Honest one-line status: **the foundation is real, safe, and trustworthy; the persistent product experience is the next build (Phase B), not a claim to make today.**

---

### Deliverables map
1. Product truth cleanup → §1 (commit A1)
2. Crawler integrity fix → §2 (commit A2, `page-validity.ts` + tests)
3. Architecture reality → `ARCHITECTURE_REALITY.md`
4. Database/auth implementation → §4 (`lib/foundation/**`, `app/api/{auth,projects}/**`)
5. Testing coverage → §5 (`tests/**`, 33 tests)
6. WordPress safety → §6 (`lib/foundation/wp-execution.ts`)
7. AI metrics correction → §7 (`app/app/command.tsx`)
8. Technical debt audit → `TECHNICAL_DEBT_AUDIT.md`
9. Updated beta readiness → this section
