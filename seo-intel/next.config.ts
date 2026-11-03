import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', 'pg'],
  // Hosted on SiteGround's Node.js hosting, like LawMatchNow: builds use one
  // CPU and no worker threads to stay inside shared hosting's memory and
  // process limits. Types are checked in CI (type-check), so the build skips
  // that step.
  experimental: { cpus: 1, workerThreads: false },
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
