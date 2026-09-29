import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Photo uploads are resized in the browser first, so a few MB is plenty.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
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
