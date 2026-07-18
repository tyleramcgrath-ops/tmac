import { test, expect, type Page } from '@playwright/test'

// Real-browser E2E of the persistent foundation. Runs against the built app
// backed by a live Postgres (started by scripts/e2e.sh). Exercises the rendered
// UI, not route handlers.

const unique = () => `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`
const PASSWORD = 'longenough12345'

// Fail the test on any unexpected browser console error.
function trackConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

async function signup(page: Page, email: string) {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('**/app/projects')
}

test('protected route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/app/projects')
  await page.waitForURL('**/login**')
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('invalid login shows a generic error and does not authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill('nobody@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('signup validation rejects a short password', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Email' }).fill(unique())
  await page.getByRole('textbox', { name: 'Password' }).fill('short')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Password must be at least 10 characters.')).toBeVisible()
  await expect(page).toHaveURL(/\/signup/)
})

test('full journey: signup → project persists across refresh & re-login; recommendations persist', async ({ page }) => {
  const errors = trackConsole(page)
  const email = unique()

  // 1-3. signup + authenticated redirect
  await signup(page, email)
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()

  // empty state visible before any project
  await expect(page.getByText(/No projects yet/i)).toBeVisible()

  // 4. create project
  await page.getByRole('button', { name: 'New project' }).click()
  await page.getByRole('textbox', { name: 'Domain' }).fill('github.com')
  await page.getByRole('textbox', { name: 'Name' }).fill('GitHub E2E')
  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByText('GitHub E2E')).toBeVisible()

  // 5-6. refresh → project remains
  await page.reload()
  await expect(page.getByText('GitHub E2E')).toBeVisible()

  // 7-9. logout → login → project remains
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.waitForURL('**/login**')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/app/projects')
  await expect(page.getByText('GitHub E2E')).toBeVisible()

  // open project
  await page.getByText('GitHub E2E').click()
  await page.waitForURL('**/app/projects/**')
  await expect(page.getByRole('heading', { name: 'GitHub E2E' })).toBeVisible()

  // 10-12. run a real crawl and wait for it to persist to history
  await page.getByRole('button', { name: 'Run scan' }).click()
  await expect(page.getByText('Latest scan')).toBeVisible({ timeout: 45_000 })

  // 13. recommendations exist after the scan
  await page.getByRole('button', { name: 'Recommendations' }).click()
  const recCards = page.locator('.rf-card').filter({ has: page.getByRole('button', { name: 'accepted' }) })
  await expect(recCards.first()).toBeVisible({ timeout: 20_000 })

  // Key off recommendation TITLE (not position) so assertions survive reload,
  // where same-timestamp recs may re-order. Titles are unique.
  const acceptTitle = (await recCards.nth(0).locator('p.font-medium').first().innerText()).trim()
  const rejectTitle = (await recCards.nth(1).locator('p.font-medium').first().innerText()).trim()
  const cardByTitle = (t: string) => page.locator('.rf-card').filter({ hasText: t })

  // 14-15. accept one, reject another. The button matching the current status
  // becomes disabled — a real signal of persisted state.
  await cardByTitle(acceptTitle).getByRole('button', { name: 'accepted' }).click()
  await expect(cardByTitle(acceptTitle).getByRole('button', { name: 'accepted' })).toBeDisabled()
  await cardByTitle(rejectTitle).getByRole('button', { name: 'rejected' }).click()
  await expect(cardByTitle(rejectTitle).getByRole('button', { name: 'rejected' })).toBeDisabled()

  // 16-17. refresh → the disabled (current) states persist from the database
  await page.reload()
  await page.getByRole('button', { name: 'Recommendations' }).click()
  await expect(cardByTitle(acceptTitle).getByRole('button', { name: 'accepted' })).toBeDisabled()
  await expect(cardByTitle(rejectTitle).getByRole('button', { name: 'rejected' })).toBeDisabled()

  // 18-19. cross-tenant access denied: sign up as another user and visit the URL
  const projectUrl = page.url().replace(/#.*$/, '')
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.waitForURL('**/login**')
  await signup(page, unique())
  await page.goto(projectUrl)
  await expect(page.getByText('Project not found, or you do not have access.')).toBeVisible()

  // 20. no unexpected console errors. Expected HTTP failures from deliberate
  // negative actions (401 invalid login, 404 cross-tenant) are logged by the
  // browser as "Failed to load resource: … 401/404"; those are not app faults.
  // Any real JS error or uncaught exception still fails the test.
  const meaningful = errors.filter(
    (e) =>
      !/favicon|manifest|ResizeObserver/i.test(e) &&
      !/Failed to load resource: the server responded with a status of (401|404)/i.test(e)
  )
  expect(meaningful, `console errors: ${meaningful.join('\n')}`).toEqual([])
})
