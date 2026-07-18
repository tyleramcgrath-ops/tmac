# Safe Diff Engine (Phase D §3)

No write happens without a transparent preview. The diff engine produces an exact before/after so a human (or an auto-approve policy) is never asked to trust an opaque change.

## What every preview contains (`diff.ts` → `Preview`)

- **currentValue** — the live value being replaced (captured from the site, not assumed).
- **proposedValue** — the concrete generated change.
- **diff** — a character-level `DiffSegment[]` of `equal` / `insert` / `delete` runs.
- **reason** — the recommendation's stored reasoning.
- **evidenceUrls** — the pages this rests on.
- **expectedImpact**, **confidence**, **risk** — carried from Engine V2.
- **rollbackAvailable** — true for supported writes (before-values are captured).
- **deployable** — true only when the fix maps to a supported WordPress write (title/meta); schema/alt are advisory.
- **warnings** — from the safety engine.

## The diff algorithm

An LCS dynamic-programming pass over the two short strings yields the minimal edit script, then adjacent same-type characters are merged into runs. It is exact and reversible:

- `equal + delete` segments reconstruct the **original** exactly.
- `equal + insert` segments reconstruct the **proposed** exactly.

This property is asserted in `operator-engine.test.ts` ("produces insert/delete/equal segments" reconstructs both sides), so the rendered before/after can never silently misrepresent the change.

## No hidden writes — enforced

- The Operator UI renders the delete-side (red) and insert-side (green) of every diff before any deploy button is active.
- **Dry run** returns the full diff + decision + safety with zero writes (verified in tests: the live post is unchanged after a dry run).
- The deploy route re-derives the same preview server-side; the client cannot smuggle a different value except via an explicit `editedValue` (a human edit), which is itself recorded in the deployment reason.

## Rendering

The UI's `renderDiff(diff, 'delete'|'insert')` composes each side from the segments, so the operator sees exactly what will change, per fix, before approving — individually or in bulk.
