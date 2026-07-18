# Deployment Pipeline (Phase D)

The path a fix travels from recommendation to verified live change. Every stage is gated; failure at any stage is honest and recoverable.

## Stages

1. **Select** — the user (or a bulk operation) picks recommendations in the Operator tab.
2. **Generate fix** (`fixgen.ts`) — a concrete change is produced from the real crawled page signals. If no safe value can be generated, the item is marked advisory (not deployable) with a reason — never a fabricated change.
3. **Preview** (`diff.ts`) — current value, proposed value, character diff, reason, evidence URLs, expected impact, confidence, risk, rollback availability. Nothing is written yet.
4. **Safety assessment** (`safety.ts`) — risk score, affected pages, SEO/business impact, warnings, rollback plan. Dangerous classes (robots/noindex/canonical/redirect/sitemap) are **blocked** here.
5. **Policy decision** (`policy.ts`) — `auto-approved` / `requires-approval` / `blocked`. Default policy auto-approves nothing.
6. **Approval** — auto (opt-in policy) or explicit human. Bulk approval passes `approve: true` per item; a human edit can override the proposed value (`editedValue`).
7. **Resolve target** (`resolveWpTarget`) — the recommendation's evidence URL is mapped to a WordPress post by slug. No match → honest failure, no guess.
8. **Deploy** (`executeWpDeployment`) — capture BEFORE from the live site, apply the write. If the before-capture fails, the deploy aborts (never apply without rollback data).
9. **Verify** — re-read the value from the live site and compare. `verified` on match, `verify_failed` on mismatch (HTTP 200 is never assumed to be success).
10. **Reconcile** (`outcomeForDeployment`) — `verified` → recommendation verified; `verify_failed`/`failed` → recommendation **reopened** (status → open, history appended); `rolled_back` → recommendation rolled_back.
11. **Record** — a durable `WpDeployment` (before/after/approver/reason/verification/result) + an audit-log entry.

## Modes

- **Single** — one item, explicit approval.
- **Bulk** — many items in one call; each is independent (**partial-success recovery**): one item's failure never aborts the others; the response lists every item's outcome.
- **Dry run** — runs stages 2–6 and returns the plan (diff, decision, safety) **without writing**. Verified in tests to leave the site unchanged.
- **Batch rollback** — many deployments restored in one call, each verified, linked recommendations reopened/rolled_back.

## Result shape (per item)

`{ recommendationId, ok, status, verified, reopened, requiresApproval?, blocked?, stage?, error?, note?, deploymentId? }` — so the UI and any caller can see exactly what happened and why.

## Tests

`operator-routes.test.ts` drives all of this through the real route handlers against the WP double: dry-run writes nothing; explicit-approved deploy verifies and marks the recommendation verified; **verify failure reopens**; policy auto-approve works after opt-in; rollback restores the original and reopens the recommendation.
