import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  KEY_NAMES,
  deleteSecret,
  getSecret,
  isSecretConfigured,
  saveSecret,
  type KeyName,
} from '@/lib/config'
import { getStore } from '@/lib/db'
import { RobinhoodCryptoAdapter } from '@/lib/brokers'

export const dynamic = 'force-dynamic'

// GET: which keys are configured (booleans only — never the secret values), and
// whether the encrypted-store is available (APP_SECRET set).
export async function GET() {
  const configured: Record<string, boolean> = {}
  for (const name of KEY_NAMES) configured[name] = await isSecretConfigured(name)
  return NextResponse.json({
    configured,
    canSaveFromUi: !!process.env.APP_SECRET,
    keyNames: KEY_NAMES,
  })
}

const saveSchema = z.object({ action: z.literal('save'), name: z.string(), value: z.string().min(1) })
const deleteSchema = z.object({ action: z.literal('delete'), name: z.string() })
const testSchema = z.object({ action: z.literal('test'), broker: z.string() })

function isKeyName(name: string): name is KeyName {
  return (KEY_NAMES as readonly string[]).includes(name)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  try {
    if (body.action === 'save') {
      const { name, value } = saveSchema.parse(body)
      if (!isKeyName(name)) return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
      await saveSecret(name, value)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'delete') {
      const { name } = deleteSchema.parse(body)
      if (!isKeyName(name)) return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
      await deleteSecret(name)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'test') {
      const { broker } = testSchema.parse(body)
      if (broker === 'paper') {
        return NextResponse.json({ ok: true, message: 'Paper trading simulator ready.' })
      }
      if (broker === 'robinhood_crypto') {
        const apiKey = await getSecret('RH_CRYPTO_API_KEY')
        const privateKeyBase64 = await getSecret('RH_CRYPTO_PRIVATE_KEY')
        const adapter = new RobinhoodCryptoAdapter(
          apiKey && privateKeyBase64 ? { apiKey, privateKeyBase64 } : null,
        )
        const result = await adapter.testConnection()
        return NextResponse.json(result)
      }
      if (broker === 'robinhood_equities_options') {
        return NextResponse.json({
          ok: false,
          message:
            'Equities/options require approved API access (e.g. Robinhood Agentic Trading). Scaffold only.',
        })
      }
      return NextResponse.json({ error: 'Unknown broker' }, { status: 400 })
    }
    if (body.action === 'reset') {
      const store = await getStore()
      store.reset()
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
