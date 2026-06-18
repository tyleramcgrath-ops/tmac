import type {
  BacklinkData,
  ContentGap,
  PageAnalysis,
  Recommendation,
  SchemaGap,
  TechnicalIssue,
} from './types'

// Deterministic, prioritized action plan built from the comparison data.
// The AI layer (lib/ai.ts) adds copy suggestions on top; it never replaces
// these data-derived recommendations.

export function buildRecommendations(args: {
  user: PageAnalysis
  competitors: PageAnalysis[]
  contentGap: ContentGap | null
  schemaGap: SchemaGap | null
  technicalIssues: TechnicalIssue[]
  backlinks: BacklinkData | null
  keyword: string
}): Recommendation[] {
  const recs: Recommendation[] = []
  const { user, contentGap, schemaGap, technicalIssues, backlinks, keyword } = args
  const page = user.page

  // Technical issues map directly to recommendations.
  for (const issue of technicalIssues) {
    recs.push({
      category: issue.severity === 'critical' ? 'critical' : 'technical',
      issue: issue.issue,
      why: issue.detail,
      fix: technicalFix(issue.id, keyword),
      impact: issue.severity === 'critical' ? 'High' : issue.severity === 'warning' ? 'Medium' : 'Low',
      difficulty: technicalDifficulty(issue.id),
      priority: 0,
    })
  }

  // Content gaps.
  if (page && contentGap) {
    if (page.wordCount < contentGap.recommendedWordCountMin) {
      recs.push({
        category: 'content',
        issue: `Content is thinner than competitors (${page.wordCount.toLocaleString()} vs median ${contentGap.competitorMedianWordCount.toLocaleString()} words)`,
        why: 'Top-ranking pages for this keyword cover the topic in substantially more depth.',
        fix: `Expand the page to roughly ${contentGap.recommendedWordCountMin.toLocaleString()}–${contentGap.recommendedWordCountMax.toLocaleString()} words by adding the missing sections and questions identified in the content gap analysis.`,
        impact: 'High',
        difficulty: 'Hard',
        priority: 0,
      })
    }
    if (contentGap.missingHeadingTopics.length > 0) {
      recs.push({
        category: 'content',
        issue: `${contentGap.missingHeadingTopics.length} topic section(s) competitors cover that your page lacks`,
        why: 'Multiple top-10 pages dedicate sections to these topics, signalling Google rewards that coverage.',
        fix: `Add sections covering: ${contentGap.missingHeadingTopics.slice(0, 5).join('; ')}.`,
        impact: 'High',
        difficulty: 'Medium',
        priority: 0,
      })
    }
    if (contentGap.missingQuestions.length > 0) {
      recs.push({
        category: 'content',
        issue: `${contentGap.missingQuestions.length} search question(s) your page does not answer`,
        why: 'These come from People Also Ask and competitor FAQ sections — they reflect real searcher intent.',
        fix: `Add an FAQ section answering: ${contentGap.missingQuestions.slice(0, 4).map((q) => `"${q}"`).join(', ')}.`,
        impact: 'Medium',
        difficulty: 'Easy',
        priority: 0,
      })
    }
    if (contentGap.missingTerms.length >= 5) {
      recs.push({
        category: 'content',
        issue: 'Missing semantically related terms competitors use',
        why: 'Related-term coverage helps search engines confirm topical depth.',
        fix: `Naturally work these terms into the copy where relevant: ${contentGap.missingTerms.slice(0, 10).map((t) => t.term).join(', ')}.`,
        impact: 'Medium',
        difficulty: 'Easy',
        priority: 0,
      })
    }
  }

  // Schema gaps.
  if (schemaGap && schemaGap.missingTypes.length > 0) {
    recs.push({
      category: 'schema',
      issue: `Missing schema types competitors use: ${schemaGap.missingTypes.slice(0, 4).join(', ')}`,
      why: 'Structured data unlocks rich results and improves machine understanding for AI search.',
      fix: 'Add the suggested JSON-LD blocks from the Schema Analysis section to the page <head>, then validate with Google\'s Rich Results Test.',
      impact: 'Medium',
      difficulty: 'Easy',
      priority: 0,
    })
  }

  // Backlinks.
  if (backlinks?.available && backlinks.profiles.length > 1) {
    const userProfile = backlinks.profiles[0]
    const comps = backlinks.profiles.slice(1).filter((p) => p.referringDomains !== null)
    const median = comps.length ? [...comps].map((c) => c.referringDomains!).sort((a, b) => a - b)[Math.floor(comps.length / 2)] : null
    if (userProfile.referringDomains !== null && median !== null && userProfile.referringDomains < median) {
      recs.push({
        category: 'backlinks',
        issue: `Authority gap: ${userProfile.referringDomains.toLocaleString()} referring domains vs competitor median ${median.toLocaleString()}`,
        why: 'Link authority remains one of the strongest ranking factors for competitive keywords.',
        fix: 'Run a backlink-gap campaign: identify domains linking to 2+ competitors but not you, and pitch them your improved page. Promote linkable assets (data, tools, original research).',
        impact: 'High',
        difficulty: 'Hard',
        priority: 0,
      })
    }
  } else if (backlinks && !backlinks.available) {
    recs.push({
      category: 'backlinks',
      issue: 'Backlink comparison unavailable',
      why: 'Without backlink data the authority gap versus competitors cannot be measured.',
      fix: 'Connect a DataForSEO API key on the Settings page to enable backlink and authority comparison.',
      impact: 'Low',
      difficulty: 'Easy',
      priority: 0,
    })
  }

  // Speed.
  const psi = user.pageSpeed
  if (psi && !psi.error && psi.performance !== null && psi.performance < 70) {
    const top = psi.opportunities.slice(0, 3).map((o) => o.title).join('; ')
    recs.push({
      category: 'speed',
      issue: `Lighthouse performance score is ${psi.performance}/100`,
      why: 'Core Web Vitals are a ranking signal and slow pages lose visitors before the content loads.',
      fix: top ? `Start with the highest-impact opportunities: ${top}.` : 'Address the opportunities listed in the Page Speed section.',
      impact: psi.performance < 50 ? 'High' : 'Medium',
      difficulty: 'Medium',
      priority: 0,
    })
  }

  // AI / GEO.
  if (page) {
    if (!page.hasFaqSection) {
      recs.push({
        category: 'ai-geo',
        issue: 'No FAQ content for AI Overviews / answer engines',
        why: 'Concise Q&A blocks are the format most often quoted by AI Overviews, featured snippets and LLM search.',
        fix: 'Add an FAQ section with 4–8 questions (use the People Also Ask questions from this report) and mark it up with FAQPage schema.',
        impact: 'Medium',
        difficulty: 'Easy',
        priority: 0,
      })
    }
    if (!page.author) {
      recs.push({
        category: 'ai-geo',
        issue: 'No visible author or credibility signals',
        why: 'E-E-A-T signals (author bios, credentials, citations) influence both classic rankings and AI-engine source selection.',
        fix: 'Add a named author with a short bio, link to an author page, and add Person schema.',
        impact: 'Medium',
        difficulty: 'Easy',
        priority: 0,
      })
    }
    if (page.links.external === 0) {
      recs.push({
        category: 'ai-geo',
        issue: 'Page cites no external sources',
        why: 'Citing authoritative sources increases trust for users, reviewers and AI systems summarizing your content.',
        fix: 'Reference 2–5 authoritative external sources (studies, documentation, statistics) with descriptive anchor text.',
        impact: 'Low',
        difficulty: 'Easy',
        priority: 0,
      })
    }
  }

  return prioritize(recs)
}

const IMPACT_WEIGHT = { High: 3, Medium: 2, Low: 1 } as const
const DIFFICULTY_WEIGHT = { Easy: 3, Medium: 2, Hard: 1 } as const
const CATEGORY_BOOST: Record<Recommendation['category'], number> = {
  critical: 100, 'high-impact': 50, content: 20, technical: 15, schema: 10, speed: 10, 'ai-geo': 5, backlinks: 5,
}

function prioritize(recs: Recommendation[]): Recommendation[] {
  const scored = recs
    .map((r) => ({
      rec: r,
      score: CATEGORY_BOOST[r.category] + IMPACT_WEIGHT[r.impact] * 10 + DIFFICULTY_WEIGHT[r.difficulty] * 3,
    }))
    .sort((a, b) => b.score - a.score)
  return scored.map(({ rec }, i) => ({ ...rec, priority: i + 1 }))
}

function technicalFix(id: string, keyword: string): string {
  const fixes: Record<string, string> = {
    'crawl-failed': 'Ensure the page returns HTTP 200 to crawlers, is not blocked by a firewall/bot protection, and loads server-rendered HTML.',
    'http-status': 'Fix the response so the canonical URL returns HTTP 200.',
    https: 'Install a TLS certificate and 301-redirect all http:// URLs to https://.',
    'mixed-content': 'Update all asset URLs (images, scripts, stylesheets) to https://.',
    noindex: 'Remove "noindex" from the meta robots tag (or the X-Robots-Tag header) so the page can be indexed.',
    'redirect-chain': 'Point all internal links and redirects directly at the final URL in a single hop.',
    'missing-title': `Add a unique <title> of 50–60 characters that leads with "${keyword}".`,
    'long-title': 'Shorten the title to under 60 characters while keeping the target keyword near the front.',
    'short-title': 'Expand the title toward 50–60 characters with the keyword plus a compelling modifier (year, benefit, brand).',
    'missing-meta': `Write a 140–160 character meta description containing "${keyword}" with a clear value proposition and call to action.`,
    'long-meta': 'Trim the meta description to under 160 characters so it displays in full.',
    'missing-h1': `Add a single H1 containing "${keyword}" that matches search intent.`,
    'duplicate-h1': 'Keep one H1 and demote the others to H2.',
    'missing-canonical': 'Add a self-referencing <link rel="canonical"> tag.',
    'thin-content': 'Expand the content to comprehensively cover the topic (see the Content Gap section for the recommended length and sections).',
    'missing-alt': 'Add descriptive alt text to every meaningful image; include the keyword where it is genuinely accurate.',
    'no-schema': 'Add the suggested JSON-LD from the Schema Analysis section.',
    'invalid-schema': 'Fix the listed required-property errors and re-validate with Google\'s Rich Results Test.',
    'no-internal-links': 'Link to 3–8 relevant pages on your site with descriptive anchor text.',
    'kw-title': `Rewrite the title to include "${keyword}" near the beginning.`,
    'kw-h1': `Include "${keyword}" (or a close variant) in the H1.`,
    'kw-intro': `Mention "${keyword}" naturally within the first one or two sentences.`,
  }
  return fixes[id] ?? 'See the report detail for the affected element.'
}

function technicalDifficulty(id: string): Recommendation['difficulty'] {
  if (['https', 'crawl-failed', 'thin-content', 'http-status'].includes(id)) return 'Hard'
  if (['redirect-chain', 'mixed-content', 'invalid-schema', 'no-schema'].includes(id)) return 'Medium'
  return 'Easy'
}
