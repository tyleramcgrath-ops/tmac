# Phase F — Multi-Agent SEO Operating System (Report)

RankForge is now a coordinated team of 9 specialized agents. A crawl produces
recommendations that were discovered, analyzed, challenged, prioritized, and
(when approved) deployed and verified by named agents — with disagreement
surfaced and evidence winning. The user sees a team, not a tool.

**No disconnected features. No new dashboards.** The multi-agent layer is
rendered inside the existing Recommendations tab, over the single D.6 findings
pipeline.

---

## What was built

`lib/foundation/agents/` — the coordination layer over the one issue-evaluation
pipeline (P3-safe by construction; agents never re-run rules):

| Module | Role |
|---|---|
| `types.ts`, `registry.ts` | 9 agents, narrow responsibilities, separation of duties, category→owner map |
| `stances.ts` | per-agent perspective builders (Scout/owner/Strategist/CRO/Local) |
| `qa.ts` | the skeptic — challenges every finding (`QA_AGENT.md`) |
| `consensus.ts` | agree / disagree / needs-review / human-required (`CONSENSUS_ENGINE.md`) |
| `orchestrator.ts` | coordinates all agents → stances + consensus + provenance + reports |
| `tasks.ts` | inter-agent task chain (`TASK_ORCHESTRATOR.md`) |
| `memory.ts` | per-agent learning from outcomes (`AGENT_MEMORY.md`) |
| `metrics.ts` | consensus quality + agreement + honest 'unknown' where no ground truth |
| `service.ts` | coordinate at read time so provenance is never stale |

Wiring: recommendations `GET` returns coordinated recs + agent reports + memory +
metrics; scan completion surfaces the consensus breakdown; `client.ts` DTOs +
`_components/AgentPanel.tsx` render it in the existing tab.

Deliverables: `AGENT_ARCHITECTURE.md`, `CONSENSUS_ENGINE.md`,
`TASK_ORCHESTRATOR.md`, `AGENT_MEMORY.md`, `QA_AGENT.md`, this report.

---

## Definition of Done — checklist

> A crawl should produce coordinated recommendations from multiple specialized agents.

✅ Every recommendation is coordinated by 3–6 agents (owner + Scout + Strategist,
plus CRO on money pages and Local for local businesses) and challenged by QA.

> The user should be able to see who discovered / analyzed / challenged / approved / deployed / verified the issue.

✅ Each recommendation carries a full `provenance` chain rendered as a visible
row: `Discovered: Scout → Analyzed: <owner> → Challenged: QA Reviewer →
Prioritized: Strategist → Approved: human → Deployed: Operator → Verified:
Operator`. Stages not yet reached are shown struck-through.

> No recommendation should appear without traceable ownership and evidence.

✅ Coordination is attached to every recommendation; provenance always names the
discoverer (Scout), analyzer (category owner), and challenger (QA). Evidence is
the finding's real crawl facts — asserted in the route test.

---

## User experience (in the existing Recommendations tab)

- **Agent team strip** — all 9 agents, active/standby, findings owned, one-line
  summary, and any honest limitation (e.g. Authority's "off-site authority not
  assessed"). Consensus tally across all findings.
- **Per recommendation** — a consensus chip (agree / disagree / needs-review /
  human-required) with its reason; the provenance chain; a red "Disagreement
  surfaced" block when agents conflict; and an expandable list of every agent's
  stance (position, confidence, note, assumptions).

The user sees who made the recommendation, who agreed, who disagreed, why, the
evidence, the confidence, approval status, deployment status, verification, and
learning history — all in one place, no extra screens.

---

## Success metrics (`metrics.ts`) — honest about what is measurable

| Metric | Source | Note |
|---|---|---|
| Agent agreement rate | consensus verdicts | `agree / total` |
| Disagreement rate | consensus | surfaced conflicts |
| Human-required rate | consensus | irreversible / hard-QA-block |
| Consensus quality | consensus | decisive verdicts (agree + human-required) / total |
| Human agreement | statuses | accepted / (accepted + rejected) |
| User override rate | history | human changed the agent's proposal |
| Verification success | deployments | verified / (verified + verify-failed) |
| False-positive (proxy) | statuses | user-rejected / total (labeled a proxy) |
| Precision (proxy) | statuses | 1 − false-positive proxy |
| **Recall, false-negatives** | — | **reported as `unknown`** — require labeled ground truth we do not have; never fabricated |

Precision/recall in the true sense need a labeled corpus. RankForge doesn't have
one in this environment, so those are reported honestly as `unknown` rather than
invented — consistent with every prior phase.

---

## Honesty invariants (enforced + tested)

- **Authority Builder** reports off-site authority (backlinks, brand mentions,
  referring domains) as **UNKNOWN** — there is no external backlink data source
  here, so nothing is estimated. It only identifies on-site linkable-asset
  candidates. (`agents.test.ts` asserts the limitation carries `confidence:
  'unknown'`.)
- **Local SEO** stands down entirely for non-local businesses.
- Agents add perspective over real, evidence-backed findings — none fabricates
  data, outreach, or metrics.

---

## Validation

- `tests/agents.test.ts` — 17 cases: QA challenge behavior, all four consensus
  outcomes, dangerous-class escalation, full provenance chain, agent
  participation + honesty invariants, task chain routing, memory learning,
  metrics honesty.
- `tests/scan-rec-routes.test.ts` — route-level: the API returns a 9-agent team,
  consensus metrics, and a traceable provenance chain (Scout discovered, QA
  challenged) on every recommendation, and the P3 single-source invariant still
  holds.
- Full suite **207 pass** (8 gated skips); `tsc --noEmit` clean; `next build`
  compiles.

---

## FINAL QUESTION

> Would this architecture scale to dozens of specialized AI agents without major
> redesign?

# YES

### Architectural evidence

1. **Agents are data + small pure functions over one pipeline, not forked
   engines.** Adding an agent is: (a) a `registry.ts` entry, and (b) a stance
   builder (`(rec) => AgentStance | null`) wired into the orchestrator's stance
   list. It reads the *same* typed findings every other agent reads. Going from 9
   to 30 agents adds 30 stance functions and 30 registry rows — no new pipeline,
   no schema migration, no change to the findings engine. This is the property
   that D.6's "single source of truth" bought us: because there is one findings
   pipeline, agents compose over it instead of multiplying it.

2. **The unit of collaboration is uniform.** Every agent speaks in exactly one
   shape — `AgentStance { position, confidence, evidence, assumptions, note }`.
   The consensus engine, the UI, the provenance chain, and the metrics all
   operate on `AgentStance[]` of arbitrary length. A 3-agent finding and a
   30-agent finding flow through identical code; the consensus rule
   (evidence-weighted, escalate-on-conflict) does not care how many stances it
   receives.

3. **Consensus cost is linear and order-independent.** `computeConsensus` is O(n)
   in the number of stances and depends only on their contents, not their
   identities or arrival order — so more agents mean more evidence, not more
   coupling. There is no N² agent-to-agent negotiation to blow up.

4. **Separation of duties is enforced by construction, so more agents don't
   erode trust.** Discovery (Scout), judgement (specialists), challenge (QA), and
   execution (Operator) are distinct roles with `neverDoes` constraints. Adding a
   tenth specialist cannot accidentally gain deploy rights or bypass QA — the
   orchestrator always routes through QA and consensus regardless of how many
   proposers exist.

5. **Ownership rides on typed rule identity (D.6 P2), not string matching.** New
   agents claim new categories by extending one `CATEGORY_OWNER` map. There is no
   regex, no title parsing, no per-agent rule duplication to keep in sync — the
   exact debt that would make a large agent fleet unmaintainable was already
   removed.

6. **The task and memory layers are already fleet-shaped.** `AgentTask` records
   `fromAgent → toAgent` for *any* pair, so a new agent can hand off to or
   receive from existing ones with no schema change. Memory is keyed by
   `agentId`, derived from durable per-issue history (stable identity, P1), so a
   new agent simply starts accumulating its own reliability and lessons.

### The honest caveat (why "YES", not "YES, trivially")

Two things scale *linearly today but would benefit from structure* well before
"dozens":

- **Overlapping ownership / cross-agent input** is currently expressed by
  hand-wired conditions in the orchestrator (CRO on money pages, Local on local
  pages). At ~dozens of agents this wants a small declarative capability
  registry ("this agent contributes when predicate P holds") rather than an
  `if` per agent. That is an *additive refactor of one file*, not a redesign —
  the stance/consensus contract does not change.

- **Read-time coordination** recomputes all stances on every recommendations
  fetch. That is fine at today's scale and correctness-first (never stale), but
  with dozens of agents over thousands of recommendations it would want caching
  or precomputation — the same "projected columns / caching" scaling investment
  the D.6 review already flagged, now applying to coordination. Again additive.

Neither touches the core contract (`AgentStance` → consensus → provenance).
Because agents are composable functions over one shared, typed, evidence-backed
pipeline — not independent engines — the architecture absorbs dozens of agents by
addition, not by rework. **YES.**
