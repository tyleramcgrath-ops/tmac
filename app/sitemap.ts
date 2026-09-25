import type { MetadataRoute } from 'next'
import { COMPARISONS } from '@/lib/compare'
import { INDUSTRIES } from '@/lib/industries'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://saysites.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://saysites.com/templates', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://saysites.com/visibility-index', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://saysites.com/redesign', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://saysites.com/google-guidelines', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://saysites.com/websites-for', changeFrequency: 'monthly', priority: 0.8 },
    ...INDUSTRIES.map((i) => ({ url: `https://saysites.com/websites-for/${i.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...COMPARISONS.map((c) => ({ url: `https://saysites.com/compare/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    { url: 'https://saysites.com/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { url: 'https://saysites.com/terms', changeFrequency: 'yearly', priority: 0.2 },
  ]
}
