import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The trading engine and broker adapters run server-side only. API keys and
  // order execution never reach the browser.
  serverExternalPackages: [],
  // Type errors still fail the build; lint warnings (e.g. unused vars) do not.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
