# RankForge — Guided Pilot Guide (10 Customers, Direct Support)

Operator-facing runbook for the first paid pilot. Assumes RC2 is deployed. The
pilot is **guided, allow-listed, and directly supported** — that posture is what
makes the remaining limitations acceptable.

## One-time deployment setup
Set these on the production deployment (Vercel):

| Env var | Purpose | Pilot value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (required in prod) | your Postgres URL |
| `APP_SECRET` | sessions + encryption (≥32 chars) | `openssl rand -base64 32` |
| `RF_SIGNUP_ALLOWLIST` | restrict sign-up to the cohort | the 10 emails, or their `@domains` |
| `MAIL_WEBHOOK_URL` | real verification-email delivery | your relay endpoint (optional) |
| `NEXT_PUBLIC_RF_ENABLE_ATLAS` | show the external-intel (Google) tab | **leave unset** (Atlas hidden) |
| `GOOGLE_CLIENT_ID`/`SECRET` | only if you later enable Atlas | leave unset for the pilot |

Rationale: Atlas OFF keeps the pilot scope to the validated crawl → recommend →
deploy loop and removes the Google dead-end entirely. Allow-list + logged-only
email are safe because the cohort is hand-picked.

## Per-customer onboarding (≈30–45 min, on a call)
1. Add their email to `RF_SIGNUP_ALLOWLIST`; have them sign up. (They'll see a
   verify banner — non-blocking; resend/verify as convenient. If `MAIL_WEBHOOK_URL`
   is unset, retrieve the link from server logs for them.)
2. Create the project (domain, industry, primary goal — explain why each helps
   the recommendations).
3. The **Getting started** checklist on the project page drives the rest:
   **Run scan → Connect WordPress → Deploy & verify a fix.**
4. Connect WordPress with an **Application Password**, ideally on a **staging**
   site first. Deploy one low-risk title fix; watch read-back verification.
5. Review the prioritized recommendations; deploy 2–3 more together.
6. Show a **rollback** so they trust reversibility.
7. Have them leave and return to confirm persistence.

## During the pilot
- Users can **Send feedback / report issue** from the bar in the app; you review
  submissions per org via `GET /api/feedback` (or the store). Triage into the
  metrics table below.
- Set each org's pilot window when you want a hard stop: set
  `org.pilot = { status: 'active', expiresAt: <ISO> }` (via a small script using
  `store.updateOrg`). When it passes, project access is blocked with a clear
  message. (There is no self-serve admin UI yet — operators set this directly.)
- Watch server logs for `[postgres] idle client error` (benign, pool recovers)
  and any 5xx.

## Metrics to track (one row per customer)
| Metric | Source | Target |
|---|---|---|
| Onboarding time | signup → first verified deploy | < 45 min guided |
| Crawl success | scan completed vs partial/failed | ≥ 90% pages |
| Recommendation acceptance | accepted+deployed / surfaced | ≥ 40% |
| Deployment success | verified / attempted | ≥ 95% |
| Verification success | verified / applied | ≥ 95% |
| Rollbacks | count + reason | trend → 0 |
| Bugs | from feedback + logs | 0 critical |
| Confusion moments | feedback + call notes | capture verbatim |
| Feature requests | feedback | ranked |

## Support boundaries (what "direct support" covers)
- **Team access:** one login per business (no invite UI yet) — add a second
  person by allow-listing another email into the same workflow, or share the
  login. Document per customer.
- **Email delivery:** if `MAIL_WEBHOOK_URL` is unset, verification is logged-only;
  the operator hands the user the link. Set the webhook for hands-off delivery.
- **Google/Analytics:** not in pilot scope (Atlas off). If a customer needs it,
  that's the signal to run a controlled live-OAuth validation first — do not
  enable it half-tested.
- **AIOSEO:** meta writes on a real AIOSEO site should be verified with the first
  such customer (RankForge auto-detects AIOSEO; the storage path is validated on
  the test double + AIOSEO detection validated live — see LIVE_WORDPRESS_VALIDATION.md).

## Exit criteria (pilot → GA)
- ≥ 8/10 reach a verified live deploy; deployment + verification ≥ 95% on real
  WordPress; 0 critical or wrong-site incidents; rollback works on demand; the
  top-3 confusion points get UX fixes.
