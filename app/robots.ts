import type { MetadataRoute } from 'next'

function baseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'https://tmac-nu.vercel.app'
}

// Crawl the marketing pages; keep the app/API surfaces out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/projects', '/studio', '/login', '/signup'] }],
    sitemap: `${baseUrl()}/sitemap.xml`,
  }
}
