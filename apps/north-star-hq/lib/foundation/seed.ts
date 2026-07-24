// Seeds a sample project into a freshly created org so a new signup's
// Headquarters dashboard has something real to show immediately, instead of
// an empty state. This app has no connection to any real customer's data —
// see store.ts. Every recommendation/deployment below is fabricated demo
// content for a fictional business ("Aurora Outdoor Co.").

import { randomUUID } from 'crypto'
import { encryptSecret } from './crypto'
import type { FoundationStore } from './store'
import type {
  ActivityEvent,
  ContentBrief,
  Job,
  Project,
  Recommendation,
  RecommendationStatus,
  Scan,
  WpConnection,
  WpDeployment,
} from './types'

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

export async function seedSampleProject(store: FoundationStore, orgId: string, userId: string): Promise<void> {
  const now = iso(0)
  const project: Project = {
    id: randomUUID(),
    orgId,
    domain: 'aurora-outdoor.example',
    name: 'Aurora Outdoor Co.',
    industry: 'Ecommerce — outdoor gear',
    businessProfile: 'Direct-to-consumer outdoor gear retailer (tents, packs, trail footwear).',
    goals: ['Grow organic revenue', 'Fix technical SEO health', 'Scale content production'],
    notes: 'Seeded demo project for North Star Headquarters.',
    createdAt: iso(60 * 24 * 10),
    updatedAt: now,
  }
  await store.createProject(project)

  const scan: Scan = {
    id: randomUUID(),
    projectId: project.id,
    createdBy: userId,
    createdAt: iso(60 * 6),
    status: 'completed',
    startedAt: iso(60 * 6),
    completedAt: iso(60 * 5),
    error: null,
    summary: { pagesCrawled: 142, urlsDiscovered: 158, blockedCount: 3, siteScore: 71, critical: 2, warning: 5, info: 4 },
    pages: [],
    blocked: [],
  }
  await store.createScan(scan)

  const wpConnection: WpConnection = {
    id: randomUUID(),
    projectId: project.id,
    siteUrl: 'https://aurora-outdoor.example',
    username: 'demo',
    appPasswordEnc: encryptSecret('demo-simulated-app-password'),
    aioseo: false,
    seoPlugin: 'yoast',
    createdBy: userId,
    createdAt: iso(60 * 24 * 9),
  }
  await store.upsertWpConnection(wpConnection)

  type Seed = {
    ruleId: string
    ruleCategory: string
    severity: 'critical' | 'warning' | 'info'
    businessContext: string
    title: string
    category: string
    status: RecommendationStatus
    url: string
    reasoning: string
    facts: string[]
    impactSize: 'high' | 'medium' | 'low'
    impactCategory: string
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    deploy?: boolean
  }

  const seeds: Seed[] = [
    {
      ruleId: 'missing-meta-description',
      ruleCategory: 'technical',
      severity: 'critical',
      businessContext: 'money-page',
      title: 'Missing meta description on /tents/aurora-3p',
      category: 'Technical SEO',
      status: 'open',
      url: 'https://aurora-outdoor.example/tents/aurora-3p',
      reasoning: 'This product page has no meta description, so Google is generating a snippet from body text — usually a worse click-through pitch than a written one.',
      facts: ['No <meta name="description"> tag found in the rendered HTML.', 'Page received 1,204 impressions in the last 28 days per Search Console.'],
      impactSize: 'high',
      impactCategory: 'CTR',
      riskLevel: 'low',
      confidence: 92,
    },
    {
      ruleId: 'broken-internal-link',
      ruleCategory: 'technical',
      severity: 'critical',
      businessContext: 'standard',
      title: '4 internal links point to a 404\'d /trail-runners-old page',
      category: 'Technical SEO',
      status: 'open',
      url: 'https://aurora-outdoor.example/collections/footwear',
      reasoning: 'The old trail-runner collection URL was retired but 4 pages still link to it, sending both users and crawl budget into a dead end.',
      facts: ['GET /trail-runners-old returns 404.', '4 internal links found across the crawl pointing at this URL.'],
      impactSize: 'medium',
      impactCategory: 'crawl efficiency',
      riskLevel: 'low',
      confidence: 97,
    },
    {
      ruleId: 'thin-content',
      ruleCategory: 'content',
      severity: 'warning',
      businessContext: 'money-page',
      title: 'Product page for Aurora 2P Tent is thin relative to top-ranking competitors',
      category: 'Content',
      status: 'accepted',
      url: 'https://aurora-outdoor.example/tents/aurora-2p',
      reasoning: 'The page has 96 words of unique copy; the top 3 ranking competitor pages for "2 person backpacking tent" average 480 words covering weight, packed size, and weather rating.',
      facts: ['96 words of body copy detected.', 'Competing pages average 480 words on the same query cluster.'],
      impactSize: 'medium',
      impactCategory: 'rankings',
      riskLevel: 'low',
      confidence: 74,
    },
    {
      ruleId: 'missing-title-tag',
      ruleCategory: 'technical',
      severity: 'warning',
      businessContext: 'money-page',
      title: 'Title tag on /packs/summit-40l is truncated in search results',
      category: 'Technical SEO',
      status: 'deployed',
      url: 'https://aurora-outdoor.example/packs/summit-40l',
      reasoning: 'The title tag is 78 characters, well past the ~60 character point where Google typically truncates — the brand name and key spec are getting cut off.',
      facts: ['Title tag measured at 78 characters.', 'Rendered SERP snippet is truncated with an ellipsis.'],
      impactSize: 'medium',
      impactCategory: 'CTR',
      riskLevel: 'low',
      confidence: 88,
      deploy: true,
    },
    {
      ruleId: 'missing-alt-text',
      ruleCategory: 'accessibility',
      severity: 'warning',
      businessContext: 'standard',
      title: 'Hero product images missing alt text on the homepage',
      category: 'Accessibility',
      status: 'deployed',
      url: 'https://aurora-outdoor.example/',
      reasoning: 'The three hero carousel images have empty alt attributes, which is both an accessibility gap and a missed image-search signal.',
      facts: ['3 of 3 hero images have alt="".'],
      impactSize: 'low',
      impactCategory: 'accessibility',
      riskLevel: 'low',
      confidence: 95,
      deploy: true,
    },
    {
      ruleId: 'duplicate-title',
      ruleCategory: 'technical',
      severity: 'info',
      businessContext: 'utility',
      title: 'Shipping and Returns pages share an identical title tag',
      category: 'Technical SEO',
      status: 'dismissed',
      url: 'https://aurora-outdoor.example/pages/shipping',
      reasoning: 'Both utility pages are titled "Aurora Outdoor Co." with no page-specific text — low priority since neither targets organic traffic.',
      facts: ['Both pages share the exact title string.'],
      impactSize: 'low',
      impactCategory: 'indexation clarity',
      riskLevel: 'low',
      confidence: 60,
    },
  ]

  const recommendations: Recommendation[] = seeds.map((s, i) => {
    const createdAt = iso(60 * 5 - i)
    const history: Recommendation['history'] = []
    if (s.status !== 'open') {
      history.push({ at: iso(60 * 4), by: userId, from: 'open', to: s.deploy ? 'accepted' : s.status })
      if (s.deploy) history.push({ at: iso(60 * 3), by: userId, from: 'accepted', to: 'deployed' })
    }
    return {
      id: randomUUID(),
      projectId: project.id,
      scanId: scan.id,
      issueId: `${project.id}:${s.ruleId}:${s.url}`,
      ruleId: s.ruleId,
      ruleVersion: 1,
      ruleCategory: s.ruleCategory,
      ruleSeverity: s.severity,
      businessContext: s.businessContext,
      title: s.title,
      category: s.category,
      severity: s.severity,
      status: s.status,
      pageType: s.businessContext === 'money-page' ? 'product' : 'standard',
      priorityRank: i + 1,
      priorityScore: 100 - i * 8,
      reasoning: s.reasoning,
      evidence: { affectedUrls: [s.url], facts: s.facts },
      confidence: s.confidence,
      confidenceBasis: 'Rule certainty weighted by observed prevalence across the crawl.',
      expectedImpact: { category: s.impactCategory, size: s.impactSize, note: `Estimated ${s.impactSize} impact on ${s.impactCategory}.` },
      risk: { level: s.riskLevel, note: 'Simulated deploy — no real site is affected.' },
      createdAt,
      history,
    }
  })
  await store.createRecommendations(recommendations)

  const deployments: WpDeployment[] = []
  for (const rec of recommendations) {
    if (rec.status !== 'deployed') continue
    const dep: WpDeployment = {
      id: randomUUID(),
      projectId: project.id,
      connectionId: wpConnection.id,
      postId: 1000 + deployments.length,
      postType: 'pages',
      postUrl: rec.evidence.affectedUrls[0],
      before: { title: 'Untitled', metaDescription: '', contentHash: '00000000', content: '' },
      after: { title: rec.title },
      approvedBy: userId,
      approvedAt: iso(60 * 3),
      reason: rec.reasoning,
      recommendationId: rec.id,
      status: 'verified',
      verification: { checkedAt: iso(60 * 3), titleMatches: true, metaMatches: null, note: 'Simulated deployment (demo data).' },
      result: 'Applied and verified (simulated).',
      createdAt: iso(60 * 3),
    }
    deployments.push(dep)
    await store.createWpDeployment(dep)
    rec.status = 'verified'
    await store.updateRecommendation(rec)
  }

  const jobs: Job[] = [
    {
      id: randomUUID(),
      orgId,
      projectId: project.id,
      kind: 'scheduled_scan',
      status: 'succeeded',
      runAt: iso(60 * 6),
      payload: {},
      attempts: 1,
      maxAttempts: 3,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      result: { scanId: scan.id },
      createdAt: iso(60 * 6),
      updatedAt: iso(60 * 5),
    },
  ]
  for (const job of jobs) await store.enqueueJob(job)

  const brief: ContentBrief = {
    id: randomUUID(),
    projectId: project.id,
    keyword: 'best 2 person backpacking tent',
    createdBy: userId,
    createdAt: iso(60 * 2),
    status: 'draft',
    serpAvailable: false,
    serpResults: [],
    competitorsConsidered: [],
    title: 'Best 2-Person Backpacking Tents in 2026',
    metaDescription: 'A buyer\'s guide comparing weight, packed size, and weather rating across the top 2-person backpacking tents — including the Aurora 2P.',
    outline: ['What to look for in a 2-person tent', 'Weight vs. livable space tradeoffs', 'Our top picks', 'Aurora 2P Tent review'],
    contentHtml: '',
    rationale: 'Targets a high-intent comparison query where Aurora 2P Tent currently has no dedicated ranking page.',
  }
  await store.createContentBrief(brief)

  const events: ActivityEvent[] = [
    { id: randomUUID(), orgId, projectId: project.id, type: 'scout.discovery_completed', summary: 'Scout finished crawling aurora-outdoor.example — 142 pages, 2 critical issues found.', missionId: null, recommendationId: null, agentRole: 'scout', actorId: null, detail: null, at: iso(60 * 5) },
    { id: randomUUID(), orgId, projectId: project.id, type: 'recommendation.generated', summary: `${recommendations.length} recommendations generated from the latest scan.`, missionId: null, recommendationId: null, agentRole: 'atlas', actorId: null, detail: null, at: iso(60 * 5 - 1) },
    { id: randomUUID(), orgId, projectId: project.id, type: 'approval.granted', summary: 'Title tag fix on /packs/summit-40l approved.', missionId: recommendations[3].issueId, recommendationId: recommendations[3].id, agentRole: 'operator', actorId: userId, detail: null, at: iso(60 * 4) },
    { id: randomUUID(), orgId, projectId: project.id, type: 'deployment.finished', summary: 'Deployed and verified the title tag fix on /packs/summit-40l (simulated).', missionId: recommendations[3].issueId, recommendationId: recommendations[3].id, agentRole: 'operator', actorId: userId, detail: null, at: iso(60 * 3) },
    { id: randomUUID(), orgId, projectId: project.id, type: 'deployment.finished', summary: 'Deployed and verified alt text on the homepage hero images (simulated).', missionId: recommendations[4].issueId, recommendationId: recommendations[4].id, agentRole: 'operator', actorId: userId, detail: null, at: iso(60 * 3) },
  ]
  for (const event of events) await store.appendActivity(event)
}
