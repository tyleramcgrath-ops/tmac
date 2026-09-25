// Turns logos into a PNG contact sheet so Sofie can see what she made and
// fix it, the way a designer steps back from the screen.

import { Resvg } from '@resvg/resvg-js'

export interface Sheet {
  logo: string
  icon: string
}

function nested(svg: string, x: number, y: number, w: number, h: number): string {
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100'
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMinYMid meet">${inner}</svg>`
}

// One row per logo, top to bottom: the logo at twice header size on the
// site's background, then the icon large and at browser-tab size.
export function renderSheet(items: Sheet[], background = '#ffffff'): Buffer {
  const W = 1200
  const rowH = 190
  const rows = items.map((it, i) => {
    const y = 20 + i * rowH
    return [
      `<rect x="20" y="${y}" width="860" height="170" rx="10" fill="${background}" stroke="#d8d6d0"/>`,
      nested(it.logo, 50, y + 29, 800, 112),
      `<rect x="900" y="${y}" width="170" height="170" rx="10" fill="#f4f3ef" stroke="#d8d6d0"/>`,
      nested(it.icon, 921, y + 21, 128, 128),
      `<rect x="1090" y="${y + 69}" width="90" height="32" rx="6" fill="#ffffff" stroke="#d8d6d0"/>`,
      nested(it.icon, 1098, y + 77, 16, 16),
    ].join('')
  })
  const H = 20 + items.length * rowH
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ecebe6"/>${rows.join('')}</svg>`
  return new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }).render().asPng()
}
