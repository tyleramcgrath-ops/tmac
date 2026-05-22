'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const TYPES = ['House', 'Condo', 'Townhouse', 'Multi-Family', 'Land'] as const
const SORTS = [
  { value: 'ending', label: 'Ending soonest' },
  { value: 'newest', label: 'Newly listed' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'bids', label: 'Most bids' },
] as const

export function FilterBar() {
  const router = useRouter()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
      router.push(`/?${next.toString()}`, { scroll: false })
    },
    [params, router],
  )

  const type = params.get('type') ?? ''
  const sort = params.get('sort') ?? 'ending'
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const beds = params.get('beds') ?? ''

  const hasFilters = type || min || max || beds || params.get('q')

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <Label className="mb-2 block">Property type</Label>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={!type} onClick={() => update('type', null)}>All</FilterChip>
          {TYPES.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => update('type', t)}>
              {t}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Min beds</Label>
        <div className="flex gap-1.5">
          {['', '1', '2', '3', '4'].map((b) => (
            <FilterChip key={b || 'any'} active={beds === b} onClick={() => update('beds', b)}>
              {b ? `${b}+` : 'Any'}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Price (USD)</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Min"
            inputMode="numeric"
            defaultValue={min}
            onBlur={(e) => update('min', e.target.value.replace(/\D/g, ''))}
            className="text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            placeholder="Max"
            inputMode="numeric"
            defaultValue={max}
            onBlur={(e) => update('max', e.target.value.replace(/\D/g, ''))}
            className="text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Sort by</Label>
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => router.push('/')}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition',
        active ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
