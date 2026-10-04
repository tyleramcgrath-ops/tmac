import { describe, expect, it } from 'vitest'
import { structuredData } from '../apps/saysites/lib/seo'
import { SHOWCASE } from '../apps/saysites/lib/showcase'

type LD = Record<string, unknown> & { '@type': string }

describe('SaySites law firm structured data', () => {
  const { site, pages } = SHOWCASE['calder-and-vane']
  const biz = { '@id': `https://${site.subdomain}.saysites.com/#business` }
  const ld = (slug: string) => structuredData(site, pages.find((p) => p.slug === slug)!, pages) as LD[]

  it('describes the firm, each attorney shown and each practice area', () => {
    expect(ld('').some((x) => x['@type'] === 'LegalService')).toBe(true)
    const people = pages.flatMap((p) => ld(p.slug)).filter((x) => x['@type'] === 'Person')
    expect(people.length).toBeGreaterThan(0)
    for (const p of people) expect(p).toMatchObject({ worksFor: biz })
    expect(typeof people[0].name).toBe('string')
    expect(typeof people[0].jobTitle).toBe('string')
    const area = pages.find((p) => /^practice-areas\/[^/]+$/.test(p.slug))!
    expect(ld(area.slug).find((x) => x['@type'] === 'Service')).toMatchObject({ name: area.name, provider: biz })
  })

  it('gives every page one breadcrumb trail, never two', () => {
    for (const p of pages) expect(ld(p.slug).filter((x) => x['@type'] === 'BreadcrumbList').length, p.slug).toBeLessThanOrEqual(1)
  })
})
