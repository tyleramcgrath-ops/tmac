# AI Visibility Engine (Phase G §2)

Tracks how the brand appears in AI search — ChatGPT, Google AI Overviews,
Perplexity, Gemini, and Claude — behind one provider abstraction, with every
observation graded and never blurred.

## Provider abstraction (`external/providers/ai-search.ts`)

```ts
interface AiSearchProvider extends Provider {
  readonly engine: 'chatgpt' | 'ai-overviews' | 'perplexity' | 'gemini' | 'claude'
  probe(query: string): Promise<ProviderOutcome<AiVisibility>>
}
```

A `probe` asks one engine about one prompt and returns what it observed:

```ts
interface AiVisibility {
  engine, query,
  brandMentioned: boolean,        // did the answer mention us
  entityMentions: string[],       // entities the answer associated with the topic
  citationCount: number,          // how many times we were cited as a source
  cited: boolean,                 // were we cited at all
  competitorCitations: string[],  // competitor domains cited instead
}
```

This directly covers the §2 tracking list: brand mentions, entity mentions,
citation frequency, missing citations (`cited === false`), and competitor
citations.

## The grading rule — Observed / Estimated / Unavailable, never blurred

- **Observed** — a connected engine returned an answer we parsed. `grade:
  'observed'`, `source: 'ai:<engine>'`.
- **Estimated** — reserved for any inference layer on top (e.g. projecting
  visibility across untested queries). The engine never silently promotes an
  estimate to an observation.
- **Unavailable** — the engine isn't connected (the default here), or errored /
  rate-limited / unauthorized. The `NullAiSearchProvider` returns
  `disconnected`; `assembleAtlas` turns "no engine connected" into an
  `unavailable` AI-visibility observation with the reason.

The phase's instruction — *"Mark every observation Observed / Estimated /
Unavailable. Never blur those categories."* — is enforced by the type system:
`AiVisibility` only ever arrives inside a graded `Observation`, and the grade is
set at the single conversion seam, not scattered.

## What it feeds

- **Morning briefing** — a query where a competitor is cited and we are not
  becomes a **threat** ("missing citation gap"); a query where the brand isn't
  mentioned becomes an **opportunity**. Both carry `grade: 'observed'` so the
  reader trusts them (see `MORNING_BRIEFING.md`).
- **Change detection** — `detectAiCitationChanges` compares two snapshots and
  reports only genuine gained/lost citations (`AI_VISIBILITY` category).
- **External knowledge graph** — observed entity mentions become `entity` nodes
  and `mentions-entity` / `cited-by-ai` edges, each stamped with the engine as
  evidence.

## Honest limitation in this environment

No AI-search engine is reachable here (outbound network restricted), so AI
visibility is reported as **unavailable** end-to-end — the briefing says so and
recommends connecting an engine. When a real key is added behind the
`AiSearchProvider` interface, the same readings upgrade to `observed` with no
change to the briefing, change-detection, or knowledge-graph code.

## Tested

`tests/external.test.ts`: connected probe returns `observed` data; the Null
provider is `disconnected` and never fabricates; the briefing surfaces a
"competitor cited, we are not" threat from observed AI data with the correct
grade; AI-citation change detection flags a newly-gained citation.
