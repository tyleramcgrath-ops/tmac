// Cron/worker endpoint — the real background processor. Protected by CRON_SECRET
// (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). Claims a bounded
// batch of due/queued jobs atomically, runs their handlers, writes an immutable
// JobExecution history row per run, chains follow-ups, applies retries, and
// returns a structured execution report.
//
// Manually callable in dev: `curl -H "Authorization: Bearer $CRON_SECRET" \
//   http://localhost:3000/api/cron/jobs`

import { resolveBatchSize } from '@/lib/scheduling/worker'
import { processBatch } from '@/lib/scheduling/engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed — never process without a configured secret
  const header = request.headers.get('authorization') || ''
  // Accept "Bearer <secret>" (Vercel Cron) or the raw secret.
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header
  return provided === secret
}

async function handle(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized. Provide the cron secret in the Authorization header.' }, { status: 401 })
  }

  let prisma: any
  try { const { getPrismaClient } = await import('@/lib/db'); prisma = getPrismaClient() }
  catch { return Response.json({ error: 'Database is not configured.' }, { status: 503 }) }

  const batchSize = resolveBatchSize(process.env.JOB_BATCH_SIZE)
  try {
    const report = await processBatch({ prisma, batchSize })
    return Response.json(report)
  } catch (err: any) {
    return Response.json({ ok: false, error: 'Worker run failed.', detail: String(err?.message ?? err).slice(0, 300) }, { status: 500 })
  }
}

// Vercel Cron issues GET; POST supported for manual/programmatic triggering.
export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
