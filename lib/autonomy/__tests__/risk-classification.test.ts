/**
 * Phase 10.1 Validation: Risk Classification Tests
 *
 * Verify accurate risk assessment and calibration.
 */

import { TestSuite, assert, assertEqual } from '../../execution/__tests__/test-utils'
import { classifyRisk, explainRisk } from '../risk-classifier'

const suite = new TestSuite('Risk Classification Tests')

suite.describe('Risk Classification Engine', () => {
  suite.it('missing schema is very_low risk base', async () => {
    const assessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assertEqual(assessment.riskLevel, 'very_low', 'Missing schema should be very_low')
    assert(assessment.riskScore < 0.2, 'Score should be < 0.2')
  })

  suite.it('broken links is low risk base', async () => {
    const assessment = classifyRisk({
      executionType: 'broken_links',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assertEqual(assessment.riskLevel, 'low', 'Broken links should be low')
  })

  suite.it('medical pages increase risk significantly', async () => {
    const baseAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const medicalAssessment = classifyRisk({
      executionType: 'missing_schema',
      pageType: 'medical_claim',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assert(medicalAssessment.riskScore > baseAssessment.riskScore, 'Medical pages should increase risk')
  })

  suite.it('stale data increases risk', async () => {
    const freshAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const staleAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 72,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assert(staleAssessment.riskScore > freshAssessment.riskScore, 'Stale data should increase risk')
  })

  suite.it('unhealthy wordpress increases risk significantly', async () => {
    const healthyAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const unhealthyAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assert(unhealthyAssessment.riskScore > healthyAssessment.riskScore + 0.25, 'Unhealthy WP adds 30%+ risk')
  })

  suite.it('incompatible plugin increases risk', async () => {
    const compatibleAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const incompatibleAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assert(incompatibleAssessment.riskScore > compatibleAssessment.riskScore, 'Incompatible plugin should increase risk')
  })

  suite.it('missing rollback significantly increases risk', async () => {
    const rollbackAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const noRollbackAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: false,
      verificationAvailable: true,
    })

    assert(noRollbackAssessment.riskScore > rollbackAssessment.riskScore + 0.3, 'No rollback adds 35%+ risk')
  })

  suite.it('missing verification increases risk', async () => {
    const verifyAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const noVerifyAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: false,
    })

    assert(noVerifyAssessment.riskScore > verifyAssessment.riskScore, 'No verification should increase risk')
  })

  suite.it('concurrent changes increase risk', async () => {
    const noChangesAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
      concurrentChanges: false,
    })

    const concurrentAssessment = classifyRisk({
      executionType: 'missing_schema',
      dataFreshnessHours: 12,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
      concurrentChanges: true,
    })

    assert(concurrentAssessment.riskScore > noChangesAssessment.riskScore, 'Concurrent changes should increase risk')
  })

  suite.it('risk explanations are clear', async () => {
    const assessment = classifyRisk({
      executionType: 'missing_schema',
      pageType: 'medical_claim',
      dataFreshnessHours: 72,
      wordPressHealth: 0.5,
      pluginCompatibility: 0.5,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    const explanations = explainRisk(
      {
        executionType: 'missing_schema',
        pageType: 'medical_claim',
        dataFreshnessHours: 72,
        wordPressHealth: 0.5,
        pluginCompatibility: 0.5,
        rollbackAvailable: true,
        verificationAvailable: true,
      },
      assessment
    )

    assert(explanations.length > 0, 'Should have explanations')
    assert(explanations.some((e) => e.includes('Base risk')), 'Should explain base risk')
    assert(explanations.some((e) => e.includes('medical')), 'Should mention medical page type')
    assert(explanations.some((e) => e.includes('stale')), 'Should mention data staleness')
  })

  suite.it('risk score bounded at 1.0', async () => {
    const assessment = classifyRisk({
      executionType: 'missing_schema',
      pageType: 'financial_claim',
      dataFreshnessHours: 168,
      wordPressHealth: 0,
      pluginCompatibility: 0,
      rollbackAvailable: false,
      verificationAvailable: false,
      concurrentChanges: true,
      hasRecentManualEdit: true,
    })

    assert(assessment.riskScore <= 1.0, 'Risk score should not exceed 1.0')
    assertEqual(assessment.riskLevel, 'critical', 'Accumulation should result in critical')
  })

  suite.it('very_low risk score produces very_low level', async () => {
    const assessment = classifyRisk({
      executionType: 'missing_alt_text',
      dataFreshnessHours: 6,
      wordPressHealth: 1.0,
      pluginCompatibility: 1.0,
      rollbackAvailable: true,
      verificationAvailable: true,
    })

    assertEqual(assessment.riskLevel, 'very_low', 'Ideal conditions should be very_low')
    assert(assessment.riskScore < 0.15, 'Very low should score < 0.15')
  })
})

suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
