import type { MetadataRoute } from 'next'
import { siteUrl } from './lib/site-url'
import { COMPARISONS } from './contact/_lib/competitors'

// Real sitemap for the public marketing pages — an SEO tool should have exemplary
// SEO. Base URL comes from the deploy env (falls back to the production domain).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()

  const rankforge = ['', '/features', '/wordpress', '/agency', '/pricing'].map((path) => ({
    url: `${base}${path || '/'}`,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  // The Contact Studios site. The scanner and the comparison hub are the two
  // pages worth ranking, so they carry the weight; sign-in is deliberately
  // absent, since there is nothing there for a crawler.
  const contact = [
    { path: '/contact', priority: 0.9 },
    { path: '/contact/app', priority: 0.9 },
    { path: '/contact/compare', priority: 0.8 },
    { path: '/contact/signup', priority: 0.4 },
  ].map((entry) => ({
    url: `${base}${entry.path}`,
    changeFrequency: 'weekly' as const,
    priority: entry.priority,
  }))

  const comparisons = COMPARISONS.map((item) => ({
    url: `${base}/contact/compare/${item.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...rankforge, ...contact, ...comparisons]
}
