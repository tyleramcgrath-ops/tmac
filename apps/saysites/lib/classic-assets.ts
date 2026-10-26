// When an owner claims their site "as it is", the kept pages (lib/classic)
// still load photos, backgrounds and fonts from their old web host, which
// goes away when their domain moves to SaySites. This copies those files to
// SaySites (ss_media, kind 'asset', served at /u/<id>) and points the pages
// at the copies. Files from other hosts (Google Fonts, a CDN) stay where
// they are.

import { safeFetchBytes } from './importer'
import type { Page } from './schema'
import type { Store } from './store'

const ASSET = /\.(jpe?g|png|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot)$/i
const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject' }
export const ASSET_LIMITS = { files: 300, bytes: 80_000_000 }

// Every file on their old host that the kept pages use.
export function oldHostFiles(pages: readonly Page[], host: string): string[] {
  const bare = host.replace(/^www\./, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`https://(?:www\\.)?${bare}/[^\\s"'()<>,]+`, 'gi')
  const out = new Set<string>()
  for (const p of pages) {
    if (!p.classic) continue
    for (const m of p.classic.html.matchAll(re)) {
      const u = m[0].replace(/&amp;/g, '&')
      try {
        if (ASSET.test(new URL(u).pathname)) out.add(u)
      } catch {}
    }
  }
  return [...out]
}

export async function keepClassicAssets(
  store: Store,
  siteId: string,
  host: string,
  pages: readonly Page[],
  fetchBytes: (url: string) => Promise<{ type: string; data: Buffer } | null> = safeFetchBytes
): Promise<{ pages: Page[]; copied: number }> {
  const files = oldHostFiles(pages, host).slice(0, ASSET_LIMITS.files)
  const moved = new Map<string, string>()
  let total = 0
  for (let i = 0; i < files.length; i += 6) {
    await Promise.all(
      files.slice(i, i + 6).map(async (url) => {
        const got = await fetchBytes(url).catch(() => null)
        if (!got || total + got.data.length > ASSET_LIMITS.bytes) return
        const ext = new URL(url).pathname.split('.').pop()!.toLowerCase()
        const mime = /^(image|font)\//.test(got.type) || got.type === 'application/vnd.ms-fontobject' ? got.type : MIME[ext]
        if (!mime) return
        total += got.data.length
        moved.set(url, `/u/${await store.addAsset(siteId, mime, got.data)}`)
      })
    )
  }
  if (!moved.size) return { pages: [...pages], copied: 0 }
  // Longest first, so a file's address is never cut short by another's.
  const order = [...moved.keys()].sort((a, b) => b.length - a.length)
  const out = pages.map((p) => {
    if (!p.classic) return p
    let html = p.classic.html
    for (const from of order) {
      const to = moved.get(from)!
      html = html.split(from).join(to).split(from.replace(/&/g, '&amp;')).join(to)
    }
    return html === p.classic.html ? p : { ...p, classic: { html } }
  })
  return { pages: out, copied: moved.size }
}
