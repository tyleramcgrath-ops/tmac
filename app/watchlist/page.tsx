import { Suspense } from 'react'
import { Heart } from 'lucide-react'
import { ListingsGrid } from '@/components/listings-grid'

export const metadata = { title: 'Watchlist — Bidly' }

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-muted-foreground">Properties you&apos;re keeping an eye on.</p>
        </div>
      </div>
      <Suspense fallback={null}>
        <ListingsGrid scope="watchlist" />
      </Suspense>
    </div>
  )
}
