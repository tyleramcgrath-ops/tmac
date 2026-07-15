/**
 * Phase 10.1 Validation: Policy Precedence Tests
 *
 * Verify that the most restrictive policy always wins.
 * Global > Organization > Project (in restriction strength)
 */

import { TestSuite, assert, assertEqual } from '../../execution/__tests__/test-utils'
import { evaluatePolicy, type PolicyRules } from '../policy-engine'

const suite = new TestSuite('Policy Precedence Tests')

suite.describe('Policy Precedence: Most Restrictive Wins', () => {
  suite.it('global disallow overrides org allow', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: false,
        executionTypePermissions: { missing_schema: false },
        maxRiskThreshold: 'very_low',
        minConfidence: 0.85,
      },
      organization: {
        allowAutonomous: true,
        maxRiskThreshold: 'low',
        minConfidence: 0.8,
      },
      project: {
        autonomyMode: 'low_risk_autonomy',
        allowAutonomous: true,
        maxRiskThreshold: 'low',
        minConfidence: 0.8,
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 0.9,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Global policy should block')
    assert(result.blockedBy === 'global_policy' || result.blockedBy === 'project_policy', 'Should identify policy source')
  })

  suite.it('organization restrict overrides project allow', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'critical',
        minConfidence: 0.5,
      },
      organization: {
        allowAutonomous: false,
        maxRiskThreshold: 'very_low',
      },
      project: {
        autonomyMode: 'low_risk_autonomy',
        allowAutonomous: true,
        maxRiskThreshold: 'low',
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'low',
        confidence: 0.9,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Organization policy should block')
  })

  suite.it('project risk threshold overrides org and global', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'high',
        minConfidence: 0.8,
      },
      organization: {
        allowAutonomous: true,
        maxRiskThreshold: 'medium',
      },
      project: {
        autonomyMode: 'low_risk_autonomy',
        allowAutonomous: true,
        maxRiskThreshold: 'very_low',
        maxRiskThreshold: 'low',
        minConfidence: 0.95,
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'medium',
        confidence: 0.9,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Project threshold should block medium-risk')
  })

  suite.it('confidence threshold must be met at all levels', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'low',
        minConfidence: 0.9,
      },
      organization: {
        allowAutonomous: true,
        minConfidence: 0.85,
      },
      project: {
        autonomyMode: 'low_risk_autonomy',
        allowAutonomous: true,
        minConfidence: 0.8,
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 0.88, // Fails global 0.9
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Should fail global confidence threshold')
    assert(result.reason.includes('Confidence'), 'Should explain confidence issue')
  })

  suite.it('emergency stop blocks even if all policies permit', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
      organization: {
        allowAutonomous: true,
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
      project: {
        autonomyMode: 'low_risk_autonomy',
        allowAutonomous: true,
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 1.0,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: true,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Emergency stop must override all')
    assertEqual(result.blockedBy, 'emergency_stop', 'Should identify as emergency stop')
  })

  suite.it('approval_required mode requires approval for non-very-low-risk', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { broken_links: true },
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
      organization: null,
      project: {
        autonomyMode: 'approval_required',
        allowAutonomous: true,
        maxRiskThreshold: 'critical',
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'broken_links',
        riskLevel: 'low',
        confidence: 0.9,
        dataFreshnessHours: 24,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'requires_approval', 'Approval-required mode should require approval')
  })

  suite.it('simulation_only mode defers all executions', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
      organization: null,
      project: {
        autonomyMode: 'simulation_only',
        allowAutonomous: true,
        maxRiskThreshold: 'critical',
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 1.0,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'deferred', 'Simulation mode should defer')
  })

  suite.it('disabled mode blocks all executions', async () => {
    const rules: PolicyRules = {
      global: {
        allowAutonomous: true,
        executionTypePermissions: { missing_schema: true },
        maxRiskThreshold: 'critical',
        minConfidence: 0.0,
      },
      organization: null,
      project: {
        autonomyMode: 'disabled',
        allowAutonomous: false,
        maxRiskThreshold: 'critical',
      },
    }

    const result = await evaluatePolicy(
      {
        organizationId: 'org1',
        projectId: 'proj1',
        executionType: 'missing_schema',
        riskLevel: 'very_low',
        confidence: 1.0,
        dataFreshnessHours: 12,
      },
      rules,
      {
        emergencyStopActive: false,
        dailyChangesRemaining: 100,
        dataIsStale: false,
        userRole: 'owner',
      }
    )

    assertEqual(result.decision, 'blocked', 'Disabled mode should block')
  })
})

suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
