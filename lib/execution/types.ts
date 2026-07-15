/**
 * Execution Engine Types (Phase 9.1)
 *
 * Defines all execution types, their requirements, preconditions,
 * dependencies, rollback procedures, verification checks, and expected outcomes.
 */

export type ExecutionType =
  | 'update_seo_title'
  | 'update_meta_description'
  | 'update_canonical'
  | 'update_robots'
  | 'add_schema'
  | 'add_internal_links'
  | 'add_faq'
  | 'improve_headings'
  | 'update_image_alt'
  | 'update_content'
  | 'add_redirect'
  | 'update_sitemap'
  | 'improve_indexation'

export interface ExecutionTypeDefinition {
  type: ExecutionType
  name: string
  description: string
  category: 'metadata' | 'schema' | 'links' | 'content' | 'technical' | 'redirects'
  risk: 'low' | 'medium' | 'high'
  reversible: boolean
  requiresPreview: boolean
  requiresApproval: boolean
  defaultApprovalPolicy: 'automatic' | 'manual' | 'two_person' | 'admin'
  inputs: string[] // Required fields in payload
  preconditions: string[] // Must be true before execution
  dependencies: ExecutionType[] // Other executions that must complete first
  verificationChecks: VerificationCheck[]
  rollbackStrategy: 'reverse' | 'restore_backup' | 'manual'
  expectedOutcomes: string[]
}

export interface VerificationCheck {
  name: string
  description: string
  check: 'fetch_page' | 'parse_html' | 'validate_schema' | 'check_links' | 'crawl_index' | 'gsc_query'
  critical: boolean // If false, failure is warning not error
  autoRollback: boolean // If true, failed check triggers automatic rollback
}

export const EXECUTION_TYPES: Record<ExecutionType, ExecutionTypeDefinition> = {
  update_seo_title: {
    type: 'update_seo_title',
    name: 'Update SEO Title',
    description: 'Update page title tag for SEO and CTR optimization',
    category: 'metadata',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'newTitle', 'rationale'],
    preconditions: ['pageExists', 'titleFieldAccessible'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'title_changed',
        description: 'Verify title was updated in page HTML',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'title_html_valid',
        description: 'Verify title tag is valid HTML',
        check: 'parse_html',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_ctr', 'improved_rankings'],
  },

  update_meta_description: {
    type: 'update_meta_description',
    name: 'Update Meta Description',
    description: 'Update page meta description for CTR optimization',
    category: 'metadata',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'newDescription', 'rationale'],
    preconditions: ['pageExists', 'metaFieldAccessible'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'meta_description_changed',
        description: 'Verify meta description was updated',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'meta_html_valid',
        description: 'Verify meta tag is valid HTML',
        check: 'parse_html',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_ctr'],
  },

  update_canonical: {
    type: 'update_canonical',
    name: 'Update Canonical Tag',
    description: 'Update or add canonical tag for consolidation or self-referencing',
    category: 'technical',
    risk: 'medium',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'two_person',
    inputs: ['pageUrl', 'canonicalUrl', 'rationale'],
    preconditions: ['pageExists', 'canonicalUrlValid', 'noExistingConflict'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'canonical_updated',
        description: 'Verify canonical tag was updated',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'canonical_valid_url',
        description: 'Verify canonical URL is valid',
        check: 'parse_html',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_crawl_efficiency', 'consolidated_rankings'],
  },

  update_robots: {
    type: 'update_robots',
    name: 'Update Robots Directive',
    description: 'Update robots meta tag or robots.txt directives',
    category: 'technical',
    risk: 'high',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'admin',
    inputs: ['pageUrl', 'robotsDirective', 'rationale'],
    preconditions: ['pageExists', 'validRobotsDirective'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'robots_updated',
        description: 'Verify robots directive was applied',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_indexation', 'prevented_indexation'],
  },

  add_schema: {
    type: 'add_schema',
    name: 'Add Schema Markup',
    description: 'Add or update schema.org JSON-LD markup for rich results',
    category: 'schema',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'schemaType', 'schemaData', 'rationale'],
    preconditions: ['pageExists', 'schemaTypeValid', 'schemaDataValid'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'schema_added',
        description: 'Verify schema was added to page',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'schema_valid',
        description: 'Verify schema.org is valid JSON-LD',
        check: 'validate_schema',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_rich_results', 'improved_ai_readiness'],
  },

  add_internal_links: {
    type: 'add_internal_links',
    name: 'Add Internal Links',
    description: 'Add contextual internal links to support related pages',
    category: 'links',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'links', 'rationale'],
    preconditions: ['pageExists', 'editableContent', 'targetPagesValid'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'links_added',
        description: 'Verify internal links were added',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'links_valid',
        description: 'Verify links point to valid pages',
        check: 'check_links',
        critical: false,
        autoRollback: false,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_internal_linking', 'improved_authority_flow'],
  },

  add_faq: {
    type: 'add_faq',
    name: 'Add FAQ Section',
    description: 'Add FAQ schema and content for rich snippets',
    category: 'content',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'faqs', 'rationale'],
    preconditions: ['pageExists', 'editableContent', 'faqDataValid'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'faq_added',
        description: 'Verify FAQ was added to page',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'faq_schema_valid',
        description: 'Verify FAQ schema is valid',
        check: 'validate_schema',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_rich_results', 'improved_ctr'],
  },

  improve_headings: {
    type: 'improve_headings',
    name: 'Improve Heading Structure',
    description: 'Optimize heading hierarchy for SEO and readability',
    category: 'content',
    risk: 'medium',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'headings', 'rationale'],
    preconditions: ['pageExists', 'editableContent'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'headings_updated',
        description: 'Verify headings were updated',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'heading_structure_valid',
        description: 'Verify heading hierarchy is valid',
        check: 'parse_html',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_readability', 'improved_seo'],
  },

  update_image_alt: {
    type: 'update_image_alt',
    name: 'Update Image Alt Text',
    description: 'Add or update alt text for images',
    category: 'content',
    risk: 'low',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'imageUpdates', 'rationale'],
    preconditions: ['pageExists', 'imageFieldAccessible'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'alt_text_updated',
        description: 'Verify alt text was updated',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_accessibility', 'improved_image_search'],
  },

  update_content: {
    type: 'update_content',
    name: 'Update Content',
    description: 'Update page content for freshness, relevance, and accuracy',
    category: 'content',
    risk: 'medium',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'contentChanges', 'rationale'],
    preconditions: ['pageExists', 'editableContent'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'content_updated',
        description: 'Verify content was updated',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
      {
        name: 'html_valid',
        description: 'Verify HTML is valid',
        check: 'parse_html',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_freshness', 'improved_relevance'],
  },

  add_redirect: {
    type: 'add_redirect',
    name: 'Add Redirect',
    description: 'Add 301 or 302 redirect for consolidation or migration',
    category: 'redirects',
    risk: 'high',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'admin',
    inputs: ['sourceUrl', 'targetUrl', 'redirectType', 'rationale'],
    preconditions: ['sourceUrlValid', 'targetUrlValid', 'noCircularRedirects'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'redirect_active',
        description: 'Verify redirect was added and is active',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['consolidated_rankings', 'preserved_link_equity'],
  },

  update_sitemap: {
    type: 'update_sitemap',
    name: 'Update Sitemap',
    description: 'Update XML sitemap for crawl efficiency',
    category: 'technical',
    risk: 'medium',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['sitemapType', 'urlChanges', 'rationale'],
    preconditions: ['sitemapAccessible'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'sitemap_valid',
        description: 'Verify sitemap is valid XML',
        check: 'fetch_page',
        critical: true,
        autoRollback: true,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_crawl_coverage'],
  },

  improve_indexation: {
    type: 'improve_indexation',
    name: 'Improve Indexation',
    description: 'Improve page indexability and crawlability',
    category: 'technical',
    risk: 'medium',
    reversible: true,
    requiresPreview: true,
    requiresApproval: true,
    defaultApprovalPolicy: 'manual',
    inputs: ['pageUrl', 'improvements', 'rationale'],
    preconditions: ['pageExists'],
    dependencies: [],
    verificationChecks: [
      {
        name: 'indexation_improved',
        description: 'Verify indexation signals are improved',
        check: 'crawl_index',
        critical: true,
        autoRollback: false,
      },
    ],
    rollbackStrategy: 'reverse',
    expectedOutcomes: ['improved_indexation', 'improved_crawl_efficiency'],
  },
}

export function getExecutionType(type: ExecutionType): ExecutionTypeDefinition {
  return EXECUTION_TYPES[type]
}

export function validateExecutionType(type: unknown): type is ExecutionType {
  return typeof type === 'string' && type in EXECUTION_TYPES
}
