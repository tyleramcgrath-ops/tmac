// Cron-triggered scheduler runner (RankForge). One pass = reap stale locks →
// materialize due schedules → drain due jobs. Idempotent and safe to
// over-fire (claims are atomic). Protected by CRON_SECRET: any request
// without a matching `Authorization: Bearer $CRON_SECRET` is rejected, so
// this internal endpoint is never publicly runnable.
//
// Trigger: Vercel's Hobby plan doesn't support platform crons, so
// .github/workflows/scheduler-cron.yml polls this on a schedule instead (see
// that file, and SCHEDULER_DESIGN.md §7). If the project ever moves to Vercel
// Pro, a vercel.json `crons` entry hitting this same route is a drop-in
// replacement — the route itself doesn't care who calls it.

import { randomUUID } from 'crypto'
import { getStore } from '@/lib/foundation/store'
import { tick } from '@/lib/foundation/scheduler/engine'
import { productionHandlers } from '@/lib/foundation/scheduler/handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function handle(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'Scheduler is not configured (CRON_SECRET unset).' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const store = await getStore()
  const summary = await tick(store, {
    now: new Date(),
    runnerId: `cron_${randomUUID()}`,
    handlers: productionHandlers(),
    limit: 10,
  })
  return Response.json({ ok: true, ...summary })
}

// Vercel Cron issues GET; support POST too for manual/authorized triggering.
export const GET = handle
export const POST = handle
