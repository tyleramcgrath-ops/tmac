// Demo data generator for interactive RankForge demonstrations
// Generates realistic sample data across all subsystems

export const DEMO_PROJECTS = {
  law_firm: {
    name: 'Smith & Associates Law Firm',
    industry: 'Legal Services',
    website: 'https://smithlaw.example.com',
    description: 'Mid-sized litigation and family law practice',
    pages: 127,
    keywords: 856,
    competitors: 12,
  },
  ecommerce: {
    name: 'TechGear Ecommerce',
    industry: 'Ecommerce / Electronics',
    website: 'https://techgear.example.com',
    description: 'Electronics and accessories retail',
    pages: 2847,
    keywords: 5420,
    competitors: 34,
  },
  saas: {
    name: 'CloudAnalytics SaaS',
    industry: 'Business Intelligence',
    website: 'https://cloudanalytics.example.com',
    description: 'Real-time analytics platform',
    pages: 89,
    keywords: 312,
    competitors: 18,
  },
  local: {
    name: 'Premier Dental Studio',
    industry: 'Dental Services',
    website: 'https://dentistry.example.com',
    description: 'Local dental practice with multi-location',
    pages: 34,
    keywords: 156,
    competitors: 8,
  },
  agency: {
    name: 'Digital Growth Agency',
    industry: 'Marketing Agency',
    website: 'https://digitalgrowth.example.com',
    description: 'Full-service digital marketing agency',
    pages: 156,
    keywords: 1204,
    competitors: 52,
  },
};

export const DEMO_CRAWL_DATA = {
  law_firm: {
    totalPages: 127,
    indexedPages: 119,
    crawlErrors: 8,
    totalLinks: 3421,
    brokenLinks: 47,
    avgLoadTime: 1.8,
    coreWebVitals: {
      lcp: { value: 2.1, status: 'good' },
      fid: { value: 45, status: 'good' },
      cls: { value: 0.08, status: 'good' },
    },
    topPages: [
      { url: '/services/litigation', visits: 4521, keywords: 89 },
      { url: '/about', visits: 2103, keywords: 12 },
      { url: '/blog/legal-trends', visits: 1856, keywords: 34 },
      { url: '/practice-areas/family-law', visits: 1642, keywords: 67 },
      { url: '/contact', visits: 892, keywords: 5 },
    ],
  },
  ecommerce: {
    totalPages: 2847,
    indexedPages: 2741,
    crawlErrors: 106,
    totalLinks: 47821,
    brokenLinks: 234,
    avgLoadTime: 2.3,
    coreWebVitals: {
      lcp: { value: 3.2, status: 'needs improvement' },
      fid: { value: 98, status: 'needs improvement' },
      cls: { value: 0.12, status: 'needs improvement' },
    },
    topPages: [
      { url: '/products/laptops', visits: 12450, keywords: 234 },
      { url: '/products/phones', visits: 9876, keywords: 201 },
      { url: '/deals', visits: 7654, keywords: 89 },
      { url: '/returns-policy', visits: 3456, keywords: 12 },
      { url: '/shipping-info', visits: 2987, keywords: 8 },
    ],
  },
};

export const DEMO_SEARCH_CONSOLE_DATA = {
  law_firm: {
    totalClicks: 12847,
    totalImpressions: 234589,
    avgPosition: 3.2,
    ctr: 5.47,
    topKeywords: [
      { keyword: 'litigation attorney near me', clicks: 456, impressions: 8234, position: 2.1 },
      { keyword: 'family law lawyer', clicks: 389, impressions: 6234, position: 3.4 },
      { keyword: 'divorce attorney', clicks: 342, impressions: 5892, position: 2.8 },
      { keyword: 'estate planning lawyer', clicks: 267, impressions: 4156, position: 4.2 },
      { keyword: 'personal injury lawyer', clicks: 198, impressions: 3421, position: 5.1 },
    ],
  },
};

export const DEMO_GA4_DATA = {
  law_firm: {
    totalUsers: 3847,
    totalSessions: 5234,
    avgSessionDuration: 287,
    bounceRate: 42.3,
    conversionRate: 8.9,
    topConvertingPages: [
      { page: '/services/litigation', conversions: 89, conversionRate: 12.4 },
      { page: '/contact', conversions: 67, conversionRate: 22.3 },
      { page: '/blog/legal-trends', conversions: 34, conversionRate: 4.2 },
    ],
  },
};

export const DEMO_KNOWLEDGE_GRAPH = {
  law_firm: {
    topics: [
      {
        id: 'litigation',
        name: 'Litigation Services',
        entities: ['Discovery', 'Expert Witnesses', 'Trial Strategy', 'Settlement Negotiation'],
        authority: 0.92,
        coverage: 0.87,
      },
      {
        id: 'family-law',
        name: 'Family Law',
        entities: ['Divorce', 'Custody', 'Alimony', 'Mediation'],
        authority: 0.85,
        coverage: 0.79,
      },
      {
        id: 'estate-planning',
        name: 'Estate Planning',
        entities: ['Wills', 'Trusts', 'Probate', 'Power of Attorney'],
        authority: 0.78,
        coverage: 0.71,
      },
    ],
    moneyPages: [
      { url: '/services/litigation', strength: 9.2, supports: 34, weakens: 2 },
      { url: '/practice-areas/family-law', strength: 8.7, supports: 28, weakens: 1 },
      { url: '/about', strength: 6.4, supports: 12, weakens: 0 },
    ],
  },
};

export const DEMO_DECISION_ENGINE_DATA = {
  law_firm: {
    objectives: [
      { id: 'lead_generation', label: 'Lead Generation', weight: 0.4, status: 'active' },
      { id: 'authority', label: 'Authority / Trust', weight: 0.35, status: 'active' },
      { id: 'engagement', label: 'Engagement', weight: 0.15, status: 'active' },
      { id: 'retention', label: 'Client Retention', weight: 0.1, status: 'active' },
    ],
    recommendations: [
      {
        id: 'rec-001',
        page: '/services/litigation',
        type: 'add_schema',
        businessValue: 92,
        seoOpportunity: 88,
        priority: 1,
        status: 'pending_approval',
      },
      {
        id: 'rec-002',
        page: '/practice-areas/family-law',
        type: 'improve_headings',
        businessValue: 78,
        seoOpportunity: 72,
        priority: 2,
        status: 'pending_approval',
      },
      {
        id: 'rec-003',
        page: '/blog/legal-trends',
        type: 'add_internal_links',
        businessValue: 65,
        seoOpportunity: 71,
        priority: 3,
        status: 'pending_approval',
      },
    ],
  },
};

export const DEMO_OPERATOR_DATA = {
  law_firm: {
    status: 'active',
    focusMode: '1h',
    candidates: [
      {
        id: 'cand-001',
        page: '/services/litigation',
        type: 'schema_addition',
        confidence: 0.94,
        impact: 'high',
        effort: 'low',
        status: 'shortlisted',
      },
      {
        id: 'cand-002',
        page: '/practice-areas/family-law',
        type: 'heading_optimization',
        confidence: 0.87,
        impact: 'medium',
        effort: 'low',
        status: 'shortlisted',
      },
    ],
    primaryMission: {
      action: 'Add structured data to /services/litigation',
      expectedGain: '₹45,000/month',
      timeframe: '2-3 days',
      riskLevel: 'low',
    },
  },
};

export const DEMO_EXECUTION_HISTORY = {
  law_firm: {
    total: 34,
    successful: 31,
    failed: 1,
    rollback: 2,
    recent: [
      {
        id: 'exec-034',
        page: '/services/litigation',
        type: 'add_schema',
        status: 'verified',
        changedAt: '2 hours ago',
        verifiedAt: '1 hour ago',
      },
      {
        id: 'exec-033',
        page: '/practice-areas/family-law',
        type: 'improve_headings',
        status: 'verified',
        changedAt: '5 hours ago',
        verifiedAt: '4 hours ago',
      },
      {
        id: 'exec-032',
        page: '/blog/legal-trends',
        type: 'add_internal_links',
        status: 'verified',
        changedAt: '1 day ago',
        verifiedAt: '22 hours ago',
      },
      {
        id: 'exec-031',
        page: '/contact',
        type: 'update_seo_title',
        status: 'rolled_back',
        changedAt: '2 days ago',
        issue: 'Title too long (72 chars)',
      },
    ],
  },
};

export const DEMO_WORDPRESS_DEPLOYMENTS = {
  law_firm: {
    total: 34,
    successful: 31,
    failed: 1,
    rollback: 2,
    recent: [
      {
        id: 'wp-034',
        page: '/services/litigation',
        change: 'Added schema markup',
        status: 'live',
        deployedAt: '2 hours ago',
        verificationStatus: 'all_checks_passed',
      },
      {
        id: 'wp-033',
        page: '/practice-areas/family-law',
        change: 'Updated headings',
        status: 'live',
        deployedAt: '5 hours ago',
        verificationStatus: 'all_checks_passed',
      },
      {
        id: 'wp-032',
        page: '/blog/legal-trends',
        change: 'Added internal links',
        status: 'live',
        deployedAt: '1 day ago',
        verificationStatus: 'all_checks_passed',
      },
    ],
  },
};

export const DEMO_LEARNING_DATA = {
  law_firm: {
    preferences: [
      { factor: 'Schema updates on money pages', weight: 0.95, source: 'execution-success' },
      { factor: 'Internal linking to topic clusters', weight: 0.88, source: 'execution-success' },
      { factor: 'Heading optimization on service pages', weight: 0.82, source: 'execution-success' },
      { factor: 'Avoid bulk changes during campaigns', weight: 0.76, source: 'execution-failure' },
    ],
    improvements: [
      { metric: 'Recommendation accuracy', current: 0.87, trend: 'up', change: '+8% this month' },
      { metric: 'Execution success rate', current: 0.94, trend: 'up', change: '+3% this month' },
      { metric: 'Verification pass rate', current: 0.98, trend: 'stable', change: 'No change' },
    ],
  },
};

export function getDemoData(projectType: string) {
  return {
    project: DEMO_PROJECTS[projectType as keyof typeof DEMO_PROJECTS],
    crawl: DEMO_CRAWL_DATA[projectType as keyof typeof DEMO_CRAWL_DATA],
    searchConsole: DEMO_SEARCH_CONSOLE_DATA[projectType as keyof typeof DEMO_SEARCH_CONSOLE_DATA],
    ga4: DEMO_GA4_DATA[projectType as keyof typeof DEMO_GA4_DATA],
    knowledgeGraph: DEMO_KNOWLEDGE_GRAPH[projectType as keyof typeof DEMO_KNOWLEDGE_GRAPH],
    decisionEngine: DEMO_DECISION_ENGINE_DATA[projectType as keyof typeof DEMO_DECISION_ENGINE_DATA],
    operator: DEMO_OPERATOR_DATA[projectType as keyof typeof DEMO_OPERATOR_DATA],
    executionHistory: DEMO_EXECUTION_HISTORY[projectType as keyof typeof DEMO_EXECUTION_HISTORY],
    wordpressDeployments: DEMO_WORDPRESS_DEPLOYMENTS[projectType as keyof typeof DEMO_WORDPRESS_DEPLOYMENTS],
    learning: DEMO_LEARNING_DATA[projectType as keyof typeof DEMO_LEARNING_DATA],
  };
}

export const FEATURE_STATUS = {
  dashboard: { status: 'ready', completion: 100 },
  crawl: { status: 'ready', completion: 95 },
  knowledgeGraph: { status: 'ready', completion: 90 },
  contentIntelligence: { status: 'beta', completion: 85 },
  decisionEngine: { status: 'ready', completion: 92 },
  operator: { status: 'ready', completion: 88 },
  dailyMission: { status: 'ready', completion: 87 },
  campaigns: { status: 'beta', completion: 70 },
  executionEngine: { status: 'ready', completion: 96 },
  wordpressDeployment: { status: 'ready', completion: 93 },
  verification: { status: 'ready', completion: 94 },
  rollback: { status: 'ready', completion: 100 },
  autonomousOperations: { status: 'beta', completion: 82 },
  learning: { status: 'ready', completion: 87 },
  reports: { status: 'beta', completion: 65 },
  settings: { status: 'ready', completion: 80 },
};
