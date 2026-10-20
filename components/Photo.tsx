import { PHOTOS, photoSrcSet, photoUrl, type PhotoKey } from '@/lib/photos'

/** A responsive Unsplash photo. `priority` for the one above the fold. */
export function Photo({ name, className, sizes = '100vw', priority = false }: { name: PhotoKey; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <img
      className={className}
      src={photoUrl(name, 1600)}
      srcSet={photoSrcSet(name)}
      sizes={sizes}
      alt={PHOTOS[name].alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  )
}
