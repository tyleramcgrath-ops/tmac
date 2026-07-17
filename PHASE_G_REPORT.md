# Phase G — Mission Atlas (Report)

RankForge now understands not only the website itself but the external
environment influencing its SEO — competitors, AI-search visibility, backlinks,
Search Console, analytics, trends, and change — behind a provider architecture
that grades every datum and degrades gracefully when disconnected.

## What was built

`lib/foundation/external/`:

| Module | Purpose |
|---|---|
| `types.ts` | EvidenceGrade + `Observation<T>` atom; the `Provider` / `ProviderOutcome` connector contract |
| `providers/shared.ts` | one config → uniform status + failure outcomes for all kinds |
| `providers/ai-search.ts` | ChatGPT/AIO/Perplexity/Gemini/Claude abstraction (Null + Mock) |
| `providers/backlinks.ts` | Semrush/SE Ranking/Ahrefs/Majestic + manual CSV import |
| `providers/search-console.ts` | GSC (queries/CTR/position/impressions/clicks) |
| `providers/analytics.ts` | GA4 (conversions/engagement/revenue-if-available/events) |
| `providers/trends.ts` | trend source (growth/seasonality/emerging) |
| `competitors.ts` | overlap computed from crawls, graded per dimension |
| `knowledge-graph.ts` | external KG; evidence on every node/edge |
| `change-detection.ts` | significant-only change surfacing |
| `briefing.ts` | morning briefing from available graded data |
| `service.ts` | `assembleAtlas` + `disconnectedProviderSet` (the default here) |

Persistence: `Competitor` entity + store CRUD (both impls via the P7 column-map)
+ `migration 003` + store conformance coverage — verified on real Postgres 16.

API + UI (no separate dashboard app): `competitors` + `atlas` routes; client
DTOs; a new **Atlas** tab in the existing project workspace showing the morning
briefing, provider states, competitor overlap, and an evidence-grade badge on
every value.

Deliverables: `MISSION_ATLAS.md`, `EXTERNAL_INTELLIGENCE.md`,
`AI_VISIBILITY_ENGINE.md`, `COMPETITOR_ENGINE.md`, `CONNECTOR_ARCHITECTURE.md`,
`MORNING_BRIEFING.md`, this report.

## Testing matrix (`tests/external.test.ts`, 16 cases)

The phase's required matrix, all covered:

| Requirement | Covered by |
|---|---|
| Mock providers | connected `observed` reads across kinds |
| Real providers | same interface a real client implements (Mock stands in; egress-blocked here) |
| Disconnected providers | `Null*Provider` + `disconnectedProviderSet` → `unavailable` |
| Provider failures | `error` outcome + `error` status |
| Partial responses | `partial: true`, truncated payload |
| Rate limiting | `rate-limited` outcome + status |
| Credential rotation | `rotate()` flips `unauthorized` → `connected` |

Plus: CSV manual import (graded `imported`), competitor overlap grading
(observed/estimated/unavailable), change-detection significance + no-change-when-
unobservable, briefing honest degradation, atlas full-snapshot degradation, and
KG evidence on every node/edge.

Full suite **223 pass** (8 gated skips); `tsc --noEmit` clean; `next build`
compiles; migrations `001`–`003` + store conformance verified on real
PostgreSQL 16.

## Honest status of external connectivity

In this environment, outbound network access is restricted to GitHub + package
registries, so **no real third-party provider (Semrush, GSC, GA4, ChatGPT,
Perplexity, …) is reachable.** Per the brief's explicit instruction — *"If
integrations or network access are unavailable, design the architecture and
gracefully degrade"* — Mission Atlas ships as a complete, tested connector
architecture that **defaults to the disconnected provider set**. Every external
reading is honestly `unavailable` with a reason; the morning briefing says so and
lists what to connect; the internal audit/recommendations/operator/agents remain
fully functional. Connecting a real credential behind any provider interface
upgrades that reading from `unavailable` to `observed`/`imported` with **zero
change** to the engines, the briefing, the knowledge graph, or the UI.

This is not a limitation hidden behind a mock — it is the design the brief asked
for: the value distinction (Observed / Imported / Estimated / Unavailable) is
enforced at every stage, and "Unavailable" is a first-class, explained outcome
rather than a fabricated number.

## Definition of Done — checklist

> RankForge understands not only the website itself, but also the external
> environment influencing its SEO performance.

✅ The full external environment (competitors, search results, AI visibility,
backlinks, GSC, GA4, trends, industry change) is modeled as graded observations
behind provider interfaces, assembled into one `AtlasSnapshot` + morning
briefing, and surfaced in the Atlas tab.

> It should gracefully distinguish Observed / Imported / Estimated / Unavailable
> at every stage. Never fabricate external intelligence.

✅ The `EvidenceGrade` rides with every value from provider → observation →
overlap → knowledge graph → change → briefing → UI badge. Disconnected/failed
providers degrade to `unavailable` with reasons. No external metric is ever
invented — the grep test is `external/**` contains no fabricated constants, and
`revenue`/`authority`/AI-visibility are `null`/`unavailable` rather than guessed.

## Where it goes next (honest, additive)

- **Real provider clients** behind the existing interfaces (a network-enabled
  deployment) — no core change.
- **Snapshot persistence** so change detection compares to a stored prior
  (currently compares to a passed-in prior; the store seam is ready).
- **Competitor crawling** through the D.6 SSRF guard once outbound fetch is
  permitted — upgrades overlap from `unavailable` to `observed`.

None require redesign: the connector contract and the evidence-grade atom are the
stable core, exactly so these can be added by plugging in, not rewiring.
