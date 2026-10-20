import type { MetadataRoute } from 'next'
import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { attorneySlugs, listPosts } from '@/lib/directory'
import { CITIES, STATES, stateByCode } from '@/lib/geo'
import { researchedOn } from '@/lib/law/facts'
import { TOPICS, ctxFor, topicsFor, topicsForPractice } from '@/lib/law/topics'
import { TOOLS, statesFor } from '@/lib/law/tools'
import { CONTENT_REVIEWED, abs } from '@/lib/site'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reviewed = new Date(CONTENT_REVIEWED)
  const page = (path: string, priority = 0.6, lastModified: Date = reviewed) => ({ url: abs(path), lastModified, priority })
  const [attorneys, posts] = await Promise.all([attorneySlugs(), listPosts(1, 200)])
  return [
    page('/', 1),
    ...['/find-a-lawyer', '/practice-areas', '/states', '/cities', '/guides', '/questions', '/glossary', '/emergency', '/get-started', '/for-attorneys', '/blog'].map((p) => page(p, 0.8)),
    ...['/about', '/contact', '/privacy', '/terms', '/disclaimer'].map((p) => page(p, 0.3)),
    ...PRACTICE_AREAS.map((p) => page(`/practice-area/${p.slug}`, p.guide ? 0.9 : 0.6)),
    ...GUIDES.map((g) => page(`/guide/${g.slug}`, 0.8)),
    ...STATES.map((s) => page(`/state/${s.slug}`, 0.7)),
    ...CITIES.map((c) => page(`/${c.slug}`, 0.8)),
    page('/laws', 0.8),
    page('/calculators', 0.9),
    ...TOOLS.map((t) => page(`/calculators/${t.slug}`, 0.8)),
    ...TOOLS.flatMap((t) => statesFor(t).map((s) => page(`/calculators/${t.slug}/${s.slug}`, 0.7))),
    ...TOPICS.map((t) => page(`/laws/${t.slug}`, 0.8, new Date(researchedOn(t.lead)))),
    ...STATES.flatMap((s) => topicsFor(s.code).map((t) => page(`/state/${s.slug}/${t.slug}`, 0.8, new Date(researchedOn(t.lead))))),
    // City + issue pages that carry verified state law (the rest are noindex until listings arrive).
    ...CITIES.flatMap((c) => {
      const law = ctxFor(stateByCode(c.state)!)
      return PRACTICE_AREAS.filter((p) => topicsForPractice(p.slug).some((t) => law.f(t.lead))).map((p) => page(`/${c.slug}/${p.slug}`, 0.7))
    }),
    ...posts.items.map((p) => page(`/blog/${p.slug}`, 0.5, new Date((p.updated || p.created).replace(' ', 'T')))),
    ...attorneys.map((a) => page(`/attorney/${a.slug}`, 0.5, new Date(a.updated.replace(' ', 'T')))),
  ]
}
