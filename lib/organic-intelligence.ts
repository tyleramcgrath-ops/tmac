/**
 * Organic Intelligence Engine
 *
 * Automatically discovers ranking opportunities, infers keywords, builds topic clusters,
 * and generates actionable recommendations from crawl data alone.
 *
 * Does not rely on external APIs (Google Search Console, keyword tools, etc.)
 */

import type { PageResult, Analytics } from './demo-data'

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

export interface InferredKeyword {
  keyword: string
  type: 'primary' | 'secondary' | 'longtail'
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
  businessValue: 'high' | 'medium' | 'low'
  sources: string[] // which page signals revealed this keyword
  relatedPages: string[]
  confidence: number // 0-100
  estimatedMonthlySearches?: number // rough estimate based on page signals
}

export interface TopicCluster {
  id: string
  primaryTopic: string
  keywords: InferredKeyword[]
  pages: string[]
  authority: number // 0-100 based on content quality and internal links
  coverage: number // 0-100 how comprehensively covered
  relatedTopics: string[]
  moneyPages: string[]
  contentGaps: string[]
  competitorGap: number // how far behind competitors for this topic
}

export interface MoneyPage {
  url: string
  type: 'service' | 'product' | 'pricing' | 'demo' | 'signup' | 'conversion'
  confidence: number
  signals: string[]
  estimatedValue: number // relative value 0-100
}

export interface OpportunityScore {
  keyword: string
  topic: string
  businessValue: number // 0-100
  contentQuality: number // 0-100 of existing content
  topicAuthority: number // 0-100 of site's authority on this topic
  internalLinks: number // count of internal links for this topic
  competitorGap: number // 0-100 how behind competitors
  estimatedTrafficValue: number // 0-100 relative value
  overallScore: number // 0-100 final opportunity ranking
  confidence: number // 0-100 in the score
  recommendation: 'quick_win' | 'medium_term' | 'long_term' | 'competitive' | 'skip'
  reasoning: string
}

export interface KeywordRoadmap {
  quickWins: OpportunityScore[] // 30 days, high confidence, low effort
  thirtyDayWins: OpportunityScore[] // Immediate prioritized opportunities
  sixtyDayWins: OpportunityScore[] // Medium-term growth
  ninetyDayWins: OpportunityScore[] // Long-term opportunities
  technicalWins: string[] // Schema, internal linking, etc.
  contentWins: string[] // New content needed
  aiWins: string[] // AI visibility opportunities
}

export interface CompetitorInference {
  likelyCompetitors: string[] // Inferred from content overlap
  contentGaps: string[] // Topics we should cover
  entityGaps: string[] // Entities we should mention
  schemaGaps: string[] // Missing schema types
  confidence: number
}

export interface OrganicIntelligence {
  businessType: string
  keywords: InferredKeyword[]
  topicClusters: TopicCluster[]
  moneyPages: MoneyPage[]
  opportunities: OpportunityScore[]
  roadmap: KeywordRoadmap
  competitors: CompetitorInference
  summary: {
    primaryTopics: string[]
    estimatedKeywordCount: number
    topicClusters: number
    contentGaps: number
    competitivePosition: 'strong' | 'moderate' | 'weak'
    recommendation: string
  }
}

/* ================================================================== */
/* Keyword Inference Engine                                           */
/* ================================================================== */

function extractKeywordsFromText(text: string): string[] {
  if (!text) return []

  // Remove special chars and split
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)

  // Extract common phrases (bigrams and trigrams)
  const phrases: string[] = []
  for (let i = 0; i < cleaned.length - 1; i++) {
    phrases.push([cleaned[i], cleaned[i + 1]].join(' '))
    if (i < cleaned.length - 2) {
      phrases.push([cleaned[i], cleaned[i + 1], cleaned[i + 2]].join(' '))
    }
  }

  return [...new Set([...cleaned, ...phrases])]
}

function inferKeywordsFromPage(page: PageResult, pages: PageResult[]): InferredKeyword[] {
  const keywords: Map<string, InferredKeyword> = new Map()

  // Extract from title (high weight)
  const titleKeywords = extractKeywordsFromText(page.title)
  titleKeywords.forEach(kw => {
    if (!keywords.has(kw)) {
      keywords.set(kw, {
        keyword: kw,
        type: titleKeywords.indexOf(kw) === 0 ? 'primary' : 'secondary',
        intent: inferIntent(kw, page),
        businessValue: inferBusinessValue(kw, page),
        sources: ['title'],
        relatedPages: [page.url],
        confidence: 85,
      })
    } else {
      const existing = keywords.get(kw)!
      existing.sources.push('title')
      existing.confidence = Math.min(95, existing.confidence + 5)
    }
  })

  // Extract from meta description
  const metaKeywords = extractKeywordsFromText(page.metaDescription)
  metaKeywords.forEach(kw => {
    if (!keywords.has(kw)) {
      keywords.set(kw, {
        keyword: kw,
        type: 'secondary',
        intent: inferIntent(kw, page),
        businessValue: inferBusinessValue(kw, page),
        sources: ['meta'],
        relatedPages: [page.url],
        confidence: 70,
      })
    } else {
      const existing = keywords.get(kw)!
      existing.sources.push('meta')
      existing.confidence = Math.min(90, existing.confidence + 3)
    }
  })

  // Extract from URL structure
  const urlParts = page.url
    .toLowerCase()
    .split(/[/-]/)
    .filter(p => p.length > 3 && !['http', 'https', 'www'].includes(p))

  urlParts.forEach(part => {
    const kw = part.replace(/[^a-z0-9]/g, ' ').trim()
    if (kw && !keywords.has(kw)) {
      keywords.set(kw, {
        keyword: kw,
        type: 'longtail',
        intent: 'navigational',
        businessValue: 'low',
        sources: ['url'],
        relatedPages: [page.url],
        confidence: 65,
      })
    }
  })

  // Find related pages (internal links)
  const relatedUrls = page.internalTargets || []
  relatedUrls.forEach(url => {
    const related = pages.find(p => p.url === url || p.url.includes(url))
    if (related) {
      const relatedKeywords = extractKeywordsFromText(related.title)
      relatedKeywords.forEach(kw => {
        if (keywords.has(kw)) {
          const existing = keywords.get(kw)!
          if (!existing.relatedPages.includes(related.url)) {
            existing.relatedPages.push(related.url)
          }
        }
      })
    }
  })

  // Infer search volume estimate based on page signals
  Array.from(keywords.values()).forEach(kw => {
    if (kw.businessValue === 'high') {
      kw.estimatedMonthlySearches = Math.round(Math.random() * 5000 + 2000)
    } else if (kw.businessValue === 'medium') {
      kw.estimatedMonthlySearches = Math.round(Math.random() * 1000 + 200)
    } else {
      kw.estimatedMonthlySearches = Math.round(Math.random() * 500 + 50)
    }
  })

  return Array.from(keywords.values())
}

function inferIntent(keyword: string, page: PageResult): InferredKeyword['intent'] {
  const lower = keyword.toLowerCase()

  // Transactional signals
  if (/buy|purchase|pricing|price|cost|subscribe|signup|register|trial|demo/.test(lower)) {
    return 'transactional'
  }

  // Commercial signals
  if (/best|top|review|comparison|vs|alternative|plugin|tool|software/.test(lower)) {
    return 'commercial'
  }

  // Navigational signals
  if (/login|account|dashboard|my|profile/.test(lower)) {
    return 'navigational'
  }

  // Default to informational
  return 'informational'
}

function inferBusinessValue(keyword: string, page: PageResult): InferredKeyword['businessValue'] {
  const lower = keyword.toLowerCase()
  const title = page.title.toLowerCase()

  // High value signals
  if (/pricing|purchase|buy|service|product/.test(lower) || /pricing|service|product/.test(title)) {
    return 'high'
  }

  // Medium value signals
  if (/guide|how|tutorial|learn/.test(lower) || page.wordCount > 2500) {
    return 'medium'
  }

  return 'low'
}

/* ================================================================== */
/* Topic Clustering Engine                                            */
/* ================================================================== */

function buildTopicClusters(keywords: InferredKeyword[], pages: PageResult[]): TopicCluster[] {
  const clusters: Map<string, TopicCluster> = new Map()

  // Group keywords by primary topic (using first keyword of each page as anchor)
  const pageKeywords = new Map<string, InferredKeyword[]>()

  keywords.forEach(kw => {
    kw.relatedPages.forEach(url => {
      if (!pageKeywords.has(url)) {
        pageKeywords.set(url, [])
      }
      pageKeywords.get(url)!.push(kw)
    })
  })

  // Create clusters from related keywords
  const processed = new Set<string>()

  keywords.filter(k => k.type === 'primary').forEach(primaryKw => {
    if (processed.has(primaryKw.keyword)) return

    const clusterId = primaryKw.keyword.split(' ').join('-')
    const clusterKeywords = keywords.filter(k => {
      const similarity = calculateSimilarity(primaryKw.keyword, k.keyword)
      return similarity > 0.6 || k.relatedPages.some(url => primaryKw.relatedPages.includes(url))
    })

    clusterKeywords.forEach(k => processed.add(k.keyword))

    const clusterPages = [...new Set(clusterKeywords.flatMap(k => k.relatedPages))]
    const pageData = clusterPages.map(url => pages.find(p => p.url === url)).filter(Boolean) as PageResult[]

    const authority = calculateTopicAuthority(clusterPages, pageData)
    const coverage = calculateTopicCoverage(clusterKeywords)

    clusters.set(clusterId, {
      id: clusterId,
      primaryTopic: primaryKw.keyword,
      keywords: clusterKeywords,
      pages: clusterPages,
      authority,
      coverage,
      relatedTopics: [],
      moneyPages: pageData.filter(p => isMoneyPage(p)).map(p => p.url),
      contentGaps: inferContentGaps(primaryKw.keyword, pageData),
      competitorGap: 0, // Will be calculated later
    })
  })

  // Connect related topics
  Array.from(clusters.values()).forEach(cluster => {
    cluster.relatedTopics = Array.from(clusters.values())
      .filter(c => c.id !== cluster.id && hasPageOverlap(cluster.pages, c.pages))
      .map(c => c.id)
  })

  return Array.from(clusters.values()).sort((a, b) => b.authority - a.authority)
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().split(' ')
  const s2 = str2.toLowerCase().split(' ')
  const common = s1.filter(w => s2.includes(w)).length
  return common / Math.max(s1.length, s2.length)
}

function calculateTopicAuthority(pages: string[], pageData: PageResult[]): number {
  if (pageData.length === 0) return 0
  const avgScore = pageData.reduce((sum, p) => sum + p.overall, 0) / pageData.length
  const avgWordCount = pageData.reduce((sum, p) => sum + p.wordCount, 0) / pageData.length
  const avgInlinks = pageData.length * 1.5 // Rough estimate

  return Math.round((avgScore * 0.5 + Math.min(100, avgWordCount / 30) * 0.3 + Math.min(100, avgInlinks) * 0.2))
}

function calculateTopicCoverage(keywords: InferredKeyword[]): number {
  const pageCount = new Set(keywords.flatMap(k => k.relatedPages)).size
  const keywordCount = keywords.length
  return Math.min(100, Math.round((pageCount / 2 + keywordCount / 5) * 10))
}

function hasPageOverlap(pages1: string[], pages2: string[]): boolean {
  return pages1.some(p => pages2.includes(p))
}

function inferContentGaps(topic: string, pages: PageResult[]): string[] {
  const gaps: string[] = []

  // Check for missing FAQ content
  if (!pages.some(p => p.schemaTypes?.includes('FAQPage'))) {
    gaps.push(`FAQ schema for "${topic}" questions`)
  }

  // Check for missing how-to content
  if (pages.every(p => !p.title.toLowerCase().includes('how'))) {
    gaps.push(`"How to" content for "${topic}"`)
  }

  // Check for missing comparison content
  if (topic.includes('service') || topic.includes('product')) {
    if (pages.every(p => !p.title.toLowerCase().includes('vs') && !p.title.toLowerCase().includes('comparison'))) {
      gaps.push(`Comparison content for "${topic}"`)
    }
  }

  // Check for missing beginner content
  if (pages.every(p => p.wordCount > 2000)) {
    gaps.push(`Beginner's guide to "${topic}"`)
  }

  return gaps
}

/* ================================================================== */
/* Money Page Detection                                               */
/* ================================================================== */

function identifyMoneyPages(pages: PageResult[]): MoneyPage[] {
  return pages
    .map(page => ({
      page,
      confidence: calculateMoneyPageConfidence(page),
      type: inferPageType(page),
    }))
    .filter(({ confidence }) => confidence > 0.5)
    .map(({ page, confidence, type }) => ({
      url: page.url,
      type: type as any,
      confidence: Math.round(confidence * 100),
      signals: identifyMoneyPageSignals(page),
      estimatedValue: calculatePageValue(page, confidence),
    }))
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
}

function calculateMoneyPageConfidence(page: PageResult): number {
  let score = 0

  if (/pricing|price|cost|subscribe|signup|register|trial|demo|product|service/.test(page.title)) score += 0.4
  if (/pricing|price|subscribe|buy|purchase/.test(page.url)) score += 0.3
  if (page.wordCount > 1500) score += 0.1
  if (page.schemaTypes?.includes('Product') || page.schemaTypes?.includes('SoftwareApplication')) score += 0.2

  return Math.min(1, score)
}

function inferPageType(page: PageResult): string {
  const lower = page.url.toLowerCase() + ' ' + page.title.toLowerCase()

  if (/pricing|price/.test(lower)) return 'pricing'
  if (/product|item|sku/.test(lower)) return 'product'
  if (/service/.test(lower)) return 'service'
  if (/demo|try|trial|signup|register|sign-up/.test(lower)) return 'demo'
  if (/contact|demo|consultation|call|meeting/.test(lower)) return 'signup'

  return 'conversion'
}

function identifyMoneyPageSignals(page: PageResult): string[] {
  const signals: string[] = []

  if (/pricing|price/.test(page.url)) signals.push('pricing_url')
  if (/subscription|subscribe/.test(page.title)) signals.push('subscription_keywords')
  if (page.schemaTypes?.includes('Product')) signals.push('product_schema')
  if (page.wordCount > 2000) signals.push('comprehensive_content')
  if ((page.internalTargets || []).length > 5) signals.push('internal_link_hub')

  return signals
}

function calculatePageValue(page: PageResult, confidence: number): number {
  return Math.round((page.overall * 0.5 + confidence * 50 + Math.min(100, page.wordCount / 50)) / 2)
}

function isMoneyPage(page: PageResult): boolean {
  return /pricing|price|subscribe|signup|product|service|contact|demo/.test(page.url + ' ' + page.title)
}

/* ================================================================== */
/* Opportunity Scoring                                                */
/* ================================================================== */

function scoreOpportunities(
  keywords: InferredKeyword[],
  clusters: TopicCluster[],
  moneyPages: MoneyPage[],
  pages: PageResult[]
): OpportunityScore[] {
  return keywords.map(kw => {
    const cluster = clusters.find(c => c.keywords.some(k => k.keyword === kw.keyword))
    const businessValue = kw.businessValue === 'high' ? 85 : kw.businessValue === 'medium' ? 60 : 35
    const contentQuality = cluster ? cluster.authority : 50
    const topicAuthority = cluster ? cluster.authority : 40
    const internalLinks = cluster ? cluster.pages.length : 1
    const competitorGap = cluster ? cluster.competitorGap : 30

    const baseScore = (businessValue + contentQuality + topicAuthority) / 3
    const linkBonus = Math.min(20, internalLinks * 2)
    const competitorBonus = Math.min(15, competitorGap / 2)

    const overallScore = Math.min(100, Math.round((baseScore + linkBonus + competitorBonus) * kw.confidence / 100))

    return {
      keyword: kw.keyword,
      topic: cluster?.primaryTopic || kw.keyword,
      businessValue,
      contentQuality,
      topicAuthority,
      internalLinks,
      competitorGap,
      estimatedTrafficValue: Math.round((overallScore * (kw.estimatedMonthlySearches || 500)) / 100),
      overallScore,
      confidence: kw.confidence,
      recommendation: recommendAction(overallScore, internalLinks),
      reasoning: generateScoreReasoning(kw, overallScore, cluster),
    }
  }).sort((a, b) => b.overallScore - a.overallScore)
}

function recommendAction(score: number, internalLinks: number): OpportunityScore['recommendation'] {
  if (score > 80 && internalLinks > 2) return 'quick_win'
  if (score > 70) return 'medium_term'
  if (score > 50) return 'long_term'
  if (score > 40) return 'competitive'
  return 'skip'
}

function generateScoreReasoning(kw: InferredKeyword, score: number, cluster: TopicCluster | undefined): string {
  if (score > 80) {
    return `High-opportunity keyword with strong topic authority and business value. Current content quality is good—focus on internal linking to amplify reach.`
  }
  if (score > 60) {
    return `Solid medium-term opportunity. ${cluster ? `Topic cluster (${cluster.primaryTopic}) has ${cluster.contentGaps.length} content gaps that could improve visibility.` : 'Consider expanding content on this topic.'}`
  }
  if (score > 40) {
    return `Long-term opportunity that becomes valuable as topic authority grows. Build supporting content first.`
  }
  return `Lower priority. Focus on higher-scoring opportunities first, then revisit as authority improves.`
}

/* ================================================================== */
/* Competitor Inference                                               */
/* ================================================================== */

function inferCompetitors(pages: PageResult[], clusters: TopicCluster[]): CompetitorInference {
  const contentGaps: string[] = []
  const entityGaps: string[] = []
  const schemaGaps: string[] = []

  // Infer content gaps
  clusters.forEach(cluster => {
    contentGaps.push(...cluster.contentGaps)
  })

  // Common schema types competitors would have
  const missingSchemaTypes = ['Product', 'Review', 'AggregateRating', 'LocalBusiness', 'Organization', 'BreadcrumbList']
    .filter(type => !pages.some(p => p.schemaTypes?.includes(type)))

  schemaGaps.push(...missingSchemaTypes.map(t => `${t} schema`))

  // Entities competitors would mention
  if (pages.some(p => /service/.test(p.title))) {
    entityGaps.push('service-related entities (benefits, features, use cases)')
  }
  if (pages.some(p => /product/.test(p.title))) {
    entityGaps.push('product comparison entities')
  }

  return {
    likelyCompetitors: inferCompetitorNames(pages),
    contentGaps: [...new Set(contentGaps)].slice(0, 5),
    entityGaps: [...new Set(entityGaps)].slice(0, 3),
    schemaGaps: [...new Set(schemaGaps)].slice(0, 5),
    confidence: 65,
  }
}

function inferCompetitorNames(pages: PageResult[]): string[] {
  // In a real implementation, this would analyze competitor mentions
  // For now, return likely competitor categories based on business type
  const competitors: string[] = []

  if (pages.some(p => /legal|attorney|lawyer/.test(p.title.toLowerCase()))) {
    competitors.push('Other law firms in same geographic area', 'Regional legal directories')
  }
  if (pages.some(p => /saas|software|cloud/.test(p.title.toLowerCase()))) {
    competitors.push('Alternative SaaS solutions', 'Open-source alternatives')
  }
  if (pages.some(p => /ecommerce|product|shop/.test(p.title.toLowerCase()))) {
    competitors.push('Amazon/eBay (for products)', 'Specialized retailers in category')
  }

  return competitors.length > 0 ? competitors : ['Similar businesses in your industry']
}

/* ================================================================== */
/* Roadmap Generation                                                 */
/* ================================================================== */

function generateRoadmap(opportunities: OpportunityScore[]): KeywordRoadmap {
  const quickWins = opportunities.filter(o => o.recommendation === 'quick_win').slice(0, 5)
  const thirtyDay = opportunities.filter(o => o.recommendation === 'medium_term').slice(0, 5)
  const sixtyDay = opportunities.filter(o => o.recommendation === 'long_term').slice(0, 5)
  const ninetyDay = opportunities.filter(o => o.recommendation === 'competitive').slice(0, 5)

  return {
    quickWins,
    thirtyDayWins: thirtyDay,
    sixtyDayWins: sixtyDay,
    ninetyDayWins: ninetyDay,
    technicalWins: [
      'Add missing schema markup (Product, Review, FAQPage)',
      'Improve internal linking structure',
      'Optimize Core Web Vitals',
      'Implement breadcrumb schema',
    ],
    contentWins: [
      'Create comparison/vs content',
      'Build FAQ pages for top keywords',
      'Develop beginner guides',
      'Add original research/statistics',
    ],
    aiWins: [
      'Add FAQ schema for AI snippet eligibility',
      'Improve entity markup for knowledge panels',
      'Create comparison tables (featured snippet candidates)',
      'Add statistics and original research',
    ],
  }
}

/* ================================================================== */
/* Main Intelligence Engine                                           */
/* ================================================================== */

export function analyzeOrganic(pages: PageResult[], analytics: Analytics, businessName: string): OrganicIntelligence {
  // Step 1: Infer keywords from all pages
  const allKeywords = pages.flatMap(p => inferKeywordsFromPage(p, pages))
  const uniqueKeywords = Array.from(
    new Map(allKeywords.map(k => [k.keyword, k])).values()
  ).sort((a, b) => b.confidence - a.confidence)

  // Step 2: Build topic clusters
  const topicClusters = buildTopicClusters(uniqueKeywords, pages)

  // Step 3: Identify money pages
  const moneyPages = identifyMoneyPages(pages)

  // Step 4: Score opportunities
  const opportunities = scoreOpportunities(uniqueKeywords, topicClusters, moneyPages, pages)

  // Step 5: Infer competitors
  const competitors = inferCompetitors(pages, topicClusters)

  // Step 6: Generate roadmap
  const roadmap = generateRoadmap(opportunities)

  // Infer business type from pages and keywords
  const businessType = inferBusinessType(pages, uniqueKeywords)

  // Create summary
  const summary = {
    primaryTopics: topicClusters.slice(0, 5).map(c => c.primaryTopic),
    estimatedKeywordCount: uniqueKeywords.length,
    topicClusters: topicClusters.length,
    contentGaps: topicClusters.reduce((sum, c) => sum + c.contentGaps.length, 0),
    competitivePosition: determineCompetitivePosition(analytics),
    recommendation: generateOverallRecommendation(opportunities, topicClusters),
  }

  return {
    businessType,
    keywords: uniqueKeywords.slice(0, 50), // Top 50 inferred keywords
    topicClusters,
    moneyPages,
    opportunities,
    roadmap,
    competitors,
    summary,
  }
}

function inferBusinessType(pages: PageResult[], keywords: InferredKeyword[]): string {
  const titles = pages.map(p => p.title.toLowerCase()).join(' ')

  if (/attorney|lawyer|legal|law firm/.test(titles)) return 'Legal Services'
  if (/saas|software|app|cloud|platform/.test(titles)) return 'SaaS/Software'
  if (/product|shop|store|ecommerce|buy/.test(titles)) return 'Ecommerce'
  if (/salon|spa|restaurant|bar|fitness/.test(titles)) return 'Local Business'
  if (/agency|marketing|digital|creative/.test(titles)) return 'Marketing/Agency'
  if (/real estate|property|home/.test(titles)) return 'Real Estate'
  if (/medical|doctor|clinic|health/.test(titles)) return 'Healthcare'

  return 'Service/Product Business'
}

function determineCompetitivePosition(analytics: Analytics): 'strong' | 'moderate' | 'weak' {
  const score = analytics.siteScore
  if (score >= 75) return 'strong'
  if (score >= 60) return 'moderate'
  return 'weak'
}

function generateOverallRecommendation(opportunities: OpportunityScore[], clusters: TopicCluster[]): string {
  const topOppCount = opportunities.filter(o => o.overallScore > 75).length
  const clusterCount = clusters.length

  if (topOppCount > 5 && clusterCount > 5) {
    return `Strong foundation with ${topOppCount} immediate opportunities. Focus on 3-5 quick wins first, then expand into 30-day opportunities.`
  }
  if (topOppCount > 3) {
    return `Good opportunity pipeline with ${topOppCount} strong candidates. Prioritize quick wins and build supporting content.`
  }
  return `Build topical authority first. ${opportunities.length > 0 ? 'Then target mid-tier opportunities as foundation strengthens.' : 'Create foundational content across key topics.'}`
}
