import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'seo-intel/**',
      'shorts/**',
      // Pre-existing tests built on a custom TestSuite runner (their own
      // describe/it/assert + a trailing process.exit()) rather than vitest's
      // API. They still run correctly via their original `npm run test:*`
      // scripts (node --import tsx); under vitest's runner process.exit()
      // aborts the whole run, so they're excluded here rather than broken.
      'lib/execution/__tests__/**/*.test.ts',
      'lib/autonomy/__tests__/**/*.test.ts',
      // Database integration test: instantiates Prisma at import time and
      // creates/deletes real Organization/Project rows in beforeAll/afterAll,
      // so it requires a provisioned Postgres (it belongs to the integration
      // tier, not the unit run). Run it with a live DATABASE_URL, not here.
      'lib/operator/__tests__/self-review.test.ts',
    ],
  },
})
