import { NextResponse } from 'next/server'
import { isHistoryEnabled } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Tells the client whether persistent report history is available. When it
// isn't (serverless without a database), the UI uses on-demand streaming
// analysis instead of the create-then-poll flow.
export async function GET() {
  return NextResponse.json({ historyEnabled: isHistoryEnabled() })
}
