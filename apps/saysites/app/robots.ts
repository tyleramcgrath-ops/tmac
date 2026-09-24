import type { MetadataRoute } from 'next'

// saysites.com's own robots.txt. Customer sites get theirs from lib/serve.ts.
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === 'production' && process.env.SAYSITES_INDEXABLE === '1'
  return production
    ? { rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/preview/', '/login', '/signup'] }], sitemap: 'https://saysites.com/sitemap.xml' }
    : { rules: [{ userAgent: '*', disallow: '/' }] }
}
