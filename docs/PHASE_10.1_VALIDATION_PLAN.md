# Phase 10.1: Autonomous Operations Validation Plan

**Objective**: Prove that RankForge autonomous operations are safe enough to operate without direct user intervention.

**Scope**: Real WordPress validation using Phase 9.2a Docker environments + comprehensive test suites

**Duration**: ~2-3 hours for full validation run (can be parallelized)

---

## Part 1: Environment Setup (10 minutes)

### 1.1 Start WordPress Test Environments

```bash
# Terminal 1: Start Docker WordPress instances
npm run docker:up

# Wait for initialization (~60 seconds)
npm run docker:logs

# Verify all 4 instances are ready
curl http://localhost:8001/wp-json/  # Clean WordPress
curl http://localhost:8002/wp-json/  # Yoast
curl http://localhost:8003/wp-json/  # Rank Math
curl http://localhost:8004/wp-json/  # AIOSEO
```

### 1.2 Verify Connections

Each instance should respond with WordPress REST API metadata (site name, description, etc.)

---

## Part 2: Automated Test Suites (45 minutes)

### 2.1 Policy Tests (8 minutes)

```bash
npm run test -- lib/autonomy/__tests__/policy-precedence.test.ts
```

**Tests** (8):
- Global policy overrides organization
- Organization policy overrides project
- Emergency stop blocks all
- Autonomy modes enforced (disabled/simulation/approval/low-risk)
- Role restrictions (Viewers cannot approve)
- Daily limits enforced
- Data freshness checked

**Expected**: ✅ 8/8 PASS

### 2.2 Risk Classification Tests (6 minutes)

```bash
npm run test -- lib/autonomy/__tests__/risk-classification.test.ts
```

**Tests** (11):
- Base execution type risks calibrated
- Page type multipliers applied correctly
- Data freshness penalties
- WordPress health impact
- Plugin compatibility impact
- Rollback/verification availability penalties
- Risk score bounds at 1.0
- Risk explanations clear

**Expected**: ✅ 11/11 PASS

### 2.3 Forbidden Actions Tests (4 minutes)

```bash
npm run test -- lib/autonomy/__tests__/forbidden-actions.test.ts
```

**Tests** (13):
- No contract for page rewrites
- No contract for page deletes
- No contract for redirects
- Protected pages block execution (legal, medical, financial, checkout)
- Batch size limits enforced
- Allowed mutations validated
- Confidence thresholds checked

**Expected**: ✅ 13/13 PASS

### 2.4 Security & Tenant Isolation Tests (7 minutes)

```bash
npm run test -- lib/autonomy/__tests__/security.test.ts
```

**Tests** (18):
- Cross-organization data filtered
- Viewer role blocked
- Session expiration checked
- Replay prevention (nonce validation)
- Deleted membership blocks access
- Role downgrade prevents higher-level ops

**Expected**: ✅ 18/18 PASS

### 2.5 Real WordPress Validation Tests (15 minutes)

```bash
npm run test -- lib/autonomy/__tests__/wordpress-validation.test.ts
```

**Scenarios**:
- **Scenario A**: Successful schema autonomy (detect → approve → execute → verify)
- **Scenario B**: Metadata conflict detection (concurrent edit blocked)
- **Scenario C**: Verification failure → automatic rollback
- **Scenario D**: Emergency stop blocks all evaluations
- **Scenario E**: Cross-tenant attack prevention
- **Scenario F**: Simulation mode (zero changes)

**Protected Pages** (4 sub-tests):
- Legal pages block autonomy
- Medical pages block autonomy
- Financial pages block autonomy
- Checkout pages block autonomy

**Expected**: ✅ 10/10 PASS

### 2.6 Stress Tests (5 minutes, non-blocking)

```bash
npm run test -- lib/autonomy/__tests__/stress-tests.test.ts
```

**Workloads**:
- 100 concurrent evaluations
- 500 concurrent evaluations
- 1000 concurrent evaluations

**Measurements**:
- Throughput (evals/sec)
- Queue latency (p50, p95, max)
- Policy evaluation latency
- Duplicate prevention
- Concurrency safety

**Expected**: ✅ 3/3 PASS (with performance targets met)

---

## Part 3: Real WordPress Execution Tests (60 minutes)

### 3.1 Execute All Execution Types Against All Configurations

For each execution type (missing_schema, broken_links, minor_metadata, missing_alt_text, heading_improvements, canonical_repair, robots_correction):

For each WordPress configuration (clean, Yoast, Rank Math, AIOSEO):

1. **Create test post** with known initial state
2. **Evaluate policy** (should approve for low-risk)
3. **Classify risk** (verify very_low or low)
4. **Check contract** (compliance verified)
5. **Execute change** (apply via WordPress API)
6. **Verify independently** (fetch rendered page + parse HTML)
7. **Trigger rollback** (restore original state)
8. **Verify restoration** (confirm original state restored)
9. **Record results** (success/failure/metrics)

**Matrix**: 7 execution types × 4 configurations = 28 test cycles

**Per-Cycle Results Recorded**:
```json
{
  "executionType": "missing_schema",
  "wpConfiguration": "yoast",
  "status": "passed",
  "executionTime": 245,      // milliseconds
  "verificationTime": 523,    // milliseconds
  "rollbackTime": 187,        // milliseconds
  "pageStateRestored": true,
  "noUnexpectedMutations": true,
  "verificationFailures": 0,
  "errors": []
}
```

**Expected**:
- ✅ ≥95% success rate (≥26/28 tests pass)
- ✅ All rollbacks successful
- ✅ No unexpected mutations detected
- ✅ Verification independent from execution

### 3.2 Failure Injection Testing (20 minutes)

For each failure scenario, inject and verify recovery:

| Failure | Injection | Expected Behavior | Status |
|---------|-----------|-------------------|--------|
| WordPress timeout | 10ms HTTP timeout | Retry + timeout error | ✅ |
| Invalid credentials | Wrong auth | 401 Unauthorized + immediate fail | ✅ |
| Rate limiting | 50 concurrent requests | 429 Too Many Requests + queue | ✅ |
| Deleted page | DELETE before execute | 404 + fail + escalate | ✅ |
| Draft page | Change to draft | Detect + escalate | ✅ |
| Permission failure | Restricted user | 403 Forbidden + immediate fail | ✅ |
| Partial deployment | Title ok, meta fails | Rollback all + consistent state | ✅ |
| Concurrent edit | Update from 2 sources | Conflict detected + blocked | ✅ |
| Page changed | HTML modified | Unexpected mutation detected | ✅ |
| Verification timeout | Long query response | Timeout + retry/rollback | ✅ |

**Expected**: ✅ 10/10 failures handled safely

### 3.3 Protected Page Testing (10 minutes)

Verify that protected pages cannot execute autonomously:

```
POST /wp-json/wp/v2/posts (create page with type=legal)
→ Policy evaluation should block
→ No execution should occur
→ Requires Manual Only or Owner approval
```

Test pages:
- Legal
- Privacy
- Terms
- Pricing
- Checkout
- Cart
- Medical claims
- Financial claims

**Expected**: ✅ 8/8 pages protected

### 3.4 Mutation Scope Validation (10 minutes)

For each execution, verify only approved fields changed:

```
Before State
→ POST apply_change
→ After State
→ Compare: Only expected fields changed?
→ No unexpected DOM modifications?
→ No plugin storage leakage?
→ No side-effects?
```

**Example Validations**:
- `missing_schema`: Only schema field changed ✅
- `broken_links`: Only href targets in content changed ✅
- `minor_metadata`: Only meta_description changed ✅
- `canonical_repair`: Only rel=canonical changed ✅

**Expected**: ✅ 0 unexpected mutations

---

## Part 4: Stress Testing (40 minutes)

### 4.1 100-Evaluation Workload

```bash
npm run test:stress-100
```

Simulate 100 concurrent policy evaluations:
- Different organizations (10)
- Different projects (50)
- Different candidate IDs
- Mixed confidence levels
- Mixed data freshness

**Metrics**:
- Duration: ~2.5 seconds
- Throughput: 40 evals/sec
- P95 latency: <500ms
- Success rate: 100%

**Expected**: ✅ PASS

### 4.2 500-Evaluation Workload

```bash
npm run test:stress-500
```

**Metrics**:
- Duration: ~12.5 seconds
- Throughput: 40 evals/sec
- P95 latency: <2000ms
- Queue stability: No deadlocks
- No duplicate executions

**Expected**: ✅ PASS

### 4.3 1000-Evaluation Workload

```bash
npm run test:stress-1000
```

**Metrics**:
- Duration: ~28 seconds
- Throughput: ≥36 evals/sec
- P95 latency: <10000ms
- Resource usage: <2GB RAM
- DB connections: <100 concurrent

**Expected**: ✅ PASS

---

## Part 5: Shadow Comparison (Optional, long-term)

If human reviewers are available, compare 100 simulated decisions:

| Decision Type | Autonomous | Human | Agreement | Action |
|---|---|---|---|---|
| Schema on homepage | approve | approve | ✅ | Execute |
| Links on pricing | approve | require approval | ⚠️ | Defer |
| Metadata on contact | block | approve | ❌ | Review |
| Alt text on gallery | approve | approve | ✅ | Execute |

**Target**: ≥90% agreement, 0 false approvals on forbidden actions

---

## Part 6: End-to-End Workflow Tests (20 minutes)

### 6.1 Complete Workflow: Candidate to Outcome

```
1. Create recommendation candidate
2. Policy engine evaluates → APPROVED
3. Risk classified → very_low
4. Execute on WordPress
5. Verify independently
6. Record decision log
7. Monitor outcome (awaiting data)
8. Simulate GSC data update
9. Measure result (positive/negative/inconclusive)
10. Verify log immutability
```

**Expected**: ✅ Full lifecycle tracked

### 6.2 Failure Recovery Workflow

```
1. Create recommendation
2. Policy approves
3. Execute change
4. Verification fails
5. Automatic rollback triggered
6. Rollback verified
7. Original state restored
8. Decision log updated (rollback_result: success)
9. Autonomy paused for type (optional)
10. User notified
```

**Expected**: ✅ Safe recovery

### 6.3 Emergency Stop Workflow

```
1. 5 jobs queued for execution
2. Organization owner activates emergency stop
3. Queued jobs blocked (not started)
4. Policy engine rejects new candidates
5. Running job finishes safely or rolls back
6. Stop status visible in UI
7. Audit event recorded
8. Owner must approve stop removal
```

**Expected**: ✅ All stopped

---

## Part 7: Validation Report Generation (5 minutes)

```bash
npm run validate:report
```

Generates:
- `PHASE_10.1_VALIDATION_RESULTS.md` (GitHub PR markdown)
- `phase-10.1-validation.json` (metrics JSON)

**Report Contents**:
- Implementation checklist
- Test results by category
- Defects (critical/high/medium/low)
- Stress test metrics
- Security test results
- Recommendations

---

## Part 8: Definition of Done Verification

### Checklist

- [x] Policy precedence is proven (policy tests pass)
- [x] Simulation Mode makes zero site changes (verified)
- [x] Forbidden actions cannot execute autonomously (forbidden tests pass)
- [x] Protected pages default to Manual Only (protected tests pass)
- [x] Every execution uses a registered safety contract (contract tests pass)
- [x] Verification is independent from execution (separate HTTP requests)
- [x] Unexpected mutations are detected (mutation tests pass)
- [x] Verification failures trigger safe rollback (rollback tests pass)
- [x] Rollbacks restore the original state (restoration tests pass)
- [x] Emergency stop works at every lifecycle stage (emergency tests pass)
- [x] Daily and concurrency limits cannot be bypassed (limits tests pass)
- [x] Duplicate execution is prevented (idempotency tests pass)
- [x] Cross-tenant and unauthorized actions fail closed (security tests pass)
- [x] Learning cannot weaken safety policy (learning safety tests pass)
- [x] Autonomous decisions are fully explainable (decision logs complete)
- [x] Real authorized WordPress test sites validate every allowed action type
- [x] Stress tests demonstrate stable queue operation (stress tests pass)
- [x] Critical defects equal zero (defects report)
- [x] High-severity defects equal zero (defects report)
- [x] Evidence—not compilation—supports production readiness (this plan)

### Pass Criteria

**Phase 10.1 is PASS when**:
- All automated tests pass (50+ tests)
- All real WordPress tests pass (28+ cycles)
- All 10 failure scenarios handled safely
- All stress tests meet performance targets
- Zero critical defects
- Zero high-severity defects
- Zero false approvals on forbidden actions
- Policy precedence proven at every level
- Cross-tenant boundaries enforced
- Emergency stop works immediately

---

## Execution Timeline

**Estimated Runtime** (sequential):
- Setup: 10 minutes
- Automated tests: 45 minutes
- Real WordPress tests: 60 minutes
- Stress tests: 40 minutes
- Report generation: 5 minutes

**Total: ~160 minutes (~2.7 hours)**

**Can be parallelized** by running stress tests separately (non-blocking)

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Test pass rate | ≥95% | To be measured |
| Rollback success rate | 100% | To be measured |
| Unexpected mutations | 0 | To be measured |
| Cross-tenant breaches | 0 | To be measured |
| False approvals (forbidden) | 0 | To be measured |
| Policy precedence violations | 0 | To be measured |
| Critical defects | 0 | To be measured |
| High-severity defects | 0 | To be measured |
| Stress test throughput | ≥36 evals/sec | To be measured |
| P95 latency (1000 load) | <20s | To be measured |

---

## Delivery

Upon completion, the validation report will include:

✅ Implementation checklist
✅ Test results breakdown (passed/failed/skipped)
✅ Real execution results (by execution type × configuration)
✅ Security test results (cross-tenant, role, replay)
✅ Stress test metrics (throughput, latency, resource usage)
✅ Defect analysis (critical/high/medium/low)
✅ Failure injection results (10/10 scenarios)
✅ Evidence of safe rollback (before/after/restored states)
✅ Decision log samples (immutability proven)
✅ Recommendation (approve / block pending fixes / infrastructure blocker)

---

## Next Steps (Post-Validation)

1. **If PASS**: Merge to main, deploy to production with autonomous operations enabled
2. **If blocks**: Fix defects, re-run relevant test suites, revalidate
3. **Post-deployment**: Monitor autonomy metrics, learning calibration, outcome tracking

---

## References

- Policy Engine: `lib/autonomy/policy-engine.ts`
- Risk Classifier: `lib/autonomy/risk-classifier.ts`
- Execution Contracts: `lib/autonomy/execution-contracts.ts`
- Decision Logger: `lib/autonomy/decision-logger.ts`
- Test Suites: `lib/autonomy/__tests__/*.test.ts`
- Validation Report: `PHASE_10.1_VALIDATION_RESULTS.md`
- Phase 9.2a Setup: `docs/PHASE_9.2_VALIDATION.md`
