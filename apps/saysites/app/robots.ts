import type { MetadataRoute } from 'next'

// saysites.com's own robots.txt. Customer sites get theirs from lib/serve.ts.
export default function robots(): MetadataRoute.Robots {
  // SAYSITES_INDEXABLE=1 is set only on the live site. On Vercel, preview
  // deployments stay closed even if they inherit it.
  const production = process.env.SAYSITES_INDEXABLE === '1' && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production')
  return production
    ? { rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/preview/', '/login', '/signup'] }], sitemap: 'https://saysites.com/sitemap.xml' }
    : { rules: [{ userAgent: '*', disallow: '/' }] }
}
