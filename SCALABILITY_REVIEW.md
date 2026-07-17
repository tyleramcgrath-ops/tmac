# RankForge — Scalability Review (Phase D.5)

Can this architecture comfortably support 100 / 1k / 10k / 100k / 1M projects? Honest per-tier assessment with the actual bottlenecks.

## Storage model reality

Every entity is a JSONB `data` blob with a handful of extracted key columns. The fields the product filters/sorts on — `severity`, `priorityScore`, status-combos — are **blob-only**, so those queries can't use an index. Index coverage on the *lookup* predicates (`project_id, created_at DESC`, etc.) is actually good; the problem is **row width and load-everything list queries**, not row lookup.

Worst offenders (bad at any scale, verified):
- `listScans` (`postgres.ts:138`) returns up to 20 **full scan blobs including all `pages[]`**, then the route discards everything but `summary` — shipping MBs to render ~7 integers/row.
- `getScan` (`postgres.ts:134`) loads the entire `pages[]` unconditionally.
- `listRecommendations` (`postgres.ts:160`) has **no LIMIT** — unbounded, and grows every re-scan because recommendations are INSERT-only with no cross-scan dedupe (see `ARCHITECTURE_REVIEW.md` D-1).

Scan blob size: the stored `pages[]` is the raw crawl payload (title/meta/schemaTypes/internalTargets/fixes per page), capped at 1000 pages. Realistically **1–10 MB per scan**.

## Per-tier

| Projects | Verdict | Governing bottleneck |
|---|---|---|
| **100** | Fine | Nothing. Pool max=5 ample; wasteful blob loads tolerable. |
| **1,000** | Fine, watch concurrency | Pool max=5 (`postgres.ts:31`): sustained concurrency >5 queues; each list holds a connection while streaming multi-MB blobs → p99 rises. |
| **10,000** | Starts to hurt | `rf_recommendations` in the tens of millions (inflated by no cross-scan dedupe). `listRecommendations` unbounded; `listScans` detoasting 20 full blobs/view is real DB CPU. Pool max=5 a genuine bottleneck. |
| **100,000** | Real blockers | ~3 TB scan JSONB (100k × ~10 scans × ~3 MB). Every `SELECT data` detoasts large blobs. No index for `status`/`severity`/`priorityScore` (blob-only) → product filters/sorts are app-side over full sets. Migration-on-cold-start across a serverless fleet is a liability. |
| **1,000,000** | Does not get here without redesign | Unpartitioned multi-hundred-million/billion-row `rf_scans`/`rf_recommendations` with fat TOAST, single Pool per instance, INSERT-only recs. Requires partitioning + scan-payload offload + upsert. |

## The fixes, cheapest-first

1. **Project `summary` into real columns / use `data->'summary'`** and stop selecting `pages[]` on list paths. Biggest win, tiny change, helps at *every* tier.
2. **Add `LIMIT` + pagination to `listRecommendations`.**
3. **Extract `severity`, `status`, `priorityScore`, `ruleId` as columns** (needs the `ruleId` field first) so top-N/filter queries use indexes.
4. **Cross-scan recommendation upsert** (dedupe by `issueId`) — stops row-count blowup *and* fixes the correctness defect.
5. **Bump pool + PgBouncer**; **skip migrate-on-connect**, migrate in deploy.
6. **≥100k:** move scan `pages[]` to object storage, keep `summary` in the row; partition `rf_scans`/`rf_recommendations` by org/time.

## Client / compute

- Crawling is client-driven (batched `/api/crawl`), so crawl compute scales with clients, not the server — good. But `/api/crawl` is unauthenticated and unthrottled (SSRF + amplification risk — see `SECURITY_REVIEW.md`).
- The reco/operator engines are pure, in-memory, O(pages) per scan — fine.
- The file store's O(n)-per-write is dev/test-only (prod forces Postgres via `env.ts`); acceptable.

## Bottom line

Comfortable to ~1k, workable to ~10k with the cheap fixes (1–3), needs the structural fixes (3–6) for 100k, and needs partitioning + payload offload for 1M. Nothing here is a dead end — but the un-projected list queries and the missing cross-scan dedupe should be fixed before the first real growth, not after.
