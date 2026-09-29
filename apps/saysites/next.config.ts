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
    // Photos in the homepage's example sites. Vercel resizes them and serves
    // AVIF/WebP, so they stay light.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
