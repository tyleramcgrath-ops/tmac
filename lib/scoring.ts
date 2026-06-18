import type {
  BacklinkData,
  ContentGap,
  PageAnalysis,
  SchemaGap,
  Scores,
  SerpData,
  TechnicalIssue,
} from './types'

// Deterministic 0–100 scoring computed from real extracted data. When the
// underlying data is unavailable (e.g. no backlink API) the score is a neutral
// 50 and the explanation says the data is missing — no fake precision.

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))

export function buildScores(args: {
  user: PageAnalysis
  competitors: PageAnalysis[]
  contentGap: ContentGap | null
  schemaGap: SchemaGap | null
  technicalIssues: TechnicalIssue[]
  backlinks: BacklinkData | null
  serp: SerpData | null
  keyword: string
}): Scores {
  const content = scoreContent(args.user, args.contentGap)
  const technical = scoreTechnical(args.technicalIssues, args.user)
  const schema = scoreSchema(args.user, args.schemaGap)
  const authority = scoreAuthority(args.backlinks)
  const speed = scoreSpeed(args.user, args.competitors)
  const intent = scoreIntent(args.user, args.serp, args.keyword)
  const aiReadiness = scoreAiReadiness(args.user, args.schemaGap)

  // Weighted overall. Authority gets a reduced weight when data is unavailable.
  const authorityKnown = args.backlinks?.available ?? false
  const weights: [number, number][] = [
    [content.score, 25],
    [technical.score, 20],
    [schema.score, 10],
    [authority.score, authorityKnown ? 15 : 5],
    [speed.score, 10],
    [intent.score, 15],
    [aiReadiness.score, 10],
  ]
  const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0)
  const overallScore = clamp(weights.reduce((sum, [s, w]) => sum + s * w, 0) / totalWeight)

  return {
    overall: {
      key: 'overall',
      label: 'Overall SEO Competitiveness',
      score: overallScore,
      explanation: overallExplanation(overallScore, authorityKnown),
    },
    content,
    technical,
    schema,
    authority,
    speed,
    intent,
    aiReadiness,
  }
}

function overallExplanation(score: number, authorityKnown: boolean): string {
  const tier =
    score >= 80 ? 'Your page is highly competitive against the current top 10.' :
    score >= 60 ? 'Your page is competitive but has clear gaps versus the top 10.' :
    score >= 40 ? 'Your page has significant gaps versus the pages currently ranking.' :
    'Your page needs substantial work to compete for this keyword.'
  return authorityKnown ? tier : `${tier} (Authority data unavailable — connect a backlink API for a complete picture.)`
}

function scoreContent(user: PageAnalysis, gap: ContentGap | null) {
  if (!user.page || user.page.crawlError) {
    return entry('content', 'Content', 0, 'Your page could not be crawled, so content could not be evaluated.')
  }
  const gapScore = gap?.contentGapScore ?? 50
  const score = clamp(100 - gapScore)
  const wc = user.page.wordCount
  const median = gap?.competitorMedianWordCount ?? 0
  return entry(
    'content', 'Content',
    score,
    `Your page has ${wc.toLocaleString()} words vs a competitor median of ${median.toLocaleString()}. ` +
      `${gap?.missingTerms.length ?? 0} commonly-used competitor terms and ${gap?.missingQuestions.length ?? 0} frequently-answered questions are missing from your page.`
  )
}

function scoreTechnical(issues: TechnicalIssue[], user: PageAnalysis) {
  if (!user.page || user.page.crawlError) {
    return entry('technical', 'Technical SEO', 0, 'Crawl failed — technical health could not be verified.')
  }
  const critical = issues.filter((i) => i.severity === 'critical').length
  const warning = issues.filter((i) => i.severity === 'warning').length
  const info = issues.filter((i) => i.severity === 'info').length
  const score = clamp(100 - critical * 25 - warning * 8 - info * 3)
  return entry(
    'technical', 'Technical SEO',
    score,
    critical + warning + info === 0
      ? 'No technical issues detected on your page.'
      : `${critical} critical, ${warning} warning and ${info} minor issue(s) detected.`
  )
}

function scoreSchema(user: PageAnalysis, gap: SchemaGap | null) {
  if (!user.page) return entry('schema', 'Schema', 0, 'Crawl failed — schema could not be checked.')
  const userTypes = user.page.schemaTypes.length
  const missing = gap?.missingTypes.length ?? 0
  const invalid = user.page.schema.filter((s) => s.errors.length > 0).length
  let score = userTypes === 0 ? 20 : 70 + Math.min(userTypes * 5, 20)
  score -= missing * 8 + invalid * 10
  return entry(
    'schema', 'Schema',
    clamp(score),
    userTypes === 0
      ? 'Your page has no structured data. Competitors using schema are eligible for rich results you are not.'
      : `Your page has ${userTypes} schema type(s)${missing ? `, but is missing ${missing} type(s) competitors commonly use` : ''}${invalid ? ` and ${invalid} block(s) have validation errors` : ''}.`
  )
}

function scoreAuthority(backlinks: BacklinkData | null) {
  if (!backlinks?.available || backlinks.profiles.length === 0) {
    return entry('authority', 'Authority / Backlinks', 50, 'No backlink API connected — authority comparison unavailable. This neutral score does not reflect real data.')
  }
  const user = backlinks.profiles[0]
  const comps = backlinks.profiles.slice(1).filter((p) => p.error === null && p.referringDomains !== null)
  if (user.error !== null || user.referringDomains === null || comps.length === 0) {
    return entry('authority', 'Authority / Backlinks', 50, 'Backlink data could not be retrieved for enough pages to compare.')
  }
  const median = [...comps].map((c) => c.referringDomains!).sort((a, b) => a - b)[Math.floor(comps.length / 2)]
  const ratio = median > 0 ? user.referringDomains / median : 1
  const score = clamp(Math.min(ratio, 1.5) * 60 + (user.domainRank ?? 0) / 10)
  return entry(
    'authority', 'Authority / Backlinks',
    score,
    `Your target has ${user.referringDomains.toLocaleString()} referring domains vs a competitor median of ${median.toLocaleString()}.`
  )
}

function scoreSpeed(user: PageAnalysis, competitors: PageAnalysis[]) {
  const psi = user.pageSpeed
  if (!psi || psi.error || psi.performance === null) {
    return entry('speed', 'Page Speed', 50, psi?.error ?? 'PageSpeed data unavailable for your page. This neutral score does not reflect real data.')
  }
  const compScores = competitors.map((c) => c.pageSpeed?.performance).filter((s): s is number => typeof s === 'number')
  const compAvg = compScores.length ? Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length) : null
  return entry(
    'speed', 'Page Speed',
    clamp(psi.performance),
    `Lighthouse performance score of ${psi.performance}/100 (${psi.strategy})` +
      (compAvg !== null ? ` vs competitor average ${compAvg}/100.` : '.') +
      (psi.lcpMs !== null ? ` LCP ${(psi.lcpMs / 1000).toFixed(1)}s.` : '')
  )
}

function scoreIntent(user: PageAnalysis, serp: SerpData | null, keyword: string) {
  if (!user.page || !user.keywords) {
    return entry('intent', 'SERP Intent Match', 0, 'Crawl failed — intent match could not be evaluated.')
  }
  const u = user.keywords.usage
  let score = 0
  if (u.inTitle) score += 25
  if (u.inH1) score += 20
  if (u.inFirst100Words) score += 15
  if (u.inMetaDescription) score += 10
  if (u.inH2s) score += 10
  if (u.inUrl) score += 10
  if (u.density >= 0.3 && u.density <= 3) score += 10
  const parts: string[] = []
  if (!u.inTitle) parts.push('title')
  if (!u.inH1) parts.push('H1')
  if (!u.inFirst100Words) parts.push('opening copy')
  return entry(
    'intent', 'SERP Intent Match',
    clamp(score),
    parts.length === 0
      ? `"${keyword}" is well-placed across title, headings and opening copy.`
      : `"${keyword}" is missing from: ${parts.join(', ')}.`
  )
}

function scoreAiReadiness(user: PageAnalysis, schemaGap: SchemaGap | null) {
  const page = user.page
  if (!page) return entry('aiReadiness', 'AI Search Readiness', 0, 'Crawl failed — AI readiness could not be evaluated.')
  let score = 0
  const notes: string[] = []
  if (page.hasFaqSection) score += 20; else notes.push('no FAQ content')
  if (page.schemaTypes.length > 0) score += 20; else notes.push('no schema markup')
  if (page.author) score += 15; else notes.push('no visible author/credibility info')
  if (page.publishedDate || page.modifiedDate) score += 10; else notes.push('no published/updated dates')
  if (page.headings.some((h) => h.text.endsWith('?'))) score += 10; else notes.push('no question-style headings')
  if (page.links.external > 0) score += 10; else notes.push('no outbound citations/sources')
  if (page.hasTableOfContents) score += 5
  if (page.wordCount >= 600) score += 10
  return entry(
    'aiReadiness', 'AI Search Readiness',
    clamp(score),
    notes.length === 0
      ? 'The page is well-structured for AI Overviews and answer engines.'
      : `To improve AI/LLM visibility, address: ${notes.join('; ')}.`
  )
}

function entry(key: string, label: string, score: number, explanation: string) {
  return { key, label, score: clamp(score), explanation }
}
