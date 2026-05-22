import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-7xl font-bold">404</p>
      <h1 className="mt-2 text-xl font-semibold">Listing not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This auction may have ended or never existed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to auctions</Link>
      </Button>
    </div>
  )
}
