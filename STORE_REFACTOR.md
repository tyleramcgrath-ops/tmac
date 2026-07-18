# Store Consistency (Phase D.6 P7)

Eliminates the dual-store drift risk the D.5 review flagged: two hand-duplicated
`FoundationStore` implementations with no guard, where the A12 "the INSERT
forgot a NOT-NULL column" bug class was still live and every schema change was a
two-file edit.

---

## The defect (from D.5)

- The Postgres store hand-listed columns in each INSERT/UPDATE. Adding a
  NOT-NULL column meant editing every relevant statement; forgetting one was a
  runtime error (the A12 class — three real bugs in that phase).
- The file store and Postgres store could silently diverge (a method updated in
  one and not the other) with **no test to catch it**.

## The fix — one column source per table

`lib/foundation/postgres.ts` now declares each table's projected (non-`data`)
columns **once**, via a single key-extractor:

```ts
interface TableDesc<T> { name: string; pk: string[]; keys: (e: T) => Record<string, unknown> }

const TABLES = {
  recs: { name: 'rf_recommendations', pk: ['id'],
          keys: (r) => ({ id: r.id, project_id: r.projectId, scan_id: r.scanId,
                          status: r.status, created_at: r.createdAt }) },
  // … users, orgs, members, projects, scans, wpConn, wpDep, audit
}
```

Generic writers build their SQL from that extractor:

- `ins(table, entity)` → `INSERT INTO … (cols…, data) VALUES (…)`
- `upd(table, entity)` → `UPDATE … SET <non-pk cols>, data=… WHERE <pk>`
- `ups(table, entity)` → `INSERT … ON CONFLICT (pk) DO UPDATE SET … EXCLUDED…`

Consequences:

- **An INSERT and an UPDATE can never disagree** about the column set — they
  read the same extractor.
- **Adding a projected column is a one-line edit** to the extractor; the A12
  class is gone.
- **Bonus fix:** `updateRecommendation` now keeps the projected `scan_id`
  column in sync (the old hand-written UPDATE left it stale after a P1 upsert
  re-pointed `scanId`).

## The drift guard — one contract, both stores

`tests/store-conformance.test.ts` runs a **single behavioral contract** against
**both** implementations:

- the file store — always;
- Postgres — when `RF_TEST_DATABASE_URL` is set (gated; CI without a DB skips
  cleanly).

The contract round-trips **every write path**: create/update for users
(including the P6 `tokenVersion`), orgs + membership, `addMember` upsert,
projects, scans, recommendations (create + update that re-points `scanId`), WP
connection upsert, WP deployment insert/update, and audit. If the two stores
ever diverge — a method added to one and not the other, a projected column
forgotten, an update that drops a field — a contract assertion fails on the
store that drifted.

## Migration-runner hardening

Wrapping this up, `migrate.ts` now serializes concurrent runners on a PostgreSQL
**advisory lock** and uses `ON CONFLICT (version) DO NOTHING` on the history
insert. This fixes a real cold-start race (multiple serverless instances booting
at once, or parallel test workers sharing a DB) where two runners raced on the
migration-history primary key.

## Verification

- The contract passes against the **file store** in the default suite.
- Run against **real PostgreSQL 16**, the contract passes on the Postgres store,
  and the two gated DB test files run together without the migration race.
- `tsc --noEmit` clean; default suite 190 pass.

## What P7 deliberately did not do

The `FoundationStore` interface is still a 36-method fat interface (ISP not yet
satisfied), and projected columns for the fields the product filters/sorts on
(`severity`, `priorityScore`) are not yet added. The column-map now makes adding
them a one-line change, and the contract will guard any new method — but
segregating the interface and projecting query columns are scaling investments
left for a future, scoped pass rather than expanded into this hardening release.
