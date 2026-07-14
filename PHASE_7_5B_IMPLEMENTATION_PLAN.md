# PHASE 7.5B — DECISION ENGINE IMPLEMENTATION PLAN

## Overview

The Decision Engine becomes the single source of truth for all page prioritization in TMAC. Every recommendation, automation rule, campaign, and daily mission originates from this engine.

**Core Components:**
1. Page Classification Engine
2. Signal Collection & Normalization
3. Business Value Scoring
4. SEO Opportunity Scoring
5. Expected Business Return Calculation
6. Risk Assessment
7. Time Estimation
8. Dependency Resolution
9. Explainability Engine
10. Daily Mission Generation

---

## DATABASE SCHEMA

### PageClassification
```sql
CREATE TABLE "PageClassification" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  
  -- Classification results
  classifications Json  -- [{type: "ServicePage", confidence: 0.96, signals: [...]}, ...]
  primaryClassification String  -- "ServicePage"
  confidenceScore Float  -- 0-1
  
  -- Raw signals used for classification
  urlPattern String?
  hasSchema String[]  -- ["Service", "LocalBusiness"]
  hasForm Boolean
  ctaButtons String[]  -- ["Book Now", "Call"]
  navigationLevel String?  -- "main", "secondary", "footer"
  internalLinkCount Int
  internalLinkAnchorTexts String[]
  
  -- Manual overrides
  manualClassification String?
  manualClassificationReason String?
  
  -- Timestamps
  classifiedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  businessValue BusinessValueScore?
  seoOpportunity SEOOpportunityScore?
  
  @@unique([projectId, pageUrl])
}
```

### PageSignals
```sql
CREATE TABLE "PageSignals" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  
  -- GA4 Signals
  ga4_monthlyVisitors Int @default(0)
  ga4_monthlyConversions Int @default(0)
  ga4_conversionRate Float @default(0)  -- percentage
  ga4_avgSessionDuration Float @default(0)  -- seconds
  ga4_bounceRate Float @default(0)  -- percentage
  ga4_30dayTrend Float @default(0)  -- % change
  ga4_conversionValue Float @default(0)  -- $
  ga4_lastUpdated DateTime?
  
  -- Google Search Console Signals
  gsc_monthlyImpressions Int @default(0)
  gsc_monthlyClicks Int @default(0)
  gsc_ctr Float @default(0)  -- percentage
  gsc_avgPosition Float @default(0)
  gsc_industryAvgCtr Float @default(0)  -- for benchmarking
  gsc_bestRankingQuery String?
  gsc_30dayTrend Float @default(0)  -- % change
  gsc_lastUpdated DateTime?
  
  -- Crawl Signals
  crawl_status Int  -- 200, 301, 404, etc
  crawl_title String?
  crawl_metaDescription String?
  crawl_h1 String?
  crawl_contentLength Int  -- words
  crawl_internalLinks Int
  crawl_internalTargets Int
  crawl_inboundCount Int
  crawl_hasCanonical Boolean
  crawl_hasNoindex Boolean
  crawl_hasMixedContent Boolean
  crawl_schemaTypes String[]
  crawl_coreWebVitals Json?  -- {lcp, fid, cls, ttfb}
  crawl_mobileUsable Boolean
  crawl_secureConnection Boolean
  crawl_lastCrawled DateTime?
  
  -- Technical Signals
  technical_issueCount Int @default(0)
  technical_criticalIssues Int @default(0)
  technical_warningIssues Int @default(0)
  technical_infoIssues Int @default(0)
  technical_score Int @default(0)  -- 0-100
  
  -- Content Signals
  content_score Int @default(0)  -- 0-100
  content_keywordRelevance Float @default(0)  -- 0-1
  content_readabilityScore Int @default(0)
  content_lastUpdated DateTime?
  content_daysOld Int  -- days since last update
  
  -- Schema Signals
  schema_score Int @default(0)  -- 0-100
  schema_hasLocalBusiness Boolean
  schema_hasService Boolean
  schema_hasProduct Boolean
  schema_hasOrganization Boolean
  schema_hasFAQ Boolean
  schema_completeness Float  -- percentage
  
  -- Business Signals
  business_strategicImportance Int?  -- user-assigned 0-100
  business_manualPriority String?  -- "MISSION_CRITICAL", "HIGH", "NORMAL", "IGNORE"
  business_revenuePotential Float?  -- $ estimate
  business_conversionGoal String?
  
  -- Historical data for trends
  signalHistory Json?  -- [{date: "2026-07-14", visitors: 500, conversions: 15}, ...]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  classification PageClassification?
  
  @@unique([projectId, pageUrl])
  @@index([projectId])
  @@index([ga4_30dayTrend])
  @@index([gsc_avgPosition])
}
```

### BusinessValueScore
```sql
CREATE TABLE "BusinessValueScore" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  
  -- Component scores (0-100)
  revenueContribution Int
  conversionVolume Int
  conversionRate Int
  trafficVolume Int
  strategicImportance Int
  navigationProminence Int
  internalAuthority Int
  trend Int  -- -50 to +50
  manualPriority Int  -- user override
  businessTypeWeight Float  -- multiplier
  
  -- Weights used
  weightRevenue Float @default(0.40)
  weightConversions Float @default(0.25)
  weightStrategic Float @default(0.20)
  weightNavigation Float @default(0.10)
  weightAuthority Float @default(0.05)
  
  -- Final scores
  businessValueScore Int  -- 0-100 (weighted sum)
  scoreExplanation Json  -- [{factor: "Revenue", points: 40, reason: "..."}]
  
  -- Business mode
  businessMode String? @default("general")  -- "law_firm", "ecommerce", "saas", etc
  
  calculatedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  classification PageClassification @relation(fields: [projectId, pageUrl], references: [projectId, pageUrl])
  
  @@unique([projectId, pageUrl])
  @@index([projectId])
  @@index([businessValueScore])
}
```

### SEOOpportunityScore
```sql
CREATE TABLE "SEOOpportunityScore" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  
  -- Component scores (0-100)
  rankingGap Int  -- 0 (rank 1) to 100 (rank 11+)
  ctrGap Int  -- your CTR vs industry avg
  impressionVolume Int  -- opportunity from volume
  schemaGaps Int  -- missing schema
  internalLinking Int  -- can improve internal links
  indexability Int  -- noindex, 404, etc
  coreWebVitals Int  -- mobile performance
  contentFreshness Int  -- how old is content
  backlinks Int  -- authority/DA
  duplicateContent Int  -- duplicate/canonical issues
  
  -- Weights used
  weightRanking Float @default(0.30)
  weightCtr Float @default(0.25)
  weightImpressions Float @default(0.20)
  weightSchema Float @default(0.15)
  weightContentFresh Float @default(0.10)
  
  -- Final scores
  seoOpportunityScore Int  -- 0-100
  scoreExplanation Json  -- [{factor: "Ranking Gap", points: 80, reason: "..."}]
  
  -- Specific opportunities
  opportunities String[]  -- ["Can rank #1", "Missing FAQ schema", "CTR too low"]
  
  calculatedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  classification PageClassification @relation(fields: [projectId, pageUrl], references: [projectId, pageUrl])
  
  @@unique([projectId, pageUrl])
  @@index([projectId])
  @@index([seoOpportunityScore])
}
```

### PagePriority
```sql
CREATE TABLE "PagePriority" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  
  -- Component scores
  businessValue Int  -- 0-100
  seoOpportunity Int  -- 0-100
  
  -- Weighted priority
  priorityScore Int  -- 0-100
  businessValueWeight Float @default(0.60)
  seoOpportunityWeight Float @default(0.40)
  
  -- Ranking
  priorityRank Int  -- position among all pages
  percentile Int  -- 0-100 (100 = top 1%)
  
  -- Explainability
  explanation Json  -- {why: "...", factors: [...], opportunities: [...]}
  summary String  -- one-line summary
  
  -- For sorting
  sortOrder Int  -- used in UI
  
  calculatedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, pageUrl])
  @@index([projectId])
  @@index([priorityScore])
  @@index([priorityRank])
}
```

### RecommendationDecision
```sql
CREATE TABLE "RecommendationDecision" (
  id String @id @default(cuid())
  projectId String
  pageUrl String
  recommendationType String  -- "title_optimization", "schema_addition", "internal_links", etc
  
  -- Why this recommendation
  classificationContext String?  -- "Service page with high revenue"
  priorityContext String?  -- "Page #2 by business value"
  opportunityContext String?  -- "Ranking position 11, can reach #1"
  
  -- Scoring
  businessValue Int  -- inherited from page
  seoOpportunity Int
  expectedBusinessReturn Json  -- {trafficGain: 300, conversionGain: 25, revenueGain: 5000, confidence: 0.85}
  difficulty Int  -- 1-10
  riskLevel String  -- "Very Low", "Low", "Medium", "High", "Very High"
  riskExplanation String
  estimatedTime Int  -- minutes
  timeToWin String  -- "Immediate", "Short Term", "Medium Term", "Long Term"
  dependencies String[]  -- other recommendations that must complete first
  
  -- Explainability
  whyThis String  -- "Your title doesn't match search intent"
  whyNow String  -- "CTR declining 0.3% per month"
  whyThisPage String  -- "Highest-revenue page"
  whyThisPriority String  -- "Business value 92 + SEO opportunity 78"
  dataSupporting Json  -- source data used
  assumptions String[]  -- "Assumes schema improves CTR by 15%"
  confidence Float  -- 0-1
  
  -- Prediction & verification
  prediction Json  -- {expectedTraffic: 200, expectedConversions: 5, expectedRevenue: 1000}
  deployment DateTime?
  actualResult Json?  -- {actualTraffic: 180, actualConversions: 6, actualRevenue: 1200}
  variance Float?  -- (actual - predicted) / predicted
  verifiedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, pageUrl, recommendationType])
  @@index([projectId])
  @@index([expectedBusinessReturn])
}
```

### DailyMission
```sql
CREATE TABLE "DailyMission" (
  id String @id @default(cuid())
  projectId String
  date DateTime @default(now())
  
  -- Selected recommendation
  pageUrl String
  recommendationType String
  
  -- Context
  reasoning String  -- why this recommendation today
  expectedReturn Json
  estimatedTime Int  -- minutes
  difficulty Int  -- 1-10
  
  -- Status
  status String @default("active")  -- "active", "completed", "skipped"
  completedAt DateTime?
  actualTime Int?  -- minutes spent
  actualResult Json?
  
  project Project @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, date])
  @@index([projectId])
  @@index([status])
}
```

### BusinessContext
```sql
CREATE TABLE "BusinessContext" (
  id String @id @default(cuid())
  organizationId String
  
  -- Business mode
  businessMode String  -- "law_firm", "ecommerce", "saas", "local_business", "medical", "financial", etc
  
  -- Weighting preferences
  businessValueWeights Json  -- {revenue: 0.40, conversions: 0.25, ...}
  seoOpportunityWeights Json  -- {ranking: 0.30, ctr: 0.25, ...}
  priorityWeights Json  -- {businessValue: 0.60, seoOpportunity: 0.40}
  
  -- Business priorities
  highestValueServices String[]  -- ["personal injury", "criminal defense"]
  highestValueLocations String[]  -- ["chicago", "denver"]
  primaryConversionGoal String  -- "book appointment", "purchase", "signup"
  secondaryConversionGoal String?
  
  -- Seasonal patterns
  seasonalPriorities Json?  -- {q4: ["holiday shopping"], march: ["spring refresh"]}
  
  -- Constraints
  maxDeploymentsPerDay Int @default(5)
  requiresManualApproval Boolean @default(true)
  autoApproveRiskLevel String? @default("Very Low")  -- only auto-approve "Very Low" risk
  
  -- Competitor context
  importantCompetitors String[]
  
  updatedAt DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([organizationId])
}
```

---

## SCORING FORMULAS

### Business Value Score

```typescript
function calculateBusinessValue(signals: PageSignals, classification: PageClassification, context: BusinessContext): {
  score: number
  breakdown: BreakdownItem[]
  explanation: string
} {
  
  // 1. Revenue Contribution (0-100)
  const revenueScore = normalizeValue(
    signals.ga4_conversionValue || 0,
    context.avgConversionValue,
    maxConversionValue
  )
  
  // 2. Conversion Volume (0-100)
  const conversionScore = normalizeValue(
    signals.ga4_monthlyConversions,
    context.avgConversions,
    maxConversions
  )
  
  // 3. Conversion Rate (0-100)
  const rateScore = normalizeValue(
    signals.ga4_conversionRate,
    context.avgConversionRate,
    maxConversionRate
  )
  
  // 4. Traffic Volume (0-100)
  const trafficScore = normalizeValue(
    signals.ga4_monthlyVisitors,
    context.avgVisitors,
    maxVisitors
  )
  
  // 5. Strategic Importance (0-100)
  let strategicScore = 0
  if (signals.business_manualPriority === "MISSION_CRITICAL") strategicScore = 100
  else if (signals.business_manualPriority === "HIGH") strategicScore = 75
  else if (signals.business_manualPriority === "IGNORE") strategicScore = 0
  else strategicScore = 50
  
  // 6. Navigation Prominence (0-100)
  let navigationScore = 0
  if (signals.crawl_navigationLevel === "main") navigationScore = 90
  else if (signals.crawl_navigationLevel === "secondary") navigationScore = 60
  else navigationScore = 20
  
  // 7. Internal Authority (0-100)
  const authorityScore = Math.min(100, signals.crawl_inboundCount * 2)
  
  // 8. Trend (0-100, center at 50)
  const trendScore = Math.max(0, Math.min(100, 50 + (signals.ga4_30dayTrend * 2)))
  
  // Apply manual override
  let manualBoost = 0
  if (signals.business_manualPriority === "MISSION_CRITICAL") manualBoost = 1.2
  else if (signals.business_manualPriority === "HIGH") manualBoost = 1.1
  
  // Apply business mode weighting
  const weights = context.businessValueWeights || DEFAULT_WEIGHTS
  
  const businessValueScore = Math.round(
    (revenueScore * weights.revenue +
     conversionScore * weights.conversions +
     strategicScore * weights.strategic +
     navigationScore * weights.navigation +
     authorityScore * weights.authority) *
    manualBoost
  )
  
  return {
    score: Math.min(100, businessValueScore),
    breakdown: [
      { factor: "Revenue", points: revenueScore, weight: weights.revenue },
      { factor: "Conversions", points: conversionScore, weight: weights.conversions },
      { factor: "Strategic", points: strategicScore, weight: weights.strategic },
      { factor: "Navigation", points: navigationScore, weight: weights.navigation },
      { factor: "Authority", points: authorityScore, weight: weights.authority },
      { factor: "Trend", points: trendScore, weight: 0.05 }
    ],
    explanation: generateExplanation(...)
  }
}
```

### SEO Opportunity Score

```typescript
function calculateSEOOpportunity(signals: PageSignals, context: BusinessContext): {
  score: number
  breakdown: BreakdownItem[]
  opportunities: string[]
} {
  
  // 1. Ranking Gap (0-100)
  // Position 1 = 0 opportunity, Position 11+ = 100 opportunity
  const rankingGap = Math.min(100, Math.max(0, (signals.gsc_avgPosition - 1) * 10))
  
  // 2. CTR Gap (0-100)
  // How much below industry average
  const ctrGap = Math.max(0, signals.gsc_industryAvgCtr - signals.gsc_ctr) * 50
  
  // 3. Impression Volume (0-100)
  // High impressions = wasted potential if CTR is low
  const impressionVolume = normalizeValue(
    signals.gsc_monthlyImpressions,
    context.avgImpressions,
    maxImpressions
  )
  
  // 4. Schema Gaps (0-100)
  // Missing relevant schema types
  const schemaGaps = calculateSchemaMissing(
    signals.schema_types,
    classification.primaryClassification
  ) * 100
  
  // 5. Content Freshness (0-100)
  // Content older than 12 months = high opportunity
  const contentAge = Math.min(365, signals.content_daysOld || 0)
  const freshness = Math.max(0, (contentAge / 365) * 100)
  
  // 6. Core Web Vitals (0-100)
  const coreWebVitalsScore = signals.crawl_coreWebVitals ? 
    evaluateCoreWebVitals(signals.crawl_coreWebVitals) : 50
  
  // Apply weights
  const weights = context.seoOpportunityWeights || DEFAULT_WEIGHTS
  
  const seoOpportunityScore = Math.round(
    rankingGap * weights.ranking +
    ctrGap * weights.ctr +
    impressionVolume * weights.impressions +
    schemaGaps * weights.schema +
    freshness * weights.freshness
  )
  
  // Identify specific opportunities
  const opportunities = []
  if (rankingGap > 50) opportunities.push(`Can reach top 10 (currently rank ${signals.gsc_avgPosition})`)
  if (ctrGap > 20) opportunities.push(`CTR ${signals.gsc_ctr}% vs ${signals.gsc_industryAvgCtr}% industry avg`)
  if (schemaGaps > 30) opportunities.push("Missing critical schema markup")
  if (freshness > 60) opportunities.push("Content needs refresh")
  
  return {
    score: Math.min(100, seoOpportunityScore),
    breakdown: [...],
    opportunities
  }
}
```

### Priority Score

```typescript
function calculatePriority(businessValue: number, seoOpportunity: number, context: BusinessContext): {
  priorityScore: number
  rank: number
  explanation: string
} {
  const bvWeight = context.priorityWeights?.businessValue || 0.60
  const seoWeight = context.priorityWeights?.seoOpportunity || 0.40
  
  const priorityScore = Math.round(
    (businessValue * bvWeight) + (seoOpportunity * seoWeight)
  )
  
  return {
    priorityScore,
    rank: calculateRank(priorityScore, allPageScores),
    explanation: `Business Value ${businessValue}/100 + SEO Opportunity ${seoOpportunity}/100`
  }
}
```

### Expected Business Return

```typescript
function calculateExpectedReturn(recommendation: RecommendationDecision, signals: PageSignals): {
  trafficGain: number  // estimated visitors
  conversionGain: number  // estimated conversions
  revenueGain: number  // estimated revenue
  confidence: number  // 0-1
  assumption: string[]
} {
  
  // Based on recommendation type and page signals
  const recommendationType = recommendation.type
  
  switch(recommendationType) {
    case "title_optimization":
      // Typical CTR improvement: 15-25%
      const ctrImprovement = 0.20
      const trafficGain = signals.gsc_monthlyImpressions * ctrImprovement * (1 - signals.gsc_ctr / 100)
      const conversionGain = trafficGain * signals.ga4_conversionRate / 100
      return {
        trafficGain: Math.round(trafficGain),
        conversionGain: Math.round(conversionGain),
        revenueGain: Math.round(conversionGain * (signals.ga4_conversionValue / signals.ga4_monthlyConversions)),
        confidence: 0.82,
        assumptions: ["Assumes CTR improves by 20%", "Based on industry benchmarks"]
      }
    
    case "schema_addition":
      // FAQ schema typically increases CTR 5-15%
      const schemaImpact = 0.10
      const schemaTraffic = signals.gsc_monthlyImpressions * schemaImpact * (1 - signals.gsc_ctr / 100)
      return {
        trafficGain: Math.round(schemaTraffic),
        conversionGain: Math.round(schemaTraffic * signals.ga4_conversionRate / 100),
        revenueGain: ...,
        confidence: 0.75,
        assumptions: ["Schema improves SERP appearance", "Based on schema type"]
      }
    
    case "ranking_improvement":
      // Moving from position 11 to position 5: ~3x traffic
      const positionImprovement = calculateTrafficImprovement(signals.gsc_avgPosition, 5)
      return {
        trafficGain: Math.round(signals.gsc_monthlyImpressions * positionImprovement),
        conversionGain: ...,
        revenueGain: ...,
        confidence: 0.68,  // Lower confidence for ranking predictions
        assumptions: ["Ranking improves to top 5", "Based on CTR curves"]
      }
  }
}
```

### Risk Assessment

```typescript
function assessRisk(recommendation: RecommendationDecision): {
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High"
  explanation: string
  reversible: boolean
} {
  const type = recommendation.type
  
  const riskMap = {
    "title_optimization": { level: "Very Low", explanation: "Easily reversible", reversible: true },
    "meta_description": { level: "Very Low", explanation: "Easily reversible", reversible: true },
    "schema_addition": { level: "Low", explanation: "Adding schema doesn't break existing content", reversible: true },
    "internal_linking": { level: "Low", explanation: "Can test on subset first", reversible: true },
    "content_refresh": { level: "Medium", explanation: "Might change existing rankings", reversible: false },
    "url_change": { level: "High", explanation: "301 redirects needed, potential link loss", reversible: false },
    "canonical_change": { level: "High", explanation: "Can confuse search engines", reversible: false },
    "schema_removal": { level: "Medium", explanation: "Might decrease SERP features", reversible: true }
  }
  
  return riskMap[type] || { level: "Medium", explanation: "Unknown", reversible: false }
}
```

### Time Estimation

```typescript
function estimateTime(recommendation: RecommendationDecision): {
  estimatedMinutes: number
  timeToWin: "Immediate" | "Short Term" | "Medium Term" | "Long Term"
  explanation: string
} {
  const type = recommendation.type
  
  const timeMap = {
    "title_optimization": { minutes: 15, timeToWin: "Immediate" },
    "meta_description": { minutes: 15, timeToWin: "Immediate" },
    "schema_addition": { minutes: 45, timeToWin: "Short Term" },
    "internal_linking": { minutes: 60, timeToWin: "Medium Term" },
    "content_refresh": { minutes: 120, timeToWin: "Medium Term" },
    "url_change": { minutes: 180, timeToWin: "Long Term" },
    "comprehensive_redesign": { minutes: 480, timeToWin: "Long Term" }
  }
  
  return timeMap[type] || { minutes: 120, timeToWin: "Medium Term" }
}
```

---

## CLASSIFICATION SIGNALS

### URL Patterns
```typescript
const urlPatterns = {
  homepage: /^\/+$/,
  services: /\/(services?|practice|practice-areas?|what-we-do)\//i,
  products: /\/(products?|shop)\//i,
  categories: /\/(categories?|collections?)\//i,
  locations: /\/(locations?|offices?|branch)\//i,
  profiles: /\/(attorney|lawyer|team|staff|expert)\//i,
  blog: /\/(blog|articles?|news|resources?)\//i,
  faq: /\/(faq|faqs|help|support)\//i,
  pricing: /\/(pricing|plans?|rates?)\//i,
  checkout: /\/(checkout|cart|buy)\//i,
  contact: /\/(contact|contact-us|get-in-touch)\//i,
  pricing: /\/(pricing|plans?|quote)\//i
}
```

### Schema Signals
```typescript
const schemaSignals = {
  "Service": "Service, Practice Area, Offering",
  "Product": "Product, ProductPage",
  "LocalBusiness": "Location Page, Clinic, Office",
  "Article": "Blog, News, Resource",
  "FAQPage": "FAQ, Support",
  "Organization": "Homepage, About, Brand",
  "WebPage": "Generic page",
  "ContactPoint": "Contact Page",
  "BreadcrumbList": "Site hierarchy indicator"
}
```

---

## INTEGRATION POINTS

### With GA4
- Pull monthly conversions, conversion value, traffic, bounce rate
- Track 30-day trends
- Calculate conversion rates

### With Google Search Console
- Pull monthly impressions, clicks, CTR, average position
- Calculate CTR gaps vs. industry benchmarks
- Track ranking trends

### With Crawl Engine
- Pull technical scores, issue counts
- Detect forms, CTAs, navigation
- Analyze content length, freshness
- Detect schema
- Core Web Vitals

### With Recommendation Engine
- Every recommendation must trace to Decision Engine
- Recommendations are hypotheses we test
- Track actual vs. predicted outcomes
- Adjust confidence over time

### With Daily Mission
- Select page + recommendation with highest Expected Business Return
- That can realistically be completed today
- Considering user's capacity and existing workload

### With Automation Engine (Phase 8)
- High-priority pages trigger automations first
- Automation rules respect manual priorities
- Low-value pages still get work, but lower in queue

---

## PERFORMANCE CONSIDERATIONS

### Optimization Strategies

1. **Lazy Calculation**
   - Only recalculate pages when underlying signals change
   - Use change detection on GA4, GSC, crawl data
   - Cache scores for 1 hour

2. **Batch Processing**
   - Recalculate all page scores nightly (off-peak)
   - Incremental updates when individual signals change

3. **Indexing**
   - Index on priorityScore, businessValue, seoOpportunity
   - Index on projectId for fast filtering
   - Index on updateTime for cache invalidation

4. **Materialized Views**
   - Pre-calculate top 100 pages for each project
   - Pre-calculate by classification
   - Pre-calculate by priority tier

### Scalability Targets

| Pages | Calculation Time | Update Frequency |
|-------|------------------|------------------|
| 10 | <100ms | Real-time |
| 100 | <500ms | Real-time |
| 500 | <2s | Real-time with caching |
| 1000+ | <5s | Nightly batch |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [ ] Database schema creation
- [ ] Page classification engine
- [ ] Signal collection & normalization

### Phase 2: Scoring (Week 2)
- [ ] Business value scoring
- [ ] SEO opportunity scoring
- [ ] Priority ranking

### Phase 3: Intelligence (Week 3)
- [ ] Expected business return calculation
- [ ] Risk assessment
- [ ] Time estimation
- [ ] Explainability engine

### Phase 4: Integration (Week 4)
- [ ] Connect to GA4 sync
- [ ] Connect to GSC sync
- [ ] Connect to crawl engine
- [ ] Update recommendations to use Decision Engine

### Phase 5: Daily Mission (Week 5)
- [ ] Daily mission generator
- [ ] Daily mission UI
- [ ] Mission outcome tracking

### Phase 6: Testing & Optimization (Week 6)
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Benchmarking

---

## SUCCESS METRICS

1. **Explainability**: Every recommendation has a clear "why"
2. **Accuracy**: Predicted business return vs. actual within ±20%
3. **Coverage**: 95% of pages classified with >80% confidence
4. **Performance**: <5s to calculate all scores for 1000 pages
5. **Adoption**: Users choose mission-recommended actions >70% of time

---

## KNOWN LIMITATIONS & FUTURE WORK

1. **GA4 Data Lag**: Conversion data lags 24-48 hours
2. **New Pages**: Classification lower confidence on new pages without signals
3. **Seasonal**: Seasonal businesses need custom weighting
4. **Revenue Attribution**: Can't track revenue for all page types
5. **Business Modes**: Will add law firm, ecommerce, SaaS presets iteratively

---

## APPROVAL NEEDED

Before implementation:

- [ ] Schema structure approved
- [ ] Scoring formulas validated
- [ ] Classification signals comprehensive
- [ ] Performance strategy viable
- [ ] Integration approach clear

Once approved, implementation proceeds immediately.
