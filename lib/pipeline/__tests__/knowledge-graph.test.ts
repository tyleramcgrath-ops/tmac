import { describe, it, expect } from 'vitest'
import { buildNodeId, NODE_TYPES, EDGE_TYPES } from '../stages/knowledge-graph'

/**
 * Pure unit tests for the knowledge-graph module — no database required.
 * The full round-trip (persistence + retrieval + verification) runs in the
 * pipeline integration suite.
 */

describe('buildNodeId', () => {
  it('namespaces id by node type', () => {
    expect(buildNodeId(NODE_TYPES.PAGE, 'https://example.com/foo')).toMatch(/^page:/)
    expect(buildNodeId(NODE_TYPES.TOPIC, 'Personal Injury')).toBe('topic:personal_injury')
  })

  it('slugifies labels deterministically', () => {
    const a = buildNodeId(NODE_TYPES.ENTITY, 'Acme Legal, LLC.')
    const b = buildNodeId(NODE_TYPES.ENTITY, 'Acme Legal, LLC.')
    expect(a).toBe(b)
    expect(a).toBe('entity:acme_legal_llc')
  })

  it('trims urls and strips protocol', () => {
    expect(buildNodeId(NODE_TYPES.PAGE, 'https://example.com/foo/bar')).toBe(
      'page:example_com_foo_bar',
    )
  })
})

describe('EDGE_TYPES', () => {
  it('exposes all Phase 7.8G relationship names', () => {
    const required = [
      'PAGE_HAS_TOPIC',
      'PAGE_MENTIONS_ENTITY',
      'PAGE_SUPPORTS_PAGE',
      'PAGE_SUPPORTS_MONEY_PAGE',
      'PAGE_LINKS_TO_PAGE',
      'PAGE_TARGETS_LOCATION',
      'PAGE_OFFERS_SERVICE',
      'PAGE_DESCRIBES_PRODUCT',
      'PAGE_CONTAINS_SCHEMA',
      'ENTITY_RELATES_TO_ENTITY',
      'TOPIC_RELATES_TO_TOPIC',
      'SERVICE_RELATES_TO_LOCATION',
      'CATEGORY_CONTAINS_PRODUCT',
    ]
    for (const name of required) {
      expect(EDGE_TYPES[name as keyof typeof EDGE_TYPES]).toBe(name)
    }
  })
})

describe('NODE_TYPES', () => {
  it('supports pages, topics, entities, services, products, locations, categories, faqs, authors, schema types, money pages, business objectives', () => {
    const expected = [
      'PAGE',
      'TOPIC',
      'ENTITY',
      'SERVICE',
      'PRODUCT',
      'LOCATION',
      'CATEGORY',
      'FAQ',
      'AUTHOR',
      'SCHEMA_TYPE',
      'MONEY_PAGE',
      'BUSINESS_OBJECTIVE',
    ]
    for (const key of expected) {
      expect(NODE_TYPES[key as keyof typeof NODE_TYPES]).toBeTruthy()
    }
  })
})
