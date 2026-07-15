# Phase 9.2a: WordPress Real-World Validation

Comprehensive validation of the Execution Engine against real WordPress instances.

## Overview

Phase 9.2a proves that the execution engine can:
- Execute all 13 execution types on real WordPress sites
- Verify changes at the HTML level (not just API responses)
- Rollback changes completely and safely
- Recover gracefully from 10+ failure scenarios
- Operate consistently across different SEO plugins (Yoast, Rank Math, AIOSEO)

## Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 22+
- 8GB available disk space

### Start Test Environment

```bash
# Start WordPress containers (clean, Yoast, Rank Math, AIOSEO)
npm run docker:up

# Wait ~60 seconds for containers to fully initialize
# Check status:
npm run docker:logs

# Containers are ready when you see:
# "Ready for connections" in MySQL logs
# "AH00094: Command line activated" in Apache logs
```

### Access Test Environments

| Environment | URL | Plugins |
|---|---|---|
| Clean | http://localhost:8001 | None |
| Yoast | http://localhost:8002 | Yoast SEO |
| Rank Math | http://localhost:8003 | Rank Math |
| AIOSEO | http://localhost:8004 | All in One SEO |

**Default Credentials (all instances)**
- Username: `admin`
- Password: (set by Docker)

## Running Validation Tests

### Full Validation Suite

```bash
npm run test:wordpress-validation
```

This runs:
1. **Execution Type Validation** - All 13 types across all environments
2. **Failure Injection** - 10 failure scenarios
3. **Rollback Validation** - Execute → Rollback → Verify cycle
4. **Multi-Environment** - Cross-plugin consistency

### Expected Output

```
✅ Execution Engine Tests: 52/52 PASSED
  - 13 types × 4 environments × (execute + rollback)
  - Success rate: 98%+

✅ Failure Handling: 10/10 DETECTED
  - WordPress timeout: ✅ detected & recovered
  - Network interruption: ✅ handled gracefully
  - Invalid credentials: ✅ rejected safely
  - API rate limiting: ✅ queued correctly
  - Plugin conflict: ✅ escalated to operator
  - Concurrent edit: ✅ conflict detected
  - Deleted page: ✅ 404 detected
  - Draft page: ✅ draft status flagged
  - Permission failure: ✅ 403 rejected
  - Partial deployment: ✅ rolled back atomically

✅ Rollback Validation: 13/13 COMPLETE
  - Title updates: before/after/rollback verified
  - Meta descriptions: before/after/rollback verified
  - Schema additions: before/after/rollback verified
  - ... (all 13 types)
```

## Test Files

### Core Validation
- `lib/execution/validator.ts` - Execution validation harness
- `lib/execution/failure-injection.ts` - Failure scenario injection
- `lib/execution/__tests__/wordpress-validation.test.ts` - Test suite

### Infrastructure
- `docker-compose.test.yml` - WordPress test environment definition
- `scripts/setup-wordpress-test.sh` - Setup script
- `package.json` - npm scripts for Docker & testing

## Validation Details

### Execution Type Validation

For each of 13 execution types, the validator:

1. **Captures Before State**
   - WordPress post data via REST API
   - Page HTML via browser fetch
   - Metadata, schema, links, robots directives
   - SEO plugin-specific fields

2. **Executes Change**
   - Applies execution via WordPress REST API
   - Uses correct plugin meta fields
   - Handles multipart/form-data if needed

3. **Captures After State**
   - Same detailed snapshot as before

4. **Compares States**
   - Verifies expected changes occurred
   - Detects unexpected side effects
   - Compares field-by-field

5. **Rolls Back Change**
   - Applies rollback payload
   - Restores original values

6. **Verifies Rollback**
   - Captures post-rollback state
   - Compares with original state
   - Confirms complete restoration

### Failure Injection Scenarios

| Scenario | Simulation | Expected Behavior |
|---|---|---|
| **WordPress Timeout** | 10ms HTTP timeout | Fail with timeout error; no changes; enable retry |
| **Network Interruption** | (requires proxy) | Detect partial request; safe state |
| **Invalid Credentials** | Wrong auth header | 401 Unauthorized; reject immediately |
| **API Rate Limiting** | 50 concurrent requests | 429 Too Many Requests; queue & backoff |
| **Plugin Conflict** | (requires test plugin) | Plugin filter rejects; no partial state |
| **Concurrent Edit** | Update page from 2 sources | Detect conflict; fail or merge carefully |
| **Deleted Page** | DELETE then execute | 404; no changes; escalate |
| **Draft Page** | Change status to draft | Detect draft; escalate if required published |
| **Permission Failure** | Restricted API user | 403 Forbidden; reject immediately |
| **Partial Deployment** | Update title, fail on meta | Detect partial; atomic rollback |

Each scenario tests:
- Detection by execution engine ✅
- Safe recovery ✅
- No site inconsistency ✅
- Proper logging & escalation ✅

### Rollback Validation

For each execution type:

```
Before State
    ↓
  Execute
    ↓
After State (verify change occurred)
    ↓
  Rollback
    ↓
Final State (verify = Before State)
```

Requirements:
- ✅ After State must differ from Before State
- ✅ Final State must exactly match Before State
- ✅ Rollback must complete without errors
- ✅ No orphaned changes on rollback failure

## Interpreting Results

### Success Criteria

Phase 9.2a validation is **PASS** when:

```
✅ Execution Type Validation: ≥ 80% success across all types/environments
✅ Failure Injection: ≥ 80% detected, ≥ 90% recovered safely
✅ Rollback Validation: 100% complete restoration
✅ Multi-Environment: All plugin combinations validated
❌ No site inconsistencies after any test
```

### Common Failures & Recovery

**"No changes detected"**
- Verify WordPress is writable
- Check auth credentials (Admin must have edit_posts capability)
- Verify SEO plugin meta fields are registered

**"Rollback did not restore"**
- Plugin may override values
- Check for post revisions to understand what changed
- Verify rollback payload includes all fields

**"Connection refused"**
- WordPress container may still be starting
- Wait 60+ seconds after `docker up`
- Check `npm run docker:logs` for errors

## Metrics Tracked

Each execution records:

```javascript
{
  executionType: "update_seo_title",
  environment: "yoast",
  status: "passed",
  executionDuration: 234,      // ms
  verificationDuration: 456,    // ms
  rollbackDuration: 189,        // ms
  errors: [],
  warnings: [],
  evidence: {
    beforeState: { ... },
    afterState: { ... },
    rollbackState: { ... }
  }
}
```

Used to measure:
- Execution speed
- Success rate by type
- Success rate by plugin
- Failure modes
- Rollback reliability

## Cleanup

```bash
# Stop containers
npm run docker:down

# Remove all data and volumes
docker-compose -f docker-compose.test.yml down -v

# View logs before cleanup
npm run docker:logs
```

## Next Steps

After Phase 9.2a validation passes:

- **Phase 9.2b**: Autonomous Execution (policy-controlled automation)
- **Phase 9.2c**: Campaign Execution (multi-step, dependency-aware)
- **Phase 9.2d**: Outcome Measurement (track real SEO impact over time)

## Troubleshooting

### WordPress containers keep restarting

```bash
# Check logs
npm run docker:logs

# Full restart
npm run docker:down
npm run docker:up
```

### Tests timeout waiting for WordPress

```bash
# WordPress database takes time to initialize
# Increase wait time in setup-wordpress-test.sh from 60s to 120s
# Or manually verify with:
curl http://localhost:8001/wp-json/
```

### "Authentication failed"

WordPress needs REST API access enabled:
- Check `wp-json` endpoint is accessible
- Verify admin user exists
- Create app password in WordPress UI (Users > Select Admin > App Passwords)

### Tests pass locally but fail on Vercel

Local Docker ≠ Vercel CI environment. Phase 9.2a validation is **local-only** for now. Production validation will be in Phase 9.3 with dedicated test WordPress hosting.

## References

- Execution Engine: `/lib/execution`
- Validator: `/lib/execution/validator.ts`
- Failure Injection: `/lib/execution/failure-injection.ts`
- Phase 9.1: `/docs/PHASE_9.1_COMPLETION_REPORT.md`
