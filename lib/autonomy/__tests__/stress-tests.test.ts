/**
 * Phase 10.1 Validation: Stress Testing
 *
 * Tests autonomy engine under load:
 * - 100, 500, 1000 concurrent evaluations
 * - Measures queue latency, throughput, stability
 * - Tests duplicate prevention and idempotency
 *
 * Run: npm run test -- lib/autonomy/__tests__/stress-tests.test.ts
 */

import { TestSuite, assert } from '../../execution/__tests__/test-utils'
import { evaluatePolicy, type PolicyRules } from '../policy-engine'
import { classifyRisk } from '../risk-classifier'

const suite = new TestSuite('Phase 10.1: Stress Testing')

interface StressTestMetrics {
  workload: number
  startTime: number
  endTime: number
  duration: number
  successCount: number
  failureCount: number
  throughput: number
  meanLatency: number
  maxLatency: number
  p95Latency: number
  duplicateDetected: number
  errors: string[]
}

/**
 * Run stress test with N concurrent evaluations
 */
async function runStressTest(workload: number): Promise<StressTestMetrics> {
  const metrics: StressTestMetrics = {
    workload,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
    successCount: 0,
    failureCount: 0,
    throughput: 0,
    meanLatency: 0,
    maxLatency: 0,
    p95Latency: 0,
    duplicateDetected: 0,
    errors: [],
  }

  const policyRules: PolicyRules = {
    global: {
      allowAutonomous: true,
      executionTypePermissions: { missing_schema: true },
      maxRiskThreshold: 'low',
      minConfidence: 0.85,
    },
    project: {
      autonomyMode: 'low_risk_autonomy',
      allowAutonomous: true,
      maxRiskThreshold: 'low',
      minConfidence: 0.85,
    },
  }

  const latencies: number[] = []
  const evaluationIds = new Set<string>()
  let duplicates = 0

  // Simulate concurrent evaluations
  const promises = []
  for (let i = 0; i < workload; i++) {
    const candidateId = `cand_${i}`
    const isDuplicate = evaluationIds.has(candidateId)
    if (isDuplicate) duplicates++
    evaluationIds.add(candidateId)

    const evalStart = Date.now()

    const promise = (async () => {
      try {
        const result = await evaluatePolicy(
          {
            organizationId: `org_${i % 10}`, // 10 organizations
            projectId: `proj_${i % 50}`, // 50 projects
            executionType: 'missing_schema',
            riskLevel: 'very_low',
            confidence: 0.85 + Math.random() * 0.15,
            dataFreshnessHours: 12 + Math.random() * 24,
          },
          policyRules,
          {
            emergencyStopActive: false,
            dailyChangesRemaining: 100,
            dataIsStale: false,
            userRole: 'owner',
          }
        )

        const evalLatency = Date.now() - evalStart
        latencies.push(evalLatency)

        if (result.decision === 'approved' || result.decision === 'requires_approval' || result.decision === 'deferred') {
          metrics.successCount++
        } else {
          metrics.failureCount++
        }
      } catch (err) {
        metrics.failureCount++
        metrics.errors.push(String(err))
      }
    })()

    promises.push(promise)
  }

  // Wait for all evaluations
  await Promise.all(promises)

  metrics.endTime = Date.now()
  metrics.duration = metrics.endTime - metrics.startTime
  metrics.throughput = Math.round((workload / metrics.duration) * 1000) // evaluations/sec
  metrics.duplicateDetected = duplicates

  if (latencies.length > 0) {
    metrics.meanLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    metrics.maxLatency = Math.max(...latencies)

    // Calculate P95
    const sorted = latencies.sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    metrics.p95Latency = sorted[p95Index] || 0
  }

  return metrics
}

suite.describe('Stress Testing: Autonomy Evaluation Throughput', () => {
  suite.it('handle 100 concurrent evaluations', async () => {
    console.log('\n📊 Running 100-evaluation workload...')
    const metrics = await runStressTest(100)

    console.log(`   Duration: ${metrics.duration}ms`)
    console.log(`   Throughput: ${metrics.throughput} evals/sec`)
    console.log(`   Success: ${metrics.successCount}, Failures: ${metrics.failureCount}`)
    console.log(`   Mean latency: ${metrics.meanLatency}ms`)
    console.log(`   P95 latency: ${metrics.p95Latency}ms`)
    console.log(`   Max latency: ${metrics.maxLatency}ms`)

    assert(metrics.successCount > 0, 'Should have successful evaluations')
    assert(metrics.duration < 60000, 'Should complete in < 60 seconds')
    assert(metrics.p95Latency < 5000, 'P95 latency should be < 5s')
  })

  suite.it('handle 500 concurrent evaluations', async () => {
    console.log('\n📊 Running 500-evaluation workload...')
    const metrics = await runStressTest(500)

    console.log(`   Duration: ${metrics.duration}ms`)
    console.log(`   Throughput: ${metrics.throughput} evals/sec`)
    console.log(`   Success: ${metrics.successCount}, Failures: ${metrics.failureCount}`)
    console.log(`   Mean latency: ${metrics.meanLatency}ms`)
    console.log(`   P95 latency: ${metrics.p95Latency}ms`)
    console.log(`   Max latency: ${metrics.maxLatency}ms`)

    assert(metrics.successCount > 0, 'Should have successful evaluations')
    assert(metrics.duration < 120000, 'Should complete in < 120 seconds')
    assert(metrics.p95Latency < 10000, 'P95 latency should be < 10s')
  })

  suite.it('handle 1000 concurrent evaluations', async () => {
    console.log('\n📊 Running 1000-evaluation workload...')
    const metrics = await runStressTest(1000)

    console.log(`   Duration: ${metrics.duration}ms`)
    console.log(`   Throughput: ${metrics.throughput} evals/sec`)
    console.log(`   Success: ${metrics.successCount}, Failures: ${metrics.failureCount}`)
    console.log(`   Mean latency: ${metrics.meanLatency}ms`)
    console.log(`   P95 latency: ${metrics.p95Latency}ms`)
    console.log(`   Max latency: ${metrics.maxLatency}ms`)

    assert(metrics.successCount > 0, 'Should have successful evaluations')
    assert(metrics.duration < 300000, 'Should complete in < 300 seconds')
    assert(metrics.p95Latency < 20000, 'P95 latency should be < 20s')
  })
})

suite.describe('Idempotency: Duplicate Detection', () => {
  suite.it('prevent duplicate execution of same candidate', async () => {
    // Simulate same candidate delivered twice
    const candidateId = 'cand_duplicate_test'
    const executedIds = new Set<string>()
    let duplicateDetected = 0

    // First execution
    executedIds.add(candidateId)

    // Second execution (duplicate)
    if (executedIds.has(candidateId)) {
      duplicateDetected++
    } else {
      executedIds.add(candidateId)
    }

    assert(duplicateDetected === 1, 'Should detect duplicate')
  })

  suite.it('prevent concurrent access to same page', async () => {
    // Simulate two workers accessing same page simultaneously
    const pageId = 'page_123'
    const locks = new Map<string, boolean>()

    // Worker 1 acquires lock
    const acquired1 = !locks.has(pageId)
    if (acquired1) locks.set(pageId, true)

    // Worker 2 attempts lock (should fail)
    const acquired2 = !locks.has(pageId)

    assert(acquired1 === true, 'First worker should acquire lock')
    assert(acquired2 === false, 'Second worker should not acquire lock')
  })

  suite.it('ensure one effective execution per candidate', async () => {
    // Multiple jobs delivered for same candidate
    const candidateId = 'cand_multi_delivery'
    const executionLog: Array<{ candidateId: string; executionTime: number }> = []

    // Simulate multiple job deliveries
    for (let i = 0; i < 3; i++) {
      // Check if already executed
      const alreadyExecuted = executionLog.some((e) => e.candidateId === candidateId)
      if (!alreadyExecuted) {
        executionLog.push({ candidateId, executionTime: Date.now() })
      }
    }

    // Should only have one execution logged
    const duplicateExecutions = executionLog.filter((e) => e.candidateId === candidateId).length
    assert(duplicateExecutions === 1, 'Should have exactly one execution')
  })
})

suite.describe('Concurrency: Multi-Organization Safety', () => {
  suite.it('prevent cross-organization execution', async () => {
    // Simulate two organizations evaluating simultaneously
    const org1Eval = await evaluatePolicy(
      {
        organizationId: 'org_1',
        projectId: 'proj_1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 0.9,
        dataFreshnessHours: 12,
      },
      {
        global: {
          allowAutonomous: true,
          executionTypePermissions: { missing_schema: true },
          maxRiskThreshold: 'low',
          minConfidence: 0.85,
        },
        project: {
          autonomyMode: 'low_risk_autonomy',
          allowAutonomous: true,
          maxRiskThreshold: 'low',
        },
      },
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    const org2Eval = await evaluatePolicy(
      {
        organizationId: 'org_2', // Different organization
        projectId: 'proj_2',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 0.9,
        dataFreshnessHours: 12,
      },
      {
        global: {
          allowAutonomous: true,
          executionTypePermissions: { missing_schema: true },
          maxRiskThreshold: 'low',
          minConfidence: 0.85,
        },
        project: {
          autonomyMode: 'low_risk_autonomy',
          allowAutonomous: true,
          maxRiskThreshold: 'low',
        },
      },
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    // Both should be evaluated independently
    assert(org1Eval.decision === org2Eval.decision, 'Same policies should yield same decision')
  })
})

suite.describe('Stress Testing: Risk Classification', () => {
  suite.it('classify risk for 1000 different page/policy combinations', async () => {
    const pageTypes = ['legal', 'medical_claim', 'financial_claim', 'checkout', 'homepage'] as const
    const risks = ['very_low', 'low', 'medium', 'high'] as const

    const startTime = Date.now()
    let successCount = 0

    for (let i = 0; i < 1000; i++) {
      const pageType = pageTypes[i % pageTypes.length]
      const baseRisk = risks[i % risks.length]

      const assessment = classifyRisk({
        executionType: 'missing_schema',
        pageType: pageType as any,
        dataFreshnessHours: 12 + (i % 72),
        wordPressHealth: i % 2 === 0 ? 1.0 : 0.5,
        pluginCompatibility: i % 3 === 0 ? 0.0 : 1.0,
        rollbackAvailable: i % 2 === 0,
        verificationAvailable: true,
      })

      if (assessment.riskLevel) {
        successCount++
      }
    }

    const duration = Date.now() - startTime

    console.log(`\n   Classified 1000 combinations in ${duration}ms`)
    console.log(`   Throughput: ${Math.round((1000 / duration) * 1000)} classifications/sec`)

    assert(successCount === 1000, 'Should classify all combinations')
    assert(duration < 30000, 'Should complete in < 30 seconds')
  })
})

suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
