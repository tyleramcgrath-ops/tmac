import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // PGlite loads its own WASM and data files at runtime; bundling breaks those paths.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
