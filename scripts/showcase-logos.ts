// Draws the logos for the example sites (lib/showcase.ts) with the same
// logo engine Sofie uses, and writes them to public/media/logos. Run with
// `npx tsx scripts/showcase-logos.ts` when a showcase logo changes.

import { writeFileSync } from 'fs'
import { join } from 'path'
import { composeLogo, type LogoSpec } from '../lib/logo-compose'

const OUT = join(__dirname, '..', 'public', 'media', 'logos')

const SPECS: Record<string, LogoSpec> = {
  'rivertown-plumbing': {
    layout: 'mark-left',
    name: { text: 'Rivertown', font: 'Archivo', weight: 800, case: 'upper', tracking: 0.02 },
    tagline: { text: 'Plumbing · Since 2009', font: 'Archivo', weight: 600, case: 'upper', tracking: 0.2 },
    mark: { kind: 'icon', icon: 'drop', shape: 'circle', style: 'solid' },
    colors: { name: '#0f2438', accent: '#1a4f86', tagline: '#56657a', mark: '#1a4f86', markInk: '#ffffff' },
  },
  'rosies-bakery': {
    layout: 'wordmark',
    align: 'center',
    name: { text: 'Rosie’s', font: 'Fraunces', weight: 700, case: 'as-is', tracking: -0.01 },
    tagline: { text: 'Bakery', font: 'Josefin Sans', weight: 600, case: 'upper', tracking: 0.5 },
    taglineStyle: 'flanked',
    mark: { kind: 'none' },
    colors: { name: '#a8431f', tagline: '#2b211a', mark: '#a8431f', markInk: '#fbf8f3' },
  },
  'salt-and-stone': {
    layout: 'wordmark',
    align: 'center',
    name: { text: 'Salt & Stone', font: 'Cormorant Garamond', weight: 600, case: 'upper', tracking: 0.1 },
    tagline: { text: 'Hair Studio', font: 'Josefin Sans', weight: 400, case: 'upper', tracking: 0.4 },
    taglineStyle: 'rule',
    mark: { kind: 'none' },
    colors: { name: '#231d1a', tagline: '#7a4b5b', mark: '#7a4b5b', markInk: '#faf7f5' },
  },
  'northside-electric': {
    layout: 'mark-left',
    name: { text: 'Northside', font: 'Barlow Condensed', weight: 700, case: 'upper', tracking: 0.04, accent: { text: 'Electric', weight: 400 } },
    mark: { kind: 'icon', icon: 'lightning', shape: 'square', style: 'solid' },
    colors: { name: '#111827', accent: '#4b5563', mark: '#111827', markInk: '#e8c547' },
  },
  'summit-heating-air': {
    layout: 'mark-left',
    name: { text: 'Summit', font: 'Oswald', weight: 600, case: 'upper', tracking: 0.08 },
    tagline: { text: 'Heating & Air', font: 'Archivo', weight: 600, case: 'upper', tracking: 0.24 },
    mark: { kind: 'icon', icon: 'mountains', shape: 'hexagon', style: 'solid' },
    colors: { name: '#0f2438', tagline: '#1a4f86', mark: '#1a4f86', markInk: '#ffffff' },
  },
  'ridgeline-roofing': {
    layout: 'mark-left',
    name: { text: 'Ridgeline', font: 'Archivo', weight: 900, case: 'upper', tracking: 0 },
    tagline: { text: 'Roofing', font: 'Archivo', weight: 500, case: 'upper', tracking: 0.42 },
    mark: { kind: 'icon', icon: 'house-line', shape: 'shield', style: 'solid' },
    colors: { name: '#111827', tagline: '#4b5563', mark: '#1f2937', markInk: '#ffffff' },
  },
  'green-acre-landscapes': {
    layout: 'mark-left',
    name: { text: 'Green Acre', font: 'Zilla Slab', weight: 700, case: 'as-is', tracking: 0 },
    tagline: { text: 'Landscapes', font: 'Archivo', weight: 600, case: 'upper', tracking: 0.3 },
    mark: { kind: 'icon', icon: 'leaf', shape: 'circle', style: 'solid' },
    colors: { name: '#173a2b', tagline: '#2f6b4f', mark: '#2f6b4f', markInk: '#f1f4ef' },
  },
  'bright-and-tidy': {
    layout: 'mark-left',
    name: { text: 'Bright & Tidy', font: 'Outfit', weight: 700, case: 'as-is', tracking: -0.02 },
    tagline: { text: 'Cleaning Co.', font: 'Outfit', weight: 500, case: 'upper', tracking: 0.26 },
    mark: { kind: 'icon', icon: 'sparkle', shape: 'rounded', style: 'solid' },
    colors: { name: '#0f2438', tagline: '#1a4f86', mark: '#1a4f86', markInk: '#ffffff' },
  },
  'harbor-auto': {
    layout: 'mark-left',
    name: { text: 'Harbor', font: 'Roboto Slab', weight: 800, case: 'upper', tracking: 0.04 },
    tagline: { text: 'Auto Repair', font: 'Archivo', weight: 600, case: 'upper', tracking: 0.24 },
    mark: { kind: 'icon', icon: 'anchor', shape: 'circle', style: 'solid' },
    colors: { name: '#111827', accent: '#4b5563', tagline: '#4b5563', mark: '#1f2937', markInk: '#ffffff' },
  },
  'willow-dental': {
    layout: 'mark-left',
    name: { text: 'willow', font: 'Manrope', weight: 800, case: 'lower', tracking: -0.03, accent: { text: 'dental', weight: 400 } },
    mark: { kind: 'icon', icon: 'tree', shape: 'none', style: 'solid' },
    colors: { name: '#173a2b', accent: '#2f6b4f', mark: '#2f6b4f', markInk: '#ffffff' },
  },
  'olive-and-ember': {
    layout: 'wordmark',
    align: 'center',
    name: { text: 'Olive & Ember', font: 'Playfair Display', weight: 700, case: 'as-is', tracking: -0.01 },
    tagline: { text: 'Wood-fired kitchen', font: 'Josefin Sans', weight: 600, case: 'upper', tracking: 0.3 },
    taglineStyle: 'flanked',
    mark: { kind: 'none' },
    colors: { name: '#2b211a', tagline: '#a8431f', mark: '#a8431f', markInk: '#fbf8f3' },
  },
  'hale-and-porter': {
    layout: 'wordmark',
    align: 'center',
    name: { text: 'Hale & Porter', font: 'Libre Caslon Text', weight: 400, case: 'as-is', tracking: 0 },
    tagline: { text: 'Attorneys at Law', font: 'Libre Caslon Text', weight: 400, case: 'upper', tracking: 0.3 },
    taglineStyle: 'rule',
    mark: { kind: 'none' },
    colors: { name: '#111827', tagline: '#4b5563', mark: '#1f2937', markInk: '#ffffff' },
  },
  'field-and-thread': {
    layout: 'mark-left',
    name: { text: 'Field & Thread', font: 'Fraunces', weight: 600, case: 'as-is', tracking: -0.01 },
    tagline: { text: 'General Goods', font: 'Josefin Sans', weight: 400, case: 'upper', tracking: 0.3 },
    mark: { kind: 'icon', icon: 'needle', shape: 'circle', style: 'outline' },
    colors: { name: '#173a2b', tagline: '#2f6b4f', mark: '#2f6b4f', markInk: '#ffffff' },
  },
}

async function main() {
  const only = process.argv[2]
  for (const [sub, spec] of Object.entries(SPECS)) {
    if (only && sub !== only) continue
    const out = await composeLogo(spec)
    writeFileSync(join(OUT, `${sub}.svg`), out.svg)
    writeFileSync(join(OUT, `${sub}-icon.svg`), out.icon)
    console.log(sub, `${out.width}x${out.height}`, (out.width / out.height).toFixed(1))
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
