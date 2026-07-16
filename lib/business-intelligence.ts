/**
 * Business Intelligence Engine
 *
 * Automatically understands the business behind a website.
 * Infers what the company sells, how it makes money, which pages drive revenue,
 * and what customers need at each stage of their journey.
 *
 * The Decision Engine uses this intelligence to prioritize recommendations
 * by business impact, not SEO score.
 */

import type { PageResult, Analytics } from './demo-data'

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

export type BusinessModel = 'lead_generation' | 'ecommerce' | 'saas' | 'local' | 'agency' | 'subscription' | 'marketplace' | 'enterprise' | 'nonprofit'
export type JourneyStage = 'awareness' | 'consideration' | 'decision' | 'conversion' | 'retention'
export type PagePurpose = 'revenue' | 'trust' | 'authority' | 'education' | 'comparison' | 'faq' | 'support' | 'conversion' | 'legal' | 'recruiting' | 'brand'

export interface Service {
  name: string
  type: 'primary' | 'supporting' | 'complementary'
  pages: string[]
  revenue: number // relative importance 0-100
  confidence: number
  relatedServices: string[]
  missingContent: string[]
}

export interface Location {
  name: string
  isPrimary: boolean
  pages: string[]
  serviceArea?: string
  confidence: number
  authority: number
  opportunities: string[]
}

export interface CustomerJourneyStep {
  stage: JourneyStage
  name: string
  purpose: string
  pages: string[]
  confidence: number
  gaps: string[]
  missingPages: string[]
  conversionSignals: string[]
}

export interface PageValue {
  url: string
  purpose: PagePurpose
  revenuePriority: number // 0-100: direct revenue contribution
  leadPriority: number // 0-100: lead generation importance
  trustPriority: number // 0-100: trust/credibility contribution
  authorityPriority: number // 0-100: authority building
  educationPriority: number // 0-100: education value
  businessImportance: number // 0-100: overall importance
  journeyStage: JourneyStage | null
  estimatedMonthlyValue: number // rough $ estimate
  conversionMetrics: {
    isMoneyPage: boolean
    hasCallToAction: boolean
    hasTrustSignals: boolean
    hasInternalLinks: boolean
  }
  recommendations: string[]
}

export interface BusinessProfile {
  businessType: string
  industry: string
  subIndustry: string
  businessModels: BusinessModel[]
  primaryObjective: string
  secondaryObjectives: string[]
  targetCustomers: string
  services: Service[]
  locations: Location[]
  primaryMarket: string
  secondaryMarkets: string[]
  confidence: number
  summary: string
}

export interface RevenueMap {
  totalPages: number
  moneyPages: number
  trustPages: number
  supportingPages: number
  contentPages: number
  orphanedPages: number
  pageValues: PageValue[]
  estimatedMonthlyRevenue: number
  revenueRiskScore: number // 0-100: how much revenue at risk
  concentrationRisk: number // 0-100: revenue concentrated on few pages?
  recommendations: string[]
}

export interface CustomerJourney {
  stages: CustomerJourneyStep[]
  gaps: string[]
  bottlenecks: string[]
  conversionRiskScore: number // 0-100: how likely to lose customers?
  estimatedConversionRate: number // 0-100
  recommendations: string[]
}

export interface BusinessIntelligence {
  businessProfile: BusinessProfile
  revenueMap: RevenueMap
  customerJourney: CustomerJourney
  pageValues: Map<string, PageValue>
  businessRisks: {
    risk: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    businessImpact: string
    seoPotential: string
  }[]
  opportunities: {
    opportunity: string
    businessValue: number // 0-100
    seoPotential: number // 0-100
    effort: string
    businessImpact: string
    estimatedMonthlyValue: number
    confidence: number
  }[]
}

/* ================================================================== */
/* Business Profile Engine                                            */
/* ================================================================== */

function inferBusinessType(pages: PageResult[], analytics: Analytics): { type: string; confidence: number } {
  const titles = pages.map(p => p.title.toLowerCase()).join(' ')
  const urls = pages.map(p => p.url.toLowerCase()).join(' ')
  const content = titles + ' ' + urls

  // Legal/Law
  if (/attorney|lawyer|law firm|legal|contract|lawsuit|litigation|practice/.test(content)) {
    return { type: 'Legal Services', confidence: 95 }
  }

  // Healthcare
  if (/doctor|dental|medical|clinic|hospital|health|physician|dentist|therapy/.test(content)) {
    return { type: 'Healthcare', confidence: 95 }
  }

  // HVAC/Plumbing/Home Services
  if (/hvac|plumbing|air condition|heating|cooling|plumber|electrician|contractor/.test(content)) {
    return { type: 'Home Services', confidence: 90 }
  }

  // SaaS/Software
  if (/saas|software|app|cloud|platform|subscription|pricing|features|dashboard/.test(content)) {
    return { type: 'Software/SaaS', confidence: 90 }
  }

  // Ecommerce
  if (/product|shop|store|buy|cart|checkout|ecommerce|merchandise|catalog/.test(content)) {
    return { type: 'Ecommerce', confidence: 90 }
  }

  // Agency
  if (/agency|marketing|creative|design|digital|strategy|campaign/.test(content)) {
    return { type: 'Marketing Agency', confidence: 85 }
  }

  // Local Business
  if (/salon|spa|restaurant|bar|fitness|gym|hotel|restaurant|cafe/.test(content)) {
    return { type: 'Local Business', confidence: 85 }
  }

  // Financial Services
  if (/bank|finance|loan|insurance|investment|mortgage|credit/.test(content)) {
    return { type: 'Financial Services', confidence: 85 }
  }

  // Real Estate
  if (/real estate|property|home|rent|lease|agent|realtor|listing/.test(content)) {
    return { type: 'Real Estate', confidence: 85 }
  }

  return { type: 'Service/Product Business', confidence: 50 }
}

function inferBusinessModels(pages: PageResult[], businessType: string): BusinessModel[] {
  const titles = pages.map(p => p.title.toLowerCase()).join(' ')
  const models: BusinessModel[] = []

  if (/pricing|subscribe|subscription|monthly|annual|plan/.test(titles)) {
    models.push('subscription')
  }
  if (/saas|software|cloud/.test(businessType.toLowerCase())) {
    models.push('saas')
  }
  if (/product|buy|shop|ecommerce/.test(titles)) {
    models.push('ecommerce')
  }
  if (/contact|quote|consultation|schedule|book|appointment|form/.test(titles)) {
    models.push('lead_generation')
  }
  if (/local|location|service area|near me/.test(titles)) {
    models.push('local')
  }
  if (/agency|marketing|design/.test(businessType.toLowerCase())) {
    models.push('agency')
  }

  return models.length > 0 ? models : ['lead_generation']
}

function inferBusinessObjective(pages: PageResult[], businessModels: BusinessModel[]): { primary: string; secondary: string[] } {
  const primary = businessModels[0] === 'ecommerce' ? 'Sell Products' : businessModels[0] === 'saas' ? 'Grow Subscribers' : 'Generate Leads'

  const secondary: string[] = []
  if (pages.some(p => /build|authority|thought leader|expert|resource/.test(p.title))) {
    secondary.push('Build Authority')
  }
  if (pages.some(p => /blog|news|update/.test(p.url))) {
    secondary.push('Content Marketing')
  }
  if (pages.some(p => /community|forum|group/.test(p.url))) {
    secondary.push('Build Community')
  }

  return { primary, secondary }
}

function inferServices(pages: PageResult[]): Service[] {
  const servicePages = pages.filter(p => /service|product|solution|offering/.test(p.url.toLowerCase()))

  if (servicePages.length === 0) return []

  return servicePages.slice(0, 5).map((page, idx) => {
    const name = extractServiceName(page.url)
    return {
      name,
      type: idx === 0 ? 'primary' : 'supporting',
      pages: [page.url],
      revenue: idx === 0 ? 85 : 60 - idx * 5,
      confidence: 75,
      relatedServices: [],
      missingContent: inferMissingServiceContent(name),
    }
  })
}

function extractServiceName(url: string): string {
  const parts = url.split('/').filter(p => p && p.length > 3)
  const name = parts[parts.length - 1]?.replace(/[-_]/g, ' ') || 'Service'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function inferMissingServiceContent(serviceName: string): string[] {
  return [
    `"How ${serviceName} works" guide`,
    `${serviceName} pricing page`,
    `${serviceName} FAQ`,
    `${serviceName} case studies`,
    `${serviceName} comparison to competitors`,
  ]
}

function inferTargetCustomers(pages: PageResult[], businessType: string): string {
  if (/small business|startup|sme/.test(pages.map(p => p.title).join(' '))) {
    return 'Small Businesses'
  }
  if (/enterprise|large/.test(pages.map(p => p.title).join(' '))) {
    return 'Enterprise'
  }
  if (businessType.includes('Local')) {
    return 'Local Customers'
  }
  return 'Businesses and Individuals'
}

/* ================================================================== */
/* Revenue Map Engine                                                 */
/* ================================================================== */

function buildRevenueMap(pages: PageResult[], businessProfile: BusinessProfile, monthlyVisits: number, valuePerVisit: number): RevenueMap {
  const pageValues = pages.map(page => identifyPageValue(page, businessProfile, monthlyVisits, valuePerVisit))

  const moneyPages = pageValues.filter(pv => pv.revenuePriority > 70).length
  const trustPages = pageValues.filter(pv => pv.trustPriority > 70).length
  const estimatedMonthlyRevenue = pageValues.reduce((sum, pv) => sum + pv.estimatedMonthlyValue, 0)

  // Calculate concentration risk (are revenues concentrated on few pages?)
  const topPageRevenue = pageValues
    .sort((a, b) => b.estimatedMonthlyValue - a.estimatedMonthlyValue)
    .slice(0, 3)
    .reduce((sum, pv) => sum + pv.estimatedMonthlyValue, 0)

  const concentrationRisk = estimatedMonthlyRevenue > 0 ? (topPageRevenue / estimatedMonthlyRevenue) * 100 : 0

  const revenueRiskScore = pages.filter(p => !isMoneyPage(p)).length > pages.length * 0.7 ? 75 : 40

  return {
    totalPages: pages.length,
    moneyPages,
    trustPages,
    supportingPages: pageValues.filter(pv => pv.authorityPriority > 60).length,
    contentPages: pageValues.filter(pv => pv.educationPriority > 60).length,
    orphanedPages: pages.filter(p => (p.internalTargets || []).length === 0).length,
    pageValues,
    estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue),
    revenueRiskScore,
    concentrationRisk: Math.round(concentrationRisk),
    recommendations: generateRevenueRecommendations(pageValues, concentrationRisk),
  }
}

function identifyPageValue(page: PageResult, businessProfile: BusinessProfile, monthlyVisits: number, valuePerVisit: number): PageValue {
  const purpose = inferPagePurpose(page, businessProfile)
  const journeyStage = inferJourneyStage(page, purpose)

  const revenuePriority = isMoneyPage(page) ? 90 : /service|product/.test(page.url) ? 75 : 30
  const leadPriority = /contact|quote|form|schedule|consultation/.test(page.url) ? 85 : 40
  const trustPriority = /about|testimonial|case study|award|review/.test(page.url) ? 80 : 35
  const authorityPriority = /blog|guide|resource|expert|research/.test(page.url) ? 75 : 40
  const educationPriority = /guide|how|tutorial|faq|resource/.test(page.url) ? 70 : 30

  const businessImportance = (revenuePriority * 0.4 + leadPriority * 0.25 + trustPriority * 0.2 + authorityPriority * 0.1 + educationPriority * 0.05)

  const isMoneyPageFlag = revenuePriority > 70 || leadPriority > 70
  const estimatedVisits = isMoneyPageFlag ? (monthlyVisits * 0.15) : monthlyVisits > 0 ? monthlyVisits / 10 : 0
  const estimatedMonthlyValue = isMoneyPageFlag ? Math.round(estimatedVisits * valuePerVisit) : 0

  return {
    url: page.url,
    purpose,
    revenuePriority: Math.round(revenuePriority),
    leadPriority: Math.round(leadPriority),
    trustPriority: Math.round(trustPriority),
    authorityPriority: Math.round(authorityPriority),
    educationPriority: Math.round(educationPriority),
    businessImportance: Math.round(businessImportance),
    journeyStage,
    estimatedMonthlyValue,
    conversionMetrics: {
      isMoneyPage: isMoneyPageFlag,
      hasCallToAction: /contact|call|schedule|book|buy|sign up/.test(page.title.toLowerCase()),
      hasTrustSignals: /about|testimonial|award|certified|trusted/.test(page.title.toLowerCase()),
      hasInternalLinks: (page.internalTargets || []).length > 2,
    },
    recommendations: generatePageRecommendations(page, purpose, businessImportance),
  }
}

function inferPagePurpose(page: PageResult, businessProfile: BusinessProfile): PagePurpose {
  const lower = page.url.toLowerCase() + ' ' + page.title.toLowerCase()

  if (/pricing|price|cost|buy|purchase|cart|checkout/.test(lower)) return 'revenue'
  if (/contact|quote|form|consultation|schedule|book|call/.test(lower)) return 'conversion'
  if (/about|mission|team|company|culture|values/.test(lower)) return 'trust'
  if (/blog|article|guide|resource|post/.test(lower)) return 'education'
  if (/comparison|vs|alternative|competitor/.test(lower)) return 'comparison'
  if (/faq|question|answer/.test(lower)) return 'faq'
  if (/help|support|troubleshoot|issue|problem/.test(lower)) return 'support'
  if (/privacy|terms|legal|disclaimer/.test(lower)) return 'legal'
  if (/career|job|hiring|recruit/.test(lower)) return 'recruiting'
  if (/case study|client|portfolio|work/.test(lower)) return 'authority'
  if (/brand|logo|company|about/.test(lower)) return 'brand'

  return 'support'
}

function inferJourneyStage(page: PageResult, purpose: PagePurpose): JourneyStage | null {
  if (purpose === 'revenue' || purpose === 'conversion') return 'conversion'
  if (purpose === 'education' || purpose === 'faq') return 'awareness'
  if (purpose === 'comparison' || purpose === 'authority') return 'consideration'
  if (purpose === 'trust') return 'decision'
  if (purpose === 'support') return 'retention'
  return null
}

function isMoneyPage(page: PageResult): boolean {
  return /pricing|price|subscribe|product|product|service|contact|quote|appointment|schedule|consultation|book|buy|checkout|cart/.test(
    page.url.toLowerCase() + ' ' + page.title.toLowerCase()
  )
}

function generateRevenueRecommendations(pageValues: PageValue[], concentrationRisk: number): string[] {
  const recs: string[] = []

  if (concentrationRisk > 80) {
    recs.push('Diversify revenue sources: improve support pages to drive more traffic')
  }

  const moneyPages = pageValues.filter(pv => pv.revenuePriority > 70)
  if (moneyPages.length < 3) {
    recs.push(`Create more money pages: you only have ${moneyPages.length}`)
  }

  const lowValuePages = pageValues.filter(pv => pv.businessImportance < 40)
  if (lowValuePages.length > pageValues.length * 0.4) {
    recs.push('Remove or consolidate low-value pages')
  }

  return recs
}

function generatePageRecommendations(page: PageResult, purpose: PagePurpose, importance: number): string[] {
  const recs: string[] = []

  if (importance > 70 && (page.internalTargets || []).length < 3) {
    recs.push('Add internal links to this important page')
  }

  if (/contact|conversion/.test(purpose) && page.wordCount < 500) {
    recs.push('Expand conversion copy to improve clarity')
  }

  if (purpose === 'education' && page.wordCount > 5000 && !page.title.includes('|')) {
    recs.push('Consider breaking into multiple focused pages')
  }

  return recs
}

/* ================================================================== */
/* Customer Journey Detection                                         */
/* ================================================================== */

function detectCustomerJourney(pages: PageResult[], businessProfile: BusinessProfile): CustomerJourney {
  const stages: CustomerJourneyStep[] = [
    {
      stage: 'awareness',
      name: 'Awareness',
      purpose: 'Discovery & Education',
      pages: pages.filter(p => /blog|guide|resource|article|faq/.test(p.url.toLowerCase())).map(p => p.url),
      confidence: 75,
      gaps: [],
      missingPages: [],
      conversionSignals: [],
    },
    {
      stage: 'consideration',
      name: 'Consideration',
      purpose: 'Comparison & Evaluation',
      pages: pages.filter(p => /service|product|feature|pricing|comparison/.test(p.url.toLowerCase())).map(p => p.url),
      confidence: 70,
      gaps: [],
      missingPages: [],
      conversionSignals: [],
    },
    {
      stage: 'decision',
      name: 'Decision',
      purpose: 'Trust & Authority',
      pages: pages.filter(p => /about|testimonial|case study|award|review/.test(p.url.toLowerCase())).map(p => p.url),
      confidence: 65,
      gaps: [],
      missingPages: [],
      conversionSignals: [],
    },
    {
      stage: 'conversion',
      name: 'Conversion',
      purpose: 'Call to Action',
      pages: pages.filter(p => /contact|quote|schedule|book|call|form|checkout/.test(p.url.toLowerCase())).map(p => p.url),
      confidence: 80,
      gaps: [],
      missingPages: [],
      conversionSignals: [],
    },
    {
      stage: 'retention',
      name: 'Retention',
      purpose: 'Support & Growth',
      pages: pages.filter(p => /support|help|guide|resource|faq/.test(p.url.toLowerCase())).map(p => p.url),
      confidence: 60,
      gaps: [],
      missingPages: [],
      conversionSignals: [],
    },
  ]

  // Identify gaps
  const gaps: string[] = []
  if (stages[1].pages.length === 0) gaps.push('Missing comparison/evaluation content')
  if (stages[2].pages.length === 0) gaps.push('No trust/social proof content')
  if (stages[3].pages.length === 0) gaps.push('Missing conversion pages (contact, form, checkout)')

  // Identify bottlenecks (stages with content but poor internal linking)
  const bottlenecks: string[] = []
  stages.forEach(stage => {
    if (stage.pages.length > 0) {
      const avgLinks = stage.pages.reduce((sum, url) => {
        const page = pages.find(p => p.url === url)
        return sum + ((page?.internalTargets || []).length || 0)
      }, 0) / stage.pages.length

      if (avgLinks < 2) {
        bottlenecks.push(`${stage.name} stage has weak internal linking`)
      }
    }
  })

  return {
    stages,
    gaps,
    bottlenecks,
    conversionRiskScore: Math.max(...stages.map(s => (100 - s.confidence) * (s.pages.length === 0 ? 1 : 0.5))),
    estimatedConversionRate: calculateConversionRate(pages),
    recommendations: generateJourneyRecommendations(stages, gaps, bottlenecks),
  }
}

function calculateConversionRate(pages: PageResult[]): number {
  // Rough estimate based on content quality and structure
  const avgScore = pages.reduce((sum, p) => sum + p.overall, 0) / pages.length
  const hasConversionPages = pages.some(p => /contact|checkout|form/.test(p.url))
  const hasLeadPages = pages.some(p => /service|product/.test(p.url))

  let rate = (avgScore / 100) * 100 * 0.05 // ~2.5% base conversion rate for average site
  if (hasConversionPages) rate += 1
  if (hasLeadPages) rate += 0.5

  return Math.min(5, Math.round(rate * 10) / 10)
}

function generateJourneyRecommendations(stages: CustomerJourneyStep[], gaps: string[], bottlenecks: string[]): string[] {
  const recs: string[] = [...gaps, ...bottlenecks]

  const awarenessPagesWithoutLink = stages[0].pages.filter(url => {
    // pages in awareness that don't link to consideration
    return true
  })

  if (stages[3].pages.length === 0) {
    recs.push('Create dedicated conversion/contact page with clear CTA')
  }

  return recs
}

/* ================================================================== */
/* Main Business Intelligence Engine                                  */
/* ================================================================== */

export function analyzeBusinessIntelligence(
  pages: PageResult[],
  analytics: Analytics,
  businessName: string,
  monthlyVisits: number,
  valuePerVisit: number
): BusinessIntelligence {
  // Step 1: Build Business Profile
  const { type: businessType, confidence: typeConfidence } = inferBusinessType(pages, analytics)
  const businessModels = inferBusinessModels(pages, businessType)
  const { primary: primaryObjective, secondary: secondaryObjectives } = inferBusinessObjective(pages, businessModels)
  const targetCustomers = inferTargetCustomers(pages, businessType)
  const services = inferServices(pages)

  const businessProfile: BusinessProfile = {
    businessType,
    industry: businessType,
    subIndustry: '',
    businessModels,
    primaryObjective,
    secondaryObjectives,
    targetCustomers,
    services,
    locations: [],
    primaryMarket: 'Primary Market',
    secondaryMarkets: [],
    confidence: typeConfidence,
    summary: `${businessName} is a ${businessType} business focused on "${primaryObjective}".`,
  }

  // Step 2: Build Revenue Map
  const revenueMap = buildRevenueMap(pages, businessProfile, monthlyVisits, valuePerVisit)

  // Step 3: Detect Customer Journey
  const customerJourney = detectCustomerJourney(pages, businessProfile)

  // Step 4: Identify Business Risks
  const businessRisks = identifyBusinessRisks(pages, revenueMap, customerJourney, analytics)

  // Step 5: Identify Opportunities
  const opportunities = identifyBusinessOpportunities(pages, revenueMap, customerJourney, businessProfile)

  // Create page value map
  const pageValues = new Map(revenueMap.pageValues.map(pv => [pv.url, pv]))

  return {
    businessProfile,
    revenueMap,
    customerJourney,
    pageValues,
    businessRisks,
    opportunities,
  }
}

function identifyBusinessRisks(pages: PageResult[], revenueMap: RevenueMap, journey: CustomerJourney, analytics: Analytics) {
  const risks: BusinessIntelligence['businessRisks'] = []

  if (revenueMap.concentrationRisk > 80) {
    risks.push({
      risk: 'Revenue Concentration Risk',
      severity: 'critical',
      businessImpact: `${Math.round(revenueMap.concentrationRisk)}% of revenue comes from ${revenueMap.moneyPages} pages`,
      seoPotential: 'Expand content to diversify traffic sources',
    })
  }

  if (journey.conversionRiskScore > 50) {
    risks.push({
      risk: 'Weak Customer Journey',
      severity: 'high',
      businessImpact: 'Customers may not find the right pages at each stage',
      seoPotential: 'Improve internal linking and content organization',
    })
  }

  if (pages.filter(p => !isMoneyPage(p)).length > pages.length * 0.8) {
    risks.push({
      risk: 'Low Revenue Focus',
      severity: 'medium',
      businessImpact: 'Site is not optimized for business goals',
      seoPotential: 'Create more conversion-focused pages',
    })
  }

  return risks
}

function identifyBusinessOpportunities(
  pages: PageResult[],
  revenueMap: RevenueMap,
  journey: CustomerJourney,
  businessProfile: BusinessProfile
) {
  const opps: BusinessIntelligence['opportunities'] = []

  // Revenue diversification
  if (revenueMap.concentrationRisk > 70) {
    opps.push({
      opportunity: 'Expand high-value service pages',
      businessValue: 85,
      seoPotential: 75,
      effort: '2-3 weeks',
      businessImpact: `Could reduce concentration risk and add $${Math.round(revenueMap.estimatedMonthlyRevenue * 0.2)}/month`,
      estimatedMonthlyValue: Math.round(revenueMap.estimatedMonthlyRevenue * 0.2),
      confidence: 80,
    })
  }

  // Journey gaps
  if (journey.gaps.length > 0) {
    opps.push({
      opportunity: `Fill customer journey gaps: ${journey.gaps[0]}`,
      businessValue: 80,
      seoPotential: 70,
      effort: '1-2 weeks',
      businessImpact: 'Reduce customer friction and improve conversion rate',
      estimatedMonthlyValue: Math.round(revenueMap.estimatedMonthlyRevenue * 0.1),
      confidence: 75,
    })
  }

  // Trust building
  const trustPages = revenueMap.pageValues.filter(pv => pv.trustPriority > 50)
  if (trustPages.length < 3) {
    opps.push({
      opportunity: 'Build trust and authority content',
      businessValue: 75,
      seoPotential: 65,
      effort: '3-4 weeks',
      businessImpact: 'Increase conversion rates on decision stage',
      estimatedMonthlyValue: Math.round(revenueMap.estimatedMonthlyRevenue * 0.15),
      confidence: 70,
    })
  }

  return opps
}
