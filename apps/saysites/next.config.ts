import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep builds scoped to this app, not the monorepo root.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
