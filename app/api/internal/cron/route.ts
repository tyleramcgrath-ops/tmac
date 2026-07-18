// Cron-triggered scheduler runner (RankForge). Vercel Cron hits this on a fixed
// cadence (see vercel.json). One pass = reap stale locks → materialize due
// schedules → drain due jobs. Idempotent and safe to over-fire (claims are
// atomic). Protected by CRON_SECRET: Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` for platform cron invocations, and any
// request without it is rejected — so this internal endpoint is never publicly
// runnable.

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
