/**
 * Phase 10.1 Validation: Forbidden Actions Tests
 *
 * Prove that RankForge never autonomously performs forbidden actions.
 * Negative tests for safety.
 */

import { TestSuite, assert } from '../../execution/__tests__/test-utils'
import { validateContractCompliance, EXECUTION_CONTRACTS } from '../execution-contracts'
import type { ExecutionType, PageType, RiskLevel } from '../types'

const suite = new TestSuite('Forbidden Actions Tests')

const FORBIDDEN_ACTIONS = {
  rewriteFullPages: 'full_page_rewrite' as ExecutionType | 'full_page_rewrite', // Not a real type
  deletePages: 'page_deletion' as ExecutionType | 'page_deletion',
  mergePages: 'page_merge' as ExecutionType | 'page_merge',
  redirectPages: 'page_redirect' as ExecutionType | 'page_redirect',
  publishNewPages: 'publish_new' as ExecutionType | 'publish_new',
  changePricing: 'modify_pricing' as ExecutionType | 'modify_pricing',
  changeLegal: 'modify_legal' as ExecutionType | 'modify_legal',
  changeCheckout: 'modify_checkout' as ExecutionType | 'modify_checkout',
  changeForms: 'modify_forms' as ExecutionType | 'modify_forms',
  changeAuth: 'modify_auth' as ExecutionType | 'modify_auth',
  changeUGC: 'modify_ugc' as ExecutionType | 'modify_ugc',
  changeMedicalClaims: 'modify_medical' as ExecutionType | 'modify_medical',
  changeFinancialClaims: 'modify_financial' as ExecutionType | 'modify_financial',
} as const

suite.describe('Forbidden Autonomous Actions', () => {
  suite.it('no contract registered for full page rewrite', async () => {
    const executionType = 'full_page_rewrite' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Full page rewrite should have no registered contract')
  })

  suite.it('no contract for page deletion', async () => {
    const executionType = 'page_deletion' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Page deletion should have no registered contract')
  })

  suite.it('no contract for page merge', async () => {
    const executionType = 'page_merge' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Page merge should have no registered contract')
  })

  suite.it('no contract for page redirect', async () => {
    const executionType = 'page_redirect' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Page redirect should have no registered contract')
  })

  suite.it('no contract for publishing new pages', async () => {
    const executionType = 'publish_new' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Publishing new pages should have no registered contract')
  })

  suite.it('no contract for modifying pricing', async () => {
    const executionType = 'modify_pricing' as unknown as ExecutionType
    const contract = EXECUTION_CONTRACTS[executionType as ExecutionType]

    assert(!contract, 'Modifying pricing should have no registered contract')
  })

  suite.it('schema execution forbids medical pages', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      pageType: 'medical_claim',
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Medical pages should be forbidden')
    assert(result.violations.length > 0, 'Should have violations')
  })

  suite.it('schema execution forbids financial pages', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      pageType: 'financial_claim',
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Financial pages should be forbidden')
  })

  suite.it('schema execution forbids checkout pages', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      pageType: 'checkout',
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Checkout pages should be forbidden')
  })

  suite.it('schema execution forbids legal pages', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      pageType: 'legal',
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Legal pages should be forbidden')
  })

  suite.it('broken links execution forbids checkout pages', async () => {
    const result = validateContractCompliance('broken_links', {
      riskLevel: 'low',
      confidence: 0.85,
      pageType: 'checkout',
      batchSize: 1,
      affectedFields: ['internal_links'],
    })

    assert(!result.compliant, 'Checkout pages should be forbidden for link changes')
  })

  suite.it('only allowed mutations are permitted', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      batchSize: 1,
      affectedFields: ['schema', 'unauthorized_field'],
    })

    assert(!result.compliant, 'Unauthorized field should violate contract')
    assert(
      result.violations.some((v) => v.includes('Forbidden field')),
      'Should explain forbidden field mutation'
    )
  })

  suite.it('batch size limits enforced', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.95,
      batchSize: 50, // Schema contract max is 20
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Batch size should be enforced')
    assert(result.violations.some((v) => v.includes('Batch size')), 'Should explain batch size violation')
  })

  suite.it('high risk execution forbidden in very_low-only mode', async () => {
    // Simulating an execution that tries high-risk on a low-risk-only type
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'high', // Contract max is very_low
      confidence: 0.95,
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'High risk should exceed contract')
  })

  suite.it('confidence threshold must be met', async () => {
    const result = validateContractCompliance('missing_schema', {
      riskLevel: 'very_low',
      confidence: 0.7, // Contract minimum is 0.85
      batchSize: 1,
      affectedFields: ['schema'],
    })

    assert(!result.compliant, 'Low confidence should violate contract')
  })

  suite.it('canonical repair forbidden on login pages', async () => {
    const result = validateContractCompliance('canonical_repair', {
      riskLevel: 'low',
      confidence: 0.95,
      pageType: 'login',
      batchSize: 1,
      affectedFields: ['canonical_link'],
    })

    assert(!result.compliant, 'Login pages should be forbidden for canonical repair')
  })

  suite.it('link changes forbidden on billing pages', async () => {
    const result = validateContractCompliance('broken_links', {
      riskLevel: 'low',
      confidence: 0.85,
      pageType: 'billing',
      batchSize: 1,
      affectedFields: ['internal_links'],
    })

    assert(!result.compliant, 'Billing pages should be forbidden for link changes')
  })
})

suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
