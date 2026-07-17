# Verification Engine (Phase D §5)

**Never assume success because HTTP 200 returned.** Every deployment is verified by reading the changed value back from the live site and comparing it to what was requested.

## How it works (`wp-execution.ts` + `pipeline.ts`)

1. **Before deploy** — capture the current value from the live site (`readPost`). If this read fails, the deploy is aborted (no change without rollback data).
2. **Apply** — POST the change to the WordPress REST API.
3. **Re-read** — fetch the post again (`context=edit`) and extract the field that was written.
4. **Compare** — requested value vs. read-back value, per field:
   - all requested fields match → `verified`
   - any field does not match → `verify_failed` (even though the write returned 200)
   - re-read itself failed → `verify_failed` with the read error
5. **Reconcile** (`outcomeForDeployment`):
   - `verified` → recommendation → **verified** (terminal)
   - `verify_failed` → recommendation **reopened** (status → open, history appended, failure reason attached)
   - `failed` (write errored) → recommendation **reopened**
6. **Record** — the `verification` block (checkedAt, titleMatches, metaMatches, note) is stored on the durable `WpDeployment`.

## The false-"verified" guard

The canonical failure this defends against: a plugin (e.g. AIOSEO storing the meta description separately) accepts the write with **HTTP 200 but does not persist the value**. The read-back catches this and produces `verify_failed`, not `verified`.

Proven at three levels:
- **In-process double** (`wordpress-execution.test.ts`): "reports verify_failed when the server returns 200 but drops the value."
- **Real HTTP** (`wp-http-emulator.test.ts`, PHP emulator): same, over the network.
- **Operator route** (`operator-routes.test.ts`): "verification failure REOPENS the recommendation" — end-to-end, the rec returns to `open` with a history entry.

## Reopen semantics

A reopened recommendation returns to the top of the pipeline: it is `open` again, its history records the failed attempt and reason, and the linked deployment record preserves the before-values and the mismatch detail. Nothing is marked done on a failed verification.

## Honest scope

Verification currently compares the WordPress-stored field values (title/meta) via read-back. A **full re-crawl + re-score** of the live page after deploy (to confirm the on-page rendered result and refresh the audit) is a natural extension using the existing crawler; it is not yet wired into the post-deploy step. The field-level read-back is the safety-critical guarantee and is in place; the re-score is an enhancement.
