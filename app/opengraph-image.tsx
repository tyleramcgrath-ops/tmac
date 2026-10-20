import { ImageResponse } from 'next/og'
import { SEAL_L, SEAL_M } from '@/lib/brand'

export const alt = 'LawMatchNow: find the right lawyer near you'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Playfair Display from Google Fonts as TTF (Satori can't read woff2); null if offline. */
async function playfair(italic: boolean): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Playfair+Display:ital@${italic ? 1 : 0}`, { headers: { 'User-Agent': 'curl' } }).then((r) => r.text())
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1]
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null
  } catch {
    return null
  }
}

export default async function OgImage() {
  const [reg, ital] = await Promise.all([playfair(false), playfair(true)])
  const fonts = [
    ...(reg ? [{ name: 'Playfair', data: reg, style: 'normal' as const, weight: 400 as const }] : []),
    ...(ital ? [{ name: 'Playfair', data: ital, style: 'italic' as const, weight: 400 as const }] : []),
  ]
  const serif = fonts.length ? 'Playfair' : 'serif'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#f6f3ee', color: '#15284a', fontFamily: serif }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <svg width="92" height="92" viewBox="0 0 74 74">
            <circle cx="37" cy="37" r="35" fill="none" stroke="#15284a" strokeWidth="1.8" />
            <circle cx="37" cy="37" r="29.5" fill="none" stroke="#2f7fc1" strokeWidth="1.1" />
            <path d={SEAL_L} fill="#15284a" />
            <path d={SEAL_M} fill="#2f7fc1" />
          </svg>
          <div style={{ display: 'flex', fontSize: 50 }}>
            LawMatch<span style={{ color: '#2f7fc1' }}>Now</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, lineHeight: 1.05 }}>The right lawyer,</div>
          <div style={{ fontSize: 88, lineHeight: 1.05, color: '#2f7fc1', fontStyle: 'italic' }}>found with care.</div>
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#5f6b80', fontFamily: 'sans-serif' }}>Attorneys in all 50 states · Plain-English legal guides · Free case review</div>
      </div>
    ),
    { ...size, fonts },
  )
}
