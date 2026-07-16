/**
 * Demo Data System
 * Provides realistic demo projects for onboarding without requiring real crawl data.
 * Each project is fully featured: analytics, pages, events, operator history, etc.
 */

export interface DemoProject {
  name: string
  domain: string
  industry: string
  description: string
  analytics: Analytics
  pages: PageResult[]
  pageSpeed: PageSpeed
  businessInputs: { monthlyVisits: number; valuePerVisit: number; name: string }
  events: RfEvent[]
  operatorMissions: OperatorMission[]
  knowledgeGraph: KnowledgeGraphNode[]
}

export interface PageResult {
  url: string
  status: number
  overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number
  title: string
  titleLength: number
  metaDescription: string
  canonical: string
  mixedContent: boolean
  h1Count: number
  schemaTypes: string[]
  internalTargets: string[]
  https: boolean
  indexable: boolean
  fixes: FixItem[]
}

export interface FixItem {
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
}

export interface Analytics {
  siteScore: number
  categories: { technical: number; content: number; schema: number; ai: number }
  severityTotals: { critical: number; warning: number; info: number }
  totals: {
    avgWordCount: number
    pagesWithSchema: number
    nonIndexable: number
    httpsPages: number
  }
  issues: Issue[]
  links: { orphans: PageResult[]; avgInbound: number; noInternalLinks: number }
  schemaCoverage: { type: string; count: number }[]
}

export interface Issue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  affectedPages: number
}

export interface PageSpeed {
  available: boolean
  performance: number | null
  lcpMs: number | null
  cls: number | null
  inpMs: number | null
  strategy?: string
}

export interface RfEvent {
  at: string
  icon: 'audit' | 'deploy' | 'fix'
  text: string
}

export interface OperatorMission {
  title: string
  status: 'completed' | 'in-progress' | 'recommended'
  impact: string
  confidence: number
  effort: string
  reasoning: string
}

export interface KnowledgeGraphNode {
  id: string
  topic: string
  authority: number
  coverage: number
  related: string[]
}

// ─────────────────────────────────────────────────────────
// DEMO PROJECT: LAW FIRM
// ─────────────────────────────────────────────────────────

export const LAW_FIRM_DEMO: DemoProject = {
  name: 'Mitchell & Associates',
  domain: 'mitchelllaw.example.com',
  industry: 'Legal Services',
  description: 'Mid-size law firm with strong local presence but missing technical SEO optimization',
  businessInputs: {
    monthlyVisits: 8500,
    valuePerVisit: 150,
    name: 'Mitchell & Associates',
  },
  analytics: {
    siteScore: 62,
    categories: { technical: 58, content: 71, schema: 42, ai: 65 },
    severityTotals: { critical: 8, warning: 24, info: 31 },
    totals: { avgWordCount: 1840, pagesWithSchema: 12, nonIndexable: 3, httpsPages: 145 },
    issues: [
      { severity: 'critical', category: 'Technical fixes', title: 'Missing Schema markup on service pages', affectedPages: 45 },
      { severity: 'critical', category: 'Schema opportunities', title: 'Law firm LocalBusiness schema incomplete', affectedPages: 1 },
      { severity: 'warning', category: 'Content gaps', title: 'Practice area pages lack keyword targets', affectedPages: 12 },
      { severity: 'warning', category: 'Technical fixes', title: 'Core Web Vitals: LCP > 4s', affectedPages: 8 },
      { severity: 'warning', category: 'Schema opportunities', title: 'Attorney profiles missing faqSchema', affectedPages: 18 },
      { severity: 'info', category: 'Content gaps', title: 'Missing long-form guides for practice areas', affectedPages: 12 },
    ],
    links: { orphans: [], avgInbound: 2.3, noInternalLinks: 0 },
    schemaCoverage: [
      { type: 'LocalBusiness', count: 1 },
      { type: 'Attorney', count: 8 },
      { type: 'FAQPage', count: 2 },
    ],
  },
  pages: [
    {
      url: '/practice-areas/personal-injury',
      status: 200,
      overall: 64,
      scores: { technical: 72, content: 68, schema: 45, ai: 62 },
      wordCount: 2100,
      title: 'Personal Injury Lawyer | Mitchell & Associates',
      titleLength: 48,
      metaDescription: 'Personal injury law firm representing clients in car accidents, slip and fall, workplace injuries.',
      canonical: 'https://mitchelllaw.example.com/practice-areas/personal-injury',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['BreadcrumbList'],
      internalTargets: ['/', '/about', '/contact'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'warning', category: 'Schema', title: 'Add Attorney schema markup' },
        { severity: 'info', category: 'Content', title: 'Add FAQ schema for common questions' },
      ],
    },
    {
      url: '/practice-areas/family-law',
      status: 200,
      overall: 58,
      scores: { technical: 65, content: 62, schema: 32, ai: 58 },
      wordCount: 1850,
      title: 'Family Law Attorney | Divorce & Custody Lawyer',
      titleLength: 51,
      metaDescription: 'Family law attorney specializing in divorce, custody, and child support cases in the state.',
      canonical: 'https://mitchelllaw.example.com/practice-areas/family-law',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: [],
      internalTargets: ['/', '/about'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'critical', category: 'Schema', title: 'Missing Attorney schema' },
        { severity: 'warning', category: 'Schema', title: 'Add LocalBusiness context' },
      ],
    },
    {
      url: '/attorneys/john-mitchell',
      status: 200,
      overall: 71,
      scores: { technical: 78, content: 75, schema: 68, ai: 72 },
      wordCount: 1200,
      title: 'John Mitchell - Senior Attorney | Mitchell & Associates',
      titleLength: 54,
      metaDescription: 'John Mitchell is a senior attorney with 25+ years of experience in personal injury law.',
      canonical: 'https://mitchelllaw.example.com/attorneys/john-mitchell',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['Person', 'BreadcrumbList'],
      internalTargets: ['/practice-areas/personal-injury', '/'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'info', category: 'Content', title: 'Expand practice area details' },
      ],
    },
    {
      url: '/contact',
      status: 200,
      overall: 55,
      scores: { technical: 62, content: 52, schema: 28, ai: 54 },
      wordCount: 420,
      title: 'Contact Us | Mitchell & Associates',
      titleLength: 34,
      metaDescription: 'Contact Mitchell & Associates for a free consultation.',
      canonical: 'https://mitchelllaw.example.com/contact',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: [],
      internalTargets: ['/'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'critical', category: 'Schema', title: 'Add contact form schema' },
        { severity: 'critical', category: 'Schema', title: 'Add LocalBusiness contact info' },
      ],
    },
  ],
  pageSpeed: {
    available: true,
    performance: 62,
    lcpMs: 4200,
    cls: 0.15,
    inpMs: 180,
    strategy: 'mobile',
  },
  events: [
    { at: new Date(Date.now() - 86400000).toISOString(), icon: 'audit', text: 'Site audit completed: Found 8 critical schema gaps' },
    { at: new Date(Date.now() - 3600000).toISOString(), icon: 'fix', text: 'Added Attorney schema to 18 attorney profiles' },
    { at: new Date(Date.now() - 1800000).toISOString(), icon: 'deploy', text: 'Deployed schema updates (in progress)' },
  ],
  operatorMissions: [
    {
      title: 'Add missing Attorney schema to all service pages',
      status: 'recommended',
      impact: 'Medium visibility improvement in AI search results',
      confidence: 82,
      effort: '2-3 hours',
      reasoning: 'Attorneys profile pages (18 total) lack Person/Attorney schema. This is blocking citations in AI models like Claude and ChatGPT when users ask for "lawyers in your area."',
    },
    {
      title: 'Improve Core Web Vitals (LCP 4.2s → 2.8s)',
      status: 'recommended',
      impact: 'Expected +12% visibility boost',
      confidence: 78,
      effort: '4-6 hours',
      reasoning: 'LCP is 4.2s (should be <2.5s). Image optimization + lazy loading will improve. Impact: +12% CTR in Google Search results.',
    },
    {
      title: 'Create content hub: "Personal Injury Laws by State"',
      status: 'recommended',
      impact: 'Estimated +45 monthly visits',
      confidence: 71,
      effort: 'Full day',
      reasoning: 'Keyword analysis shows 8K monthly searches for practice area guides. Creating a resource hub will capture ~5% of that traffic.',
    },
  ],
  knowledgeGraph: [
    { id: '1', topic: 'Personal Injury Law', authority: 78, coverage: 65, related: ['2', '3', '4'] },
    { id: '2', topic: 'Slip and Fall Claims', authority: 72, coverage: 52, related: ['1', '5'] },
    { id: '3', topic: 'Car Accident Claims', authority: 81, coverage: 68, related: ['1', '6'] },
    { id: '4', topic: 'Wrongful Death', authority: 62, coverage: 38, related: ['1'] },
    { id: '5', topic: 'Workers Compensation', authority: 58, coverage: 42, related: ['2'] },
    { id: '6', topic: 'Insurance Claims', authority: 75, coverage: 55, related: ['3', '7'] },
    { id: '7', topic: 'Legal Damages', authority: 68, coverage: 48, related: ['6'] },
  ],
}

// ─────────────────────────────────────────────────────────
// DEMO PROJECT: SAAS
// ─────────────────────────────────────────────────────────

export const SAAS_DEMO: DemoProject = {
  name: 'CloudSync Pro',
  domain: 'cloudsyncdemo.example.com',
  industry: 'SaaS / Cloud Storage',
  description: 'Growing SaaS with good content but weak conversion optimization',
  businessInputs: {
    monthlyVisits: 24500,
    valuePerVisit: 45,
    name: 'CloudSync Pro',
  },
  analytics: {
    siteScore: 71,
    categories: { technical: 76, content: 68, schema: 58, ai: 72 },
    severityTotals: { critical: 3, warning: 18, info: 27 },
    totals: { avgWordCount: 2200, pagesWithSchema: 34, nonIndexable: 2, httpsPages: 128 },
    issues: [
      { severity: 'warning', category: 'Content gaps', title: 'Comparison pages lack specific competitor mentions', affectedPages: 8 },
      { severity: 'warning', category: 'Schema opportunities', title: 'Product pages missing FAQSchema and reviews', affectedPages: 12 },
      { severity: 'warning', category: 'Technical fixes', title: 'Blog posts lack internal linking strategy', affectedPages: 52 },
      { severity: 'info', category: 'Content gaps', title: 'Missing ROI calculator content', affectedPages: 1 },
    ],
    links: { orphans: [], avgInbound: 3.8, noInternalLinks: 2 },
    schemaCoverage: [
      { type: 'SoftwareApplication', count: 12 },
      { type: 'Product', count: 24 },
      { type: 'FAQPage', count: 8 },
    ],
  },
  pages: [
    {
      url: '/vs-dropbox',
      status: 200,
      overall: 68,
      scores: { technical: 78, content: 65, schema: 52, ai: 68 },
      wordCount: 3200,
      title: 'CloudSync vs Dropbox: Feature Comparison 2026',
      titleLength: 45,
      metaDescription: 'Detailed comparison of CloudSync Pro and Dropbox. See pricing, features, and security.',
      canonical: 'https://cloudsyncdemo.example.com/vs-dropbox',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['BreadcrumbList'],
      internalTargets: ['/', '/pricing', '/features'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'warning', category: 'Content', title: 'Add direct competitor feature comparison' },
        { severity: 'info', category: 'Schema', title: 'Add FAQSchema for comparison questions' },
      ],
    },
    {
      url: '/pricing',
      status: 200,
      overall: 74,
      scores: { technical: 82, content: 71, schema: 68, ai: 75 },
      wordCount: 1400,
      title: 'CloudSync Pro Pricing | Plans Starting at $9/mo',
      titleLength: 51,
      metaDescription: 'Simple, transparent pricing for CloudSync Pro. 3 plans to fit any team size.',
      canonical: 'https://cloudsyncdemo.example.com/pricing',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['SoftwareApplication', 'Product'],
      internalTargets: ['/', '/features', '/vs-dropbox'],
      https: true,
      indexable: true,
      fixes: [],
    },
    {
      url: '/blog/saas-security-checklist',
      status: 200,
      overall: 62,
      scores: { technical: 75, content: 58, schema: 45, ai: 65 },
      wordCount: 4100,
      title: 'SaaS Security Checklist: 15-Point Guide for 2026',
      titleLength: 50,
      metaDescription: 'Complete security checklist for SaaS companies. Ensure your data is protected.',
      canonical: 'https://cloudsyncdemo.example.com/blog/saas-security-checklist',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['BlogPosting', 'BreadcrumbList'],
      internalTargets: ['/', '/features'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'warning', category: 'Content', title: 'Add internal links to related posts' },
        { severity: 'info', category: 'Schema', title: 'Add FAQ schema for checklist items' },
      ],
    },
  ],
  pageSpeed: {
    available: true,
    performance: 81,
    lcpMs: 1800,
    cls: 0.05,
    inpMs: 95,
    strategy: 'mobile',
  },
  events: [
    { at: new Date(Date.now() - 172800000).toISOString(), icon: 'audit', text: 'Full site audit: 130 pages crawled' },
    { at: new Date(Date.now() - 86400000).toISOString(), icon: 'deploy', text: 'Added FAQ schema to 12 product pages' },
    { at: new Date(Date.now() - 3600000).toISOString(), icon: 'fix', text: 'Fixed broken internal links on blog' },
  ],
  operatorMissions: [
    {
      title: 'Create comparison content: CloudSync vs Notion, Slack, Teams',
      status: 'recommended',
      impact: '~180 new monthly visits from comparison queries',
      confidence: 85,
      effort: '6-8 hours',
      reasoning: 'Keyword data shows 12K searches/month for "CloudSync vs [competitor]". Current pages lack direct feature tables.',
    },
    {
      title: 'Build internal linking strategy for blog (52 posts)',
      status: 'recommended',
      impact: 'Expected +20% authority flow to top pages',
      confidence: 79,
      effort: '3-4 hours',
      reasoning: 'Blog posts exist but are siloed. Strategic internal links to comparison/pricing pages will improve conversion.',
    },
    {
      title: 'Create ROI calculator (with lead capture)',
      status: 'recommended',
      impact: '~50 qualified leads / month',
      confidence: 72,
      effort: 'Full day',
      reasoning: 'Competitors have working ROI calculators. SaaS buyers use these. Would support 8-12 deals/year.',
    },
  ],
  knowledgeGraph: [
    { id: '1', topic: 'Cloud Storage Solutions', authority: 82, coverage: 71, related: ['2', '3'] },
    { id: '2', topic: 'File Collaboration Tools', authority: 78, coverage: 68, related: ['1', '4'] },
    { id: '3', topic: 'Enterprise Cloud Security', authority: 75, coverage: 65, related: ['1', '5'] },
    { id: '4', topic: 'Team Productivity Software', authority: 72, coverage: 62, related: ['2'] },
    { id: '5', topic: 'Data Compliance (GDPR, HIPAA)', authority: 68, coverage: 58, related: ['3'] },
  ],
}

// ─────────────────────────────────────────────────────────
// DEMO PROJECT: ECOMMERCE
// ─────────────────────────────────────────────────────────

export const ECOMMERCE_DEMO: DemoProject = {
  name: 'TechGear Shop',
  domain: 'techgearshop.example.com',
  industry: 'Ecommerce / Electronics',
  description: 'Growing ecommerce store with conversion optimization opportunities',
  businessInputs: {
    monthlyVisits: 45000,
    valuePerVisit: 28,
    name: 'TechGear Shop',
  },
  analytics: {
    siteScore: 68,
    categories: { technical: 72, content: 64, schema: 75, ai: 68 },
    severityTotals: { critical: 4, warning: 22, info: 35 },
    totals: { avgWordCount: 350, pagesWithSchema: 282, nonIndexable: 8, httpsPages: 458 },
    issues: [
      { severity: 'critical', category: 'Technical fixes', title: 'Duplicate product pages (color/size variants)', affectedPages: 145 },
      { severity: 'warning', category: 'Content gaps', title: 'Product descriptions lack keyword targets', affectedPages: 280 },
      { severity: 'warning', category: 'Schema opportunities', title: 'Review schema incomplete (no aggregateRating)', affectedPages: 120 },
      { severity: 'info', category: 'Content gaps', title: 'Missing category pages for related products', affectedPages: 24 },
    ],
    links: { orphans: [], avgInbound: 2.1, noInternalLinks: 8 },
    schemaCoverage: [
      { type: 'Product', count: 280 },
      { type: 'Review', count: 145 },
      { type: 'AggregateOffer', count: 280 },
    ],
  },
  pages: [
    {
      url: '/products/wireless-headphones-pro',
      status: 200,
      overall: 72,
      scores: { technical: 78, content: 68, schema: 82, ai: 72 },
      wordCount: 520,
      title: 'Wireless Headphones Pro - Noise Canceling | TechGear',
      titleLength: 55,
      metaDescription: 'Premium wireless headphones with active noise canceling. 40-hour battery, $199.',
      canonical: 'https://techgearshop.example.com/products/wireless-headphones-pro',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['Product', 'Review', 'AggregateOffer'],
      internalTargets: ['/category/headphones', '/'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'info', category: 'Content', title: 'Expand features section with keywords' },
      ],
    },
    {
      url: '/category/headphones',
      status: 200,
      overall: 58,
      scores: { technical: 68, content: 52, schema: 62, ai: 58 },
      wordCount: 180,
      title: 'Wireless Headphones | TechGear Shop',
      titleLength: 36,
      metaDescription: 'Shop wireless headphones at TechGear. Premium brands, best prices.',
      canonical: 'https://techgearshop.example.com/category/headphones',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['BreadcrumbList'],
      internalTargets: ['/'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'warning', category: 'Content', title: 'Add category description with keyword targets' },
        { severity: 'warning', category: 'Content', title: 'Add internal links to top products' },
      ],
    },
  ],
  pageSpeed: {
    available: true,
    performance: 68,
    lcpMs: 2800,
    cls: 0.08,
    inpMs: 140,
    strategy: 'mobile',
  },
  events: [
    { at: new Date(Date.now() - 259200000).toISOString(), icon: 'audit', text: 'Product feed audit: 458 pages, 145 duplicates detected' },
    { at: new Date(Date.now() - 172800000).toISOString(), icon: 'deploy', text: 'Implemented canonical tags on all variants' },
    { at: new Date(Date.now() - 86400000).toISOString(), icon: 'fix', text: 'Added missing review aggregates to 120 products' },
  ],
  operatorMissions: [
    {
      title: 'Consolidate variant pages (color/size = single canonical)',
      status: 'completed',
      impact: 'Resolved duplicate content + improved indexation',
      confidence: 92,
      effort: 'Already done',
      reasoning: 'Canonical tags now properly set. Authority consolidates to main product page.',
    },
    {
      title: 'Expand product descriptions with keyword targets',
      status: 'recommended',
      impact: '~2,800 new monthly visits from long-tail queries',
      confidence: 81,
      effort: '2-3 days',
      reasoning: '280 products lack 150+ word descriptions. Adding keyword-targeted content will capture long-tail traffic.',
    },
    {
      title: 'Create buying guides for top 5 categories',
      status: 'recommended',
      impact: '~400 monthly visits + improved category authority',
      confidence: 76,
      effort: 'Full week',
      reasoning: 'Competitors rank with buying guides. Would establish category authority and support product pages.',
    },
  ],
  knowledgeGraph: [
    { id: '1', topic: 'Wireless Headphones', authority: 82, coverage: 75, related: ['2', '3'] },
    { id: '2', topic: 'Noise Canceling Technology', authority: 78, coverage: 68, related: ['1', '4'] },
    { id: '3', topic: 'Bluetooth Audio', authority: 75, coverage: 70, related: ['1', '5'] },
    { id: '4', topic: 'Active Sound Tech', authority: 72, coverage: 58, related: ['2'] },
    { id: '5', topic: 'Wireless Charging', authority: 68, coverage: 52, related: ['3'] },
  ],
}

// ─────────────────────────────────────────────────────────
// DEMO PROJECT: LOCAL BUSINESS
// ─────────────────────────────────────────────────────────

export const LOCAL_BUSINESS_DEMO: DemoProject = {
  name: 'Bella Salon & Spa',
  domain: 'bellasalonandspa.example.com',
  industry: 'Local Service / Beauty',
  description: 'Local beauty salon with strong Google My Business but weak organic rankings',
  businessInputs: {
    monthlyVisits: 3200,
    valuePerVisit: 85,
    name: 'Bella Salon & Spa',
  },
  analytics: {
    siteScore: 54,
    categories: { technical: 62, content: 52, schema: 48, ai: 54 },
    severityTotals: { critical: 6, warning: 18, info: 22 },
    totals: { avgWordCount: 420, pagesWithSchema: 8, nonIndexable: 2, httpsPages: 24 },
    issues: [
      { severity: 'critical', category: 'Schema opportunities', title: 'LocalBusiness schema incomplete (missing hours/phone)', affectedPages: 1 },
      { severity: 'critical', category: 'Content gaps', title: 'Service pages lack detailed descriptions', affectedPages: 8 },
      { severity: 'warning', category: 'Technical fixes', title: 'Mobile speed: LCP 5.2s (should be <2.5s)', affectedPages: 24 },
      { severity: 'warning', category: 'Schema opportunities', title: 'Service pages missing Service schema', affectedPages: 8 },
    ],
    links: { orphans: [], avgInbound: 1.2, noInternalLinks: 0 },
    schemaCoverage: [
      { type: 'LocalBusiness', count: 1 },
      { type: 'HairSalon', count: 1 },
    ],
  },
  pages: [
    {
      url: '/',
      status: 200,
      overall: 58,
      scores: { technical: 65, content: 58, schema: 54, ai: 58 },
      wordCount: 680,
      title: 'Bella Salon & Spa - Hair, Nails, Massage in Downtown',
      titleLength: 59,
      metaDescription: 'Professional salon and spa in downtown. Hair, nails, facials, massage. Book online now.',
      canonical: 'https://bellasalonandspa.example.com/',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['LocalBusiness', 'HairSalon'],
      internalTargets: ['/services', '/book'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'critical', category: 'Schema', title: 'Add complete opening hours to LocalBusiness schema' },
        { severity: 'warning', category: 'Content', title: 'Expand about section with team bios' },
      ],
    },
    {
      url: '/services/haircut',
      status: 200,
      overall: 52,
      scores: { technical: 62, content: 48, schema: 38, ai: 52 },
      wordCount: 320,
      title: 'Haircuts at Bella Salon | Professional Cuts',
      titleLength: 42,
      metaDescription: 'Professional haircuts by experienced stylists at Bella Salon. $45-65.',
      canonical: 'https://bellasalonandspa.example.com/services/haircut',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: [],
      internalTargets: ['/', '/book'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'critical', category: 'Schema', title: 'Add Service schema' },
        { severity: 'warning', category: 'Content', title: 'Add stylist specialties and experience' },
      ],
    },
  ],
  pageSpeed: {
    available: true,
    performance: 48,
    lcpMs: 5200,
    cls: 0.18,
    inpMs: 220,
    strategy: 'mobile',
  },
  events: [
    { at: new Date(Date.now() - 604800000).toISOString(), icon: 'audit', text: 'Site audit completed' },
    { at: new Date(Date.now() - 432000000).toISOString(), icon: 'fix', text: 'Added LocalBusiness schema (incomplete)' },
  ],
  operatorMissions: [
    {
      title: 'Complete LocalBusiness schema with full hours & phone',
      status: 'recommended',
      impact: 'Improved local visibility in Google Maps',
      confidence: 88,
      effort: '30 minutes',
      reasoning: 'Schema exists but missing critical fields. Completing it will improve local pack visibility.',
    },
    {
      title: 'Create detailed service pages for each service type',
      status: 'recommended',
      impact: 'Expected +40% organic traffic from local searches',
      confidence: 79,
      effort: '4 hours',
      reasoning: 'Current pages are bare (320 words). Detailed pages with stylist info + pricing + booking will rank for "[service] near me".',
    },
    {
      title: 'Optimize mobile performance (image + lazy load)',
      status: 'recommended',
      impact: '15% CTR improvement from mobile search',
      confidence: 75,
      effort: '3 hours',
      reasoning: 'LCP is 5.2s. Most local searches are mobile. Speed improvements = better rankings.',
    },
  ],
  knowledgeGraph: [
    { id: '1', topic: 'Hair Salons in Downtown', authority: 72, coverage: 68, related: ['2', '3'] },
    { id: '2', topic: 'Professional Hair Cutting', authority: 68, coverage: 62, related: ['1', '4'] },
    { id: '3', topic: 'Salon Nail Services', authority: 65, coverage: 58, related: ['1', '5'] },
    { id: '4', topic: 'Hair Coloring & Styling', authority: 62, coverage: 55, related: ['2'] },
    { id: '5', topic: 'Spa & Wellness', authority: 60, coverage: 52, related: ['3'] },
  ],
}

// ─────────────────────────────────────────────────────────
// DEMO PROJECT: MARKETING AGENCY
// ─────────────────────────────────────────────────────────

export const MARKETING_AGENCY_DEMO: DemoProject = {
  name: 'Growth Labs Agency',
  domain: 'growthlabsagency.example.com',
  industry: 'B2B / Marketing Agency',
  description: 'SEO-focused marketing agency with opportunity to improve own rankings',
  businessInputs: {
    monthlyVisits: 12800,
    valuePerVisit: 320,
    name: 'Growth Labs',
  },
  analytics: {
    siteScore: 75,
    categories: { technical: 82, content: 74, schema: 68, ai: 78 },
    severityTotals: { critical: 2, warning: 12, info: 18 },
    totals: { avgWordCount: 2600, pagesWithSchema: 28, nonIndexable: 1, httpsPages: 84 },
    issues: [
      { severity: 'warning', category: 'Content gaps', title: 'Case study pages lack specific metrics & ROI', affectedPages: 6 },
      { severity: 'warning', category: 'Schema opportunities', title: 'Service pages could use more rich snippets', affectedPages: 12 },
      { severity: 'info', category: 'Content gaps', title: 'Blog backlog: no posts on AI in SEO yet', affectedPages: 1 },
    ],
    links: { orphans: [], avgInbound: 4.2, noInternalLinks: 0 },
    schemaCoverage: [
      { type: 'LocalBusiness', count: 1 },
      { type: 'Organization', count: 1 },
      { type: 'FAQPage', count: 8 },
    ],
  },
  pages: [
    {
      url: '/services/seo',
      status: 200,
      overall: 78,
      scores: { technical: 85, content: 76, schema: 74, ai: 80 },
      wordCount: 3100,
      title: 'SEO Services | Organic Growth Specialists | Growth Labs',
      titleLength: 56,
      metaDescription: 'Enterprise SEO services focused on organic growth. 50+ agencies trust Growth Labs.',
      canonical: 'https://growthlabsagency.example.com/services/seo',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['LocalBusiness', 'Service', 'FAQPage'],
      internalTargets: ['/case-studies', '/pricing', '/'],
      https: true,
      indexable: true,
      fixes: [],
    },
    {
      url: '/case-studies/ecommerce-growth',
      status: 200,
      overall: 71,
      scores: { technical: 82, content: 68, schema: 64, ai: 74 },
      wordCount: 2800,
      title: 'Case Study: 240% Revenue Growth in 6 Months | Growth Labs',
      titleLength: 57,
      metaDescription: 'How we grew an ecommerce client from $50K to $170K monthly revenue through SEO.',
      canonical: 'https://growthlabsagency.example.com/case-studies/ecommerce-growth',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['BlogPosting'],
      internalTargets: ['/case-studies', '/services/seo'],
      https: true,
      indexable: true,
      fixes: [
        { severity: 'warning', category: 'Content', title: 'Add specific metrics: months, ROI, keyword rankings' },
        { severity: 'info', category: 'Schema', title: 'Add FAQPage schema' },
      ],
    },
  ],
  pageSpeed: {
    available: true,
    performance: 84,
    lcpMs: 1400,
    cls: 0.02,
    inpMs: 75,
    strategy: 'mobile',
  },
  events: [
    { at: new Date(Date.now() - 432000000).toISOString(), icon: 'audit', text: 'Competitive audit: benchmarked vs 8 agencies' },
    { at: new Date(Date.now() - 345600000).toISOString(), icon: 'deploy', text: 'Launched new case study page' },
    { at: new Date(Date.now() - 259200000).toISOString(), icon: 'fix', text: 'Improved Core Web Vitals' },
  ],
  operatorMissions: [
    {
      title: 'Expand case studies with ROI metrics & client testimonials',
      status: 'recommended',
      impact: '+35% case study conversion rate',
      confidence: 84,
      effort: '2-3 days',
      reasoning: 'Current case studies show results but lack specific ROI. Adding client testimonials + before/after metrics will improve conversion.',
    },
    {
      title: 'Create whitepaper: "AI Search Impact on SEO 2026"',
      status: 'recommended',
      impact: '~500 leads from gated content',
      confidence: 78,
      effort: '2 days',
      reasoning: 'High-intent B2B audience searching for "AI impact on SEO." Whitepaper captures leads for enterprise deals.',
    },
  ],
  knowledgeGraph: [
    { id: '1', topic: 'SEO Services', authority: 85, coverage: 78, related: ['2', '3', '4'] },
    { id: '2', topic: 'Technical SEO', authority: 82, coverage: 75, related: ['1', '5'] },
    { id: '3', topic: 'Content Marketing Strategy', authority: 79, coverage: 72, related: ['1', '6'] },
    { id: '4', topic: 'Link Building & Authority', authority: 76, coverage: 68, related: ['1'] },
    { id: '5', topic: 'Enterprise SEO', authority: 81, coverage: 74, related: ['2', '6'] },
    { id: '6', topic: 'AI & SEO Integration', authority: 72, coverage: 62, related: ['3'] },
  ],
}

// ─────────────────────────────────────────────────────────
// Export all demos
// ─────────────────────────────────────────────────────────

export const DEMO_PROJECTS: Record<string, DemoProject> = {
  law: LAW_FIRM_DEMO,
  saas: SAAS_DEMO,
  ecommerce: ECOMMERCE_DEMO,
  local: LOCAL_BUSINESS_DEMO,
  agency: MARKETING_AGENCY_DEMO,
}

export function getDemoProject(type: keyof typeof DEMO_PROJECTS): DemoProject {
  return DEMO_PROJECTS[type]
}

export const DEMO_CHOICES = [
  { id: 'law', name: 'Law Firm (Mitchell & Associates)', description: 'Legal services with schema gaps' },
  { id: 'saas', name: 'SaaS (CloudSync Pro)', description: 'Growing SaaS with conversion opportunities' },
  { id: 'ecommerce', name: 'Ecommerce (TechGear Shop)', description: 'Product site with duplicate content issues' },
  { id: 'local', name: 'Local Business (Bella Salon)', description: 'Local service with technical SEO gaps' },
  { id: 'agency', name: 'Marketing Agency (Growth Labs)', description: 'B2B agency with strong fundamentals' },
]
