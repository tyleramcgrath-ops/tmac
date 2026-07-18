import type { MetadataRoute } from 'next'

// Real sitemap for the public marketing pages — an SEO tool should have exemplary
// SEO. Base URL comes from the deploy env (falls back to the production domain).
function baseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'https://tmac-nu.vercel.app'
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl()
  const routes = ['', '/features', '/wordpress', '/agency', '/pricing']
  return routes.map((path) => ({
    url: `${base}${path || '/'}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))
}
