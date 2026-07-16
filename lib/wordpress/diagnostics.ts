// WordPress connection diagnostics.
//
// Runs the connection checks in explicit, ordered steps and returns a
// result for every step — not just a single pass/fail. Each step that
// depends on an earlier step being reachable is marked 'skipped' (with a
// reason) rather than silently omitted, so the caller always gets a
// complete 13-entry picture of exactly where a connection attempt stands.

import { normalizeWordPressUrl, isUrlNormalizationError } from './url'
import { normalizeApplicationPassword } from './credentials'
import { classifyWordPressError, type WordPressErrorReport } from './errors'
import { detectSeoPlugin, type SeoPluginReport } from './plugins'
import { safeWordPressFetch, SafeFetchError } from './safe-fetch'

export type DiagnosticStepStatus = 'pass' | 'fail' | 'warning' | 'skipped'

export interface DiagnosticStep {
  step: number
  id: string
  label: string
  status: DiagnosticStepStatus
  detail: string
  error?: WordPressErrorReport
}

export interface ConnectionDiagnosticsResult {
  steps: DiagnosticStep[]
  overallStatus: 'connected' | 'unauthenticated_only' | 'failed'
  readyToSave: boolean
  siteUrl: string | null
  restRoot: string | null
  authenticatedUser: { id: number; name: string; roles: string[] } | null
  canEdit: boolean | null
  seoPlugin: SeoPluginReport | null
}

const STEP_LABELS = [
  'Normalize WordPress URL',
  'Confirm HTTPS',
  'Confirm /wp-json/ is reachable',
  'Confirm REST API discovery works',
  'Authenticate as the WordPress user',
  'Confirm authenticated user identity',
  'Confirm permission to edit content',
  'Confirm pages/posts can be read',
  'Confirm target content type can be updated',
  'Detect active SEO plugin',
  'Test access to SEO plugin fields',
  'Non-destructive write-capability test',
  'Ready to save',
] as const

// Canonical step ids, in order — must stay in sync with STEP_LABELS. Every
// step() and skip() call uses these, never a label-derived slug, so a caller
// looking up `steps.find(s => s.id === 'authenticate')` gets the same result
// whether that step passed, failed, or was skipped.
const STEP_IDS = [
  'normalize_url',
  'https_check',
  'rest_reachable',
  'rest_discovery',
  'authenticate',
  'confirm_identity',
  'edit_permission',
  'read_content',
  'content_type_updatable',
  'detect_seo_plugin',
  'plugin_field_access',
  'capability_test',
  'ready_to_save',
] as const

function step(n: number, id: string, status: DiagnosticStepStatus, detail: string, error?: WordPressErrorReport): DiagnosticStep {
  return { step: n, id, label: STEP_LABELS[n - 1], status, detail, error }
}

function skip(n: number, reason: string): DiagnosticStep {
  return step(n, STEP_IDS[n - 1], 'skipped', reason)
}

async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.clone().text()
  } catch {
    return ''
  }
}

function headersToObject(h: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  h.forEach((v, k) => (out[k] = v))
  return out
}

export async function runConnectionDiagnostics(
  siteUrlInput: string,
  username: string,
  appPasswordRaw: string
): Promise<ConnectionDiagnosticsResult> {
  const steps: DiagnosticStep[] = []
  const hasCreds = !!(username && appPasswordRaw)
  const appPassword = normalizeApplicationPassword(appPasswordRaw)

  // ── Step 1: normalize URL ──
  const normalized = normalizeWordPressUrl(siteUrlInput)
  if (isUrlNormalizationError(normalized)) {
    steps.push(step(1, 'normalize_url', 'fail', normalized.error, classifyWordPressError({ exceptionMessage: normalized.error })))
    for (let i = 2; i <= 12; i++) steps.push(skip(i, 'Skipped — URL did not normalize.'))
    return finalize(steps, null, null)
  }
  steps.push(step(1, 'normalize_url', 'pass', `Resolved to ${normalized.siteUrl}`))

  // ── Step 2: HTTPS ──
  if (normalized.isInsecure) {
    steps.push(step(2, 'https_check', 'warning', 'Site is using http:// — Application Passwords require https:// on most WordPress installs except localhost.'))
  } else {
    steps.push(step(2, 'https_check', 'pass', 'Site uses https://.'))
  }

  // ── Step 3: /wp-json/ reachable ──
  let indexRes: Response
  let indexBody = ''
  try {
    const result = await safeWordPressFetch(normalized.restRoot, { Accept: 'application/json' })
    indexRes = result.response
    indexBody = await readBodyText(indexRes)
    if (!indexRes.ok) {
      const report = classifyWordPressError({ httpStatus: indexRes.status, bodyText: indexBody, step: 'wp-json reachability' })
      steps.push(step(3, 'rest_reachable', 'fail', `/wp-json/ responded with HTTP ${indexRes.status}.`, report))
      for (let i = 4; i <= 12; i++) steps.push(skip(i, 'Skipped — REST API is not reachable.'))
      return finalize(steps, normalized.siteUrl, normalized.restRoot)
    }
    steps.push(step(3, 'rest_reachable', 'pass', `/wp-json/ responded with HTTP ${indexRes.status}.`))
  } catch (err) {
    const report = classifyWordPressError(exceptionToClassifyInput(err, 'wp-json reachability'))
    steps.push(step(3, 'rest_reachable', 'fail', report.whatFailed, report))
    for (let i = 4; i <= 12; i++) steps.push(skip(i, 'Skipped — REST API is not reachable.'))
    return finalize(steps, normalized.siteUrl, normalized.restRoot)
  }

  // ── Step 4: REST discovery (valid JSON with namespaces) ──
  let namespaces: string[] = []
  try {
    const data = JSON.parse(indexBody)
    namespaces = Array.isArray(data?.namespaces) ? data.namespaces : []
    if (!Array.isArray(data?.namespaces)) {
      steps.push(step(4, 'rest_discovery', 'warning', 'REST root responded but without a namespaces list — REST discovery may be partially disabled.'))
    } else {
      steps.push(step(4, 'rest_discovery', 'pass', `Discovered ${namespaces.length} REST namespace(s).`))
    }
  } catch {
    steps.push(step(4, 'rest_discovery', 'fail', 'REST root did not return valid JSON — something between RankForge and the site is altering the response.', classifyWordPressError({ httpStatus: indexRes.status, bodyText: indexBody, step: 'rest discovery' })))
    for (let i = 5; i <= 12; i++) steps.push(skip(i, 'Skipped — REST discovery failed.'))
    return finalize(steps, normalized.siteUrl, normalized.restRoot)
  }

  // ── Steps 5-9, 11-12: require credentials ──
  if (!hasCreds) {
    for (let i = 5; i <= 9; i++) steps.push(skip(i, 'Skipped — no username/Application Password provided.'))
  }

  let authedUser: { id: number; name: string; roles: string[] } | null = null
  let canEdit: boolean | null = null
  let firstReadablePostId: number | null = null

  if (hasCreds) {
    const authHeader = { Accept: 'application/json', Authorization: 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64') }

    // ── Step 5: authenticate ──
    let meRes: Response
    let meBody = ''
    try {
      const result = await safeWordPressFetch(`${normalized.restRoot}wp/v2/users/me?context=edit`, authHeader)
      meRes = result.response
      meBody = await readBodyText(meRes)
      if (!meRes.ok) {
        const report = classifyWordPressError({ httpStatus: meRes.status, bodyText: meBody, headers: headersToObject(meRes.headers), step: 'authentication' })
        steps.push(step(5, 'authenticate', 'fail', `Authentication failed with HTTP ${meRes.status}.`, report))
        for (let i = 6; i <= 9; i++) steps.push(skip(i, 'Skipped — authentication failed.'))
      } else {
        steps.push(step(5, 'authenticate', 'pass', 'Authenticated successfully.'))

        // ── Step 6: confirm identity ──
        try {
          const me = JSON.parse(meBody)
          authedUser = { id: Number(me?.id), name: String(me?.name ?? me?.slug ?? 'unknown'), roles: Array.isArray(me?.roles) ? me.roles : [] }
          steps.push(step(6, 'confirm_identity', 'pass', `Authenticated as "${authedUser.name}" (roles: ${authedUser.roles.join(', ') || 'none listed'}).`))

          // ── Step 7: edit permission ──
          const caps = me?.capabilities && typeof me.capabilities === 'object' ? me.capabilities : {}
          canEdit = !!(caps.edit_posts || caps.edit_pages || caps.administrator)
          if (canEdit) {
            steps.push(step(7, 'edit_permission', 'pass', 'Account has content-editing capability (edit_posts/edit_pages).'))
          } else {
            steps.push(step(7, 'edit_permission', 'fail', 'Account is authenticated but lacks edit_posts/edit_pages capability.', classifyWordPressError({ httpStatus: 403, bodyText: 'capability check: edit_posts/edit_pages missing', step: 'edit permission' })))
          }
        } catch {
          steps.push(step(6, 'confirm_identity', 'fail', 'Could not parse the authenticated user response.'))
          steps.push(step(7, 'edit_permission', 'skipped', 'Skipped — could not confirm identity.'))
        }

        // ── Step 8: read posts/pages ──
        try {
          const result = await safeWordPressFetch(`${normalized.restRoot}wp/v2/posts?per_page=1&context=edit`, authHeader)
          const body = await readBodyText(result.response)
          if (result.response.ok) {
            const list = JSON.parse(body)
            firstReadablePostId = Array.isArray(list) && list.length > 0 ? Number(list[0].id) : null
            steps.push(step(8, 'read_content', 'pass', `Read access confirmed (${Array.isArray(list) ? list.length : 0} post(s) fetched).`))
          } else {
            const report = classifyWordPressError({ httpStatus: result.response.status, bodyText: body, step: 'read content' })
            steps.push(step(8, 'read_content', 'fail', `Could not read posts (HTTP ${result.response.status}).`, report))
          }
        } catch (err) {
          steps.push(step(8, 'read_content', 'fail', 'Could not read posts.', classifyWordPressError(exceptionToClassifyInput(err, 'read content'))))
        }

        // ── Step 9: target content type updatable (OPTIONS introspection) ──
        try {
          const result = await safeWordPressFetch(`${normalized.restRoot}wp/v2/posts`, authHeader, { method: 'OPTIONS' })
          const allow = result.response.headers.get('allow') ?? ''
          const canWrite = /POST/i.test(allow) || result.response.status === 200
          steps.push(
            canWrite
              ? step(9, 'content_type_updatable', 'pass', 'Posts collection accepts write methods.')
              : step(9, 'content_type_updatable', 'warning', `Could not confirm write support (Allow: "${allow || 'unknown'}").`)
          )
        } catch (err) {
          steps.push(step(9, 'content_type_updatable', 'warning', 'Could not run write-capability introspection (non-fatal).'))
        }
      }
    } catch (err) {
      const report = classifyWordPressError(exceptionToClassifyInput(err, 'authentication'))
      steps.push(step(5, 'authenticate', 'fail', report.whatFailed, report))
      for (let i = 6; i <= 9; i++) steps.push(skip(i, 'Skipped — authentication failed.'))
    }
  }

  // ── Step 10: SEO plugin detection (works unauthenticated) ──
  const seoPlugin = detectSeoPlugin(namespaces)
  steps.push(step(10, 'detect_seo_plugin', 'pass', `Detected: ${seoPlugin.pluginLabel}.`))

  // ── Step 11: plugin field access (requires auth + a readable post) ──
  if (!hasCreds || !authedUser) {
    steps.push(skip(11, 'Skipped — requires authentication.'))
  } else if (seoPlugin.plugin === 'core') {
    steps.push(step(11, 'plugin_field_access', 'skipped', 'No SEO plugin detected — only core fields apply.'))
  } else if (firstReadablePostId == null) {
    steps.push(skip(11, 'Skipped — no readable post available to test against.'))
  } else {
    try {
      const authHeader = { Accept: 'application/json', Authorization: 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64') }
      const result = await safeWordPressFetch(`${normalized.restRoot}wp/v2/posts/${firstReadablePostId}?context=edit`, authHeader)
      const body = await readBodyText(result.response)
      if (result.response.ok) {
        const post = JSON.parse(body)
        const fieldKey = seoPlugin.plugin === 'aioseo' ? 'aioseo_meta_data' : null
        const present = fieldKey ? Object.prototype.hasOwnProperty.call(post, fieldKey) : false
        if (fieldKey && present) {
          steps.push(step(11, 'plugin_field_access', 'pass', `${seoPlugin.pluginLabel} fields are exposed on posts via REST.`))
        } else {
          steps.push(step(11, 'plugin_field_access', 'warning', `Could not confirm ${seoPlugin.pluginLabel} fields are exposed via REST — treat plugin-specific field writes as unverified.`))
        }
      } else {
        steps.push(step(11, 'plugin_field_access', 'warning', 'Could not fetch a post to verify plugin field exposure.'))
      }
    } catch {
      steps.push(step(11, 'plugin_field_access', 'warning', 'Could not verify plugin field exposure.'))
    }
  }

  // ── Step 12: safe non-destructive capability test ──
  if (!hasCreds || !authedUser || firstReadablePostId == null) {
    steps.push(skip(12, 'Skipped — requires authentication and a readable post.'))
  } else {
    try {
      const authHeader = { Accept: 'application/json', Authorization: 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64') }
      const result = await safeWordPressFetch(`${normalized.restRoot}wp/v2/posts/${firstReadablePostId}`, authHeader, { method: 'OPTIONS' })
      const allow = result.response.headers.get('allow') ?? ''
      const canWrite = /POST|PUT/i.test(allow)
      steps.push(
        canWrite
          ? step(12, 'capability_test', 'pass', 'Write capability confirmed via non-destructive OPTIONS introspection — no data was modified.')
          : step(12, 'capability_test', 'warning', `Write capability could not be confirmed (Allow: "${allow || 'unknown'}"). No data was modified.`)
      )
    } catch {
      steps.push(step(12, 'capability_test', 'warning', 'Could not run the non-destructive capability test.'))
    }
  }

  return finalize(steps, normalized.siteUrl, normalized.restRoot, authedUser, canEdit, seoPlugin)
}

function exceptionToClassifyInput(err: unknown, stepLabel: string) {
  if (err instanceof SafeFetchError) {
    return {
      exceptionName: err.name,
      exceptionMessage: err.message,
      step: stepLabel,
    }
  }
  return {
    exceptionName: err instanceof Error ? err.name : 'Error',
    exceptionMessage: err instanceof Error ? err.message : String(err),
    step: stepLabel,
  }
}

function finalize(
  steps: DiagnosticStep[],
  siteUrl: string | null,
  restRoot: string | null,
  authenticatedUser: { id: number; name: string; roles: string[] } | null = null,
  canEdit: boolean | null = null,
  seoPlugin: SeoPluginReport | null = null
): ConnectionDiagnosticsResult {
  // Step 13: "ready to save" — all steps required for a usable connection must pass.
  // Steps 10-12 (plugin detection/fields) are informational, not blocking: RankForge
  // can still deploy core-field changes even with no SEO plugin detected.
  const requiredStepIds = new Set(['normalize_url', 'rest_reachable', 'rest_discovery', 'authenticate', 'confirm_identity', 'edit_permission', 'read_content'])
  const requiredSteps = steps.filter((s) => requiredStepIds.has(s.id))
  const readyToSave = requiredSteps.length === requiredStepIds.size && requiredSteps.every((s) => s.status === 'pass')

  // Compute hasFailure from steps 1-12 only — the "ready to save" step we're
  // about to push is a summary of those steps, not itself a new failure signal.
  // Computing this after the push would make hasFailure true any time
  // readyToSave is false (including the benign unauthenticated case), which
  // collapses 'unauthenticated_only' into 'failed' incorrectly.
  const hasFailure = steps.some((s) => s.status === 'fail')

  steps.push(
    readyToSave
      ? step(13, 'ready_to_save', 'pass', 'All required checks passed — this connection is safe to save.')
      : step(13, 'ready_to_save', 'fail', 'Not saved — one or more required checks did not pass.')
  )

  const overallStatus: ConnectionDiagnosticsResult['overallStatus'] = readyToSave
    ? 'connected'
    : !hasFailure && authenticatedUser == null
      ? 'unauthenticated_only'
      : 'failed'

  return { steps, overallStatus, readyToSave, siteUrl, restRoot, authenticatedUser, canEdit, seoPlugin }
}
