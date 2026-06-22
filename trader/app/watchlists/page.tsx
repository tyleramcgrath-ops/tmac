'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { usd } from '@/lib/client/format'
import type { AssetType, Quote } from '@/lib/types'

export default function WatchlistsPage() {
  const { state, refresh } = useTraderContext()
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [newList, setNewList] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const res = await fetch('/api/watchlists', { cache: 'no-store' })
      const data = await res.json()
      if (active && data.quotes) {
        setQuotes(Object.fromEntries((data.quotes as Quote[]).map((q) => [q.symbol, q])))
      }
    }
    void load()
    const t = setInterval(load, 5000)
    return () => { active = false; clearInterval(t) }
  }, [state?.watchlists])

  if (!state) return <div className="text-sm text-muted">Loading…</div>

  async function action(body: Record<string, unknown>) {
    try {
      await post('/api/watchlists', body)
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Watchlists"
        subtitle="Track symbols with live quotes."
        action={
          <div className="flex gap-2">
            <Input value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="New list name" className="w-40" />
            <Button variant="primary" disabled={!newList} onClick={() => { action({ action: 'createList', name: newList }); setNewList('') }}>
              <Plus size={16} /> Add list
            </Button>
          </div>
        }
      />

      {state.watchlists.length === 0 ? (
        <EmptyState>No watchlists. Create one above.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.watchlists.map((list) => (
            <Card key={list.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">{list.name}</h3>
                {list.id !== 'wl_default' && (
                  <Button variant="ghost" onClick={() => confirm('Delete list?') && action({ action: 'deleteList', listId: list.id })}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <AddSymbol onAdd={(symbol, assetType) => action({ action: 'addSymbol', listId: list.id, symbol, assetType })} />
              <div className="mt-3 space-y-1">
                {list.symbols.length === 0 && <div className="text-xs text-muted">No symbols yet.</div>}
                {list.symbols.map((s) => {
                  const q = quotes[s.symbol]
                  return (
                    <div key={s.symbol} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{s.symbol}</span>
                        <Badge>{s.assetType}</Badge>
                      </span>
                      <span className="flex items-center gap-3 tabular">
                        <span>{q ? usd(q.price, q.price < 1 ? 4 : 2) : '—'}</span>
                        <button onClick={() => action({ action: 'removeSymbol', listId: list.id, symbol: s.symbol })} className="text-muted hover:text-[var(--neg)]">
                          <X size={14} />
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AddSymbol({ onAdd }: { onAdd: (symbol: string, assetType: AssetType) => void }) {
  const [symbol, setSymbol] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('crypto')
  return (
    <div className="flex gap-2">
      <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol e.g. BTC-USD" />
      <Select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)} className="w-32">
        <option value="crypto">Crypto</option>
        <option value="equity">Equity</option>
        <option value="option">Option</option>
      </Select>
      <Button onClick={() => { if (symbol) { onAdd(symbol, assetType); setSymbol('') } }}>Add</Button>
    </div>
  )
}
