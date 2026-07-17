// Pure scheduling logic — next-run calculation, retry classification, and
// duplicate/idempotency keys. Kept separate from the DB/queue so it's fully
// unit-testable. The persistence + queue live in the API routes and a cron
// processor; this module decides *when* and *whether*, never *how*.

export type JobType =
  | 'crawl'
  | 'priority_rankings'
  | 'full_rankings'
  | 'gsc_sync'
  | 'ga4_sync'
  | 'fusion'
  | 'portfolio_priority'
  | 'daily_mission'
  | 'morning_briefing'
  | 'opportunities'
  | 'deployment_verification'
  | 'weekly_summary'

export type Frequency = 'hourly' | 'daily' | 'weekly' | 'after_source_update' | 'after_deployment' | 'manual'

export type JobStatus =
  | 'scheduled' | 'queued' | 'running' | 'completed' | 'completed_with_warnings'
  | 'retrying' | 'failed' | 'paused' | 'blocked' | 'not_configured'

// Sensible default cadence per job type.
export const DEFAULT_FREQUENCY: Record<JobType, Frequency> = {
  portfolio_priority: 'daily',
  daily_mission: 'daily',
  morning_briefing: 'daily',
  gsc_sync: 'daily',
  ga4_sync: 'daily',
  priority_rankings: 'daily',
  full_rankings: 'weekly',
  crawl: 'weekly',
  fusion: 'after_source_update',
  opportunities: 'after_source_update',
  deployment_verification: 'after_deployment',
  weekly_summary: 'weekly',
}

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

/**
 * Computes the next scheduled run after `from`, honoring frequency and a
 * preferred hour-of-day (in the schedule's timezone offset, expressed as
 * minutes east of UTC). Event-driven frequencies (after_*) and manual have no
 * clock-based next run and return null.
 */
export function computeNextRun(opts: {
  frequency: Frequency
  from: Date
  preferredHour?: number // 0-23 in local tz
  tzOffsetMinutes?: number // minutes to add to UTC to get local time
}): Date | null {
  const { frequency, from } = opts
  if (frequency === 'manual' || frequency === 'after_source_update' || frequency === 'after_deployment') return null

  const tz = opts.tzOffsetMinutes ?? 0
  const preferredHour = opts.preferredHour ?? 6 // 6am local by default

  if (frequency === 'hourly') return new Date(from.getTime() + HOUR)

  // For daily/weekly, target the preferred hour in local time.
  const local = new Date(from.getTime() + tz * 60 * 1000)
  const target = new Date(local)
  target.setUTCHours(preferredHour, 0, 0, 0)
  if (target.getTime() <= local.getTime()) {
    target.setTime(target.getTime() + (frequency === 'weekly' ? 7 * DAY : DAY))
  } else if (frequency === 'weekly') {
    // First weekly run is the next preferred-hour slot; subsequent ones are +7d.
    // If the slot is today and still ahead, keep it.
  }
  // Convert back to UTC.
  return new Date(target.getTime() - tz * 60 * 1000)
}

export function isDue(nextRun: Date | null, now: Date): boolean {
  return nextRun !== null && nextRun.getTime() <= now.getTime()
}

// ── Retry classification ──
export type FailureClass = 'retryable' | 'waiting_for_configuration' | 'waiting_for_user_action' | 'permanent'

const PERMANENT_SIGNATURES = [
  'permission revoked', 'permission denied', 'invalid credentials', 'invalid_grant',
  'property inaccessible', 'project deleted', 'unsupported', 'forbidden',
]
const CONFIG_SIGNATURES = ['not configured', 'missing provider', 'no live serp source', 'oauth is not configured']
const USER_ACTION_SIGNATURES = ['authorization required', 'reconnect', 're-authorize', 'select a property']

export function classifyFailure(message: string): FailureClass {
  const m = message.toLowerCase()
  if (CONFIG_SIGNATURES.some((s) => m.includes(s))) return 'waiting_for_configuration'
  if (USER_ACTION_SIGNATURES.some((s) => m.includes(s))) return 'waiting_for_user_action'
  if (PERMANENT_SIGNATURES.some((s) => m.includes(s))) return 'permanent'
  return 'retryable' // timeouts, network, quota, worker restart → retry
}

/** Whether to retry, and after how long (exponential backoff capped at maxRetries). */
export function retryDecision(opts: { failureClass: FailureClass; retryCount: number; maxRetries: number }): { retry: boolean; delayMs: number | null; status: JobStatus } {
  const { failureClass, retryCount, maxRetries } = opts
  if (failureClass === 'permanent') return { retry: false, delayMs: null, status: 'failed' }
  if (failureClass === 'waiting_for_configuration') return { retry: false, delayMs: null, status: 'not_configured' }
  if (failureClass === 'waiting_for_user_action') return { retry: false, delayMs: null, status: 'blocked' }
  // retryable
  if (retryCount >= maxRetries) return { retry: false, delayMs: null, status: 'failed' }
  const delayMs = Math.min(30 * 60 * 1000, 2 ** retryCount * 60 * 1000) // 1m,2m,4m,... capped 30m
  return { retry: true, delayMs, status: 'retrying' }
}

/**
 * Idempotency key preventing duplicate work. Same project + job type + data
 * window (e.g. a date, a device+location, a source version) yields the same
 * key, so a duplicate enqueue is a no-op.
 */
export function idempotencyKey(parts: { projectId: string; jobType: JobType; window?: string }): string {
  return [parts.projectId, parts.jobType, parts.window ?? 'default'].join(':')
}
