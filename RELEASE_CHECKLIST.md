# RankForge RC1 — Release Checklist

Status legend: ✅ done · 🔧 fixed during RC1 audit · ⛔ blocker (open) · ⬜ to do

## Critical blockers (must be ✅ before the first paying customer)
- ⛔ **Validate the live WordPress path on real infrastructure.** Connect a real
  (staging) WordPress; deploy each fix kind (title, meta, https-upgrade, H1,
  internal-links); confirm read-back verification and rollback. Until this is
  green, the core promise is unproven.
- ⛔ **Resolve the "Connect Google" dead-end.** Either hide/label the Google +
  Atlas surface as Beta for the paid scope, **or** render GSC/GA4 data and
  validate the live OAuth handshake. A customer must never connect Google and
  see nothing.

## High-priority (before broad/self-serve launch; mitigable for a guided pilot)
- ⬜ Onboarding: a project-level "Run scan → Review → Connect WordPress → Deploy"
  checklist (or guided human onboarding for the pilot).
- ⬜ Rate-limit `scans`/`crawl` per user/project (or allow-list pilot accounts).
- ⬜ Email verification (or restrict to hand-picked accounts and document it).
- ⬜ Team invitations + members UI (or accept single-user per org for the pilot).

## Security (audited — mostly PASS)
- ✅ Tenant isolation (all routes gated; cross-tenant 404) — tested.
- ✅ Auth + session revocation (tokenVersion) — tested.
- ✅ Authorization roles (admin gates on connect/deploy) — verified.
- ✅ Encrypted credentials (WP + Google), never returned/logged — tested.
- 🔧 **SSRF on WordPress connect probe** — now passes `isSafeFetchTarget` — tested.
- 🔧 Revoked Google token → `unauthorized` reason; Google fetch 15s timeout.
- ⬜ OAuth state single-use / nonce replay store (MEDIUM).
- ⬜ Uniform `assertSameOrigin` on all mutations (MEDIUM; Lax cookie is primary
  guard; WP connect now covered).
- ⬜ Shared-store rate limiter for horizontal scaling (MEDIUM).

## Reliability (audited)
- 🔧 **pg Pool `error` handler** — a Postgres restart no longer risks crashing the
  process; pool recovers on next query.
- ✅ WordPress fetch 20s timeout + abort; deploy aborts safely if before-capture fails.
- ✅ Read-back verification; verify failure reopens the recommendation.
- ✅ Partial crawl represented honestly (`status: partial`).
- ⬜ Optional: 1-retry-on-connection-error wrapper for DB queries (MEDIUM).

## Product honesty (audited)
- 🔧 **Operator trust score / rates** no longer show a fabricated 40 / 0% baseline
  at zero deployments (render "—") — tested.
- ✅ No invented rankings/traffic/ROI; evidence grading + null-revenue correct.
- ⬜ AgentPanel subtitle clarifying "roles, not independent AI models" (MEDIUM).
- ⬜ Verify the marketing "14-day money-back guarantee" is an honored policy (business).

## Quality gates (green)
- ✅ `tsc` clean.
- ✅ `next build` compiles (21 routes).
- ✅ 284 tests pass, 8 Postgres-gated skipped.
- ✅ Store conformance + migrations 001–004 verified on real PostgreSQL 16.

## Usability (before broad launch; see USABILITY_REVIEW.md)
- ⬜ Tab state in URL (deep-link/refresh/back).
- ⬜ Atlas empty state + evidence-grade legend.
- ⬜ Operator/Atlas jargon + tab reorder (WordPress before Operator/Atlas).
- ⬜ Disable "Fix on WordPress" until WP connected.

## Support & documentation
- ✅ `KNOWN_LIMITATIONS.md`, `PHASE_H_GOOGLE_AND_FIXES.md`, `PHASE_G_LIMITATIONS.md`,
  `.env.example` (incl. Google vars).
- ⬜ Customer-facing setup guide (Google Cloud OAuth app + WordPress Application
  Password steps).
- ⬜ Support runbook: how to read deployment status, roll back, reconnect Google.
- ⬜ Incident path for a bad deploy (rollback is one click; document it).

## Documentation gaps
- ⬜ No end-user help/glossary for the jargon terms (Operator, Atlas, evidence
  grade, consensus, provenance).
- ⬜ No admin doc for env vars required in production (`APP_SECRET`, `DATABASE_URL`,
  `GOOGLE_CLIENT_ID/SECRET`).
