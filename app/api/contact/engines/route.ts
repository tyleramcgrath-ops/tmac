import { NextResponse } from 'next/server'
import { availableEngines, isConfigured } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/contact/engines
// Which assistants this deployment can actually measure. The UI asks first so
// it never offers an engine the credential cannot reach — and so it can say
// plainly when nothing is configured, instead of failing at the first scan.

export async function GET() {
  return NextResponse.json({
    configured: isConfigured(),
    engines: availableEngines(),
  })
}
