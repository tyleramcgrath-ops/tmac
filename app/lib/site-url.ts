// Canonical base URL for the deploy, shared by sitemap.ts, robots.ts, and any
// structured data that needs an absolute URL. NEXT_PUBLIC_SITE_URL wins when
// set; otherwise falls back to Vercel's own production-URL env var, then the
// known production domain.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'https://tmac-nu.vercel.app'
}
