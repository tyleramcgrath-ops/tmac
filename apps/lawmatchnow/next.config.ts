import type { NextConfig } from 'next'
import path from 'node:path'

// Old URLs from the previous site point at their closest new page, so links
// and rankings they earned carry over.
const MOVED: [string, string][] = [
  ['/search', '/find-a-lawyer'],
  ['/top-attorneys', '/find-a-lawyer'],
  ['/comparisons', '/guides'],
  ['/comparison/contingency-vs-hourly-fees', '/guide/contingency-vs-hourly-fees'],
  ['/comparison/mediation-vs-litigation', '/guide/mediation-vs-litigation'],
  ['/comparison/lawyer-vs-self-representation', '/guide/do-i-need-a-lawyer'],
  ['/comparison/directory-vs-referral-service', '/about'],
  ['/legal-stats', '/guides'],
  ['/tools', '/guides'],
  ['/tools/:path*', '/guides'],
  ['/case-law', '/blog'],
  ['/:city/questions', '/questions'],
  ['/:city/for-attorneys', '/for-attorneys'],
  ['/firm/:slug', '/attorney/:slug'],
  ['/attorney/login', '/for-attorneys'],
  ['/attorney/onboarding', '/for-attorneys'],
  ['/attorney/dashboard', '/for-attorneys'],
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.join(__dirname) },
  async redirects() {
    return MOVED.map(([source, destination]) => ({ source, destination, permanent: true }))
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }]
  },
}

export default nextConfig
