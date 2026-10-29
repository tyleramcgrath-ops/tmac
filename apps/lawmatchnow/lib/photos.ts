// Unsplash photos (free under the Unsplash License), served and resized by
// Unsplash's CDN so there's nothing to host.

export const PHOTOS = {
  columns: { id: '1436450412740-6b988f486c6b', alt: 'Stone columns of a courthouse under a grey sky' },
  library: { id: '1505664194779-8beaceb93744', alt: 'Law library shelves with marble busts' },
  justice: { id: '1589829545856-d10d557cf95f', alt: 'Statue of Lady Justice holding scales' },
  signing: { id: '1521791055366-0d553872125f', alt: 'Client signing a legal document with a pen' },
  scotus: { id: '1453945619913-79ec89a82c51', alt: 'The U.S. Supreme Court building under a blue sky' },
  gavel: { id: '1593115057322-e94b77572f20', alt: 'A wooden gavel on a white background' },
} as const

export type PhotoKey = keyof typeof PHOTOS

export const photoUrl = (key: PhotoKey, w: number) =>
  `https://images.unsplash.com/photo-${PHOTOS[key].id}?w=${w}&q=${w > 1000 ? 62 : 68}&auto=format&fit=crop`

export const photoSrcSet = (key: PhotoKey, widths = [640, 1080, 1600, 2200]) =>
  widths.map((w) => `${photoUrl(key, w)} ${w}w`).join(', ')

/** A fitting photo for each guide category (blog posts use the Supreme Court). */
export const CATEGORY_PHOTO: Record<string, PhotoKey> = {
  'Hiring a Lawyer': 'signing',
  'Costs & Fees': 'library',
  'Your Rights': 'justice',
  'After an Accident': 'gavel',
  'Courts & Process': 'columns',
}
