# Automation Rules (Phase D §4, §7)

Approval automation is **opt-in and conservative**. By default RankForge deploys nothing without an explicit human approval. Organizations may grant narrow automation, but dangerous change classes can never be automated.

## The policy object (`policy.ts` → `AutomationPolicy`)

```
autoApprove: {
  title?:           'low' | 'medium'   // auto-approve title rewrites up to this risk
  metaDescription?: 'low' | 'medium'
  schema?:          'low'
}
alwaysRequireApproval: [robots-directive, canonical, redirect, sitemap, noindex]
maxAutoApprovePages:   number          // a single auto action may touch at most N pages
```

- **DEFAULT_POLICY** — `autoApprove: {}`; nothing auto-approves. This is what a new project gets.
- **EXAMPLE_POLICY** — `autoApprove: { title: 'low', metaDescription: 'low' }`, cap 5 pages. The documented opt-in for low-risk copy fixes.

## Decision procedure (`evaluatePolicy`)

For each proposed fix, given its safety assessment:

1. `safety.blocked` → **blocked** (never runs, regardless of policy).
2. fix kind in `alwaysRequireApproval` → **requires-approval**.
3. affected pages > `maxAutoApprovePages` → **requires-approval**.
4. `autoApprove[kind]` set AND `safety.risk` ≤ the allowed level → **auto-approved**.
5. otherwise → **requires-approval**.

The example from the brief holds exactly:
- *"Auto-approve title rewrites below medium risk"* → set `autoApprove.title = 'medium'`.
- *"Require approval for robots.txt changes"* → robots is in `alwaysRequireApproval` **and** blocked by the safety engine; it can never be automated.

## Safety engine (`safety.ts`) — what gets blocked

`robots-directive`, `noindex`, `canonical`, `redirect`, `sitemap` (and any recommendation whose title matches those terms) are assessed as **risk: blocked**. These can deindex pages or are hard to reverse, so they are removed from every automated/bulk path and require an explicit single human approval. The safety assessment also returns: risk score, affected page count, SEO/business impact, warnings, and a rollback plan — attached to every preview.

## Bulk operations (§9)

- **Approve all low-risk fixes** — select deployable low-risk items; auto-approved ones deploy, others report `requires-approval`.
- **Deploy all title / meta / schema updates** — filter by fix kind, bulk deploy.
- **Dry run** — see the plan (diffs + decisions + safety) with no writes.
- **Rollback batch** — restore many deployments at once.
- **Partial-success recovery** — each item is independent; one failure never aborts the batch, and the response itemizes every outcome.

## Guardrails, enforced in code (not just policy)

- The policy PUT route **sanitizes** input: it strips any attempt to auto-approve a dangerous kind and clamps `maxAutoApprovePages` to [1, 50]. Even a malformed or malicious policy cannot enable automation of a blocked class.
- Admin role required to change policy or to deploy.

## Tests

`operator-engine.test.ts` and `operator-routes.test.ts`: default policy requires approval for everything; example policy auto-approves a low-risk title within the cap; a blocked action is never auto-approved; over-cap page counts force approval; and after an org opts into `title: 'low'`, a title fix deploys without an explicit per-item approval.
