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
  // Hosted on SiteGround's Node.js hosting, like SaySites: builds use one
  // CPU, no worker threads and webpack (package.json) to stay inside shared
  // hosting's memory and process limits. Types are checked in CI
  // (pnpm type-check), so the build skips that step.
  experimental: { cpus: 1, workerThreads: false },
  typescript: { ignoreBuildErrors: true },
  turbopack: { root: path.join(__dirname) },
  async redirects() {
    return [
      // One canonical host: send www to the bare domain so rankings aren't split.
      { source: '/:path*', has: [{ type: 'host' as const, value: 'www.lawmatchnow.com' }], destination: 'https://lawmatchnow.com/:path*', permanent: true },
      ...MOVED.map(([source, destination]) => ({ source, destination, permanent: true })),
    ]
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
    }, {
      // Self-hosted images never change in place (new image, new name).
      source: '/img/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }]
  },
}

export default nextConfig
