// Photos owners upload, served on every address (saysites.com and every
// customer site). Ids are random and files never change, so they cache forever.

import { getStore } from '@/lib/store'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response('Not found', { status: 404 })
  const file = await getStore().mediaFile(id)
  if (!file) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(file.data), {
    headers: {
      'content-type': file.mime,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
    },
  })
}
