import type { MetadataRoute } from 'next'
import { siteUrl } from './lib/site-url'

// Real sitemap for the public marketing pages — an SEO tool should have exemplary
// SEO. Base URL comes from the deploy env (falls back to the production domain).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const routes = ['', '/features', '/wordpress', '/agency', '/pricing']
  return routes.map((path) => ({
    url: `${base}${path || '/'}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))
}
