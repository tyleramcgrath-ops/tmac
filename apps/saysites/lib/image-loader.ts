// Photos come from Unsplash's own image CDN, which already resizes and picks
// AVIF/WebP (auto=format). Asking it for each size directly keeps the photos
// just as light and skips Vercel's image optimization, which is metered.
export default function unsplashLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith('https://images.unsplash.com/')) return src
  const u = new URL(src)
  const w = Number(u.searchParams.get('w'))
  const h = Number(u.searchParams.get('h'))
  // Keep a fixed crop's shape when it's asked for at another width.
  if (w && h) u.searchParams.set('h', String(Math.round((h * width) / w)))
  u.searchParams.set('w', String(width))
  u.searchParams.set('q', String(quality ?? (Number(u.searchParams.get('q')) || 75)))
  if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format')
  return u.toString()
}
