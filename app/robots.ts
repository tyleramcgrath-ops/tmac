import type { MetadataRoute } from 'next'
import { siteUrl } from './lib/site-url'

// Crawl the marketing pages; keep the app/API surfaces out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/projects', '/studio', '/login', '/signup'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
