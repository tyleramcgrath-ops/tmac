# Execution History (Phase D §8)

Every deployment is a durable, server-side record — the complete audit trail of what RankForge changed, why, who approved it, and whether it verified. It survives browser close, logout, and device change (proven in A12).

## What each deployment stores (`WpDeployment`)

| Field | Meaning |
|---|---|
| `id`, `projectId`, `connectionId` | identity + tenancy |
| `recommendationId` | link back to the source recommendation (and via it, the source scan) |
| `postId`, `postType`, `postUrl` | the WordPress target |
| `before` | title, meta description, content hash, full content **captured from the live site** |
| `after` | the requested title/meta change |
| `approvedBy`, `approvedAt` | who authorized it and when |
| `reason` | why (carries the recommendation title + auto/explicit approval) |
| `status` | applied / verified / verify_failed / failed / rolled_back |
| `verification` | checkedAt, titleMatches, metaMatches, note (the read-back result) |
| `result` | human-readable outcome |
| `rolledBackAt`, `rolledBackBy` | rollback provenance |
| `createdAt` | timestamp |

## Provenance chain

`Deployment → Recommendation → Scan → Project → Org`. From any applied change you can trace: the exact recommendation and its evidence, the scan that produced it, the project/business context, and the org that owns it. Conversely, each recommendation's `history` records every status transition (open → accepted → deployed → verified, or → open on reopen), and each project's org has an `audit` log of every operator action (policy change, deploy batch, rollback batch).

## Audit log

`rf_audit` (per org) records `operator.policy.update`, `operator.deploy.batch` (with verified/total), `operator.rollback.batch`, plus the underlying `wordpress.deploy` / `wordpress.rollback` per change. Every entry has actor, action, target, detail, timestamp.

## Durability

- Stored in Postgres (`rf_wp_deployments`, JSONB + indexed `project_id, created_at DESC`) in production, or the file store in dev/test.
- A12 proved a deployment record round-trips through a store reopen (survives restart) and that rollback provenance persists.
- The `GET operator/metrics` route aggregates this history into the executive view; the WordPress tab lists it with before/after, verification result, and a rollback button.

## Retrieval, verified

`operator-routes.test.ts` and `wordpress-route.test.ts` confirm: a deployment is created with full before/after/approver/reason, its status reflects verification, a rollback updates it to `rolled_back` and restores the live value, and the linked recommendation is reconciled — all readable back from the store after the fact.
