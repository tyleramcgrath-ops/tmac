import { NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import {
  disengageKillSwitch,
  engageKillSwitch,
  runTick,
  startEngine,
  stopEngine,
} from '@/lib/engine'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  try {
    switch (action) {
      case 'start':
        await startEngine()
        break
      case 'stop':
        await stopEngine()
        break
      case 'kill':
        await engageKillSwitch()
        break
      case 'disengage':
        await disengageKillSwitch()
        break
      case 'tick': {
        const store = await getStore()
        await runTick(store.get())
        break
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
