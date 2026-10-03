// Page Intelligence (Phase C §1): classify a crawled page into a type before
// any recommendation is made. Deterministic, from URL structure + on-page
// signals. Rules key off this so advice is page-appropriate (e.g. no FAQ
// schema on a homepage, no BreadcrumbList at the site root).

import type { PageSignals } from './signals'

export type PageType =
  | 'homepage'
  | 'pricing'
  | 'product'
  | 'category'
  | 'blog_article'
  | 'blog_index'
  | 'about'
  | 'contact'
  | 'team'
  | 'location'
  | 'service'
  | 'case_study'
  | 'comparison'
  | 'faq'
  | 'documentation'
  | 'legal'
  | 'landing'
  | 'search'
  | 'other'

export interface Classification {
  type: PageType
  depth: number // path segments; homepage = 0
  confidence: number // 0-1, how sure the classifier is
  basis: string // human-readable why
}

function pathParts(url: string): string[] {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)
  } catch {
    return url.split('/').filter(Boolean)
  }
}

// URL-keyword → type. Order matters: earlier, more specific patterns win.
const URL_RULES: { type: PageType; re: RegExp }[] = [
  { type: 'pricing', re: /(^|\/)(pricing|plans|price)(\/|$)/i },
  { type: 'legal', re: /(^|\/)(privacy|terms|legal|cookie|gdpr|dpa|policy|policies|compliance)(\/|$)/i },
  { type: 'contact', re: /(^|\/)(contact|contact-us|get-in-touch|book|demo|quote|appointment)(\/|$)/i },
  { type: 'about', re: /(^|\/)(about|about-us|company|who-we-are|our-story|mission|security|trust)(\/|$)/i },
  { type: 'team', re: /(^|\/)(team|teams|people|staff|leadership|attorneys|lawyers|doctors|providers)(\/|$)/i },
  { type: 'case_study', re: /(^|\/)(case-stud|customer-stor|success-stor|customers|testimonial)/i },
  { type: 'comparison', re: /(^|\/)(vs|versus|compare|comparison|alternative)/i },
  { type: 'faq', re: /(^|\/)(faq|faqs|frequently-asked|help\/|support\/)/i },
  { type: 'documentation', re: /(^|\/)(docs|documentation|api|reference|guide|manual|readme)(\/|$)/i },
  { type: 'blog_article', re: /(^|\/)(blog|news|article|post|insights|resources)\/[^/]+/i },
  { type: 'blog_index', re: /(^|\/)(blog|news|articles|insights|resources)(\/|$)/i },
  { type: 'location', re: /(^|\/)(locations?|near-me|areas?-we-serve|[a-z-]+-(city|county|tx|ca|ny|fl))(\/|$)/i },
  { type: 'service', re: /(^|\/)(services?|practice-areas?|solutions?|treatments?|what-we-do)(\/|$)/i },
  { type: 'product', re: /(^|\/)(product|products|item|shop|store|features?)(\/|$)/i },
  { type: 'category', re: /(^|\/)(category|categories|collection|collections|catalog)(\/|$)/i },
  { type: 'search', re: /(^|\/)(search|results)(\/|\?|$)/i },
]

export function classifyPage(s: PageSignals): Classification {
  const parts = pathParts(s.url)
  const depth = parts.length
  const pathStr = '/' + parts.join('/')

  if (depth === 0) {
    return { type: 'homepage', depth, confidence: 0.98, basis: 'URL is the site root (/)' }
  }

  for (const rule of URL_RULES) {
    if (rule.re.test(pathStr)) {
      // Refine blog_article vs blog_index by segment count.
      let type = rule.type
      if (type === 'blog_article' && depth < 2) type = 'blog_index'
      return { type, confidence: 0.85, depth, basis: `URL path matches ${type} pattern (${pathStr})` }
    }
  }

  // On-page fallbacks when the URL is uninformative.
  if (s.schemaTypes?.includes('FAQPage') || s.hasFaq) {
    return { type: 'faq', depth, confidence: 0.6, basis: 'FAQ content/schema present' }
  }
  if ((s.wordCount ?? 0) > 1200 && depth >= 2) {
    return { type: 'blog_article', depth, confidence: 0.5, basis: 'long-form content at depth ≥2' }
  }

  return { type: 'other', depth, confidence: 0.4, basis: 'no strong URL/on-page signal' }
}

// Types where a bolted-on FAQ section would be inappropriate advice.
export const FAQ_INAPPROPRIATE: ReadonlySet<PageType> = new Set<PageType>([
  'homepage', 'about', 'team', 'contact', 'legal', 'blog_article', 'blog_index', 'case_study', 'search',
])

// Types that genuinely have (or should have) a breadcrumb trail.
export const BREADCRUMB_APPROPRIATE: ReadonlySet<PageType> = new Set<PageType>([
  'product', 'category', 'blog_article', 'documentation', 'service', 'location', 'case_study',
])

// The single most-appropriate schema type per page type (for specific advice).
export const PREFERRED_SCHEMA: Partial<Record<PageType, string>> = {
  homepage: 'Organization',
  pricing: 'Product/Offer',
  product: 'Product',
  blog_article: 'Article',
  case_study: 'Article',
  faq: 'FAQPage',
  contact: 'LocalBusiness',
  location: 'LocalBusiness',
  service: 'Service',
  documentation: 'TechArticle',
  about: 'Organization',
  team: 'Organization',
}
