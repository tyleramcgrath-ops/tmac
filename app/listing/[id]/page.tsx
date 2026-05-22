import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Bath, Bed, Calendar, Home, MapPin, Ruler, ShieldCheck, Star } from 'lucide-react'
import { getListing } from '@/lib/data'
import { PropertyArt } from '@/components/property-art'
import { BidPanel } from '@/components/bid-panel'
import { BidHistory } from '@/components/bid-history'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'

export function generateStaticParams() {
  return []
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = getListing(id)
  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to auctions
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <PropertyArt listing={listing} variant="hero" className="rounded-2xl" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([0, 1, 2, 3] as const).map((i) => (
              <PropertyArt
                key={i}
                listing={listing}
                className="rounded-lg opacity-90"
              />
            ))}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{listing.propertyType}</Badge>
              <Badge variant="muted">Listed by {listing.seller}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {listing.sellerRating}% positive seller rating
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {listing.address} · {listing.city}, {listing.state} {listing.zip}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
            <Stat icon={<Bed className="h-4 w-4" />} label="Beds" value={listing.beds || '—'} />
            <Stat icon={<Bath className="h-4 w-4" />} label="Baths" value={listing.baths || '—'} />
            <Stat icon={<Ruler className="h-4 w-4" />} label="Interior" value={listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : '—'} />
            <Stat
              icon={<Home className="h-4 w-4" />}
              label="Lot"
              value={
                listing.lotSqft >= 43_560
                  ? `${(listing.lotSqft / 43_560).toFixed(2)} ac`
                  : listing.lotSqft
                  ? `${listing.lotSqft.toLocaleString()} sqft`
                  : '—'
              }
            />
          </div>

          <section>
            <h2 className="mb-2 text-lg font-semibold">About this property</h2>
            <p className="leading-relaxed text-muted-foreground">{listing.description}</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Features</h2>
            <ul className="flex flex-wrap gap-2">
              {listing.features.map((f) => (
                <li key={f}>
                  <Badge variant="outline">{f}</Badge>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <KV icon={<Calendar className="h-4 w-4" />} k="Year built" v={listing.yearBuilt || '—'} />
            <KV icon={<Home className="h-4 w-4" />} k="Starting bid" v={formatCurrency(listing.startingBid)} />
            <KV
              icon={<ShieldCheck className="h-4 w-4" />}
              k="Reserve"
              v={listing.reservePrice ? formatCurrency(listing.reservePrice) : 'No reserve'}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Bid history</h2>
            <BidHistory listing={listing} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BidPanel listing={listing} />
        </aside>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}

function KV({ icon, k, v }: { icon: React.ReactNode; k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {k}
      </div>
      <p className="mt-1 text-base font-semibold">{v}</p>
    </div>
  )
}
