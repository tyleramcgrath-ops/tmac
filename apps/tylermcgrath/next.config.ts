import path from "node:path";
import type { NextConfig } from "next";

// Static export: SiteGround serves out/ from public_html, no Node runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Build on its own, not as part of the monorepo root.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
