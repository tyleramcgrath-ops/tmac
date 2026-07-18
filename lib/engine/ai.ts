import Anthropic from '@anthropic-ai/sdk'
import type {
  AiInsights,
  ContentGap,
  PageAnalysis,
  SchemaGap,
  Scores,
  SerpData,
  TechnicalIssue,
} from './types'

// AI recommendation layer. The AI runs ONLY after raw data collection and is
// given a digest of the actual extracted data. Prompts explicitly forbid
// inventing rankings, backlink numbers or schema. If no AI key is configured,
// a clearly-labelled rule-based fallback produces the same shape.

interface AiContext {
  keyword: string
  serp: SerpData | null
  user: PageAnalysis
  competitors: PageAnalysis[]
  contentGap: ContentGap | null
  schemaGap: SchemaGap | null
  technicalIssues: TechnicalIssue[]
  scores: Scores | null
}

export async function generateAiInsights(
  ctx: AiContext,
  keys: { anthropic: string | null; openai: string | null }
): Promise<AiInsights> {
  const digest = buildDataDigest(ctx)
  const prompt = buildPrompt(ctx.keyword, digest)

  if (keys.anthropic) {
    try {
      return await callClaude(prompt, keys.anthropic)
    } catch (err) {
      console.error('[ai] Claude call failed, trying fallback:', err)
    }
  }
  if (keys.openai) {
    try {
      return await callOpenAi(prompt, keys.openai)
    } catch (err) {
      console.error('[ai] OpenAI call failed, using rule-based fallback:', err)
    }
  }
  return ruleBasedInsights(ctx)
}

// ─── Data digest (real data only, trimmed to keep the prompt focused) ───────

function buildDataDigest(ctx: AiContext): Record<string, unknown> {
  const pageDigest = (a: PageAnalysis) =>
    a.page
      ? {
          position: a.position,
          url: a.page.finalUrl,
          crawlError: a.page.crawlError,
          title: a.page.title,
          titleLength: a.page.titleLength,
          metaDescription: a.page.metaDescription,
          h1: a.page.h1,
          h2s: a.page.headings.filter((h) => h.level === 2).map((h) => h.text).slice(0, 20),
          wordCount: a.page.wordCount,
          schemaTypes: a.page.schemaTypes,
          hasFaq: a.page.hasFaqSection,
          author: a.page.author,
          keywordUsage: a.keywords?.usage ?? null,
        }
      : { position: a.position, url: a.serp?.url, crawlError: 'not crawled' }

  return {
    targetKeyword: ctx.keyword,
    serp: ctx.serp
      ? {
          peopleAlsoAsk: ctx.serp.peopleAlsoAsk.slice(0, 10),
          relatedSearches: ctx.serp.relatedSearches.slice(0, 10),
          featuredSnippet: ctx.serp.featuredSnippet ?? null,
        }
      : null,
    myPage: pageDigest(ctx.user),
    competitors: ctx.competitors.map(pageDigest),
    contentGap: ctx.contentGap
      ? {
          missingTerms: ctx.contentGap.missingTerms.slice(0, 15).map((t) => t.term),
          missingPhrases: ctx.contentGap.missingPhrases.slice(0, 10).map((t) => t.term),
          missingQuestions: ctx.contentGap.missingQuestions,
          missingHeadingTopics: ctx.contentGap.missingHeadingTopics,
          recommendedWordCount: `${ctx.contentGap.recommendedWordCountMin}-${ctx.contentGap.recommendedWordCountMax}`,
          contentGapScore: ctx.contentGap.contentGapScore,
        }
      : null,
    schemaGap: ctx.schemaGap
      ? { userTypes: ctx.schemaGap.userTypes, missingTypes: ctx.schemaGap.missingTypes }
      : null,
    technicalIssues: ctx.technicalIssues.map((i) => `${i.severity}: ${i.issue}`),
    scores: ctx.scores
      ? Object.fromEntries(Object.values(ctx.scores).map((s) => [s.label, s.score]))
      : null,
  }
}

function buildPrompt(keyword: string, digest: Record<string, unknown>): string {
  return `You are an expert technical SEO consultant. Below is REAL extracted data comparing my page against the top Google organic results for the keyword "${keyword}". All data was crawled and measured — treat it as ground truth.

STRICT RULES:
- Base every statement on the provided data. Do NOT invent backlink numbers, schema, rankings, traffic figures or competitor details that are not in the data.
- If data is marked unavailable or null, say so rather than guessing.
- Be specific and practical: exact copy suggestions, exact section names.
- Suggested titles must be 50-60 characters and include the target keyword. Suggested meta descriptions must be 140-160 characters and include the keyword.

DATA:
${JSON.stringify(digest, null, 2)}

Respond with ONLY a JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "executiveSummary": "3-5 sentence plain-English summary of how my page compares and the single most important thing to fix",
  "suggestedTitles": ["3 improved title tag options"],
  "suggestedMetaDescriptions": ["2 improved meta description options"],
  "recommendedHeadingOutline": ["ordered list of recommended H1/H2/H3 for the page, prefixed with 'H1:', 'H2:' or 'H3:'"],
  "suggestedContentSections": ["4-8 new or expanded content sections with one sentence describing what each should cover"],
  "faqSuggestions": ["4-8 FAQ questions the page should answer (draw from People Also Ask and competitor coverage)"],
  "aiSearchRecommendations": ["4-8 specific actions to improve visibility in AI Overviews / LLM search, based on the data"],
  "shortAnswerBlock": "a 40-60 word direct answer to the keyword query, suitable as a featured-snippet / AI Overview answer block for my page"
}`
}

// ─── Providers ───────────────────────────────────────────────────────────────

const CLAUDE_MODEL = 'claude-opus-4-8'

async function callClaude(prompt: string, apiKey: string): Promise<AiInsights> {
  // Bound the call so a slow response can't blow the serverless function budget.
  const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 })
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return parseInsights(text, CLAUDE_MODEL)
}

async function callOpenAi(prompt: string, apiKey: string): Promise<AiInsights> {
  const model = 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`)
  const payload = (await res.json()) as Record<string, any>
  const text = payload.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new Error('OpenAI returned no content')
  return parseInsights(text, model)
}

export function parseInsights(text: string, model: string): AiInsights {
  // Tolerate accidental code fences or leading prose around the JSON object.
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('AI response contained no JSON object')
  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>

  const strArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  return {
    generatedBy: model,
    executiveSummary: typeof parsed.executiveSummary === 'string' ? parsed.executiveSummary : '',
    suggestedTitles: strArray(parsed.suggestedTitles),
    suggestedMetaDescriptions: strArray(parsed.suggestedMetaDescriptions),
    recommendedHeadingOutline: strArray(parsed.recommendedHeadingOutline),
    suggestedContentSections: strArray(parsed.suggestedContentSections),
    faqSuggestions: strArray(parsed.faqSuggestions),
    aiSearchRecommendations: strArray(parsed.aiSearchRecommendations),
    shortAnswerBlock: typeof parsed.shortAnswerBlock === 'string' ? parsed.shortAnswerBlock : null,
  }
}

// ─── Rule-based fallback (no AI key configured) ──────────────────────────────

export function ruleBasedInsights(ctx: AiContext): AiInsights {
  const { keyword, user, contentGap, serp } = ctx
  const page = user.page
  const brand = page ? hostBrand(page.finalUrl) : ''
  const year = new Date().getFullYear()
  const kw = titleCase(keyword)

  const overall = ctx.scores?.overall
  const summary = [
    overall
      ? `Your page scores ${overall.score}/100 for overall SEO competitiveness against the current top 10 for "${keyword}".`
      : `Your page was compared against the top 10 results for "${keyword}".`,
    contentGap
      ? `The content gap score is ${contentGap.contentGapScore}/100 — competitors average ${contentGap.competitorMedianWordCount.toLocaleString()} words while your page has ${page?.wordCount.toLocaleString() ?? 'an unknown number of'} words.`
      : '',
    ctx.technicalIssues.some((i) => i.severity === 'critical')
      ? `Fix the critical technical issue(s) first: ${ctx.technicalIssues.filter((i) => i.severity === 'critical').map((i) => i.issue).join('; ')}.`
      : 'No critical technical blockers were found — focus on closing the content and schema gaps.',
    'No AI key is configured, so these suggestions are rule-generated from the extracted data; connect an Anthropic or OpenAI key for tailored copy suggestions.',
  ].filter(Boolean).join(' ')

  return {
    generatedBy: null,
    executiveSummary: summary,
    suggestedTitles: [
      truncateTitle(`${kw}: Complete Guide (${year})${brand ? ` | ${brand}` : ''}`),
      truncateTitle(`${kw} — Everything You Need to Know${brand ? ` | ${brand}` : ''}`),
      truncateTitle(`Best ${kw}: Expert Tips & Examples`),
    ],
    suggestedMetaDescriptions: [
      clip(`Learn ${keyword} with our expert guide: clear explanations, practical examples and answers to the most-asked questions. Read the full breakdown now.`, 160),
      clip(`Everything you need to know about ${keyword} — comparisons, tips and FAQs based on what actually works. Get started today.`, 160),
    ],
    recommendedHeadingOutline: [
      `H1: ${kw}`,
      `H2: What Is ${kw}?`,
      ...contentGap?.missingHeadingTopics.slice(0, 5).map((t) => `H2: ${t}`) ?? [],
      'H2: Frequently Asked Questions',
      ...(contentGap?.missingQuestions.slice(0, 3).map((q) => `H3: ${q}`) ?? []),
    ],
    suggestedContentSections:
      contentGap?.missingHeadingTopics.slice(0, 6).map((t) => `${t} — cover this topic; multiple top-10 competitors dedicate a section to it.`) ?? [],
    faqSuggestions: [...(contentGap?.missingQuestions ?? []), ...(serp?.peopleAlsoAsk ?? [])].slice(0, 8),
    aiSearchRecommendations: [
      'Add a 40–60 word direct answer immediately below the H1 so AI Overviews can quote it.',
      'Add an FAQ section with FAQPage schema using the People Also Ask questions above.',
      page?.author ? 'Keep author information visible and add Person schema for stronger E-E-A-T.' : 'Add a named author with credentials and Person schema (E-E-A-T signal).',
      'Cite 2–5 authoritative external sources to increase trust for answer engines.',
      'Use question-style H2/H3 headings followed by concise answers in the first sentence.',
    ],
    shortAnswerBlock: null,
  }
}

function hostBrand(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const name = host.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return ''
  }
}

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

function truncateTitle(s: string): string {
  return s.length <= 60 ? s : s.slice(0, 57).replace(/\s+\S*$/, '') + '…'
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}
