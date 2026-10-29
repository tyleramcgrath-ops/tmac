import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // server-only throws outside React Server Components; tests run in plain Node.
      "server-only": path.resolve(__dirname, "tests/empty.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    env: { PGLITE_DIR: "memory" },
  },
});
