import { NextResponse } from 'next/server'
import { canSaveKeys, getKeyStatuses, KEY_NAMES, saveApiKey, type KeyName } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ keys: await getKeyStatuses(), canSave: canSaveKeys() })
  } catch (err) {
    console.error('[api] settings load failed:', err)
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const name = String(body.name ?? '') as KeyName
  if (!KEY_NAMES.includes(name)) {
    return NextResponse.json({ error: 'Unknown key name.' }, { status: 400 })
  }
  if (typeof body.value !== 'string' || body.value.length > 500) {
    return NextResponse.json({ error: 'Invalid key value.' }, { status: 400 })
  }
  try {
    await saveApiKey(name, body.value)
    return NextResponse.json({ keys: await getKeyStatuses(), canSave: canSaveKeys() })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save the key.' },
      { status: 400 }
    )
  }
}
