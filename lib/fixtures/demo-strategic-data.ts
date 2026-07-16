// Shared demo fixture for the Strategic Planning API routes.
//
// Single source of truth so /api/strategic/missions and
// /api/strategic/candidates don't drift into two different (and previously,
// two different broken) copies of the same "Example Page" placeholder data.
// Validated at module load via assertFixtureQuality — if this ever regresses
// to placeholder content, the route fails loudly instead of shipping it.

import type { PageResult, Analytics } from '@/lib/demo-data'
import { assertFixtureQuality } from './validate'

export const DEMO_BUSINESS_NAME = 'Sterling Roofing & Exteriors'
export const DEMO_MONTHLY_VISITS = 5000
export const DEMO_VALUE_PER_VISIT = 150

const DOMAIN = 'https://sterling-roofing-demo.rankforge.dev'

export const demoStrategicPages: PageResult[] = [
  {
    url: DOMAIN,
    status: 200,
    overall: 82,
    scores: { technical: 88, content: 78, schema: 74, ai: 80 },
    wordCount: 1800,
    title: 'Sterling Roofing & Exteriors — Licensed Roofing Contractors',
    titleLength: 51,
    metaDescription: 'Licensed, insured roofing contractors serving the metro area. Repairs, replacements, and storm damage restoration.',
    canonical: DOMAIN,
    mixedContent: false,
    h1Count: 1,
    schemaTypes: ['Organization', 'LocalBusiness'],
    internalTargets: [`${DOMAIN}/services`, `${DOMAIN}/reviews`],
    https: true,
    indexable: true,
    fixes: [],
  },
  {
    url: `${DOMAIN}/services`,
    status: 200,
    overall: 79,
    scores: { technical: 85, content: 72, schema: 68, ai: 76 },
    wordCount: 2400,
    title: 'Roofing Services — Repair, Replacement & Storm Damage',
    titleLength: 55,
    metaDescription: 'Full range of residential and commercial roofing services with transparent, upfront pricing.',
    canonical: `${DOMAIN}/services`,
    mixedContent: false,
    h1Count: 1,
    schemaTypes: ['Service'],
    internalTargets: [DOMAIN, `${DOMAIN}/reviews`],
    https: true,
    indexable: true,
    fixes: [],
  },
  {
    url: `${DOMAIN}/reviews`,
    status: 200,
    overall: 74,
    scores: { technical: 80, content: 70, schema: 65, ai: 72 },
    wordCount: 900,
    title: 'Customer Reviews — Sterling Roofing & Exteriors',
    titleLength: 46,
    metaDescription: 'Read verified reviews from homeowners and businesses who trusted us with their roofing projects.',
    canonical: `${DOMAIN}/reviews`,
    mixedContent: false,
    h1Count: 1,
    schemaTypes: ['Review'],
    internalTargets: [DOMAIN],
    https: true,
    indexable: true,
    fixes: [],
  },
]

assertFixtureQuality(demoStrategicPages.map((p) => ({ url: p.url, title: p.title, metaDescription: p.metaDescription })))

export const demoStrategicAnalytics: Analytics = {
  siteScore: 78,
  categories: { technical: 84, content: 73, schema: 69, ai: 76 },
  severityTotals: { critical: 1, warning: 4, info: 9 },
  totals: { avgWordCount: 1700, pagesWithSchema: demoStrategicPages.length, nonIndexable: 0, httpsPages: 100 },
  issues: [],
  links: { orphans: [], avgInbound: 2.8, noInternalLinks: 0 },
  schemaCoverage: [],
}
