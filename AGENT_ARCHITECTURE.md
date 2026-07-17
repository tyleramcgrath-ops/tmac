# Agent Architecture (Phase F)

RankForge is now a coordinated team of specialized AI agents, not a single
decision-maker. The user should feel they hired an SEO agency: a Scout who only
gathers facts, specialists who each own one discipline, a skeptic who challenges
everyone, and an Operator who only deploys approved work.

## The one design decision that makes this honest

**Agents are ROLES over the single issue-evaluation pipeline** hardened in D.6
(P3) — not nine parallel rule engines. If each agent re-ran its own rules we
would reintroduce the exact "two disagreeing engines" defect D.6 just closed,
and the audit/recommendations could contradict each other again. Instead:

- One pipeline (`lib/foundation/reco/`) produces the canonical findings, each
  with a **typed** `ruleId / ruleCategory / businessContext / pageType` (D.6 P2).
- The agent layer (`lib/foundation/agents/`) **coordinates over those findings**:
  it assigns each an owner, gathers multiple agents' stances, runs QA, and
  synthesizes a consensus with a provenance chain.

So "multiple specialized agents independently analyze the same project" is real
— but they analyze one shared, evidence-backed set of facts, which is what keeps
their conclusions comparable and their disagreements meaningful.

## The 9 agents (`registry.ts`)

| Agent | Owns | Never does |
|---|---|---|
| **Scout** | Crawl, discovery, evidence, technical extraction | Never prioritizes or recommends — facts only |
| **Strategist** | Business value, money pages, roadmap, opportunity ranking | Never deploys |
| **Technical SEO** | Crawlability, indexing, canonicals, robots, sitemaps, schema, redirects | Never rewrites content or invents links |
| **Content Strategist** | Content gaps, refreshes, cannibalization, internal links, clusters, EEAT | Never touches indexation directives |
| **Local SEO** | Locations, GBP, NAP, service areas, local schema | Never activates for non-local businesses |
| **Authority Builder** | Backlink opportunities, digital PR, linkable assets, authority gaps | Never fabricates outreach or metrics |
| **CRO Advisor** | CTAs, forms, trust signals, conversion friction, landing pages | Never trades away indexability without flagging |
| **Operator** | Safe deploy, verification, rollback, audit trail | Never invents fixes — only deploys approved work |
| **QA Reviewer** | Challenge everyone else | Never rubber-stamps |

## Ownership: how a finding gets an agent

Ownership rides on the typed rule category (no string parsing):

```
indexability | technical | schema | accessibility  → Technical SEO
content | links                                     → Content Strategist
```

Cross-cutting agents attach additional stances by context, not category:

- **Scout** is always the discoverer (the facts on the finding are its report).
- **Strategist** always weighs business priority.
- **CRO Advisor** weighs in when the finding is on a money page.
- **Local SEO** weighs in only for a local business on a location/contact page.
- **QA Reviewer** always challenges.

This is why the same finding can be analyzed by 3–6 agents at once — the multi-
agent value the phase asks for — without any of them re-deriving the finding.

## The atomic unit: a stance (`types.ts`)

Every agent expresses its position as an `AgentStance`:

```ts
{ agentId, position: 'support'|'concern'|'neutral', confidence,
  evidence: string[], assumptions: string[], note }
```

`evidence` is never invented; `assumptions` are the raw material QA attacks. A
recommendation's full multi-agent view is just the set of stances on it, plus
the consensus and provenance derived from them (`RecommendationCoordination`).

## Separation of duties (why this is trustworthy)

Discovery (Scout) is separate from judgement (specialists) is separate from
challenge (QA) is separate from execution (Operator). No single agent both
proposes and approves; no agent both analyzes and deploys. This is the same
principle that makes a real agency's four-eyes review trustworthy, encoded as
distinct modules with `neverDoes` constraints in the registry.

## Data flow

```
crawl ─▶ Scout (facts) ─▶ one findings pipeline (typed recs)
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                        ▼
   owner analyzes        CRO / Local / Strategist add stances   QA challenges
        └───────────────────────────┬───────────────────────────┘
                                    ▼
                            Consensus Engine  ──▶  agree / disagree /
                                    │                needs-review / human-required
                                    ▼
              Coordinated recommendation (stances + consensus + provenance)
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
             Task Orchestrator                 Agent Memory
        (inter-agent task chain)          (learn from outcomes)
```

## Honesty invariants (enforced + tested)

- **Authority** reports off-site authority (backlinks, brand mentions) as
  **UNKNOWN** — RankForge has no external backlink source in this environment,
  so nothing is estimated. It only surfaces on-site linkable-asset candidates.
- **Local** stands down entirely for non-local businesses.
- Every finding still traces to real crawl evidence; agents add perspective, not
  fabricated data.

## Where it lives / how it surfaces

`lib/foundation/agents/{types,registry,stances,qa,consensus,orchestrator,tasks,memory,metrics,service}.ts`.
Surfaced through the **existing** Recommendations tab (no new dashboard): the
agent team strip, each recommendation's consensus verdict + provenance chain +
surfaced disagreements + expandable stances. See `PHASE_F_REPORT.md`.
