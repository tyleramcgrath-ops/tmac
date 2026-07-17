# Agent Memory (Phase F)

Each agent remembers what happened to the findings it owned — so no agent
repeatedly makes the same mistake. Memory (`lib/foundation/agents/memory.ts`) is
derived **deterministically** from the durable recommendation history and
WordPress deployments RankForge already stores. No ML, no hidden state, no
fabricated confidence — the same honesty stance as the D.6 learning substrate.

## What each agent remembers (`AgentMemory`)

Grouped by the agent that primarily owns each rule category:

```ts
{
  agentId,
  totalOwned,        // findings this agent owned
  accepted,          // user accepted / it deployed / it verified
  rejected,          // user rejected or dismissed  → a mistake signal
  overridden,        // a human changed its proposal after the fact
  verified,          // read-back-verified in production
  rolledBack,        // deployed then reverted  → a strong mistake signal
  reliability,       // 0-1, (accepted + verified) / 2·total
  suggestedConfidenceNudge,  // bounded [-0.15, +0.15]
  lessons: string[]  // human-readable, e.g. "2 owned changes were rolled back"
}
```

## Signals, and what they mean

- **Rejection** — the human judged the agent's finding wrong. Counted as a
  mistake; drives the nudge down.
- **Override** — any non-`system` status transition in a finding's history; the
  human moved it away from where the agent left it. A softer "study this" signal.
- **Rollback** — a change the agent's finding drove was deployed and then
  reverted (from the rec status *or* a linked deployment's `rolled_back`
  status). The strongest mistake signal — it means the change reached production
  and was wrong.

## The confidence nudge (bounded, deterministic, not auto-applied)

```
nudge = clamp( 0.15 × (acceptRate − rejectRate − rollbackRate), −0.15, +0.15 )
```

An agent with a high acceptance rate earns a small upward nudge; one with more
rejections/rollbacks than acceptances is nudged down. It is **bounded** (no
runaway self-reinforcement) and **suggested, not auto-applied** — wiring it into
the next scan's confidence is a deliberate, reviewable step, exactly as the D.6
learning loop kept it. This prevents the failure mode where an agent silently
amplifies its own bad calls.

## Lessons (human-readable memory)

Memory also emits plain-language lessons so a human — and the agent's future self
— can see the pattern, not just a number:

- `"2 owned change(s) were rolled back — tighten evidence before deploying this class."`
- `"More rejected than accepted (5 vs 2) — recalibrate confidence downward."`
- `"3 finding(s) were overridden by a human — study those cases."`
- `"No mistakes recorded yet."`

## Why "no agent repeatedly makes the same mistake"

The loop is: propose → the human accepts/rejects/overrides, or the Operator
deploys/rolls-back → those durable outcomes are read back per-agent → the agent's
reliability and suggested nudge move → the lessons name the pattern. Because
identity is stable (D.6 P1) and rule-versioned (P2), an agent's history follows
the *issue*, not a random UUID, so the memory is continuous across rescans and a
recurring mistake accumulates rather than resetting.

## Surfaced to the user

The recommendations API returns `memory[]` alongside the coordinated
recommendations, so reliability and lessons per agent are available to the UI
(the agent team strip). Memory is computed at read time from current data, so it
is always current — never stale.

## Verified

`tests/agents.test.ts`: three rejected content findings drive the Content
Strategist's `rejected` count to 3, a negative `suggestedConfidenceNudge`, and a
"rejected" lesson; a rolled-back deployment linked to an owned finding is
recorded as a rollback with a "rolled back" lesson.
