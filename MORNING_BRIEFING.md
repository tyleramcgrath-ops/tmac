# Morning Briefing (Phase G §9)

One concise briefing, generated from ONLY the external data that is actually
available and graded. It never fabricates: when nothing is connected it says so
and points at what to connect, while the internal audit stays fully functional.

## Shape (`external/briefing.ts`)

```ts
interface MorningBriefing {
  date
  headline
  yesterday: BriefingItem[]        // recent movement
  overnight: BriefingItem[]        // fresh changes
  newOpportunities: BriefingItem[]
  newThreats: BriefingItem[]
  recommendedMission                // the single next action
  evidenceSummary: Record<grade, number>   // how much is observed vs unavailable
  confidence: number | 'unknown'
}
interface BriefingItem { title; detail; evidence; confidence }
```

Every item carries its `evidence` (grade + source) and `confidence`, so the
reader always knows whether a line is an observation, an import, an estimate, or
a gap.

## How it is assembled

From the atlas snapshot's **available** signals only:

- **Ranking changes** (GSC) → a query that dropped ≥ N positions is a threat; a
  query that rose is an opportunity. (In GSC a higher position number is worse,
  so a positive delta = a drop → threat.)
- **AI citations** → a newly-lost citation is a threat; a newly-gained one an
  opportunity.
- **AI competitor citations** → a query where a competitor is cited and we are
  not becomes a "missing-citation gap" threat, graded `observed`.
- **Backlink / other changes** → surfaced under overnight movement.

Only **significant** changes reach the briefing (see change detection); noise is
filtered out — the §9/§8 requirement "surface only meaningful changes."

## Honest degradation (the important part)

When no external source is connected — the state in this environment — the
briefing does not invent a story. It returns:

- **headline:** *"No external data sources connected — external intelligence is
  unavailable. Internal audit remains fully available."*
- **recommendedMission:** *"Connect Search Console, Analytics (GA4), a backlink
  provider, and at least one AI-search engine to unlock competitor, backlink,
  and AI-visibility intelligence. Until then, work the internal
  recommendations, which need no external data."*
- **confidence:** `unknown` (there is nothing to be confident about).
- **evidenceSummary:** every provider counted under `unavailable`.

This is the discipline the whole phase rests on: an empty briefing is reported as
empty, with a path forward — not padded with fabricated threats and
opportunities.

## Confidence in the briefing itself

When data *is* present, briefing confidence is proportional to how much of it is
genuinely observed/imported vs unavailable:

```
confidence = round( (observed + imported) / (all graded items) × 100 )
```

So a briefing built mostly from live data reads high-confidence; one built from
mostly-unavailable data reads low — and one built from nothing reads `unknown`.

## Surfaced

The Atlas tab renders the briefing at the top: headline, recommended mission,
threats and opportunities (each with a grade badge), and the evidence-grade
tally — so the first thing a user sees each day is an honest, evidence-graded
team briefing, or an honest "connect your sources" prompt.

## Tested

`tests/external.test.ts`: the disconnected briefing produces the "no external
data connected" headline, a "connect" mission, and `unknown` confidence; a
briefing built from observed AI data surfaces a "competitor cited, we are not"
threat with `grade: 'observed'`.
