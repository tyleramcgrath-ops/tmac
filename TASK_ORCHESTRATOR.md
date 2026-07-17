# Task Orchestrator (Phase F)

Agents create tasks for each other. The orchestrator (`lib/foundation/agents/
tasks.ts`, driven by `orchestrator.ts`) materializes the canonical inter-agent
workflow for every finding, so work flows through the team the way it would
through a real agency — with the handoffs visible and traceable.

## The canonical chain

For each finding, `buildTaskChain(rec, consensus)` produces:

```
1. Scout      → owner       analyze         "Facts gathered; hand off for domain analysis."
2. owner      → QA          challenge       "Analysis complete; request adversarial review."
3. QA         → Strategist  reprioritize    "Challenge recorded; weigh business priority."
4. Strategist → Operator    prepare-deploy  |  human-review   (branches on consensus)
5. Operator   → Operator    verify          "Read back the live value to verify."
6. Operator   → Strategist  record          "Record the outcome to agent memory for learning."
```

This is exactly the example flow the phase asks for: *Scout discovers → Content
analyzes → Strategist reprioritizes → Operator prepares → QA reviews →
verification confirms → learning records.*

## Consensus decides the branch

Stage 4 is where the team's verdict changes the workflow:

- **agree** → `prepare-deploy` task to the Operator (a safe, reversible
  deployment awaiting human approval).
- **disagree / needs-review / human-required** → a `human-review` task instead —
  the work does not proceed to deployment until a human resolves the conflict.

So a clean consensus flows toward execution; an unclean one is routed to a human.
No recommendation silently deploys on a contested verdict.

## Task state reflects reality

Tasks are not fiction — their status is derived from the recommendation's actual
durable state:

- Stages 1–3 (discover / analyze / challenge / reprioritize) are `done` — they
  happened during coordination.
- `prepare-deploy` is `done` once the rec is `deployed`/`verified`, else `open`.
- `verify` and `record` are `done` once the rec is `verified`, else `open`.
- `human-review` is `done` once a human has approved, else `open`.

## Deterministic + stable

Task ids are derived from the finding's stable `issueId` (`${issueId}#${n}`), so
re-running coordination on a rescan produces the same task identities — the
workflow is idempotent, mirroring the D.6 P1 stable-identity guarantee. No
`Date.now()`/random state.

## What an agent "creating a task for another" means here

Each task records `fromAgent` and `toAgent` — a real handoff between two
specialized agents (e.g. `content → qa`, `qa → strategist`, `strategist →
operator`). The orchestrator generates the full chain; the same structure
accepts ad-hoc tasks (the `AgentTask` type is open), so an agent that discovers a
new dependency mid-flow can raise a task without a schema change. This is the
seam that lets the workflow grow (see the scaling answer in `PHASE_F_REPORT.md`).

## Verified

`tests/agents.test.ts` asserts the chain contains `analyze`, `challenge`,
`verify`, and that a dangerous (`noindex`) finding — which reaches
`human-required` consensus — routes stage 4 to a `human-review` task rather than
`prepare-deploy`.
