import { defineConfig, devices } from '@playwright/test'

// Real-browser E2E against the built app + a live local Postgres.
// Chromium is pre-installed in the environment; point Playwright at it.
const PORT = process.env.E2E_PORT || '3099'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
    launchOptions: {
      executablePath:
        process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The web server is started by the e2e harness script (needs Postgres +
  // APP_SECRET wired first), so no `webServer` block here.
})
