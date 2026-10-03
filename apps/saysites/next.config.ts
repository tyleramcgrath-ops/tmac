import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Photo uploads are resized in the browser first, so a few MB is plenty.
  // Builds run on shared hosting (SiteGround), so they use one CPU and no
  // worker threads to stay within its memory limit. They also use webpack
  // (package.json): Turbopack starts helper processes that open a local
  // port, which shared hosting doesn't allow.
  experimental: { serverActions: { bodySizeLimit: '4mb' }, cpus: 1, workerThreads: false },
  // Types are checked before every change ships (npx tsc --noEmit), so the
  // build skips that step and its memory.
  typescript: { ignoreBuildErrors: true },
  // Native renderer Sofie uses to look at the logos she designs.
  serverExternalPackages: ['@resvg/resvg-js'],
  turbopack: {
    root: path.join(__dirname),
  },
  // The birthday launch became early access (September 2026). Old links
  // in posts and texts still land somewhere useful.
  async redirects() {
    return [{ source: '/birthday', destination: '/early', permanent: false }]
  },
  images: {
    // Photos in the marketing pages' example sites. Unsplash resizes them and
    // serves AVIF/WebP itself (lib/image-loader.ts), so Vercel's metered image
    // optimization isn't needed.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
};

export default nextConfig;
