# RankForge — Structured Pilot Plan (10 Real Businesses)

Purpose: convert RC1 from "strong foundation, unproven live" into "proven on real
customer infrastructure" through a **guided, allow-listed** pilot — the fastest
honest path to the first paying customers. This plan assumes the two RC1
BLOCKERs are handled first (validate live WordPress; gate the Google/Atlas
surface). See `RC1_READINESS.md`.

## Shape of the pilot
- **Cohort:** 10 hand-picked businesses on **WordPress** (the only deploy target
  RankForge supports). Prefer sites with staging environments.
- **Access:** allow-listed accounts only (mitigates the missing email
  verification + rate limiting for now).
- **Model:** **guided** — an operator walks each business through setup on a call
  (mitigates the absent onboarding). One login per business (mitigates the
  absent team-invite UI).
- **Scope shown to pilot users:** Audit → Recommendations → WordPress deploy →
  History. The Google/Atlas external-intel surface is hidden or labeled "Beta —
  not live" until GSC/GA4 rendering + live OAuth are finished.
- **Duration:** 3–4 weeks. Week 0 = onboarding + first scan; weeks 1–3 = deploy,
  verify, observe.

## Per-customer onboarding runbook (guided)
1. Create the allow-listed account; confirm login.
2. Create the project (domain, industry, primary goal — explain why each matters).
3. Run the first crawl; review the scan summary together.
4. Connect **WordPress** using an Application Password on a **staging** site
   first; deploy one low-risk fix (a title) and watch read-back verification.
5. Review the prioritized recommendations; deploy 2–3 more with the customer.
6. Show rollback on one deployment so they trust reversibility.
7. Leave, return, confirm everything persisted.

## Metrics to track (one row per customer)
| Metric | How measured | Target |
|---|---|---|
| Onboarding time | wall-clock signup → first verified deploy | < 45 min guided |
| Crawl success | scan completed vs partial/failed; pages crawled | ≥ 90% pages, completed |
| Recommendation acceptance | accepted+deployed / surfaced | ≥ 40% |
| Deployment success | verified / attempted | ≥ 95% |
| Verification success | verified / applied (read-back) | ≥ 95% |
| Rollback events | count + reason | trend to 0 |
| Bugs | severity-tagged defects | 0 critical |
| User confusion | logged moments the user asked "what is this / what next" | capture verbatim |
| Feature requests | ranked | capture verbatim |

## Instrumentation
- Deployment + verification + rollback are already durable records — export them
  per project.
- Add a lightweight session note per onboarding call (confusion + requests) since
  there is no in-app analytics yet.
- Watch server logs for the new `[postgres] idle client error` warning and any 5xx.

## Exit criteria (pilot → paid GA)
- ✅ ≥ 8/10 customers reach a verified live deploy.
- ✅ Deployment + verification success ≥ 95% across the cohort on **real**
  WordPress.
- ✅ 0 critical bugs; 0 data-integrity or wrong-site incidents.
- ✅ Rollback works on demand for every customer who needs it.
- ✅ The top-3 confusion points get UX fixes (onboarding, jargon, tab order).

## Risks specific to this pilot
- **Live-WP variance:** real WordPress installs vary (plugins, block vs classic
  editor, AIOSEO/Yoast). Content-transform verification is invariant-based, but
  expect edge cases — start on staging.
- **No email verification / invites:** acceptable only because the cohort is
  allow-listed and single-user; do **not** open self-serve signup during the pilot.
- **Google surface hidden:** if a pilot customer specifically wants GSC/GA4, that
  is the signal to prioritize finishing rendering + live-OAuth validation — do
  not enable it half-built.

## What the pilot proves (and what it doesn't)
- Proves: the core loop (crawl → recommend → deploy → verify → rollback) on real
  customer WordPress, plus real onboarding time and acceptance rates.
- Does **not** prove: unattended self-serve onboarding, multi-user collaboration,
  or the external-intelligence (Google/Atlas) value — those remain post-pilot
  work.
