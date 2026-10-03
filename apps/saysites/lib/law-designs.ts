// Law firm home pages, in three designs that share nothing but the facts:
// "counsel" (dark and formal, the consultation form right in the header),
// "classic" (ivory and serif, practice areas as an index, the form at the
// foot) and "modern" (light and clean, practice areas as photo cards, the
// form on a dark band). A new firm gets one picked from its address, so
// neighbouring firms never look alike; the owner can ask Sofie for another.
//
// What every one of them has, because it's what people choosing a lawyer
// look for: what the firm handles, where, how to reach it, how a first
// conversation goes, who the attorneys are (when the owner gives us them)
// and a consultation request on the home page itself. Nothing invented: no
// results, ratings, years or fee promises.

import type { Container, Element, Flair, GlobalStyles } from './schema'
import type { Photo } from './photos'

export const LAW_STYLES = ['counsel', 'classic', 'modern'] as const
export type LawStyle = (typeof LAW_STYLES)[number]
export const LAW_STYLE_NAMES: Record<LawStyle, string> = { counsel: 'Counsel', classic: 'Classic', modern: 'Modern' }

// Type, shapes and personality for each design (the colours stay the owner's).
export const LAW_GLOBALS: Record<LawStyle, Omit<GlobalStyles, 'colors'>> = {
  counsel: { fonts: { heading: 'serif', body: 'sans' }, headingFont: 'newsreader', baseFontSize: 17, typeScale: 1.28, radius: 4, containerWidth: 1200, headingWeight: 500, headingTracking: -0.02, buttonShape: 'square', buttonCase: 'upper', flair: 'luxe' },
  classic: { fonts: { heading: 'serif', body: 'sans' }, headingFont: 'fraunces', baseFontSize: 17, typeScale: 1.3, radius: 0, containerWidth: 1160, headingWeight: 400, headingTracking: -0.015, buttonShape: 'square', flair: 'editorial' },
  modern: { fonts: { heading: 'sans', body: 'sans' }, headingFont: 'bricolage', baseFontSize: 17, typeScale: 1.25, radius: 12, containerWidth: 1180, headingWeight: 600, headingTracking: -0.03, buttonShape: 'rounded', flair: 'clean' },
}

export function lawStyleFor(subdomain: string): LawStyle {
  let h = 7
  for (const ch of subdomain) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return LAW_STYLES[h % LAW_STYLES.length]
}

export const lawFlair = (style: LawStyle): Flair => LAW_GLOBALS[style].flair ?? 'clean'

// An attorney at the firm, in the owner's own words.
export interface Attorney {
  name: string
  role: string
  bio: string
}

export interface LawHomeInput {
  style: LawStyle
  name: string
  place: string
  headline: string
  intro: string
  phone?: string
  email?: string
  // "250 E Broad Street, Columbus, OH 43215", when the firm gave one.
  address?: string
  hours?: string
  areas: string[]
  summary: (area: string, i: number) => string
  // The practice area's own page, when it has one.
  areaHref: (area: string) => string | undefined
  areasHref: string
  hero: Photo
  // The next photo not yet used on the site.
  photo: () => Photo
  attorneys: Attorney[]
  ticker: Container[]
  faq: Container
  story?: Container
}

const pad = (y: number, x = 24) => ({ top: y, right: x, bottom: y, left: x })
const sec = { desktop: pad(104), mobile: pad(60, 20) }
const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`
const img = (id: string, p: Photo, aspect: number, radius: number, priority = false): Element => ({ id, type: 'image', src: p.src, alt: p.alt, width: p.width, height: p.height, aspect, ...(priority ? { priority: true } : {}), style: { borderRadius: radius } })
const lower = (s: string) => (/^[A-Z][a-z]+(\s|$)/.test(s) && !/^[A-Z]{2,}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)

export const FORM_NOTE = 'Sending this form doesn’t create an attorney-client relationship. Please leave out confidential details until we’ve spoken.'

const COMMITMENTS: [string, string][] = [
  ['Plain English', 'We explain where you stand and what could happen next, without the jargon.'],
  ['Straight answers on cost', 'You’ll know how our fees work, in writing, before any work begins.'],
  ['You’ll hear from us', 'We keep you informed as things move and tell you what we need from you.'],
  ['Confidential', 'What you tell us in a consultation stays between us.'],
]

const STEPS = (phone?: string): [string, string][] => [
  ['Tell us what happened', phone ? `Call ${phone} or send the form. A short description is plenty to start.` : 'Send the form. A short description is plenty to start.'],
  ['Understand your options', 'We listen, ask questions and explain where you stand and what each path tends to involve.'],
  ['Decide with a clear plan', 'If you want our help, we agree the next steps and fees in writing before any work begins.'],
]

export function lawHome(x: LawHomeInput): Container[] {
  return x.style === 'classic' ? classic(x) : x.style === 'modern' ? modern(x) : counsel(x)
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function kicker(id: string, text: string, color: string = 'primary'): Element {
  return { id, type: 'text', text, style: { fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.14, textTransform: 'uppercase', color: color as never } }
}

function form(id: string, x: LawHomeInput): Element[] {
  return [
    { id, type: 'form', fields: ['name', 'phone', 'email', 'message'], submitLabel: 'Request a consultation', thanks: `Thank you. ${x.name} has your message and will be in touch soon.` },
    { id: `${id}-note`, type: 'text', text: FORM_NOTE, style: { color: 'muted', fontSize: { desktop: 13 } } },
  ]
}

function areaButton(id: string, x: LawHomeInput, area: string, light = false): Element[] {
  const href = x.areaHref(area)
  return href ? [{ id, type: 'button', label: `About ${lower(area)}`, href, variant: 'outline', style: { margin: { desktop: { top: 6, right: 0, bottom: 0, left: 0 } }, ...(light ? { color: '#ffffff' as const } : {}) } }] : []
}

function allAreas(x: LawHomeInput, shown: number): Element[] {
  return x.areas.length > shown ? [{ id: 'lw-areas-all', type: 'button', label: `All ${x.areas.length} practice areas`, href: x.areasHref, variant: 'outline' }] : []
}

function attorneysSection(x: LawHomeInput, bg?: 'surface'): Container[] {
  if (!x.attorneys.length) return []
  return [
    {
      id: 'lw-team',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: sec, gap: { desktop: 36 }, ...(bg ? { background: bg } : {}) },
      children: [
        {
          id: 'lw-team-head',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 10 } },
          children: [
            { id: 'lw-team-h', type: 'heading', level: 2, text: x.attorneys.length === 1 ? 'Your attorney' : 'Our attorneys', style: { fontSize: { desktop: 42, mobile: 30 } } },
            { id: 'lw-team-t', type: 'text', text: 'The people you will actually speak to.', style: { color: 'muted', fontSize: { desktop: 18 } } },
          ],
        },
        {
          id: 'lw-team-grid',
          type: 'container',
          layout: 'grid',
          columns: { desktop: Math.min(3, x.attorneys.length), tablet: Math.min(2, x.attorneys.length), mobile: 1 },
          style: { gap: { desktop: 24 } },
          children: x.attorneys.slice(0, 6).map((a, i): Container => attorneyCard(`lw-at-${i + 1}`, a, x.style, bg ? 'background' : 'surface')),
        },
      ],
    },
  ]
}

export function attorneyCard(id: string, a: Attorney, style: LawStyle, bg: 'surface' | 'background' = 'surface'): Container {
  const initials = a.name.replace(/\b(Mr|Ms|Mrs|Dr|Esq)\.?\s*/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return {
    id,
    type: 'container',
    layout: 'flex',
    style: { gap: { desktop: 8 }, padding: { desktop: pad(32, 30), mobile: pad(24, 20) }, background: bg, borderRadius: style === 'classic' ? 0 : style === 'modern' ? 12 : 4 },
    children: [
      { id: `${id}-mono`, type: 'text', text: initials || 'A', style: { fontFamily: 'heading', fontSize: { desktop: 40 }, color: 'primary', margin: { desktop: { top: 0, right: 0, bottom: 6, left: 0 } } } },
      { id: `${id}-h`, type: 'heading', level: 3, text: a.name, style: { fontSize: { desktop: 26 } } },
      { id: `${id}-r`, type: 'text', text: a.role, style: { fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.1, textTransform: 'uppercase', color: 'primary' } },
      { id: `${id}-t`, type: 'text', text: a.bio, style: { color: 'muted' } },
    ],
  }
}

function contactLines(x: LawHomeInput): string {
  return [x.phone ? `Call ${x.phone}` : '', x.email ? `Email ${x.email}` : '', x.address ?? '', x.hours ? `Open ${x.hours}` : ''].filter(Boolean).join('\n\n')
}

function steps(x: LawHomeInput, dark: boolean, radius: number): Container {
  return {
    id: 'lw-steps',
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    style: { padding: sec, gap: { desktop: 40 }, ...(dark ? { background: 'secondary' as const, color: 'background' as const } : {}) },
    children: [
      {
        id: 'lw-steps-head',
        type: 'container',
        layout: 'flex',
        style: { gap: { desktop: 10 } },
        children: [
          { id: 'lw-steps-h', type: 'heading', level: 2, text: 'How working with us begins', style: { fontSize: { desktop: 42, mobile: 30 }, ...(dark ? { color: 'background' as const } : {}) } },
          { id: 'lw-steps-t', type: 'text', text: 'No pressure and no jargon. You decide at every step.', style: { fontSize: { desktop: 18 }, ...(dark ? {} : { color: 'muted' as const }) } },
        ],
      },
      {
        id: 'lw-steps-grid',
        type: 'container',
        layout: 'grid',
        columns: { desktop: 3, mobile: 1 },
        style: { gap: { desktop: 28, mobile: 18 } },
        children: STEPS(x.phone).map(([h, d], i): Container => ({
          id: `lw-step-${i + 1}`,
          type: 'container',
          layout: 'flex',
          style: dark
            ? { gap: { desktop: 10 }, padding: { desktop: pad(30, 28), mobile: pad(22, 20) }, border: 'accent' }
            : { gap: { desktop: 10 }, padding: { desktop: pad(30, 28), mobile: pad(22, 20) }, background: 'surface', borderRadius: radius },
          children: [
            { id: `lw-step-${i + 1}-h`, type: 'heading', level: 3, text: h, style: { fontSize: { desktop: 24 }, ...(dark ? { color: 'background' as const } : {}) } },
            { id: `lw-step-${i + 1}-t`, type: 'text', text: d, style: dark ? {} : { color: 'muted' } },
          ],
        })),
      },
    ],
  }
}

function tail(x: LawHomeInput): Container[] {
  return [...(x.story ? [x.story] : []), x.faq]
}

// ---------------------------------------------------------------------------
// Counsel: dark, formal, the form in the header.
// ---------------------------------------------------------------------------

function counsel(x: LawHomeInput): Container[] {
  const shown = x.areas.slice(0, 6)
  const cols = shown.length === 4 || shown.length === 2 ? 2 : 3
  const why = x.photo()
  const band = x.photo()
  return [
    {
      id: 'hero',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      direction: { desktop: 'row', mobile: 'column' },
      align: 'center',
      boxed: true,
      backgroundImage: { src: x.hero.src, width: x.hero.width, height: x.hero.height, overlay: 0.86, overlayStyle: 'side', priority: true },
      style: { background: '#11161d', padding: { desktop: pad(104), tablet: pad(80), mobile: pad(56, 20) }, gap: { desktop: 64, mobile: 36 } },
      children: [
        {
          id: 'hero-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 16 }, grow: 7 },
          children: [
            kicker('hero-kicker', x.place, 'accent'),
            { id: 'hero-title', type: 'heading', level: 1, text: x.headline, style: { color: '#ffffff', fontSize: { desktop: 62, tablet: 48, mobile: 38 }, maxWidth: 680 } },
            { id: 'hero-text', type: 'text', text: x.intro, style: { color: '#dfe5ec', fontSize: { desktop: 19, mobile: 17 }, maxWidth: 560 } },
            {
              id: 'hero-actions',
              type: 'container',
              layout: 'flex',
              direction: { desktop: 'row' },
              style: { gap: { desktop: 12 }, margin: { desktop: { top: 10, right: 0, bottom: 0, left: 0 } } },
              children: [
                ...(x.phone ? [{ id: 'hero-call', type: 'button' as const, label: `Call ${x.phone}`, href: tel(x.phone), variant: 'primary' as const, style: { background: '#ffffff' as const, color: '#11161d' as const } }] : []),
                { id: 'hero-areas', type: 'button', label: 'Practice areas', href: x.areasHref, variant: 'outline', style: { color: '#ffffff' } },
              ],
            },
          ],
        },
        {
          id: 'hero-card',
          type: 'container',
          layout: 'flex',
          style: { grow: 5, background: 'background', color: 'text', borderRadius: 4, padding: { desktop: pad(36, 34), mobile: pad(26, 20) }, gap: { desktop: 12 } },
          children: [
            { id: 'hero-card-h', type: 'heading', level: 2, text: 'Request a consultation', style: { fontSize: { desktop: 30, mobile: 26 } } },
            { id: 'hero-card-t', type: 'text', text: 'Tell us briefly what happened and how to reach you. We’ll get back to you to talk it through.', style: { color: 'muted', fontSize: { desktop: 16 } } },
            ...form('hero-form', x),
          ],
        },
      ],
    },
    ...x.ticker,
    {
      id: 'lw-areas',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: sec, gap: { desktop: 40 } },
      children: [
        {
          id: 'lw-areas-head',
          type: 'container',
          layout: 'grid',
          columns: { desktop: 2, mobile: 1 },
          align: 'end',
          style: { gap: { desktop: 48, mobile: 12 } },
          children: [
            { id: 'lw-areas-h', type: 'heading', level: 2, text: 'What we handle', style: { fontSize: { desktop: 46, mobile: 32 } } },
            { id: 'lw-areas-t', type: 'text', text: `The areas of law ${x.name} handles for clients across ${x.place}. Not sure which applies to you? Ask, and we’ll tell you honestly.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
          ],
        },
        {
          id: 'lw-areas-grid',
          type: 'container',
          layout: 'grid',
          columns: { desktop: cols, tablet: 2, mobile: 1 },
          style: { gap: { desktop: 20 } },
          children: shown.map((a, i): Container => ({
            id: `lw-area-${i + 1}`,
            type: 'container',
            layout: 'flex',
            style: { background: 'surface', borderRadius: 4, padding: { desktop: pad(36, 32), mobile: pad(26, 22) }, gap: { desktop: 10 } },
            children: [
              { id: `lw-area-${i + 1}-h`, type: 'heading', level: 3, text: a, style: { fontSize: { desktop: 28, mobile: 24 } } },
              { id: `lw-area-${i + 1}-t`, type: 'text', text: x.summary(a, i), style: { color: 'muted' } },
              ...areaButton(`lw-area-${i + 1}-more`, x, a),
            ],
          })),
        },
        ...allAreas(x, shown.length),
      ],
    },
    {
      id: 'lw-why',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 2, mobile: 1 },
      align: 'center',
      boxed: true,
      style: { background: 'surface', padding: sec, gap: { desktop: 72, mobile: 32 } },
      children: [
        img('lw-why-img', why, 0.95, 4),
        {
          id: 'lw-why-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 14 } },
          children: [
            kicker('lw-why-k', `Why clients call ${x.name}`),
            { id: 'lw-why-h', type: 'heading', level: 2, text: 'You should understand your own case.', style: { fontSize: { desktop: 44, mobile: 30 } } },
            {
              id: 'lw-why-grid',
              type: 'container',
              layout: 'grid',
              columns: { desktop: 2, mobile: 1 },
              style: { gap: { desktop: 26, mobile: 18 }, margin: { desktop: { top: 16, right: 0, bottom: 0, left: 0 } } },
              children: COMMITMENTS.map(([h, d], i): Container => ({
                id: `lw-why-${i + 1}`,
                type: 'container',
                layout: 'flex',
                style: { gap: { desktop: 6 } },
                children: [
                  { id: `lw-why-${i + 1}-h`, type: 'heading', level: 3, text: h, style: { fontSize: { desktop: 22 } } },
                  { id: `lw-why-${i + 1}-t`, type: 'text', text: d, style: { color: 'muted' } },
                ],
              })),
            },
          ],
        },
      ],
    },
    ...attorneysSection(x),
    steps(x, true, 4),
    ...tail(x),
    {
      id: 'cta',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      align: 'center',
      backgroundImage: { src: band.src, width: band.width, height: band.height, overlay: 0.8, overlayStyle: 'full' },
      style: { background: '#11161d', padding: { desktop: pad(120), mobile: pad(72, 20) }, gap: { desktop: 16 }, textAlign: { desktop: 'center' } },
      children: [
        { id: 'cta-h', type: 'heading', level: 2, text: 'Talk to us about your situation', style: { color: '#ffffff', fontSize: { desktop: 48, mobile: 32 } } },
        { id: 'cta-t', type: 'text', text: `Tell us what happened. ${x.name} will explain your options and the next step.`, style: { color: '#dfe5ec', fontSize: { desktop: 18 }, maxWidth: 540 } },
        {
          id: 'cta-actions',
          type: 'container',
          layout: 'flex',
          direction: { desktop: 'row' },
          justify: 'center',
          style: { gap: { desktop: 12 }, margin: { desktop: { top: 10, right: 0, bottom: 0, left: 0 } } },
          children: [
            { id: 'cta-btn', type: 'button', label: 'Request a consultation', href: '/contact', variant: 'primary', style: { background: '#ffffff', color: '#11161d' } },
            ...(x.phone ? [{ id: 'cta-call', type: 'button' as const, label: `Call ${x.phone}`, href: tel(x.phone), variant: 'outline' as const, style: { color: '#ffffff' as const } }] : []),
          ],
        },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Classic: ivory and serif, a practice-area index, the form at the foot.
// ---------------------------------------------------------------------------

function classic(x: LawHomeInput): Container[] {
  const shown = x.areas.slice(0, 8)
  const band = x.photo()
  return [
    {
      id: 'hero',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      align: 'center',
      boxed: true,
      style: { padding: { desktop: { top: 112, right: 24, bottom: 56, left: 24 }, mobile: { top: 56, right: 20, bottom: 32, left: 20 } }, gap: { desktop: 18 }, textAlign: { desktop: 'center' } },
      children: [
        kicker('hero-kicker', x.place),
        { id: 'hero-title', type: 'heading', level: 1, text: x.headline, style: { fontSize: { desktop: 74, tablet: 56, mobile: 40 }, maxWidth: 940 } },
        { id: 'hero-text', type: 'text', text: x.intro, style: { color: 'muted', fontSize: { desktop: 20, mobile: 17 }, maxWidth: 660 } },
        {
          id: 'hero-actions',
          type: 'container',
          layout: 'flex',
          direction: { desktop: 'row' },
          justify: 'center',
          style: { gap: { desktop: 12 }, margin: { desktop: { top: 12, right: 0, bottom: 0, left: 0 } } },
          children: [
            { id: 'hero-cta', type: 'button', label: 'Request a consultation', href: '/contact', variant: 'primary' },
            ...(x.phone ? [{ id: 'hero-call', type: 'button' as const, label: `Call ${x.phone}`, href: tel(x.phone), variant: 'outline' as const }] : []),
          ],
        },
      ],
    },
    {
      id: 'hero-photo',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: { desktop: { top: 0, right: 24, bottom: 96, left: 24 }, mobile: { top: 0, right: 20, bottom: 56, left: 20 } } },
      children: [img('hero-img', x.hero, 2.5, 0, true)],
    },
    {
      id: 'lw-areas',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      direction: { desktop: 'row', mobile: 'column' },
      boxed: true,
      style: { background: 'surface', padding: sec, gap: { desktop: 72, mobile: 28 } },
      children: [
        {
          id: 'lw-areas-head',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 14 }, grow: 1 },
          children: [
            kicker('lw-areas-k', 'Practice areas'),
            { id: 'lw-areas-h', type: 'heading', level: 2, text: `How ${x.name} can help`, style: { fontSize: { desktop: 40, mobile: 30 } } },
            { id: 'lw-areas-t', type: 'text', text: 'Not sure which applies to you? Ask, and we’ll tell you honestly.', style: { color: 'muted', fontSize: { desktop: 17 } } },
            ...allAreas(x, shown.length),
          ],
        },
        {
          id: 'lw-areas-list',
          type: 'container',
          layout: 'grid',
          columns: { desktop: 2, mobile: 1 },
          style: { gap: { desktop: 44, mobile: 28 }, grow: 2 },
          children: shown.map((a, i): Container => ({
            id: `lw-area-${i + 1}`,
            type: 'container',
            layout: 'flex',
            style: { gap: { desktop: 8 } },
            children: [
              { id: `lw-area-${i + 1}-h`, type: 'heading', level: 3, text: a, style: { fontSize: { desktop: 30, mobile: 26 } } },
              { id: `lw-area-${i + 1}-t`, type: 'text', text: x.summary(a, i), style: { color: 'muted' } },
              ...areaButton(`lw-area-${i + 1}-more`, x, a),
            ],
          })),
        },
      ],
    },
    {
      id: 'band',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      align: 'center',
      backgroundImage: { src: band.src, width: band.width, height: band.height, overlay: 0.62, overlayStyle: 'full' },
      style: { background: '#1d1a17', padding: { desktop: pad(150), mobile: pad(96, 20) }, gap: { desktop: 14 }, textAlign: { desktop: 'center' } },
      children: [
        { id: 'band-h', type: 'heading', level: 2, text: 'Clear answers, in plain English.', style: { color: '#ffffff', fontSize: { desktop: 54, mobile: 34 }, maxWidth: 820 } },
        { id: 'band-t', type: 'text', text: `${x.name}, ${x.place}`, style: { color: '#ece6dc', fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.16, textTransform: 'uppercase' } },
      ],
    },
    {
      id: 'lw-why',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 4, tablet: 2, mobile: 1 },
      boxed: true,
      style: { padding: { desktop: pad(88), mobile: pad(56, 20) }, gap: { desktop: 36, mobile: 22 } },
      children: COMMITMENTS.map(([h, d], i): Container => ({
        id: `lw-why-${i + 1}`,
        type: 'container',
        layout: 'flex',
        style: { gap: { desktop: 8 } },
        children: [
          { id: `lw-why-${i + 1}-h`, type: 'heading', level: 3, text: h, style: { fontSize: { desktop: 24 } } },
          { id: `lw-why-${i + 1}-t`, type: 'text', text: d, style: { color: 'muted' } },
        ],
      })),
    },
    ...attorneysSection(x, 'surface'),
    steps(x, false, 0),
    ...tail(x),
    {
      id: 'lw-consult',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 2, mobile: 1 },
      boxed: true,
      style: { padding: sec, gap: { desktop: 72, mobile: 32 } },
      children: [
        {
          id: 'lw-consult-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 16 } },
          children: [
            kicker('lw-consult-k', 'Request a consultation'),
            { id: 'lw-consult-h', type: 'heading', level: 2, text: 'Talk to us about your situation', style: { fontSize: { desktop: 46, mobile: 32 } } },
            { id: 'lw-consult-t', type: 'text', text: `Tell us briefly what happened and how to reach you. ${x.name} will get back to you to explain your options and the next step.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
            ...(contactLines(x) ? [{ id: 'lw-consult-d', type: 'text' as const, text: contactLines(x), style: { fontSize: { desktop: 17 }, fontWeight: 500 as const } }] : []),
          ],
        },
        {
          id: 'lw-consult-card',
          type: 'container',
          layout: 'flex',
          style: { background: 'surface', borderRadius: 0, padding: { desktop: pad(40, 36), mobile: pad(26, 20) }, gap: { desktop: 12 } },
          children: form('lw-consult-form', x),
        },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Modern: light and clean, photo cards, the form on a dark band.
// ---------------------------------------------------------------------------

function modern(x: LawHomeInput): Container[] {
  const shown = x.areas.slice(0, 6)
  const cols = shown.length === 4 || shown.length === 2 ? 2 : 3
  return [
    {
      id: 'hero',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 2, mobile: 1 },
      align: 'center',
      boxed: true,
      style: { background: 'surface', padding: { desktop: pad(80), mobile: pad(44, 20) }, gap: { desktop: 64, mobile: 32 } },
      children: [
        {
          id: 'hero-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 16 } },
          children: [
            kicker('hero-kicker', x.place),
            { id: 'hero-title', type: 'heading', level: 1, text: x.headline, style: { fontSize: { desktop: 60, tablet: 46, mobile: 38 } } },
            { id: 'hero-text', type: 'text', text: x.intro, style: { color: 'muted', fontSize: { desktop: 19, mobile: 17 }, maxWidth: 540 } },
            {
              id: 'hero-actions',
              type: 'container',
              layout: 'flex',
              direction: { desktop: 'row' },
              style: { gap: { desktop: 12 }, margin: { desktop: { top: 10, right: 0, bottom: 0, left: 0 } } },
              children: [
                { id: 'hero-cta', type: 'button', label: 'Request a consultation', href: '/contact', variant: 'primary' },
                ...(x.phone ? [{ id: 'hero-call', type: 'button' as const, label: `Call ${x.phone}`, href: tel(x.phone), variant: 'outline' as const }] : []),
              ],
            },
          ],
        },
        img('hero-img', x.hero, 1.05, 14, true),
      ],
    },
    {
      id: 'lw-why',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 4, tablet: 2, mobile: 1 },
      boxed: true,
      style: { padding: { desktop: pad(44), mobile: pad(32, 20) }, gap: { desktop: 32, mobile: 18 } },
      children: COMMITMENTS.map(([h, d], i): Container => ({
        id: `lw-why-${i + 1}`,
        type: 'container',
        layout: 'flex',
        style: { gap: { desktop: 4 } },
        children: [
          { id: `lw-why-${i + 1}-h`, type: 'text', text: h, style: { fontWeight: 700, fontSize: { desktop: 17 } } },
          { id: `lw-why-${i + 1}-t`, type: 'text', text: d, style: { color: 'muted', fontSize: { desktop: 15 } } },
        ],
      })),
    },
    ...x.ticker,
    {
      id: 'lw-areas',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: sec, gap: { desktop: 40 } },
      children: [
        {
          id: 'lw-areas-head',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 10 } },
          children: [
            { id: 'lw-areas-h', type: 'heading', level: 2, text: 'Practice areas', style: { fontSize: { desktop: 46, mobile: 32 } } },
            { id: 'lw-areas-t', type: 'text', text: `What ${x.name} handles for clients across ${x.place}.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
          ],
        },
        {
          id: 'lw-areas-grid',
          type: 'container',
          layout: 'grid',
          columns: { desktop: cols, tablet: 2, mobile: 1 },
          style: { gap: { desktop: 32, mobile: 36 } },
          children: shown.map((a, i): Container => {
            const p = x.photo()
            return {
              id: `lw-area-${i + 1}`,
              type: 'container',
              layout: 'flex',
              style: { gap: { desktop: 10 } },
              children: [
                img(`lw-area-${i + 1}-img`, p, cols === 2 ? 1.7 : 1.4, 12),
                { id: `lw-area-${i + 1}-h`, type: 'heading', level: 3, text: a, style: { fontSize: { desktop: 26, mobile: 24 }, margin: { desktop: { top: 8, right: 0, bottom: 0, left: 0 } } } },
                { id: `lw-area-${i + 1}-t`, type: 'text', text: x.summary(a, i), style: { color: 'muted' } },
                ...areaButton(`lw-area-${i + 1}-more`, x, a),
              ],
            }
          }),
        },
        ...allAreas(x, shown.length),
      ],
    },
    {
      id: 'lw-consult',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 2, mobile: 1 },
      align: 'center',
      boxed: true,
      style: { background: 'secondary', color: 'background', padding: sec, gap: { desktop: 72, mobile: 32 } },
      children: [
        {
          id: 'lw-consult-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 16 } },
          children: [
            { id: 'lw-consult-h', type: 'heading', level: 2, text: 'Tell us what happened', style: { color: 'background', fontSize: { desktop: 50, mobile: 34 } } },
            { id: 'lw-consult-t', type: 'text', text: `A few lines is plenty. ${x.name} will get back to you to explain where you stand, your options and what it would cost.`, style: { fontSize: { desktop: 19 }, maxWidth: 480 } },
            ...(contactLines(x) ? [{ id: 'lw-consult-d', type: 'text' as const, text: contactLines(x), style: { fontSize: { desktop: 17 }, fontWeight: 500 as const } }] : []),
          ],
        },
        {
          id: 'lw-consult-card',
          type: 'container',
          layout: 'flex',
          style: { background: 'background', color: 'text', borderRadius: 14, padding: { desktop: pad(36, 34), mobile: pad(26, 20) }, gap: { desktop: 12 } },
          children: form('lw-consult-form', x),
        },
      ],
    },
    ...attorneysSection(x),
    steps(x, false, 12),
    ...tail(x),
  ]
}
