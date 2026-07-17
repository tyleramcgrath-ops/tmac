# Connector Architecture (Phase G §10)

> Everything external must plug into provider interfaces. No provider-specific
> logic inside recommendation or strategy engines.

This is the structural backbone of Mission Atlas. It is what lets RankForge stay
honest (graded data, graceful degradation) and lets real providers be added
without touching the core.

## The contract (`external/types.ts`)

Every provider implements a tiny, uniform interface:

```ts
interface Provider {
  readonly id: string
  readonly kind: ProviderKind          // ai-search | backlinks | search-console | analytics | trend | competitor
  status(): ProviderStatus
}
```

…and a domain method that returns a single envelope shape:

```ts
type ProviderOutcome<T> =
  | { ok: true;  data: T; grade: 'observed'|'imported'|'estimated'; source; fetchedAt; partial? }
  | { ok: false; reason: 'disconnected'|'error'|'rate-limited'|'unauthorized'; detail }
```

Because the *outcome* is uniform, the assembly layer converts any provider's
result into a graded `Observation<T>` with one function (`toObservation`), and
the consuming engines never see a provider payload — only a graded observation.

## Uniform degradation (`external/providers/shared.ts`)

All six provider kinds derive their status and failure outcomes from **one**
`ProviderConfig` via `statusFor()` and `guard()`. So every provider degrades
identically:

- not connected → `disconnected`
- bad/rotated-out credential → `unauthorized`
- provider throttling → `rate-limited`
- upstream failure → `error`

There is no per-provider guesswork about what "unavailable" means — it is one
code path, which is why the whole system degrades predictably.

## Null + Mock per kind

Each provider kind ships two reference implementations:

- **`Null*Provider`** — the disconnected default. Every call returns
  `{ ok: false, reason: 'disconnected' }` and `status().state === 'disconnected'`.
  `disconnectedProviderSet()` wires these up; it is the default in this
  environment.
- **`Mock*Provider`** — deterministic, config-driven, for the full test matrix
  (connected / partial / error / rate-limited / unauthorized / credential
  rotation). A real Semrush/GSC/GA4/AI client would be a third implementation of
  the same interface; nothing downstream changes.

## Credential rotation

Modeled as replacing the `ProviderConfig`: `provider.rotate(newConfig)`. A
provider with a missing/stale credential returns `unauthorized`; after
`rotate({ connected: true, credential: 'fresh' })` its status flips to
`connected` and calls succeed. (Tested end-to-end.)

## The isolation guarantee (why the core stays clean)

Grep the recommendation and strategy engines (`lib/foundation/reco/**`,
`lib/foundation/agents/**`) — there is **no** import of any provider, vendor
name, or `external/providers/*`. They consume only:

- persisted `Recommendation`s (internal pipeline), and
- graded `Observation`s / the `AtlasSnapshot` (external layer).

`assembleAtlas()` is the single seam where providers are touched; it returns a
provider-free `AtlasSnapshot`. This means:

1. A new vendor is a new `Provider` implementation + a registry wire-up — no
   engine edit.
2. A provider outage can never corrupt a recommendation; it can only turn an
   observation `unavailable`.
3. Testing the engines needs no provider mocks; testing providers needs no
   engine.

## Data flow

```
real vendor key ─┐
manual CSV ──────┼─▶  Provider (observed / imported)
(nothing) ───────┘        │  ProviderOutcome<T>
                          ▼
                  assembleAtlas()  ──▶  Observation<T> (graded)  ──▶  AtlasSnapshot
                          │                                              │
                   (the only place                              consumed by UI +
                    providers exist)                            briefing + KG + engines
```

## Tested

`tests/external.test.ts` covers the required matrix against the Mock/Null
providers: connected observed reads, disconnected unavailability, error /
rate-limited / unauthorized failure modes, partial responses, and credential
rotation — plus the assembly layer producing a fully-`unavailable` snapshot from
the disconnected default, and an `observed` reading the moment one engine is
connected.
