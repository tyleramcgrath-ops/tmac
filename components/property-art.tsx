import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/data'

type Props = {
  listing: Pick<Listing, 'palette' | 'emoji' | 'propertyType' | 'city' | 'state'>
  className?: string
  variant?: 'card' | 'hero'
}

export function PropertyArt({ listing, className, variant = 'card' }: Props) {
  const style = {
    '--p-from': listing.palette.from,
    '--p-via': listing.palette.via,
    '--p-to': listing.palette.to,
    '--p-accent': listing.palette.accent,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        'property-art flex items-end justify-between text-white',
        variant === 'card' ? 'aspect-[4/3] p-4' : 'aspect-[16/9] p-6',
        className,
      )}
      style={style}
    >
      <div className="relative z-10 flex flex-col gap-1 drop-shadow">
        <span className="text-xs font-medium uppercase tracking-widest opacity-90">
          {listing.propertyType}
        </span>
        <span className="text-sm font-semibold opacity-95">
          {listing.city}, {listing.state}
        </span>
      </div>
      <div
        aria-hidden
        className={cn(
          'relative z-10 select-none drop-shadow-lg',
          variant === 'card' ? 'text-5xl' : 'text-7xl',
        )}
      >
        {listing.emoji}
      </div>
    </div>
  )
}
