# Mission Atlas (Phase G)

Phases A–F built RankForge's internal operating system. Mission Atlas expands it
to continuously understand the **external environment** influencing SEO
performance: competitors, search results, AI-search visibility, backlinks,
Search Console, analytics, trends, and industry change.

## The one rule that governs everything

**Never fabricate external data.** Every external datum is graded, and the four
grades are never blurred:

| Grade | Meaning |
|---|---|
| **observed** | RankForge fetched it live from a first-party source (e.g. our own crawl of a competitor's public page). |
| **imported** | A human supplied it (e.g. a Semrush/Ahrefs CSV export). |
| **estimated** | RankForge inferred it — clearly inference, not a fact. |
| **unavailable** | No data source is connected/reachable; explicitly unknown. |

This grade rides with **every** value (`Observation<T>` in
`lib/foundation/external/types.ts`), through the providers, the competitor
overlap, the knowledge graph, the change detector, and the morning briefing.
The UI badges each datum with its grade, so a user can never mistake a gap for a
fact or an import for a live reading.

## Honest environment note

In this deployment, outbound network access is restricted to GitHub + package
registries, so **real third-party providers (Semrush, GSC, GA4, ChatGPT, etc.)
are unreachable.** Per the phase brief ("if integrations or network access are
unavailable, design the architecture and gracefully degrade"), Mission Atlas is
delivered as a **complete connector architecture that defaults to the
disconnected provider set** — every external reading degrades to `unavailable`
with a clear reason, and real providers plug in behind the same interfaces with
zero change to the consuming code.

## The nine capabilities (and where they live)

| # | Capability | Module | Status |
|---|---|---|---|
| 1 | Competitor intelligence | `external/competitors.ts` + persisted `Competitor` | overlap computed from crawls, graded |
| 2 | AI-search intelligence | `external/providers/ai-search.ts` | provider abstraction (5 engines), graded |
| 3 | Backlink intelligence | `external/providers/backlinks.ts` | 4 vendors + manual CSV import |
| 4 | Search Console fusion | `external/providers/search-console.ts` | GSC provider (queries/CTR/position/…) |
| 5 | Analytics fusion | `external/providers/analytics.ts` | GA4 provider (conversions/revenue-if-available) |
| 6 | Trend engine | `external/providers/trends.ts` + change detection | significant-only |
| 7 | External knowledge graph | `external/knowledge-graph.ts` | evidence on every node/edge |
| 8 | Change detection | `external/change-detection.ts` | notify only when significant |
| 9 | Morning briefing | `external/briefing.ts` | built only from available graded data |
| 10 | Connector architecture | `external/types.ts` + `service.ts` | no provider logic in core engines |

Deep-dives: `EXTERNAL_INTELLIGENCE.md`, `AI_VISIBILITY_ENGINE.md`,
`COMPETITOR_ENGINE.md`, `CONNECTOR_ARCHITECTURE.md`, `MORNING_BRIEFING.md`, and
the wrap-up in `PHASE_G_REPORT.md`.

## Where it surfaces

A new **Atlas** tab in the existing project workspace (not a separate dashboard
app): the morning briefing, provider connection states, competitor overlap, and
an evidence-grade badge on every value. When nothing is connected — as in this
environment — the tab honestly shows the "connect these sources" briefing and
`unavailable` badges throughout, while the internal audit/recommendations/
operator remain fully functional.

## Definition of Done

> RankForge understands not only the website itself, but also the external
> environment influencing its SEO performance, gracefully distinguishing
> Observed / Imported / Estimated / Unavailable at every stage.

✅ The architecture models the full external environment; every stage carries an
explicit evidence grade; the disconnected default degrades gracefully to
`unavailable` with reasons; and nothing external is fabricated. The seam is
provider-agnostic, so connecting a real GSC/GA4/backlink/AI key upgrades the
same readings from `unavailable` to `observed` with no change to the engines
that consume them.
