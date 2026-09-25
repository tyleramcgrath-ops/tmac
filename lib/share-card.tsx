// The picture shown when a page without a photo is shared: the page's
// title in the site's own colours, like the cover of a brochure.

import { ImageResponse } from 'next/og'
import { pagePath, walk, type FontStack } from './schema'
import type { SiteBundle } from './sites'

// A web font close to each of the site's font styles, so the card has real
// bold type. Only the letters on the card are downloaded.
const CARD_FONTS: Record<FontStack, string> = { sans: 'Figtree', serif: 'Source Serif 4', mono: 'JetBrains Mono', rounded: 'Nunito' }

async function loadFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const q = `family=${encodeURIComponent(family)}:wght@700&text=${encodeURIComponent(text)}`
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${q}`, { signal: AbortSignal.timeout(2500) })).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) return null
    return await (await fetch(url, { signal: AbortSignal.timeout(2500) })).arrayBuffer()
  } catch {
    return null
  }
}

export async function shareCard(bundle: SiteBundle, path: string): Promise<Response> {
  const { site, pages } = bundle
  const page = pages.find((p) => p.status === 'published' && pagePath(p) === path) ?? pages.find((p) => p.slug === '')
  const c = site.globals.colors
  const name = site.business.name
  const suffix = ` | ${name}`
  // The page's main heading reads best; the SEO title is the fallback.
  const h1 = page ? [...walk(page.body)].find((el) => el.type === 'heading' && el.level === 1) : undefined
  const raw = page?.post?.title ?? (h1?.type === 'heading' ? h1.text : undefined) ?? page?.seo.title ?? name
  const title = (raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : raw).slice(0, 110)
  const a = site.business.address
  const place = a ? `${a.city}, ${a.region}` : ''
  const host = (site.customDomain ?? `${site.subdomain}.saysites.com`).replace(/^www\./, '')
  const family = CARD_FONTS[site.globals.fonts.heading]
  const font = await loadFont(family, `${name}${title}${place}${host}${name.charAt(0).toUpperCase()}`)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: c.background, color: c.text, padding: '72px 80px 0', fontFamily: font ? 'Heading' : 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: c.primary, color: c.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700 }}>
            {name.trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{name}</div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <div style={{ fontSize: title.length > 60 ? 58 : 72, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: c.muted, paddingBottom: 44 }}>
          <span>{place}</span>
          <span>{host}</span>
        </div>
        <div style={{ display: 'flex', height: 18, margin: '0 -80px', background: c.primary }} />
      </div>
    ),
    { width: 1200, height: 630, fonts: font ? [{ name: 'Heading', data: font, weight: 700, style: 'normal' }] : undefined, headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400', 'x-robots-tag': 'noindex' } }
  )
}
