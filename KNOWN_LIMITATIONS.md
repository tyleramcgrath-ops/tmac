# RankForge RC1 — Known Limitations

An honest, complete list of what RankForge does **not** do (or has not proven) as
of RC1. Grouped by kind. Nothing here is hidden from the reader; this is the
document a support team and a pilot customer should both have.

## Unproven against live third-party services (environment-blocked)
- **Live WordPress writes.** The connect → deploy → read-back verify → rollback
  path is proven only against an in-process WordPress test double. It has never
  written to a real WordPress site. (RC1 BLOCKER for paid use — must be validated
  on real infrastructure first.)
- **Live Google OAuth + GSC/GA4 API.** The authorization-code exchange, token
  refresh, and Search Console / Analytics queries are unit-tested with an
  injected fake. The real handshake with Google has never run (sandbox egress is
  restricted to GitHub + package registries). Goes live only when
  `GOOGLE_CLIENT_ID`/`SECRET` are set and the app runs where Google is reachable.

## Missing features (do not exist)
- **Email verification** — signup creates a live, session-bearing account with no
  email confirmation.
- **Team invitations / member management UI** — roles and membership exist in the
  store and are enforced by routes, but there is no way to invite or manage
  teammates through the product. Effectively single-user per org.
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
- **Rate limiting** covers only login/signup. Scan/crawl (outbound
  amplification) and OAuth-start are uncapped.
- **In-process rate limiter** — per-instance; auth limits weaken under horizontal
  scaling (needs a shared Redis/Postgres store).
- **No query-level DB retry** — a Postgres connection loss surfaces as a 500 for
  in-flight requests. (The pool now survives a restart without crashing — RC1
  fix — and recovers on the next query, but individual requests fail during the
  blip.)
- **OAuth state is not single-use** — replay is bounded only by a 10-minute
  window (low practical risk; redemption also needs Google's one-time code + the
  originating session).
- **Deep-linkable tabs** — project tab state lives in React state, not the URL;
  refresh resets to Audit and tabs aren't shareable.
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
