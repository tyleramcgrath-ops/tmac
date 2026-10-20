import { ImageResponse } from 'next/og'

export const alt = 'LawMatchNow: find the right lawyer near you'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#0e1726', color: '#fff', fontFamily: 'Georgia, serif' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 6, color: '#c9a76b', textTransform: 'uppercase' }}>§ LawMatchNow</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, lineHeight: 1.05 }}>The right lawyer,</div>
          <div style={{ fontSize: 84, lineHeight: 1.05, color: '#c9a76b', fontStyle: 'italic' }}>found with care.</div>
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#aab3c2' }}>Attorneys in all 50 states · Plain-English legal guides · Free case review</div>
      </div>
    ),
    size,
  )
}
