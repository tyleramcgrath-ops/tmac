'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Listing } from '@/lib/data'
import { useStore } from '@/lib/store'

const PALETTES = [
  { id: 'sunset', label: 'Sunset', p: { from: '#fb923c', via: '#f43f5e', to: '#7c3aed', accent: '#fde047' } },
  { id: 'ocean',  label: 'Ocean',  p: { from: '#22d3ee', via: '#3b82f6', to: '#1e3a8a', accent: '#a5f3fc' } },
  { id: 'forest', label: 'Forest', p: { from: '#86efac', via: '#16a34a', to: '#064e3b', accent: '#fef9c3' } },
  { id: 'desert', label: 'Desert', p: { from: '#fde68a', via: '#f59e0b', to: '#9a3412', accent: '#fff7ed' } },
  { id: 'rose',   label: 'Rose',   p: { from: '#fda4af', via: '#e11d48', to: '#881337', accent: '#fff1f2' } },
  { id: 'mint',   label: 'Mint',   p: { from: '#a7f3d0', via: '#14b8a6', to: '#0f766e', accent: '#ecfeff' } },
  { id: 'lilac',  label: 'Lilac',  p: { from: '#e9d5ff', via: '#a855f7', to: '#581c87', accent: '#faf5ff' } },
  { id: 'slate',  label: 'Slate',  p: { from: '#cbd5e1', via: '#475569', to: '#0f172a', accent: '#f8fafc' } },
] as const

const EMOJIS = ['🏡', '🏠', '🏘️', '🏰', '🌲', '🌊', '🌵', '⛷️', '🏞️', '🏙️', '🛖', '🏛️']

export default function SellPage() {
  const router = useRouter()
  const addListing = useStore((s) => s.addListing)
  const username = useStore((s) => s.username)

  const [palette, setPalette] = useState<typeof PALETTES[number]['id']>('sunset')
  const [emoji, setEmoji] = useState('🏡')
  const [durationDays, setDurationDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string)?.trim() ?? ''
    const num = (k: string) => Number(get(k).replace(/[^0-9.]/g, '')) || 0

    const slugBase = get('title').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = `${slugBase || 'listing'}-${Math.random().toString(36).slice(2, 6)}`
    const startingBid = num('startingBid')
    const reservePrice = num('reservePrice') || undefined
    const buyItNow = num('buyItNow') || undefined

    const features = get('features')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const propertyType = (get('propertyType') as Listing['propertyType']) || 'House'

    const listing: Listing = {
      id,
      title: get('title') || 'Untitled property',
      address: get('address') || '—',
      city: get('city') || '—',
      state: get('state').toUpperCase() || '—',
      zip: get('zip') || '—',
      beds: num('beds'),
      baths: num('baths'),
      sqft: num('sqft'),
      lotSqft: num('lotSqft'),
      yearBuilt: num('yearBuilt'),
      propertyType,
      description: get('description'),
      features,
      startingBid,
      reservePrice,
      buyItNow,
      startsAt: Date.now(),
      endsAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      seller: username || 'anonymous_seller',
      sellerRating: 100,
      palette: PALETTES.find((p) => p.id === palette)!.p,
      emoji,
    }

    addListing(listing)
    toast.success('Listing posted! It\'s live now.', {
      description: `${listing.title} · ends in ${durationDays} day${durationDays === 1 ? '' : 's'}.`,
    })
    setTimeout(() => router.push(`/listing/${id}`), 400)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">List a property</h1>
          <p className="text-sm text-muted-foreground">Auction starts the moment you publish.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <Section title="The property">
          <Field name="title" label="Listing title" placeholder="Sunny Craftsman with Garden Studio" required />
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Field name="address" label="Address" placeholder="123 Maple St" required />
            <Field name="city" label="City" placeholder="Portland" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
            <Field name="state" label="State" placeholder="OR" maxLength={2} required />
            <Field name="zip" label="ZIP" placeholder="97214" required />
            <div>
              <Label className="mb-1 block">Property type</Label>
              <select
                name="propertyType"
                defaultValue="House"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option>House</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Multi-Family</option>
                <option>Land</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field name="beds" label="Beds" type="number" defaultValue="3" />
            <Field name="baths" label="Baths" type="number" defaultValue="2" />
            <Field name="sqft" label="Sqft" type="number" defaultValue="1800" />
            <Field name="yearBuilt" label="Year built" type="number" defaultValue="1995" />
          </div>
          <Field name="lotSqft" label="Lot size (sqft)" type="number" defaultValue="6000" />
          <div>
            <Label className="mb-1 block">Description</Label>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-md border border-input bg-card p-3 text-sm"
              placeholder="What makes this property special? Neighborhood, upgrades, view, the works."
            />
          </div>
          <Field
            name="features"
            label="Features (comma-separated)"
            placeholder="ADU, solar, new roof, fenced yard"
          />
        </Section>

        <Section title="Auction terms">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field name="startingBid" label="Starting bid ($)" placeholder="500000" required />
            <Field name="reservePrice" label="Reserve price ($) — optional" placeholder="650000" />
            <Field name="buyItNow" label="Buy It Now ($) — optional" placeholder="800000" />
          </div>
          <div>
            <Label className="mb-1 block">Duration: {durationDays} day{durationDays === 1 ? '' : 's'}</Label>
            <input
              type="range"
              min={1}
              max={14}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full accent-current"
            />
            <p className="text-xs text-muted-foreground">Bids in the last 2 minutes extend the auction by 2 minutes (anti-snipe).</p>
          </div>
        </Section>

        <Section title="Cover art">
          <div>
            <Label className="mb-2 block">Color theme</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPalette(p.id)}
                  className={`relative h-12 w-12 rounded-lg ring-2 ring-offset-2 ring-offset-card transition ${
                    palette === p.id ? 'ring-foreground' : 'ring-transparent hover:ring-border'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${p.p.from}, ${p.p.via}, ${p.p.to})`,
                  }}
                  aria-label={p.label}
                  title={p.label}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`grid h-10 w-10 place-items-center rounded-lg border text-xl transition ${
                    emoji === e ? 'border-foreground bg-muted' : 'border-border hover:bg-muted'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Demo only — no real listing is created or submitted.
          </p>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish auction'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  name,
  label,
  ...rest
}: {
  name: string
  label: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 block">{label}</Label>
      <Input id={name} name={name} {...rest} />
    </div>
  )
}
