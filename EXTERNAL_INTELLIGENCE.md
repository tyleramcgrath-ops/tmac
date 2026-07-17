# External Intelligence (Phase G §4–§8)

Covers the remaining external capabilities beyond competitors (§1) and AI
visibility (§2): Search Console fusion, Analytics fusion, the trend engine, the
external knowledge graph, and change detection. All obey the same rule — graded
data, never fabricated, degrade gracefully.

## §4 — Search Console fusion (`providers/search-console.ts`)

Provider mapping GSC's core surface:

```ts
interface GscRow { query; page; clicks; impressions; ctr; position }
```

This is the primary evidence source for tying a recommendation to real search
data (queries ↔ landing pages ↔ CTR/position/impressions/clicks). Live GSC data
grades `observed`; disconnected → `unavailable`. Recommendations reference GSC
evidence when it exists and say "unavailable" when it doesn't — never a made-up
impression count.

## §5 — Analytics fusion (`providers/analytics.ts`)

GA4 provider surfacing conversions, engaged sessions, key events, and revenue —
with the honesty guard that **revenue is `null` unless the property actually
reports it** (very common), never `0`-as-fact. Funnels/engagement map to the
same graded observations. Business metrics are never fabricated: a disconnected
GA4 degrades to `unavailable`, and a property without revenue reporting yields
`revenue: null`, not an invented figure.

## §6 — Trend engine (`providers/trends.ts` + change detection)

Provider over an industry-trends source. Each `TopicTrend` carries a relative-
interest series, a computed direction, a change percentage, and an `emerging`
flag. The engine surfaces **only meaningful changes** — the trend feeds change
detection, which applies a significance threshold before anything reaches the
briefing. Disconnected → `unavailable`; nothing is extrapolated from missing
data.

## §7 — External knowledge graph (`knowledge-graph.ts`)

Extends the internal model with external nodes and the search relationships
between them. **Everything references evidence** — a node or edge cannot exist
without an `Evidence` stamp, and its grade says how we know it:

| Node kind | Example | Typical grade |
|---|---|---|
| brand | our domain | observed (our crawl) |
| competitor | rival.com | **imported** (a human added it) |
| entity | "CRM" | observed (from an AI answer) |
| topic / product | — | observed / imported |

| Edge kind | Meaning | Evidence |
|---|---|---|
| competes-with | brand ↔ competitor, weighted by business overlap | the overlap's grade (estimated/unavailable) |
| mentions-entity | brand → entity seen in an AI answer | observed (`ai:<engine>`) |
| cited-by-ai | brand cited by an AI engine | observed |

Because edges carry the overlap's grade, an edge built from an `unavailable`
overlap is itself marked as resting on unavailable evidence — the graph never
launders an unknown into a fact.

## §8 — Change detection (`change-detection.ts`)

Compares two external snapshots and surfaces **only significant** changes across
six categories: competitor, content, schema, backlink, AI-citation, ranking.

- `detectRankingChanges` — a query whose GSC position moved ≥ N places.
- `detectBacklinkChanges` — referring-domain movement ≥ N.
- `detectAiCitationChanges` — a gained or lost AI citation.
- `numericChange` / `significantChanges` — the generic threshold machinery.

Crucial honesty property: **when a prior snapshot or the new data is
unavailable, no change is emitted** — you cannot detect a change you cannot
observe, so the system reports nothing rather than a false "no change" or an
invented delta. Only changes past their threshold reach the morning briefing.

## The through-line

Every one of these consumes and produces graded `Observation`s. The
recommendation and strategy engines never import a provider — they read the
`AtlasSnapshot`. So the entire external layer can be connected, disconnected,
rate-limited, or partially available, and the worst that happens to the core is
that some observations read `unavailable`. See `CONNECTOR_ARCHITECTURE.md`.

## Tested

`tests/external.test.ts`: ranking-change significance (5-place move flagged,
1-place ignored), no-change-when-unobservable, AI-citation change, KG evidence on
every node/edge, and the full atlas snapshot degrading every §4–§8 reading to
`unavailable` under the disconnected default.
