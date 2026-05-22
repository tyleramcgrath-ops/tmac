'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Gavel, Heart, ListChecks, Plus, Search } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const hydrated = useStore((s) => s.hydrated)
  const username = useStore((s) => s.username)
  const setUsername = useStore((s) => s.setUsername)
  const watchCount = useStore((s) => s.watchlist.length)
  const myBidCount = useStore((s) => s.myBidsGrouped().length)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setDraft(username)
  }, [username])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Gavel className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Bidly</span>
        </Link>

        <form
          action="/"
          className="relative flex-1 max-w-2xl"
          onSubmit={(e) => {
            const data = new FormData(e.currentTarget)
            const q = (data.get('q') as string) || ''
            e.preventDefault()
            const url = new URL('/', window.location.origin)
            if (q.trim()) url.searchParams.set('q', q.trim())
            window.location.href = url.toString()
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search by city, state, ZIP, or feature…"
            className="pl-9"
          />
        </form>

        <nav className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/watchlist" className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Watchlist
              <Counter n={hydrated ? watchCount : 0} />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/bids" className="flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              My bids
              <Counter n={hydrated ? myBidCount : 0} />
            </Link>
          </Button>
          <Button asChild size="sm" variant="accent">
            <Link href="/sell" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              List a property
            </Link>
          </Button>
        </nav>

        <div className="ml-1 flex items-center">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setUsername(draft)
                setEditing(false)
              }}
              className="flex items-center gap-1.5"
            >
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="pick a handle"
                className="h-8 w-36"
              />
              <Button size="sm" type="submit">Save</Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-background text-xs font-semibold">
                {(hydrated && username ? username : '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline" suppressHydrationWarning>
                {hydrated && username ? username : 'Sign in'}
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="md:hidden border-t border-border">
        <nav className="mx-auto flex max-w-7xl items-center justify-around px-2 py-2 text-xs">
          <Link href="/watchlist" className="flex items-center gap-1"><Heart className="h-4 w-4" />Watch</Link>
          <Link href="/bids" className="flex items-center gap-1"><ListChecks className="h-4 w-4" />Bids</Link>
          <Link href="/sell" className="flex items-center gap-1"><Plus className="h-4 w-4" />Sell</Link>
        </nav>
      </div>
    </header>
  )
}

function Counter({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className={cn('ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground')}>
      {n}
    </span>
  )
}
