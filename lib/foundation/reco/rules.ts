// Page-type-aware rule set (Phase C §5, §9). Each rule decides whether it
// applies to a given page GIVEN its type, and returns a fully-explained
// finding. Rules never fire on page types where the advice would be wrong
// (fixing the Phase B false positives), and every finding answers why / why
// now / why this page / what if ignored / what could make it wrong.

import type { PageSignals } from './signals'
import { BREADCRUMB_APPROPRIATE, FAQ_INAPPROPRIATE, PREFERRED_SCHEMA, type Classification, type PageType } from './classify'
import type { BusinessContext } from './business'

export type Category = 'indexability' | 'content' | 'schema' | 'technical' | 'accessibility' | 'links'

export interface Explanation {
  why: string
  whyNow: string
  whyThisPage: string
  whatIfIgnored: string
  whatCouldMakeWrong: string
}

export interface Finding {
  ruleId: string
  title: string
  category: Category
  // 0-1: how mechanically certain the detection is (a missing <title> = 1.0;
  // a "thin content" heuristic = lower). Used by the confidence model.
  ruleCertainty: number
  // 0-1: intrinsic importance of fixing this, independent of how many pages
  // have it. This is what replaces prevalence in confidence/priority.
  importance: number
  seoImpact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  risk: { level: 'low' | 'medium' | 'high'; note: string }
  googleGuidance?: string
  supportingElements: string[]
  explanation: Explanation
}

interface RuleCtx {
  s: PageSignals
  cls: Classification
  biz: BusinessContext
}

type Rule = (ctx: RuleCtx) => Finding | null

const has = <T>(v: T | undefined): v is T => v !== undefined

// ── Indexability / technical ────────────────────────────────────────────────

const ruleMixedContent: Rule = ({ s }) => {
  if (s.mixedContent !== true) return null
  return {
    ruleId: 'mixed-content',
    title: 'Insecure (http://) sub-resource on an HTTPS page',
    category: 'technical',
    ruleCertainty: 0.9,
    importance: 0.85,
    seoImpact: 'high',
    effort: 'low',
    risk: { level: 'low', note: 'Swapping a resource URL to https rarely breaks anything.' },
    googleGuidance: 'Google flags mixed content; browsers block or warn on insecure sub-resources.',
    supportingElements: ['An img/script/stylesheet loads over http:// on an https page'],
    explanation: {
      why: 'Insecure sub-resources trigger browser warnings and can be blocked, harming trust and rendering.',
      whyNow: 'Security signals are a baseline expectation; this is cheap to fix.',
      whyThisPage: 'This page loads at least one http:// sub-resource while served over https.',
      whatIfIgnored: 'Users may see "not secure" warnings; assets may fail to load.',
      whatCouldMakeWrong: 'If the detected match is a navigational link rather than a sub-resource (the detector now excludes anchor href to avoid this).',
    },
  }
}

const ruleNoindex: Rule = ({ s, cls, biz }) => {
  if (s.indexable !== false) return null
  // Noindex on legal/search pages is often intentional — do not flag.
  if (cls.type === 'legal' || cls.type === 'search') return null
  const money = biz.moneyPageTypes.has(cls.type) || cls.type === 'homepage'
  return {
    ruleId: 'noindex',
    title: 'Page is not indexable (noindex or non-200)',
    category: 'indexability',
    ruleCertainty: 0.95,
    importance: money ? 0.98 : 0.8,
    seoImpact: 'high',
    effort: 'low',
    risk: { level: 'medium', note: 'Only remove noindex if the page is meant to rank.' },
    googleGuidance: 'A noindexed page cannot appear in Google Search.',
    supportingElements: ['robots meta = noindex or HTTP status ≠ 200'],
    explanation: {
      why: 'A non-indexable page is invisible to search — no ranking is possible.',
      whyNow: money ? 'This is a revenue-relevant page; being unindexable blocks all organic value.' : 'Indexability is foundational.',
      whyThisPage: `Classified as ${cls.type}; a noindex here is usually unintended.`,
      whatIfIgnored: 'The page earns zero organic traffic regardless of other optimizations.',
      whatCouldMakeWrong: 'The page may be intentionally excluded (staging, thin utility, duplicate).',
    },
  }
}

// ── Content ─────────────────────────────────────────────────────────────────

const ruleMissingTitle: Rule = ({ s }) => {
  if (!has(s.titleLength)) return null
  if (s.titleLength > 0) return null
  return {
    ruleId: 'missing-title',
    title: 'Missing <title> tag',
    category: 'content',
    ruleCertainty: 1.0,
    importance: 0.95,
    seoImpact: 'high',
    effort: 'low',
    risk: { level: 'low', note: 'Adding a title is safe.' },
    googleGuidance: 'Title links are a primary ranking and click signal.',
    supportingElements: ['No <title> text extracted'],
    explanation: {
      why: 'The title is one of the strongest on-page ranking and click-through signals.',
      whyNow: 'A missing title is a definite, high-impact defect.',
      whyThisPage: 'This page has no title text.',
      whatIfIgnored: 'Google generates a title for you; rankings and CTR suffer.',
      whatCouldMakeWrong: 'Extraction failure could rarely miss a title rendered via JS.',
    },
  }
}

const ruleTitleLength: Rule = ({ s }) => {
  if (!has(s.titleLength) || s.titleLength === 0) return null
  // Wide, non-pedantic band (Phase B: 61-vs-60 was noise). Only flag clearly
  // off titles.
  if (s.titleLength >= 15 && s.titleLength <= 70) return null
  const tooLong = s.titleLength > 70
  return {
    ruleId: 'title-length',
    title: tooLong ? `Title is long (${s.titleLength} chars) — may truncate in results` : `Title is very short (${s.titleLength} chars)`,
    category: 'content',
    ruleCertainty: 0.7,
    importance: 0.4,
    seoImpact: 'low',
    effort: 'low',
    risk: { level: 'low', note: 'Rewording a title is safe.' },
    googleGuidance: 'Titles beyond ~60–70 chars can truncate in the SERP.',
    supportingElements: [`Title length = ${s.titleLength}`],
    explanation: {
      why: tooLong ? 'Long titles truncate, hiding the tail of the message.' : 'Very short titles may under-describe the page.',
      whyNow: 'Low-priority polish, batch with other content edits.',
      whyThisPage: `This title is ${s.titleLength} chars, outside the 15–70 comfortable band.`,
      whatIfIgnored: 'Minor CTR impact; not a ranking blocker.',
      whatCouldMakeWrong: 'Brand conventions may justify the length; SERP truncation is pixel- not char-based.',
    },
  }
}

const ruleMissingMeta: Rule = ({ s, cls }) => {
  if (!has(s.metaDescriptionLength)) return null
  if (s.metaDescriptionLength > 0) return null
  // Utility/search pages rarely need a meta description.
  if (cls.type === 'search') return null
  return {
    ruleId: 'missing-meta',
    title: 'Missing meta description',
    category: 'content',
    ruleCertainty: 0.9,
    importance: 0.75,
    seoImpact: 'medium',
    effort: 'low',
    risk: { level: 'low', note: 'Adding a meta description is safe.' },
    googleGuidance: 'Meta descriptions often become the SERP snippet, influencing CTR.',
    supportingElements: ['No meta description present'],
    explanation: {
      why: 'The meta description commonly becomes the search snippet, driving click-through.',
      whyNow: 'A missing description cedes snippet control to Google.',
      whyThisPage: 'This page has no meta description.',
      whatIfIgnored: 'Google auto-generates a snippet, often less compelling.',
      whatCouldMakeWrong: 'For some pages an auto-snippet is acceptable; impact is CTR, not ranking.',
    },
  }
}

const ruleMultipleH1: Rule = ({ s, cls }) => {
  if (!has(s.h1Count)) return null
  if (s.h1Count <= 1) return null
  // Modern HTML5 tolerates multiple H1s; only flag as low-priority info, and
  // never on template-heavy homepages where multiple H1s are near-universal.
  if (cls.type === 'homepage') return null
  return {
    ruleId: 'multiple-h1',
    title: `Page has ${s.h1Count} H1 headings`,
    category: 'content',
    ruleCertainty: 0.6,
    importance: 0.3,
    seoImpact: 'low',
    effort: 'low',
    risk: { level: 'low', note: 'Demoting extra H1s to H2 is usually safe but touches markup.' },
    googleGuidance: 'Google says multiple H1s are acceptable, but a single clear H1 aids clarity.',
    supportingElements: [`H1 count = ${s.h1Count}`],
    explanation: {
      why: 'A single dominant H1 gives the clearest topical signal, though multiple are tolerated.',
      whyNow: 'Low priority; only worth doing during a content pass.',
      whyThisPage: `This ${cls.type} page has ${s.h1Count} H1s.`,
      whatIfIgnored: 'Negligible ranking effect per Google guidance.',
      whatCouldMakeWrong: 'Google explicitly permits multiple H1s; this is a clarity preference, not a defect.',
    },
  }
}

const ruleMissingH1: Rule = ({ s, cls }) => {
  if (!has(s.h1Count)) return null
  if (s.h1Count > 0) return null
  // A search-results/utility page legitimately may lack an H1; don't nag those.
  if (cls.type === 'search') return null
  return {
    ruleId: 'missing-h1',
    title: 'Page has no H1 heading',
    category: 'content',
    ruleCertainty: 0.9,
    importance: 0.7,
    seoImpact: 'medium',
    effort: 'low',
    risk: { level: 'low', note: 'Adding a single clear H1 is safe; it touches page markup.' },
    googleGuidance: 'A clear H1 states the page topic for users and search engines.',
    supportingElements: ['H1 count = 0'],
    explanation: {
      why: 'The H1 is the page’s primary heading; its absence weakens the topical signal and accessibility.',
      whyNow: 'A missing H1 is a concrete, low-effort content defect.',
      whyThisPage: `This ${cls.type} page renders no H1 heading.`,
      whatIfIgnored: 'Users and search engines get a weaker signal of what the page is about.',
      whatCouldMakeWrong: 'A heading rendered via JavaScript after load would not appear in the static crawl.',
    },
  }
}

const ruleInternalLinking: Rule = ({ s, cls }) => {
  if (!has(s.internalTargets)) return null
  // Only content/decision pages benefit; skip utility, search, and shallow roots.
  const eligible: PageType[] = ['product', 'service', 'pricing', 'documentation', 'comparison', 'blog_article', 'category', 'landing', 'case_study']
  if (!eligible.includes(cls.type)) return null
  if (s.internalTargets.length >= 3) return null
  return {
    ruleId: 'internal-linking',
    title: `Thin internal linking (${s.internalTargets.length} internal link${s.internalTargets.length === 1 ? '' : 's'})`,
    category: 'links',
    ruleCertainty: 0.7,
    importance: 0.55,
    seoImpact: 'medium',
    effort: 'low',
    risk: { level: 'low', note: 'Adding relevant internal links to real pages is safe and additive.' },
    googleGuidance: 'Internal links distribute authority and help Google discover and rank related pages.',
    supportingElements: [`Internal links out = ${s.internalTargets.length}`],
    explanation: {
      why: 'Well-linked pages pass authority and are discovered/crawled more reliably than isolated ones.',
      whyNow: 'This page links out to very few internal pages, leaving relevance and crawl value on the table.',
      whyThisPage: `This ${cls.type} page has only ${s.internalTargets.length} internal link(s).`,
      whatIfIgnored: 'Related pages get less internal authority and may be crawled/ranked less.',
      whatCouldMakeWrong: 'A deliberately focused landing page may intentionally minimize outbound links.',
    },
  }
}

// ── Schema (page-type-appropriate) ──────────────────────────────────────────

const ruleSchemaMissing: Rule = ({ s, cls }) => {
  if (!has(s.schemaTypes)) return null
  if (s.schemaTypes.length > 0) return null
  const preferred = PREFERRED_SCHEMA[cls.type]
  if (!preferred) return null // don't nag pages with no clearly-appropriate schema
  return {
    ruleId: 'schema-missing',
    title: `Add ${preferred} structured data`,
    category: 'schema',
    ruleCertainty: 0.85,
    importance: cls.type === 'pricing' || cls.type === 'product' ? 0.7 : 0.5,
    seoImpact: 'medium',
    effort: 'medium',
    risk: { level: 'low', note: 'Adding valid JSON-LD is safe.' },
    googleGuidance: `${preferred} markup can enable rich results for ${cls.type} pages.`,
    supportingElements: ['No JSON-LD @type found on the page'],
    explanation: {
      why: `${preferred} is the schema type that matches this page's purpose and can unlock rich results.`,
      whyNow: 'Structured data is a durable, page-appropriate win.',
      whyThisPage: `This page is classified ${cls.type}, for which ${preferred} is the fitting schema.`,
      whatIfIgnored: 'Missed rich-result eligibility and weaker machine understanding.',
      whatCouldMakeWrong: 'If the page already emits this schema via JS after load (not seen in the static crawl).',
    },
  }
}

const ruleBreadcrumb: Rule = ({ s, cls }) => {
  if (!has(s.schemaTypes)) return null
  if (s.schemaTypes.includes('BreadcrumbList')) return null
  // ONLY where a breadcrumb trail is appropriate — never the homepage/root.
  if (!BREADCRUMB_APPROPRIATE.has(cls.type)) return null
  if (cls.depth < 2) return null
  return {
    ruleId: 'breadcrumb',
    title: 'Add BreadcrumbList schema',
    category: 'schema',
    ruleCertainty: 0.8,
    importance: 0.35,
    seoImpact: 'low',
    effort: 'low',
    risk: { level: 'low', note: 'Safe additive markup.' },
    googleGuidance: 'BreadcrumbList can produce breadcrumb rich results for nested pages.',
    supportingElements: [`Nested page (depth ${cls.depth}) without BreadcrumbList`],
    explanation: {
      why: 'Breadcrumbs help users and can appear in results for nested pages.',
      whyNow: 'Low-effort enhancement for deep pages.',
      whyThisPage: `This is a nested ${cls.type} page (depth ${cls.depth}) that plausibly sits in a hierarchy.`,
      whatIfIgnored: 'Slightly weaker SERP presentation for nested pages.',
      whatCouldMakeWrong: 'If the page is not actually part of a browsable hierarchy.',
    },
  }
}

const ruleFaq: Rule = ({ s, cls }) => {
  if (s.hasFaq === true || s.schemaTypes?.includes('FAQPage')) return null
  // ONLY on page types where an FAQ genuinely belongs. Never homepage/about/etc.
  const appropriate: PageType[] = ['pricing', 'product', 'service', 'documentation', 'comparison', 'faq']
  if (!appropriate.includes(cls.type) || FAQ_INAPPROPRIATE.has(cls.type)) return null
  return {
    ruleId: 'faq',
    title: 'Consider an FAQ section + FAQPage schema',
    category: 'schema',
    ruleCertainty: 0.6,
    importance: 0.35,
    seoImpact: 'low',
    effort: 'medium',
    risk: { level: 'low', note: 'Only add real Q&As users actually ask.' },
    googleGuidance: 'FAQPage markup can earn expandable rich results where genuine FAQs exist.',
    supportingElements: ['No FAQ content/markup detected'],
    explanation: {
      why: 'On decision pages, a real FAQ answers objections and can earn rich results.',
      whyNow: 'Optional enhancement, only if genuine questions exist.',
      whyThisPage: `This is a ${cls.type} page where buyers/readers commonly have questions.`,
      whatIfIgnored: 'A minor missed enhancement, not a defect.',
      whatCouldMakeWrong: 'Adding fabricated FAQs to hit schema violates Google policy — only real Q&As qualify.',
    },
  }
}

// ── Accessibility ───────────────────────────────────────────────────────────

const ruleAltText: Rule = ({ s }) => {
  if (!has(s.imagesMissingAlt) || s.imagesMissingAlt <= 0) return null
  return {
    ruleId: 'alt-text',
    title: `${s.imagesMissingAlt} image(s) missing alt text`,
    category: 'accessibility',
    ruleCertainty: 0.75,
    importance: 0.45,
    seoImpact: 'low',
    effort: 'low',
    risk: { level: 'low', note: 'Adding alt text is safe and improves accessibility.' },
    googleGuidance: 'Alt text aids accessibility and image search understanding.',
    supportingElements: [`${s.imagesMissingAlt} <img> without alt`],
    explanation: {
      why: 'Alt text improves accessibility and image-search comprehension.',
      whyNow: 'Cheap, compounding accessibility + SEO win.',
      whyThisPage: `${s.imagesMissingAlt} images here lack alt attributes.`,
      whatIfIgnored: 'Screen-reader users and image search lose context.',
      whatCouldMakeWrong: 'Purely decorative images may intentionally use empty alt.',
    },
  }
}

// ── Rule registry (Phase D.6 P2) ─────────────────────────────────────────────
// The single, typed source of rule metadata. `version` lets a rule's logic
// evolve while its identity stays stable and comparable across scans;
// `dangerous` drives safety blocking WITHOUT parsing any display string (the
// former title-regex). Every ruleId the engine can emit — page and cross-page —
// must appear here so the operator/safety layers never fall back to guessing.
export interface RuleMeta {
  version: number
  // Categorically risky to auto-apply (indexation/canonical/robots class):
  // blocked from any automated/bulk path regardless of policy.
  dangerous: boolean
}

export const RULE_REGISTRY: Record<string, RuleMeta> = {
  // page rules
  noindex: { version: 1, dangerous: true }, // toggling indexability can deindex
  'mixed-content': { version: 1, dangerous: false },
  'missing-title': { version: 1, dangerous: false },
  'title-length': { version: 1, dangerous: false },
  'missing-meta': { version: 1, dangerous: false },
  'multiple-h1': { version: 1, dangerous: false },
  'missing-h1': { version: 1, dangerous: false },
  'internal-linking': { version: 1, dangerous: false },
  'schema-missing': { version: 1, dangerous: false },
  breadcrumb: { version: 1, dangerous: false },
  faq: { version: 1, dangerous: false },
  'alt-text': { version: 1, dangerous: false },
  // cross-page rules
  'dup-title': { version: 1, dangerous: false },
  'dup-meta': { version: 1, dangerous: false },
  'orphan-pages': { version: 1, dangerous: false },
}

export function ruleVersion(ruleId: string): number {
  return RULE_REGISTRY[ruleId]?.version ?? 1
}

export function isDangerousRule(ruleId: string): boolean {
  return RULE_REGISTRY[ruleId]?.dangerous ?? false
}

export const PAGE_RULES: Rule[] = [
  ruleNoindex,
  ruleMixedContent,
  ruleMissingTitle,
  ruleMissingMeta,
  ruleSchemaMissing,
  ruleAltText,
  ruleTitleLength,
  ruleMultipleH1,
  ruleMissingH1,
  ruleInternalLinking,
  ruleBreadcrumb,
  ruleFaq,
]

export function runPageRules(ctx: RuleCtx): Finding[] {
  return PAGE_RULES.map((r) => r(ctx)).filter((f): f is Finding => f !== null)
}
