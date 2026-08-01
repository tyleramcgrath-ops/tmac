// Scheduled daily refresh trigger for North Star Headquarters.
//
// Nothing in this app previously ran on a timer: every number was fetched
// because a human opened a page. This endpoint drives runDailyRefresh, which
// re-assembles each project's Mission Atlas from live providers, stores the
// snapshot, and records what materially moved since the last run.
//
// Protected by CRON_SECRET — any request without a matching
// `Authorization: Bearer $CRON_SECRET` is rejected, so this is never publicly
// runnable. Mirrors the root RankForge app's /api/internal/cron contract.
//
// Trigger: Vercel's Hobby plan does not support platform crons, so
// .github/workflows/north-star-hq-daily.yml calls this on a schedule — the
// same mechanism the root app already uses. On Vercel Pro, a vercel.json
// `crons` entry pointing here is a drop-in replacement; the route does not
// care who calls it.
//
// Safe to over-fire: a refresh is idempotent. It overwrites the snapshot with
// a newer one and only emits an event when a metric genuinely moved, so a
// double run reports nothing the first did not.

import { getStore } from '@/lib/foundation/store'
import { runDailyRefresh } from '@/lib/foundation/refresh/daily'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Refreshing every project means one external round-trip set per project.
// 300s is the platform ceiling and the same budget the root app's cron uses.
export const maxDuration = 300

async function handle(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'Scheduled refresh is not configured (CRON_SECRET unset).' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const store = await getStore()
  const summary = await runDailyRefresh(store, { now: new Date() })
  return Response.json({ ok: true, ...summary })
}

// Vercel Cron issues GET; POST is supported for manual authorized triggering.
export const GET = handle
export const POST = handle
