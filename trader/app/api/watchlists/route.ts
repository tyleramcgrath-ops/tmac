import { NextResponse } from 'next/server'
import { getStore, newId } from '@/lib/db'
import { getQuotes } from '@/lib/market-data'
import type { AssetType } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET returns live quotes for every watchlist symbol.
export async function GET() {
  const store = await getStore()
  const lists = store.get().watchlists
  const items = lists.flatMap((l) => l.symbols)
  const unique = Array.from(new Map(items.map((i) => [i.symbol, i])).values())
  const quotes = unique.length ? await getQuotes(unique) : []
  return NextResponse.json({ quotes })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string
    listId?: string
    name?: string
    symbol?: string
    assetType?: AssetType
  }
  const store = await getStore()
  const state = store.get()
  try {
    if (body.action === 'createList' && body.name) {
      const list = { id: newId('wl'), name: body.name, symbols: [], createdAt: Date.now() }
      state.watchlists.push(list)
      store.schedulePersist()
      return NextResponse.json({ ok: true, id: list.id })
    }
    if (body.action === 'addSymbol' && body.listId && body.symbol && body.assetType) {
      const list = state.watchlists.find((l) => l.id === body.listId)
      if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })
      if (!list.symbols.some((s) => s.symbol === body.symbol)) {
        list.symbols.push({ symbol: body.symbol.toUpperCase(), assetType: body.assetType })
      }
      store.schedulePersist()
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'removeSymbol' && body.listId && body.symbol) {
      const list = state.watchlists.find((l) => l.id === body.listId)
      if (list) list.symbols = list.symbols.filter((s) => s.symbol !== body.symbol)
      store.schedulePersist()
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'deleteList' && body.listId) {
      state.watchlists = state.watchlists.filter((l) => l.id !== body.listId)
      store.schedulePersist()
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
