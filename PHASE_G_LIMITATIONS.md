# Phase G — Live-Integration Limitation Statement

Mission Atlas is delivered as a **disconnected-by-default external-intelligence
architecture**. This document states, explicitly and without hedging, what has
and has not been validated, so no reader mistakes the architecture for a
live-integrated product.

## Not tested (because no real external provider was reachable)

In this environment outbound network access is restricted to GitHub + package
registries. Therefore, against real third-party services, the following were
**NOT** exercised:

- **Live third-party authentication** — no real OAuth/API-key handshake with
  GSC, GA4, Semrush, Ahrefs, Majestic, SE Ranking, or any AI-search engine was
  performed.
- **Live pagination** — real multi-page result traversal was not run.
- **Live rate limits** — real provider throttling / backoff was not observed.
- **Live provider schema compatibility** — real response payloads were not
  parsed; only the internal normalized contracts were.
- **Production credential activation** — remains **gated**: there is no
  encrypted credential store for external providers yet (see below).

## What IS proven

1. **Architecture proven** — the connector contract (`Provider`,
   `ProviderOutcome`, `Observation`), the evidence-grading atom, competitor
   persistence, the external knowledge graph, change detection, and the morning
   briefing are implemented and type-checked.
2. **Mocked behavior proven** — connected / disconnected / error / rate-limited /
   unauthorized / partial / credential-rotation are all exercised against the
   Mock/Null providers (`tests/external.test.ts`, `tests/atlas-review.test.ts`).
3. **PostgreSQL persistence proven** — `Competitor` CRUD + migration `003` +
   the store conformance contract run against real PostgreSQL 16.
4. **Deployment proven** — `next build` compiles and the Vercel preview deploys.
5. **Live provider behavior UNPROVEN** — as enumerated above.

## Credential storage status — UPDATED in Phase H (now built)

> **Update (Phase H):** the encrypted external-credential store and the Google
> connect flow described below as "not built" now exist. See
> `PHASE_H_GOOGLE_AND_FIXES.md`. OAuth token bundles are AES-256-GCM encrypted
> (`encryptSecret`), stored per `(project, kind)` in `rf_provider_connections`
> (migration `004`), never returned by an API or logged, and Search Console /
> Analytics resolve as live providers when connected. What remains unproven is
> only the **live Google handshake against Google's servers** (blocked by this
> environment's egress) — the flow is unit-tested end-to-end with an injected
> fake and goes live when `GOOGLE_CLIENT_ID`/`SECRET` are set on Vercel.

*(Original Phase G statement, retained for the record:)* There was **no
encrypted credential store for external providers**. The `ProviderConfig.credential`
field existed in the type system and drove the mock's `unauthorized` /
`connected` behavior, but no external credential was persisted, serialized into a
snapshot, returned by an API, or logged — because no such storage or connect
endpoint existed yet. The AES-256-GCM secret encryption used for WordPress
app-passwords (`lib/foundation/crypto.ts`) was named as the approved mechanism to
reuse when this was built — and Phase H reused exactly that.

## Recommended first provider for controlled live validation

**Google Search Console (GSC).** Rationale:

- **Read-only** — no write risk to the user's site or search presence.
- **First-party** — the user authorizes access to their own property; no
  third-party data-licensing concerns.
- **Highest evidence value** — queries ↔ landing pages ↔ CTR / position /
  impressions / clicks is the single richest source for tying recommendations to
  real search behavior (§4).
- **Well-bounded schema** — a small, stable API surface to validate pagination,
  date-range handling, and rate limits against.

The controlled validation sequence would be: encrypted credential storage →
`GscProvider` real client behind the existing `SearchConsoleProvider` interface
→ OAuth connect flow → one authorized property → verify observed/partial/stale
grading against real data. **This work is not started and must not begin during
this review.**

## Bottom line

Mission Atlas is safe to merge **as a disconnected-by-default architecture**:
every external reading is honestly `unavailable` with a reason, no external
metric is fabricated, tenant isolation and evidence grading are enforced and
tested, and the internal product is unaffected. It is **not** a validated live
integration, and this document is the record of that boundary.
