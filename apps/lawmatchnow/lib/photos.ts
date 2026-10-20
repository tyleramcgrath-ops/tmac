// Unsplash photos (free under the Unsplash License), served and resized by
// Unsplash's CDN so there's nothing to host. Each is used in one place.

export const PHOTOS = {
  columns: { id: '1436450412740-6b988f486c6b', alt: 'Stone columns of a courthouse under a grey sky' },
  library: { id: '1505664194779-8beaceb93744', alt: 'Law library shelves with marble busts' },
  justice: { id: '1589829545856-d10d557cf95f', alt: 'Statue of Lady Justice holding scales' },
  signing: { id: '1521791055366-0d553872125f', alt: 'Client signing a legal document with a pen' },
} as const

export type PhotoKey = keyof typeof PHOTOS

export const photoUrl = (key: PhotoKey, w: number) =>
  `https://images.unsplash.com/photo-${PHOTOS[key].id}?w=${w}&q=72&auto=format&fit=crop`

export const photoSrcSet = (key: PhotoKey, widths = [640, 1080, 1600, 2200]) =>
  widths.map((w) => `${photoUrl(key, w)} ${w}w`).join(', ')
