import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://saysites.com/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://saysites.com/templates', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://saysites.com/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { url: 'https://saysites.com/terms', changeFrequency: 'yearly', priority: 0.2 },
  ]
}
