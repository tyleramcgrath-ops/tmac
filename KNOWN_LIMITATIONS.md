# RankForge — Known Limitations (updated at RC2)

An honest, complete list of what RankForge does **not** do (or has not proven).
Grouped by kind. Nothing here is hidden; this is the document a support team and
a pilot customer should both have. **RC2 status is noted inline.**

## Unproven against live third-party services (environment-blocked)
- **Live WordPress writes — RESOLVED at RC2.** The connect → deploy → read-back
  verify → rollback path was validated against a **real running WordPress**
  (core 7.1 on PHP + SQLite), through RankForge's real routes, with a real
  Application Password — 8/8 (see `LIVE_WORDPRESS_VALIDATION.md`). Remaining
  caveat: **AIOSEO-specific meta storage** was not validated live (the plugin is
  egress-blocked); AIOSEO *auto-detection* was validated live and the storage
  path is covered by the test double — verify on the first real AIOSEO customer.
- **Live Google OAuth + GSC/GA4 API — still unproven.** The code exchange, token
  refresh, and GSC/GA4 queries are unit-tested with an injected fake; the real
  handshake with Google has never run (egress restricted). RC2 mitigates the
  *dead-end* (see below) but does not prove live Google. Recommended pilot
  posture: Atlas OFF (`NEXT_PUBLIC_RF_ENABLE_ATLAS` unset).
- **Real email delivery — pluggable, not exercised.** Verification email uses a
  pluggable mailer; without `MAIL_WEBHOOK_URL` it is **logged-only** (honestly
  reported), so no real message is sent in this environment. Set the webhook to
  enable delivery.

## SEO-plugin write support (Yoast / Rank Math / AIOSEO)
- The active SEO plugin is auto-detected from the site's REST namespaces at
  connect time, and the meta description is written to that plugin's field
  (AIOSEO `aioseo_meta_data`, Rank Math `rank_math_description`, Yoast
  `_yoast_wpseo_metadesc`, else the native excerpt). **Every write is verified by
  read-back**, so a field the plugin does not expose for REST writes surfaces as
  `verify_failed` — never a false success.
- **Yoast caveat:** `_yoast_wpseo_*` are protected meta keys; on a stock install
  they may not be writable via the core REST `meta` object without registering
  them (`show_in_rest` + `auth_callback`). Where that is the case the deployment
  is honestly reported `verify_failed`. A companion snippet/MU-plugin to expose
  these keys is planned. AIOSEO and Rank Math expose their fields for REST and
  are covered by the test double; verify on the first live customer of each.
- **SEO title vs post title:** the "SEO title" edit writes the native WordPress
  post title (live-validated), not a per-plugin title override. Per-plugin title
  overrides (`rank_math_title`, `_yoast_wpseo_title`) are a planned enhancement.

## Missing features (do not exist)
- **Explicit organization creation** — an org is auto-created at signup; there is
  no create-/switch-org surface.
- **Strategy screen** — no dedicated Strategy UI; strategy is the internal
  priority/business-context engine, surfaced inline in Recommendations.
- **Roadmap generation** — no roadmap feature of any kind.
- **CEO / executive briefing** — does not exist as a distinct feature. The only
  briefing is the Atlas *morning briefing*; the Operator "Executive metrics" grid
  is a KPI panel, not a briefing.
- **Onboarding / first-run guidance** — no wizard, checklist, or tour.
- **Password reset / account recovery** — not present (follows from no email).

## Built but not surfaced to the user (hidden / not wired)
- **GSC data in Atlas** — fetched into `snapshot.gsc` but never rendered.
- **GA4 data in Atlas** — fetched into `snapshot.analytics` but never rendered.
- **Atlas change-detection** — `assembleAtlas` supports a prior snapshot for
  "what changed overnight," but the route never persists/passes one, so the
  threats/opportunities-from-diffs are always empty.

## Operational / robustness limitations
- **Rate limiting — expanded at RC2.** Now covers signup, login, oauth-start,
  scans, crawl, WordPress connect/deploy, recommendations, and operator execute.
- **In-process rate limiter** — per-instance; limits weaken under horizontal
  scaling (needs a shared Redis/Postgres store). Unchanged.
- **Email verification is non-blocking** — accounts work before verifying (a
  banner nudges). Deliberate for the guided pilot; tighten to blocking for
  open self-serve.
- **No query-level DB retry** — a Postgres connection loss surfaces as a 500 for
  in-flight requests. (The pool now survives a restart without crashing — RC1
  fix — and recovers on the next query, but individual requests fail during the
  blip.)
- **OAuth state is not single-use** — replay is bounded only by a 10-minute
  window (low practical risk; redemption also needs Google's one-time code + the
  originating session).
- **File store is dev/test only** — production requires PostgreSQL; the file
  store would lose data on Vercel's ephemeral disk (enforced by `env.ts`).

## Scope / data honesty limitations (by design, stated for clarity)
- RankForge never reports rankings, traffic, ROI, or AI-visibility it has not
  observed; when a source is disconnected the value is **Unavailable**, not a
  guess. This is a deliberate limitation, not a defect — but it means a
  brand-new project's Atlas tab shows mostly "unavailable," which can read as
  "empty/broken" without a connected data source.
- The multi-agent "team" is a set of analytical **roles over one evidence
  pipeline**, not independent AI models.

## What IS proven (for contrast — see RC1_READINESS.md Section 1)
Auth, tenant isolation, crawl→recommendations, triage + editable priority, the
WordPress deploy/verify/rollback *logic*, operator safety gating, evidence
grading, encrypted credentials, and Postgres persistence — all covered by the
284-test suite and, for persistence, verified on real PostgreSQL 16.
