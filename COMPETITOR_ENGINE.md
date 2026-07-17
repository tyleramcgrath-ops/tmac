# Competitor Engine (Phase G §1)

Persists tracked competitors and computes overlap **from real crawls** — never
inventing competitor metrics. Each overlap dimension carries its own evidence
grade, because they don't all come from the same place.

## Persistence

`Competitor` is a first-class entity (`lib/foundation/types.ts`), stored per
project with the same JSONB + projected-key-column shape as every other entity,
so the D.6 P7 column-map and the store conformance contract cover it
automatically:

- Store methods: `createCompetitor / updateCompetitor / listCompetitors /
  getCompetitor / deleteCompetitor` (both file + Postgres impls).
- `migration 003` adds `rf_competitors` with a unique `(project_id, domain)`
  index (one competitor per domain per project).
- API: `GET/POST/DELETE /api/projects/:id/competitors` (domain normalized,
  deduped, audited, tenant-scoped).
- Verified on real Postgres 16 via the conformance contract.

## Overlap — computed and graded (`external/competitors.ts`)

Seven dimensions, each an `Observation<number>` with its own grade:

| Dimension | How | Grade |
|---|---|---|
| **topic** | Jaccard of page-type sets of both crawls | observed |
| **service** | Jaccard of service/product/pricing slugs | observed |
| **entity** | Jaccard of JSON-LD `@type` sets | observed |
| **content** | Jaccard of title token sets | observed |
| **business** | inferred from topic + service similarity | **estimated** |
| **authority** | needs backlink data for both domains | **unavailable** unless a backlink provider supplied both |

This is the crucial honesty point: overlap is not one number with one
confidence. Topic/service/entity/content are **observed** from crawl data;
business overlap is explicitly an **estimate** (labeled as inference, not a
market measure); authority overlap is **unavailable** without backlink data. The
UI badges each dimension so the user sees exactly which is which.

## Graceful degradation

When the competitor's site cannot be crawled — which is the case in this
environment (outbound fetch is blocked) — `computeOverlap(ours, null, now)`
returns **every dimension as `unavailable`** with a clear reason:

> "Competitor site was not crawled (outbound fetch blocked or not connected).
> Overlap cannot be observed."

and, for authority:

> "Authority overlap needs backlink data for both domains — no backlink provider
> connected."

The system **explains why** rather than guessing — the §1 requirement "When
unavailable, explain why. Never invent competitor metrics."

## When it can crawl (architecture ready)

The moment competitor crawling is available (real network, or a provided crawl),
the same function returns observed topic/service/entity/content overlap and an
estimated business overlap — no change to the persistence, API, KG, or UI. The
SSRF guard from D.6 P4 governs any live competitor fetch, so competitor crawling
inherits the same safety.

## Feeds the knowledge graph

Each competitor becomes a `competitor` node (graded `imported` — a human added
it) with a `competes-with` edge to the brand weighted by business overlap and
stamped with that overlap's evidence grade (see `EXTERNAL_INTELLIGENCE.md`).

## Tested

`tests/external.test.ts` + `store-conformance.test.ts`: persistence round-trip
on both stores; every dimension `unavailable` (with reasons) when the competitor
isn't crawled; correct observed/estimated/unavailable grading when both sites are
crawled; the competitor node in the KG graded `imported`.
