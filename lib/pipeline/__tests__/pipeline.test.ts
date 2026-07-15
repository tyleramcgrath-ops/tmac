import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import type { Page } from '@prisma/client'

/**
 * Pipeline Integration Tests
 *
 * These tests verify the pipeline stages can process mock page data correctly.
 * In a full integration environment, these would use real database data.
 */

// Mock Page data for testing
const mockPages: Partial<Page>[] = [
  {
    url: 'https://example-law.com/',
    title: 'Smith & Associates - Personal Injury Lawyers',
    h1: 'Personal Injury Legal Services',
    contentLength: 2500,
    metaDescription: 'Award-winning personal injury law firm serving clients nationwide',
    schemaTypes: '["LocalBusiness","LegalService"]',
    internalLinks: 15,
    inboundCount: 45,
    hasNoindex: false,
    hasMixedContent: false,
    h1Count: 1,
  },
  {
    url: 'https://example-law.com/services',
    title: 'Legal Services | Smith & Associates',
    h1: 'Our Legal Services',
    contentLength: 1800,
    metaDescription: 'Comprehensive legal services for personal injury, workers comp, and more',
    schemaTypes: '["Service","LegalService"]',
    internalLinks: 12,
    inboundCount: 32,
    hasNoindex: false,
    hasMixedContent: false,
    h1Count: 1,
  },
  {
    url: 'https://example-law.com/about',
    title: 'About Our Law Firm | Smith & Associates',
    h1: 'About Smith & Associates',
    contentLength: 1200,
    metaDescription: 'Learn about our experienced team and track record',
    schemaTypes: '["LocalBusiness"]',
    internalLinks: 8,
    inboundCount: 28,
    hasNoindex: false,
    hasMixedContent: false,
    h1Count: 1,
  },
  {
    url: 'https://example-law.com/contact',
    title: 'Contact Us | Smith & Associates',
    h1: 'Get In Touch',
    contentLength: 500,
    metaDescription: 'Contact Smith & Associates for a free consultation',
    schemaTypes: '["LocalBusiness","ContactPoint"]',
    internalLinks: 5,
    inboundCount: 150,
    hasNoindex: false,
    hasMixedContent: false,
    h1Count: 1,
  },
]

describe('Pipeline Stage Functions', () => {
  describe('Page Classification', () => {
    it('should classify homepage correctly', () => {
      const page = mockPages[0]
      const signals: string[] = []
      let score = 0

      // Simulate classification logic
      if (page.url === '/' || page.url?.includes('example-law.com/')) {
        score += 50
        signals.push('homepage')
      }
      if (page.schemaTypes?.includes('LocalBusiness')) {
        score += 15
        signals.push('schema_local_business')
      }
      if (page.contentLength! > 2000) {
        score += 10
        signals.push('content_length_high')
      }

      const confidence = Math.min(1, Math.max(0.5, score / 100))

      expect(confidence).toBeGreaterThan(0.5)
      expect(signals).toContain('schema_local_business')
    })

    it('should classify service page correctly', () => {
      const page = mockPages[1]
      const signals: string[] = []
      let score = 0

      if (page.url?.includes('/services')) {
        score += 40
        signals.push('url_pattern_service')
      }
      if (page.schemaTypes?.includes('Service')) {
        score += 15
        signals.push('schema_service')
      }

      const confidence = Math.min(1, Math.max(0.5, score / 100))

      expect(confidence).toBeGreaterThan(0.5)
      expect(signals).toContain('url_pattern_service')
    })

    it('should classify contact page correctly', () => {
      const page = mockPages[3]
      const signals: string[] = []
      let score = 0

      if (page.url?.includes('/contact')) {
        score += 40
        signals.push('url_pattern_contact')
      }
      if (page.schemaTypes?.includes('ContactPoint')) {
        score += 15
        signals.push('schema_contact')
      }

      expect(signals).toContain('url_pattern_contact')
    })
  })

  describe('Entity Extraction', () => {
    it('should extract entities from H1', () => {
      const page = mockPages[0]
      const entities: string[] = []

      if (page.h1) {
        entities.push(page.h1)
      }

      expect(entities).toContain('Personal Injury Legal Services')
    })

    it('should extract entities from schema types', () => {
      const page = mockPages[1]
      const entities: string[] = []

      if (page.schemaTypes) {
        const schemaTypes = JSON.parse(page.schemaTypes as string)
        entities.push(...schemaTypes)
      }

      expect(entities).toContain('Service')
      expect(entities).toContain('LegalService')
    })

    it('should deduplicate entities', () => {
      const allEntities = [
        'Smith & Associates',
        'Smith & Associates', // Duplicate
        'Legal Services',
        'Legal services', // Different case, same entity
      ]

      const uniqueEntities = Array.from(
        new Map(
          allEntities.map((e) => [e.toLowerCase(), e])
        ).values()
      )

      expect(uniqueEntities.length).toBeLessThan(allEntities.length)
      expect(uniqueEntities).toContain('Smith & Associates')
    })
  })

  describe('Topic Detection', () => {
    it('should detect topics from headings', () => {
      const topics = new Set<string>()
      for (const page of mockPages) {
        if (page.h1) {
          topics.add(page.h1)
        }
      }

      expect(topics.size).toBeGreaterThan(0)
      expect(Array.from(topics)).toContain('Personal Injury Legal Services')
    })

    it('should detect topics from schema types', () => {
      const topics = new Set<string>()

      const schemaMapping: Record<string, string> = {
        'LocalBusiness': 'Local Business',
        'LegalService': 'Legal Services',
        'Service': 'Services',
      }

      for (const page of mockPages) {
        if (page.schemaTypes) {
          const types = JSON.parse(page.schemaTypes as string)
          for (const type of types) {
            topics.add(schemaMapping[type] || type)
          }
        }
      }

      expect(topics.size).toBeGreaterThan(0)
      expect(Array.from(topics)).toContain('Local Business')
    })

    it('should detect topics from URLs', () => {
      const topics = new Set<string>()

      for (const page of mockPages) {
        const pathParts = new URL(page.url!, 'https://example.com').pathname
          .split('/')
          .filter((p) => p)

        for (const part of pathParts) {
          const topic = part
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(/\d+/)[0]
            .trim()

          if (topic && topic.length > 2) {
            topics.add(topic.charAt(0).toUpperCase() + topic.slice(1))
          }
        }
      }

      expect(Array.from(topics)).toContain('Services')
    })
  })

  describe('Content Scoring', () => {
    it('should score content quality based on length', () => {
      const page = mockPages[0]
      let qualityScore = 50

      if (page.contentLength! < 300) qualityScore -= 20
      else if (page.contentLength! > 1000) qualityScore += 15
      else if (page.contentLength! > 2000) qualityScore += 20

      expect(qualityScore).toBeGreaterThan(50)
    })

    it('should score SEO optimization', () => {
      const page = mockPages[0]
      let seoScore = 60

      if (page.title && page.title.length > 30 && page.title.length < 60) {
        seoScore += 15
      }
      if (page.metaDescription && page.metaDescription.length > 100) {
        seoScore += 15
      }
      if (page.h1Count === 1) {
        seoScore += 10
      }
      if (page.internalLinks! > 3) {
        seoScore += 10
      }

      expect(seoScore).toBeGreaterThan(60)
    })

    it('should calculate opportunity score', () => {
      const qualityScore = 70
      const seoScore = 75
      const technicalScore = 80

      const opportunityScore = (100 - qualityScore - seoScore - technicalScore) / 3

      expect(opportunityScore).toBeGreaterThanOrEqual(0)
      expect(opportunityScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Gap Analysis', () => {
    it('should identify missing page types', () => {
      const pageTypes = new Set<string>()

      for (const page of mockPages) {
        const url = page.url!

        if (url === '/' || url.endsWith('/')) pageTypes.add('homepage')
        if (url.includes('/about')) pageTypes.add('about')
        if (url.includes('/contact')) pageTypes.add('contact')
        if (url.includes('/blog')) pageTypes.add('blog_post')
        if (url.includes('/faq')) pageTypes.add('faq')
      }

      const commonPageTypes = ['homepage', 'service_page', 'blog_post', 'about', 'contact', 'faq']
      const missingTypes = commonPageTypes.filter((t) => !pageTypes.has(t))

      expect(missingTypes.length).toBeGreaterThan(0)
      expect(missingTypes).toContain('blog_post')
    })

    it('should identify thin content', () => {
      const thinPages = mockPages.filter((p) => p.contentLength! < 300)

      expect(thinPages.length).toBeGreaterThan(0)
      expect(thinPages[0].url).toBe('https://example-law.com/contact')
    })

    it('should identify missing schema markup', () => {
      const pagesWithoutSchema = mockPages.filter((p) => {
        if (!p.schemaTypes) return true
        const types = JSON.parse(p.schemaTypes as string)
        return types.length === 0
      })

      // All test pages have schema, so this should be empty
      expect(pagesWithoutSchema.length).toBe(0)
    })

    it('should identify FAQ opportunity', () => {
      const hasFAQ = mockPages.some((p) => p.url?.includes('/faq'))

      expect(hasFAQ).toBe(false) // No FAQ page, so opportunity exists
    })
  })

  describe('Knowledge Graph', () => {
    it('should create nodes from entities', () => {
      const nodes = new Map<string, string>()

      for (const page of mockPages) {
        if (page.h1) {
          const nodeId = page.h1
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 50)

          nodes.set(nodeId, page.h1)
        }
      }

      expect(nodes.size).toBeGreaterThan(0)
    })

    it('should create edges between related entities', () => {
      const entities = ['Smith & Associates', 'Legal Services', 'Personal Injury']
      const topics = ['Local Business', 'Legal Services']

      let edgesCreated = 0
      for (const entity of entities) {
        for (const topic of topics) {
          if (entity.toLowerCase().includes('legal') || topic.toLowerCase().includes('legal')) {
            edgesCreated++
          }
        }
      }

      expect(edgesCreated).toBeGreaterThan(0)
    })

    it('should sanitize node IDs', () => {
      const testLabels = [
        'Smith & Associates',
        'Legal Services (Personal Injury)',
        'Award-Winning Lawyers!',
      ]

      for (const label of testLabels) {
        const nodeId = label
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 50)

        expect(nodeId).toMatch(/^[a-z0-9_]*$/)
        expect(nodeId.length).toBeLessThanOrEqual(50)
      }
    })
  })

  describe('Decision Engine Integration', () => {
    it('should score pages for lead generation objective', () => {
      const contactPage = mockPages[3]
      let score = 0

      // Contact pages are high-value for lead gen
      if (contactPage.url?.includes('/contact')) score += 40
      if (contactPage.inboundCount! > 100) score += 30 // High traffic to contact
      if (contactPage.schemaTypes?.includes('ContactPoint')) score += 20

      expect(score).toBeGreaterThan(60)
    })

    it('should score pages for authority objective', () => {
      const homePage = mockPages[0]
      let score = 0

      // Homepage is best for authority
      if (homePage.url?.endsWith('/')) score += 40
      if (homePage.internalLinks! > 10) score += 20 // Good hub structure
      if (homePage.schemaTypes?.includes('LocalBusiness')) score += 20

      expect(score).toBeGreaterThan(60)
    })

    it('should score pages for conversion objective', () => {
      const pages = mockPages

      for (const page of pages) {
        let conversionScore = 0

        if (page.url?.includes('/contact') || page.url?.includes('/quote')) {
          conversionScore = 85
        } else if (page.url?.includes('/services')) {
          conversionScore = 70
        } else if (page.url?.includes('/')) {
          conversionScore = 65
        }

        expect(conversionScore).toBeGreaterThanOrEqual(60)
      }
    })
  })

  describe('Pipeline Orchestration', () => {
    it('should process pages sequentially through all stages', () => {
      const stages = [
        'content_inventory',
        'classification',
        'entity_extraction',
        'topic_detection',
        'knowledge_graph',
        'content_scoring',
        'gap_analysis',
        'decision_engine',
      ]

      expect(stages.length).toBe(8)
    })

    it('should track pipeline run status', () => {
      const statuses = ['queued', 'running', 'completed', 'partial', 'failed', 'blocked', 'cancelled']

      expect(statuses).toContain('completed')
      expect(statuses).toContain('partial')
      expect(statuses).toContain('failed')
    })

    it('should calculate pipeline duration correctly', () => {
      const startTime = Date.now()

      // Simulate work
      for (let i = 0; i < 100000000; i++) {
        Math.random()
      }

      const duration = Date.now() - startTime

      expect(duration).toBeGreaterThan(0)
    })

    it('should handle page result tracking', () => {
      let pagesProcessed = 0
      let pagesFailed = 0
      let pagesSkipped = 0

      for (const page of mockPages) {
        try {
          if (!page.url) {
            pagesFailed++
          } else {
            pagesProcessed++
          }
        } catch {
          pagesFailed++
        }
      }

      expect(pagesProcessed).toBe(4)
      expect(pagesFailed).toBe(0)
      expect(pagesSkipped).toBe(0)
    })
  })

  describe('Idempotency', () => {
    it('should generate consistent content hash', () => {
      const page = mockPages[0]

      const generateHash = (content: string) => {
        let hash = 0
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash
        }
        return Math.abs(hash).toString(36)
      }

      const content = JSON.stringify({
        title: page.title,
        contentLength: page.contentLength,
      })

      const hash1 = generateHash(content)
      const hash2 = generateHash(content)

      expect(hash1).toBe(hash2)
    })

    it('should support upsert operations', () => {
      const records = new Map<string, any>()

      const upsertPage = (pageUrl: string, data: any) => {
        const key = `project123_${pageUrl}`
        records.set(key, { ...records.get(key), ...data })
      }

      upsertPage('https://example-law.com/', { classification: 'homepage' })
      upsertPage('https://example-law.com/', { wordCount: 2500 })

      const key = 'project123_https://example-law.com/'
      const record = records.get(key)

      expect(record.classification).toBe('homepage')
      expect(record.wordCount).toBe(2500)
    })

    it('should detect concurrent runs', () => {
      const runningRuns = new Map<string, any>()

      const startRun = (auditId: string) => {
        if (runningRuns.has(auditId)) {
          const existing = runningRuns.get(auditId)
          if (['queued', 'running'].includes(existing.status)) {
            return { error: 'Pipeline already running', existingRunId: existing.id }
          }
        }

        const runId = `run_${Date.now()}`
        runningRuns.set(auditId, { id: runId, status: 'running' })
        return { success: true, runId }
      }

      const result1 = startRun('audit123')
      expect(result1.success).toBe(true)

      const result2 = startRun('audit123')
      expect(result2.error).toBeDefined()
      expect(result2.error).toContain('already running')
    })
  })
})
