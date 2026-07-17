# Recommendation Identity & Typed Rules (Phase D.6 P1 + P2)

The single highest-leverage fix in the hardening release: give recommendations
a **permanent, deterministic identity based on business meaning**, and make the
rule identity a **typed, first-class field** rather than a string parsed out of
display text.

---

## P1 — Stable cross-scan identity

### The defect (from D.5)
Every scan minted `id: randomUUID()`, hard-bound `scanId`, and
`createRecommendations` was INSERT-only. Re-scanning **silently orphaned** the
human's prior triage (accepted/rejected/dismissed) and reset `history[]` to
`[]`. The engine *had* a stable grouping key but threw it away.

### The design
Identity is the issue's **business meaning**, not a random number:

```
issueId = `${ruleId}::${scope}`
```

`scope` is:
- `'site'` — site-wide, page-agnostic rules (one issue per project, e.g.
  `missing-title::site`)
- the finding **title** — page-type-specific schema rules (e.g.
  `schema-missing::Add Product structured data`)
- the **shared value** — cross-page duplicate groups (so two different
  duplicate-title clusters keep distinct identities)

It is project-scoped by storage, so it need not embed the projectId. It is
readable, deterministic, and reproducible in a SQL backfill.

`lib/foundation/reco/identity.ts`:
- `makeIssueId(ruleId, scope)` — deterministic, whitespace-collapsed, bounded.
- `mergeForUpsert(existing, incoming)` — preserves `id`, `issueId`, `status`,
  `createdAt`, and `history`; refreshes the analysed content (confidence,
  evidence, priority, title, reasoning, `ruleVersion`, `scanId`); records a
  history entry when the rule version evolves.

### The upsert
`persistScanRecommendations(store, projectId, recs)` in `recommendations.ts`
matches each fresh recommendation to any existing one by `issueId` and upserts —
updating in place (preserving triage) or inserting new. It is implemented over
the **existing store methods** (`listRecommendations` / `updateRecommendation` /
`createRecommendations`), so both store implementations behave identically with
no dual-write path. `scans/route.ts` calls it on scan completion.

### The migration (`002_recommendation_identity.sql`)
Forward-only, idempotent, and proven against real PostgreSQL 16:

1. Backfill `issueId` into the JSONB blob for legacy rows, deterministically
   (mirrors the engine's scoping; rows with no `ruleId` fall back to a per-row
   unique id so nothing collides).
2. Fold the `history[]` of duplicate rows (same project + issueId, produced by
   the old INSERT-only path) into the newest survivor — **no recorded triage is
   lost**.
3. Delete the now-merged duplicates.
4. Add a `UNIQUE (project_id, (data->>'issueId'))` index so a project can never
   again hold two rows for one issue, plus a `ruleId` index.

**Verified:** seeded two legacy `missing-title` rows (one triaged `rejected`)
plus a schema row; after `002` they collapsed to one survivor **with the
rejected history entry preserved**, the schema row kept its title-scoped
identity, and a duplicate insert was rejected by the unique index.

### Test
`tests/recommendation-identity.test.ts`: `makeIssueId` determinism,
`mergeForUpsert` triage/history preservation + rule-version history entry, and a
full rescan-upsert over the file store proving the same issue keeps its `id`,
`status='rejected'`, and history while its `scanId` re-points to the new scan.

---

## P2 — First-class typed rule IDs

### The defect (from D.5)
`Recommendation` had no `ruleId`. The engine wrote `` `Rule "${f.ruleId}", …` ``
into `evidence.facts[]` (a presentational string) and
`ruleIdFromRecommendation` parsed it back with a regex, falling back to guessing
from the title. Fix generation, the operator pipeline, and the entire learning
substrate depended on that sentence never being reworded. Worse, safety blocking
rested on a **title regex** (`/robots|noindex|canonical|redirect|sitemap/i`) — a
decoy that would silently fail the moment a rule was reworded or a robots rule
shipped.

### The design
`Recommendation` now carries typed fields (`lib/foundation/types.ts`):

```ts
ruleId: string
ruleVersion: number
ruleCategory: string
ruleSeverity: 'critical' | 'warning' | 'info'
businessContext: string      // 'money-page' | 'standard' | 'utility' | 'site'
pageType?: string
```

- `reco/rules.ts` — `RULE_REGISTRY` is the single, typed source of rule
  metadata: `{ version, dangerous }` per ruleId. `ruleVersion()` and
  `isDangerousRule()` read from it. `ruleVersion` lets a rule's logic evolve
  while its identity stays stable and comparable across scans.
- `reco/engine.ts` — stamps all typed fields from the `Finding`; the parseable
  `Rule "…"` string is **removed** from `evidence.facts` (display text is now
  presentation-only).
- `operator/fixgen.ts` — `ruleIdFromRecommendation` (regex/title guess) replaced
  by `ruleIdOf(rec)` which reads `rec.ruleId` and degrades to `'unknown'`, never
  parses.
- `operator/safety.ts` — dangerous-action blocking now comes from
  `isDangerousRule(ruleIdOf(rec))` + a typed `DANGEROUS_FIX_KINDS` set. The
  title regex is gone.
- `operator/pipeline.ts`, `operator/learning.ts` — consume the typed `ruleId`.

Recommendations persist as JSONB, so the new fields carry with no column change.

### Consumers converted to the typed model
Operator (fix generation, preview, safety, policy), Learning loop (per-rule
aggregation), Recommendation Engine (emits the fields), and Verification (reads
the persisted record). Display text is presentation-only everywhere.

### Test
`tests/reco-engine.test.ts` asserts the engine stamps the typed fields, that
`ruleVersion`/`ruleCategory`/`ruleSeverity`/`businessContext` are shaped
correctly, and — critically — that **no recommendation leaks a parseable
`Rule "` string** into evidence. `tests/operator-engine.test.ts` proves safety
blocks from the typed rule identity (innocuous title, dangerous `ruleId`) and
from a dangerous fix kind, with the title-regex path removed.

---

## Why these two together

P1 and P2 are one redesign: a stable cross-scan `issueId` **and** a persisted
`ruleId` are what let the identity survive a reword or a version bump. Because
`issueId` is `ruleId`-based (not version-based), bumping a rule's version keeps
the same issue — so history and triage survive rule evolution, exactly as the
exit criteria require.
