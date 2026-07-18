import type {
  ContentGap,
  PageAnalysis,
  SchemaGap,
  SerpData,
  TechnicalIssue,
  TermFrequency,
} from './types'
import { includesKeyword, tokenize } from './keywords'

// The comparison engine: content gaps, schema gaps and the technical audit.
// All deterministic — computed strictly from extracted data.

// ─── Content gap ─────────────────────────────────────────────────────────────

export function buildContentGap(
  user: PageAnalysis,
  competitors: PageAnalysis[],
  serp: SerpData | null,
  keyword: string
): ContentGap {
  const crawled = competitors.filter((c) => c.page && !c.page.crawlError && c.page.wordCount > 50)
  const userPage = user.page
  const userText = userPage?.contentText.toLowerCase() ?? ''
  const userTokens = new Set(tokenize(userText))

  // Terms that appear across multiple competitors but not on the user page.
  const termAppearances = new Map<string, { docs: number; total: number }>()
  for (const c of crawled) {
    for (const { term, count } of c.keywords?.topTerms ?? []) {
      const entry = termAppearances.get(term) ?? { docs: 0, total: 0 }
      entry.docs++
      entry.total += count
      termAppearances.set(term, entry)
    }
  }
  const minDocs = Math.max(2, Math.ceil(crawled.length * 0.3))
  const missingTerms: TermFrequency[] = [...termAppearances.entries()]
    .filter(([term, { docs }]) => docs >= minDocs && !userTokens.has(term))
    .sort((a, b) => b[1].docs - a[1].docs || b[1].total - a[1].total)
    .slice(0, 25)
    .map(([term, { docs }]) => ({ term, count: docs }))

  const phraseAppearances = new Map<string, number>()
  for (const c of crawled) {
    for (const { term } of c.keywords?.topPhrases ?? []) {
      phraseAppearances.set(term, (phraseAppearances.get(term) ?? 0) + 1)
    }
  }
  const missingPhrases: TermFrequency[] = [...phraseAppearances.entries()]
    .filter(([phrase, docs]) => docs >= 2 && !userText.includes(phrase))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term, count]) => ({ term, count }))

  // Questions: PAA + competitor FAQs the user page doesn't answer.
  const candidateQuestions = new Set<string>()
  for (const q of serp?.peopleAlsoAsk ?? []) candidateQuestions.add(q)
  for (const c of crawled) for (const q of c.page?.faqQuestions ?? []) candidateQuestions.add(q)
  const missingQuestions = [...candidateQuestions]
    .filter((q) => !questionAnswered(q, userText, userPage?.faqQuestions ?? []))
    .slice(0, 12)

  // Heading topics competitors cover that the user lacks.
  const headingTopicCounts = new Map<string, { count: number; original: string }>()
  for (const c of crawled) {
    const seenInDoc = new Set<string>()
    for (const h of c.page?.headings ?? []) {
      if (h.level !== 2 && h.level !== 3) continue
      const norm = normalizeHeading(h.text)
      if (!norm || seenInDoc.has(norm)) continue
      seenInDoc.add(norm)
      const entry = headingTopicCounts.get(norm) ?? { count: 0, original: h.text }
      entry.count++
      headingTopicCounts.set(norm, entry)
    }
  }
  const userHeadingNorms = new Set((userPage?.headings ?? []).map((h) => normalizeHeading(h.text)))
  const missingHeadingTopics = [...headingTopicCounts.entries()]
    .filter(([norm, { count }]) => count >= 2 && !userHeadingNorms.has(norm))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([, { original }]) => original)

  // Word-count recommendation from competitor distribution.
  const wordCounts = crawled.map((c) => c.page!.wordCount).sort((a, b) => a - b)
  const median = wordCounts.length ? wordCounts[Math.floor(wordCounts.length / 2)] : 0
  const p75 = wordCounts.length ? wordCounts[Math.floor(wordCounts.length * 0.75)] : 0
  const recommendedWordCountMin = Math.max(300, Math.round(median / 50) * 50)
  const recommendedWordCountMax = Math.max(recommendedWordCountMin + 200, Math.round(p75 / 50) * 50)

  // Content gap score: 0 = no gap, 100 = severe gap.
  let gap = 0
  if (userPage) {
    const wordRatio = median > 0 ? Math.min(userPage.wordCount / median, 1) : 1
    gap += (1 - wordRatio) * 35 // thinner than competitors
    gap += Math.min(missingTerms.length, 20) * 1.25 // up to 25
    gap += Math.min(missingQuestions.length, 10) * 2 // up to 20
    gap += Math.min(missingHeadingTopics.length, 10) * 2 // up to 20
  } else {
    gap = 100
  }

  return {
    missingTerms,
    missingPhrases,
    missingQuestions,
    missingHeadingTopics,
    recommendedWordCountMin,
    recommendedWordCountMax,
    competitorMedianWordCount: median,
    contentGapScore: Math.round(Math.min(100, Math.max(0, gap))),
  }
}

function questionAnswered(question: string, userText: string, userFaqs: string[]): boolean {
  const qNorm = normalizeHeading(question)
  if (userFaqs.some((f) => normalizeHeading(f) === qNorm)) return true
  // consider answered if most meaningful words of the question appear in the content
  const words = tokenize(question).filter((w) => w.length > 3)
  if (words.length === 0) return true
  const present = words.filter((w) => userText.includes(w)).length
  return present / words.length >= 0.8
}

function normalizeHeading(text: string): string {
  return tokenize(text).filter((w) => w.length > 2).sort().join(' ')
}

// ─── Schema gap ──────────────────────────────────────────────────────────────

const SCHEMA_SUGGESTION_ORDER = [
  'FAQPage', 'Article', 'BlogPosting', 'BreadcrumbList', 'Organization', 'Product',
  'HowTo', 'LocalBusiness', 'VideoObject', 'WebSite', 'WebPage', 'Person', 'Review', 'Service',
]

export function buildSchemaGap(user: PageAnalysis, competitors: PageAnalysis[], keyword: string): SchemaGap {
  const userTypes = user.page?.schemaTypes ?? []
  const counts = new Map<string, number>()
  for (const c of competitors) {
    for (const type of new Set(c.page?.schemaTypes ?? [])) {
      counts.set(type, (counts.get(type) ?? 0) + 1)
    }
  }
  const competitorTypeCounts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }))

  const missingTypes = competitorTypeCounts
    .filter(({ type, count }) => count >= 2 && !userTypes.includes(type))
    .map(({ type }) => type)

  const invalidSchemas: SchemaGap['invalidSchemas'] = []
  const collect = (analysis: PageAnalysis) => {
    for (const item of analysis.page?.schema ?? []) {
      if (item.errors.length > 0) {
        invalidSchemas.push({ url: analysis.page!.finalUrl, type: item.type, errors: item.errors })
      }
    }
  }
  collect(user)
  competitors.forEach(collect)

  const suggestedJsonLd = missingTypes
    .filter((t) => SCHEMA_SUGGESTION_ORDER.includes(t))
    .sort((a, b) => SCHEMA_SUGGESTION_ORDER.indexOf(a) - SCHEMA_SUGGESTION_ORDER.indexOf(b))
    .slice(0, 3)
    .map((type) => schemaTemplate(type, user, keyword))

  return { userTypes, competitorTypeCounts, missingTypes, invalidSchemas, suggestedJsonLd }
}

function schemaTemplate(type: string, user: PageAnalysis, keyword: string): Record<string, unknown> {
  const url = user.page?.finalUrl ?? 'https://your-page-url'
  const title = user.page?.title ?? `Your page about ${keyword}`
  switch (type) {
    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is ${keyword}?`,
            acceptedAnswer: { '@type': 'Answer', text: 'Replace with a concise 40–60 word answer.' },
          },
        ],
      }
    case 'Article':
    case 'BlogPosting':
      return {
        '@context': 'https://schema.org',
        '@type': type,
        headline: title,
        author: { '@type': 'Person', name: user.page?.author ?? 'Author Name' },
        datePublished: user.page?.publishedDate ?? new Date().toISOString().slice(0, 10),
        dateModified: user.page?.modifiedDate ?? new Date().toISOString().slice(0, 10),
        mainEntityOfPage: url,
      }
    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', url).toString() },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      }
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Your Organization',
        url: new URL('/', url).toString(),
        logo: new URL('/logo.png', url).toString(),
      }
    case 'HowTo':
      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: title,
        step: [{ '@type': 'HowToStep', name: 'Step 1', text: 'Replace with the first step.' }],
      }
    default:
      return { '@context': 'https://schema.org', '@type': type, name: title, url }
  }
}

// ─── Technical audit ─────────────────────────────────────────────────────────

export function buildTechnicalIssues(user: PageAnalysis, keyword: string): TechnicalIssue[] {
  const issues: TechnicalIssue[] = []
  const page = user.page
  const push = (id: string, severity: TechnicalIssue['severity'], issue: string, detail: string) =>
    issues.push({ id, severity, issue, detail })

  if (!page || page.crawlError) {
    push('crawl-failed', 'critical', 'Your page could not be crawled', page?.crawlError ?? 'Unknown crawl failure.')
    return issues
  }

  if (page.status !== 200) push('http-status', 'critical', `Page returns HTTP ${page.status}`, 'Search engines need a 200 response to index the page.')
  if (!page.https) push('https', 'critical', 'Page is not served over HTTPS', 'HTTPS is a confirmed ranking signal and required for user trust.')
  if (page.mixedContent) push('mixed-content', 'warning', 'Mixed content detected', 'HTTPS page loads images/scripts/styles over insecure http://, which browsers may block.')
  if (!page.indexable) push('noindex', 'critical', 'Page is not indexable', `Meta robots is "${page.metaRobots ?? ''}" — the page cannot rank while noindex is present.`)
  if (page.redirectChain.length >= 2) push('redirect-chain', 'warning', `Redirect chain of ${page.redirectChain.length} hops`, `Each hop wastes crawl budget and dilutes link equity: ${page.redirectChain.map((r) => r.url).join(' → ')} → ${page.finalUrl}`)

  if (!page.title) push('missing-title', 'critical', 'Missing title tag', 'The title tag is the strongest on-page relevance signal.')
  else if (page.titleLength > 60) push('long-title', 'warning', `Title tag is ${page.titleLength} characters`, 'Titles over ~60 characters get truncated in search results.')
  else if (page.titleLength < 25) push('short-title', 'info', `Title tag is only ${page.titleLength} characters`, 'Short titles waste relevance and click-through opportunity.')

  if (!page.metaDescription) push('missing-meta', 'warning', 'Missing meta description', 'Google often writes its own snippet without one, hurting click-through rate.')
  else if (page.metaDescriptionLength > 160) push('long-meta', 'info', `Meta description is ${page.metaDescriptionLength} characters`, 'Descriptions over ~160 characters get truncated in search results.')

  if (page.h1.length === 0) push('missing-h1', 'warning', 'Missing H1 heading', 'The H1 confirms page topic to both users and search engines.')
  if (page.h1.length > 1) push('duplicate-h1', 'warning', `${page.h1.length} H1 headings found`, 'Multiple H1s dilute the primary topic signal. Keep exactly one.')

  if (!page.canonical) push('missing-canonical', 'info', 'No canonical tag', 'A self-referencing canonical protects against duplicate-content issues.')
  if (page.wordCount < 300) push('thin-content', 'critical', `Thin content: only ${page.wordCount} words`, 'Pages under ~300 words rarely rank for competitive keywords.')
  if (page.images.missingAlt > 0) push('missing-alt', 'warning', `${page.images.missingAlt} of ${page.images.count} images missing alt text`, 'Alt text is an accessibility requirement and an image-SEO ranking factor.')
  if (page.schema.length === 0) push('no-schema', 'warning', 'No structured data found', 'Schema markup enables rich results and helps AI search engines understand the page.')

  const invalid = page.schema.filter((s) => s.errors.length > 0)
  if (invalid.length > 0) push('invalid-schema', 'warning', `${invalid.length} schema block(s) have validation errors`, invalid.map((s) => `${s.type}: ${s.errors.join('; ')}`).join(' | '))

  if (page.links.internal === 0) push('no-internal-links', 'warning', 'No internal links found', 'Internal links distribute authority and help crawlers discover content.')

  if (!includesKeyword(page.title, keyword)) push('kw-title', 'warning', 'Target keyword missing from title tag', `"${keyword}" does not appear in the title.`)
  if (!page.h1.some((h) => includesKeyword(h, keyword))) push('kw-h1', 'warning', 'Target keyword missing from H1', `"${keyword}" does not appear in the main heading.`)
  if (!includesKeyword(page.firstWords, keyword)) push('kw-intro', 'info', 'Target keyword missing from the first 100 words', 'Early keyword placement confirms relevance to users and crawlers.')

  return issues
}
