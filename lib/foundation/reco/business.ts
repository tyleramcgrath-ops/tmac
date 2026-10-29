// Business Intelligence (Phase C §2). Derives a lightweight business context
// from (a) the project's stored profile and (b) the crawl itself, so that
// revenue-relevant pages are weighted above incidental ones. Nothing here is
// fabricated: money pages are identified from real page types and the URL
// graph, and profile fields are the user's own input.

import type { PageType } from './classify'

export interface BusinessContext {
  industry?: string
  profile?: string
  goals: string[]
  // Page types that carry revenue intent for THIS site (money pages).
  moneyPageTypes: Set<PageType>
  // Whether the site appears to be local (affects LocalBusiness/location value).
  local: boolean
}

export interface ProjectContext {
  industry?: string
  businessProfile?: string
  goals?: string[]
}

// Default money-page types for any business; refined by profile keywords.
const BASE_MONEY_TYPES: PageType[] = ['pricing', 'product', 'category', 'service', 'contact', 'comparison', 'landing']

export function deriveBusinessContext(project: ProjectContext | undefined, pageTypes: PageType[]): BusinessContext {
  const profile = `${project?.industry ?? ''} ${project?.businessProfile ?? ''} ${(project?.goals ?? []).join(' ')}`.toLowerCase()
  const money = new Set<PageType>(BASE_MONEY_TYPES)

  // Local-service / legal / healthcare businesses: location & contact convert.
  const local = /local|clinic|dentist|plumb|hvac|law firm|attorney|lawyer|near me|city|county|healthcare|medical|practice/.test(profile)
  if (local) {
    money.add('location')
    money.add('contact')
  }
  // Content/media businesses: articles are the product.
  if (/blog|media|publisher|content|news|magazine/.test(profile)) {
    money.add('blog_article')
  }
  // If the crawl has no obvious money page type at all, treat the homepage as
  // the primary conversion surface so it isn't deprioritized to zero.
  const hasMoney = pageTypes.some((t) => money.has(t))
  if (!hasMoney) money.add('homepage')

  return {
    industry: project?.industry || undefined,
    profile: project?.businessProfile || undefined,
    goals: project?.goals ?? [],
    moneyPageTypes: money,
    local,
  }
}

// Business-impact multiplier for a page, 0.4–1.0. Money pages and the homepage
// matter most; legal/search/archive least. This is what stops a title-length
// nit on a policy page from outranking a schema gap on the pricing page.
export function pageBusinessWeight(type: PageType, ctx: BusinessContext): number {
  if (type === 'homepage') return 1.0
  if (ctx.moneyPageTypes.has(type)) return 0.9
  if (type === 'legal' || type === 'search') return 0.4
  if (type === 'about' || type === 'team') return 0.6
  return 0.7
}
