# Operator Engine (Phase D)

RankForge moves from analysis to **execution**: Find → Decide → Fix → Verify → Learn, with the human in control. Every action is evidence-backed, explainable, reversible, auditable, and verified.

## Pipeline (§1) — every recommendation reaches a terminal state

```
Discover      a recommendation (Engine V2, page-type & business aware)
Analyze       classify + evidence already attached
Explain       why / why now / why this page / what if ignored / what could make wrong
Generate Fix  a CONCRETE change (fixgen.ts) — not "you should…"
Preview       safe diff + safety + policy decision (diff.ts, safety.ts, policy.ts)
Approve       auto (opt-in policy) or explicit human, single or bulk
Deploy        real WordPress write (wp-execution.ts)
Verify        re-read the value back; HTTP 200 is never assumed to be success
Learn         record accept/reject/edit/rollback/verify-fail (learning.ts)
Archive       terminal state: verified / rolled_back / dismissed / (reopened→open)
```

A recommendation never dangles: verified and rolled_back are terminal; a verify/deploy failure **reopens** it (status → open, with history), so it re-enters the pipeline rather than silently "succeeding."

## Modules (`lib/foundation/operator/`)

| Module | Responsibility |
|---|---|
| `fixgen.ts` | Generate the actual change from real page signals (title/meta/schema); advisory-only where a value can't be safely produced (alt text) — never fabricates. |
| `diff.ts` | LCS char diff + the transparent `Preview` object. |
| `safety.ts` | Risk score, rollback plan, impact estimates, warnings; **blocks** robots/noindex/canonical/redirect/sitemap from automated paths. |
| `policy.ts` | Approval workflows — default is opt-in (nothing auto-approves); auto-approve low-risk title/meta under a page cap; dangerous kinds always need approval. |
| `pipeline.ts` | Preview assembly + verify-reopen outcome logic. |
| `learning.ts` | No-ML feedback substrate: per-rule accept/reject/edit/rollback/verify-fail rates + a bounded suggested confidence nudge. |
| `metrics.ts` | Execution-focused operator metrics. |
| `context.ts` | Loads the latest scan's page signals + the project's policy. |

## API (`app/api/projects/[projectId]/operator/`)

- `POST preview` — fix + diff + safety + policy decision for selected recommendations (no writes).
- `POST execute` — bulk **deploy** (policy+safety gated, dry-run, partial-success, verify, reopen-on-fail) or batch **rollback**.
- `GET metrics` — executive view + learning aggregation.
- `GET/PUT policy` — read/update the automation policy (admin only; dangerous kinds can never be auto-approved).

## UI

The project **Operator** tab shows the metrics strip, deployable fixes with char-diff + safety/decision, bulk select, **Dry run** and **Approve & deploy**, and a per-run log that surfaces `reopened` / `blocked` / `needs-approval` outcomes. Rollback lives in the WordPress tab (durable deployment history).

## Guarantees

- **No hidden writes.** Every deploy has a preview; dry-run writes nothing.
- **No unverified success.** Verification re-reads the live value; a mismatch reopens the recommendation.
- **No irreversible automation.** Blocked classes never auto-run; every applied change captures before-values for one-click rollback.
- **Full audit trail.** Every deploy/rollback/policy change is an audit-log entry; every recommendation carries its status history.

## Tests

`operator-engine.test.ts` (15 unit) + `operator-routes.test.ts` (8 e2e vs the WP double): fix generation, diff round-trip, safety blocking, policy auto-approve/require/deny, verify→verified, **verify_failed→reopen**, rollback→restore, dry-run writes nothing, metrics. Full suite: 96 tests (89 + 7 gated).

## Honest limitations

- **WordPress writes are proven against the double + real-HTTP emulator, not a live WP** (environment-blocked; unchanged from A12). The operator adds no new claim there.
- **Deployable fixes are title/meta today** (the supported WordPress writes). Schema/alt/heading fixes are generated as **advisory artifacts** (shown, not auto-written) because they need block-level insertion or per-image human input — flagged, not silently dropped.
- **Learning is substrate only** (§6): it computes and exposes per-rule stats + a suggested nudge, but does not auto-mutate confidence. Wiring the nudge into Engine V2 is a deliberate, reviewable next step, not hidden ML.
