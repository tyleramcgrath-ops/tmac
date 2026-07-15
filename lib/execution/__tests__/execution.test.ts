/**
 * Phase 9.1: Execution Engine Tests
 *
 * Tests for execution type definitions, validation, and state management
 */

import { TestSuite, assert, assertEqual } from './test-utils'
import {
  EXECUTION_TYPES,
  validateExecutionType,
  getExecutionType,
  type ExecutionType,
} from '../types'

const suite = new TestSuite('Execution Engine')

suite.describe('Execution Type Definitions', () => {
  suite.it('should have 13 execution types defined', () => {
    const types = Object.keys(EXECUTION_TYPES)
    assertEqual(types.length, 13, `Expected 13 execution types, got ${types.length}`)
  })

  suite.it('should define update_seo_title', () => {
    const type = EXECUTION_TYPES.update_seo_title
    assert(type !== undefined, 'update_seo_title not defined')
    assertEqual(type.category, 'metadata')
    assertEqual(type.risk, 'low')
    assert(type.reversible, 'update_seo_title should be reversible')
  })

  suite.it('should define update_meta_description', () => {
    const type = EXECUTION_TYPES.update_meta_description
    assert(type !== undefined, 'update_meta_description not defined')
    assertEqual(type.category, 'metadata')
    assertEqual(type.risk, 'low')
  })

  suite.it('should define add_schema', () => {
    const type = EXECUTION_TYPES.add_schema
    assert(type !== undefined, 'add_schema not defined')
    assertEqual(type.category, 'schema')
    assert(type.verificationChecks.length > 0, 'add_schema should have verification checks')
  })

  suite.it('should define add_internal_links', () => {
    const type = EXECUTION_TYPES.add_internal_links
    assert(type !== undefined, 'add_internal_links not defined')
    assertEqual(type.category, 'links')
  })

  suite.it('should define add_faq', () => {
    const type = EXECUTION_TYPES.add_faq
    assert(type !== undefined, 'add_faq not defined')
    assertEqual(type.category, 'content')
  })

  suite.it('should define improve_headings', () => {
    const type = EXECUTION_TYPES.improve_headings
    assert(type !== undefined, 'improve_headings not defined')
    assertEqual(type.category, 'content')
  })

  suite.it('should define update_image_alt', () => {
    const type = EXECUTION_TYPES.update_image_alt
    assert(type !== undefined, 'update_image_alt not defined')
    assertEqual(type.category, 'content')
  })

  suite.it('should define update_content', () => {
    const type = EXECUTION_TYPES.update_content
    assert(type !== undefined, 'update_content not defined')
    assertEqual(type.category, 'content')
    assertEqual(type.risk, 'medium')
  })

  suite.it('should define add_redirect', () => {
    const type = EXECUTION_TYPES.add_redirect
    assert(type !== undefined, 'add_redirect not defined')
    assertEqual(type.category, 'redirects')
    assertEqual(type.risk, 'high')
  })

  suite.it('should define update_sitemap', () => {
    const type = EXECUTION_TYPES.update_sitemap
    assert(type !== undefined, 'update_sitemap not defined')
    assertEqual(type.category, 'technical')
  })

  suite.it('should define improve_indexation', () => {
    const type = EXECUTION_TYPES.improve_indexation
    assert(type !== undefined, 'improve_indexation not defined')
    assertEqual(type.category, 'technical')
  })

  suite.it('should define update_canonical', () => {
    const type = EXECUTION_TYPES.update_canonical
    assert(type !== undefined, 'update_canonical not defined')
    assertEqual(type.category, 'technical')
  })

  suite.it('should define update_robots', () => {
    const type = EXECUTION_TYPES.update_robots
    assert(type !== undefined, 'update_robots not defined')
    assertEqual(type.category, 'technical')
    assertEqual(type.risk, 'high')
  })
})

suite.describe('Execution Type Validation', () => {
  suite.it('should validate correct execution types', () => {
    const validTypes: ExecutionType[] = [
      'update_seo_title',
      'update_meta_description',
      'add_schema',
      'add_internal_links',
      'update_robots',
    ]

    for (const type of validTypes) {
      assert(validateExecutionType(type), `Should validate ${type}`)
    }
  })

  suite.it('should reject invalid execution types', () => {
    const invalidTypes = ['invalid_type', 'foo', 'bar']

    for (const type of invalidTypes) {
      assert(!validateExecutionType(type), `Should reject ${type}`)
    }
  })

  suite.it('should retrieve execution type definition', () => {
    const type = getExecutionType('update_seo_title')
    assertEqual(type.type, 'update_seo_title')
    assertEqual(type.name, 'Update SEO Title')
    assert(type.inputs.includes('pageUrl'), 'Should include pageUrl input')
    assert(type.inputs.includes('newTitle'), 'Should include newTitle input')
  })
})

suite.describe('Verification Checks', () => {
  suite.it('update_seo_title should have verification checks', () => {
    const type = EXECUTION_TYPES.update_seo_title
    assertEqual(type.verificationChecks.length, 2)
    assert(type.verificationChecks.some((c) => c.name === 'title_changed'))
    assert(type.verificationChecks.some((c) => c.name === 'title_html_valid'))
  })

  suite.it('should have critical checks with autoRollback', () => {
    const type = EXECUTION_TYPES.update_seo_title
    for (const check of type.verificationChecks) {
      assert(check.critical, `Check ${check.name} should be critical for title updates`)
      assert(check.autoRollback, `Check ${check.name} should trigger auto rollback`)
    }
  })

  suite.it('add_internal_links should have non-critical link checks', () => {
    const type = EXECUTION_TYPES.add_internal_links
    const linkCheck = type.verificationChecks.find((c) => c.name === 'links_valid')
    assert(linkCheck, 'Should have links_valid check')
    assert(!linkCheck.critical, 'links_valid should not be critical')
    assert(!linkCheck.autoRollback, 'links_valid should not trigger auto rollback')
  })
})

suite.describe('Approval Policies', () => {
  suite.it('low risk operations should have manual approval', () => {
    const type = EXECUTION_TYPES.update_seo_title
    assertEqual(type.defaultApprovalPolicy, 'manual')
  })

  suite.it('high risk operations should require admin approval', () => {
    const typeRobots = EXECUTION_TYPES.update_robots
    assertEqual(typeRobots.defaultApprovalPolicy, 'admin')

    const typeRedirect = EXECUTION_TYPES.add_redirect
    assertEqual(typeRedirect.defaultApprovalPolicy, 'admin')
  })

  suite.it('canonical updates should require two-person approval', () => {
    const type = EXECUTION_TYPES.update_canonical
    assertEqual(type.defaultApprovalPolicy, 'two_person')
  })
})

// Run all tests
suite.run().then((results) => {
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
})
