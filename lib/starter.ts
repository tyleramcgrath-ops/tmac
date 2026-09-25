// Builds a complete starter website from a few facts about the business.
//
// This is the deterministic first draft: Home, Services and Contact pages
// with real photography, local SEO titles, LocalBusiness data and an FAQ.
// Each kind of business gets one of three designs, the same ones shown on
// saysites.com: "bold" for trades (a full-bleed photo header), "editorial" for
// salons, dentists and law firms (serif type, split photo), and "warm" for
// food and shops. Sofie then edits the result through the same validated
// content model.

import { dropRepeatedPhotos } from './photo-rules'
import { randomUUID } from 'crypto'
import type { Container, Element, GlobalStyles, Page, Site } from './schema'
import { photosFor, type Photo, type PhotoSet } from './photos'

export type Design = 'bold' | 'editorial' | 'warm'

export const BUSINESS_TYPES = {
  plumber: { label: 'Plumber', schemaType: 'Plumber', trade: 'plumbing', design: 'bold', headline: 'Fast, honest plumbing in {city}.' },
  electrician: { label: 'Electrician', schemaType: 'Electrician', trade: 'electrical work', design: 'bold', headline: 'Safe, tidy electrical work in {city}.' },
  hvac: { label: 'Heating & air', schemaType: 'HVACBusiness', trade: 'heating and air conditioning', design: 'bold', headline: 'Stay comfortable all year in {city}.' },
  roofer: { label: 'Roofer', schemaType: 'RoofingContractor', trade: 'roofing', design: 'bold', headline: 'A roof you never have to think about.' },
  landscaper: { label: 'Landscaping', schemaType: 'LandscapingBusiness', trade: 'landscaping', design: 'bold', headline: 'Yards the neighbors notice.' },
  cleaner: { label: 'Cleaning', schemaType: 'HousekeepingService', trade: 'cleaning', design: 'bold', headline: 'Come home to a clean house.' },
  autorepair: { label: 'Auto repair', schemaType: 'AutoRepair', trade: 'auto repair', design: 'bold', headline: 'Honest repairs. Straight answers.' },
  dentist: { label: 'Dentist', schemaType: 'Dentist', trade: 'dental care', design: 'editorial', headline: 'Gentle, modern dental care in {city}.' },
  salon: { label: 'Hair salon', schemaType: 'HairSalon', trade: 'hair care', design: 'editorial', headline: 'Hair that grows out beautifully.' },
  lawyer: { label: 'Law firm', schemaType: 'LegalService', trade: 'legal help', design: 'editorial', headline: 'Clear legal help when it matters.' },
  restaurant: { label: 'Restaurant', schemaType: 'Restaurant', trade: 'food', design: 'warm', headline: 'Good food, made with care, in {city}.' },
  bakery: { label: 'Bakery or café', schemaType: 'Bakery', trade: 'fresh baking', design: 'warm', headline: 'Baked fresh every morning in {city}.' },
  store: { label: 'Shop', schemaType: 'Store', trade: 'products', design: 'warm', headline: 'Things worth owning, from {city}.' },
  other: { label: 'Other', schemaType: 'LocalBusiness', trade: 'services', design: 'warm', headline: '{name}, right here in {city}.' },
} as const satisfies Record<string, { label: string; schemaType: string; trade: string; design: Design; headline: string }>
export type BusinessTypeKey = keyof typeof BUSINESS_TYPES

// Calm, grown-up palettes. The keys stay stable; the labels are what owners see.
export const PALETTES: Record<string, { label: string; colors: GlobalStyles['colors'] }> = {
  ocean: { label: 'Navy', colors: { primary: '#1a4f86', secondary: '#0f2438', accent: '#d9a441', text: '#14202e', muted: '#56657a', background: '#ffffff', surface: '#f2f5f8' } },
  forest: { label: 'Forest', colors: { primary: '#2f6b4f', secondary: '#173a2b', accent: '#c9a45c', text: '#18241e', muted: '#56645c', background: '#ffffff', surface: '#f1f4ef' } },
  sunset: { label: 'Terracotta', colors: { primary: '#a8431f', secondary: '#2b211a', accent: '#d9a441', text: '#2b211a', muted: '#6d5d50', background: '#fbf8f3', surface: '#f3ece2' } },
  plum: { label: 'Blush', colors: { primary: '#7a4b5b', secondary: '#231d1a', accent: '#e3b5a4', text: '#231d1a', muted: '#6c625c', background: '#faf7f5', surface: '#f1ebe7' } },
  slate: { label: 'Charcoal', colors: { primary: '#1f2937', secondary: '#0b0f14', accent: '#9aa6b2', text: '#111827', muted: '#4b5563', background: '#ffffff', surface: '#f3f4f6' } },
}

export const DESIGN_GLOBALS: Record<Design, Omit<GlobalStyles, 'colors'>> = {
  bold: { fonts: { heading: 'sans', body: 'sans' }, baseFontSize: 17, typeScale: 1.26, radius: 8, containerWidth: 1180, headingWeight: 800, headingTracking: -0.025, buttonShape: 'rounded' },
  editorial: { fonts: { heading: 'serif', body: 'sans' }, baseFontSize: 17, typeScale: 1.28, radius: 2, containerWidth: 1180, headingWeight: 400, headingTracking: -0.015, buttonShape: 'square', buttonCase: 'upper' },
  warm: { fonts: { heading: 'serif', body: 'sans' }, baseFontSize: 17, typeScale: 1.26, radius: 14, containerWidth: 1160, headingWeight: 500, headingTracking: -0.015, buttonShape: 'pill' },
}

export interface StarterInput {
  name: string
  type: BusinessTypeKey
  city: string
  region: string
  phone?: string
  email?: string
  services: string[]
  palette: keyof typeof PALETTES
  // Optional extras the dashboard or Sofie can fill in.
  street?: string
  postalCode?: string
  hours?: string[]
  tagline?: string
  // A Talk & Design template can pick the design instead of the business type.
  design?: Design
  // The site's language ("en" or "es"). The starter copy is English; Sofie
  // rewrites it for other languages.
  language?: string
  // Photos to use instead of the built-in set (lib/unsplash).
  photos?: PhotoSet
  // A headline to use instead of the generated one (e.g. the H1 of the
  // owner's previous site, which is what they already rank for).
  headline?: string
}

export interface StarterOptions {
  // Stock photos other customers' sites already use (lib/photo-rules).
  taken?: Set<string>
  // Fixed ids and time for reproducible sites (the showcase examples).
  siteId?: string
  now?: string
}

export function subdomainFor(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '')
  return s || 'my-site'
}

const pad = (y: number, x = 24) => ({ top: y, right: x, bottom: y, left: x })
const section = { desktop: pad(96), mobile: pad(56, 20) }

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function buildStarterSite(input: StarterInput, ownerOrgId: string, subdomain: string, nowOrOpts: string | StarterOptions = {}): { site: Site; pages: Page[] } {
  const opts: StarterOptions = typeof nowOrOpts === 'string' ? { now: nowOrOpts } : nowOrOpts
  const now = opts.now ?? new Date().toISOString()
  const t = BUSINESS_TYPES[input.type] ?? BUSINESS_TYPES.other
  const design: Design = input.design ?? t.design
  const photos = input.photos ?? photosFor(input.type)
  // Inner pages take fresh photos while there are any; repeats that remain
  // are dropped at the end (lib/photo-rules).
  const spare = [...(photos.extra ?? [])]
  const fresh = (fallback: Photo): Photo => spare.shift() ?? fallback
  const name = input.name.trim()
  const city = tidyPlace(input.city)
  const place = input.region.trim() ? `${city}, ${tidyRegion(input.region)}` : city
  const services = tidyServices(input.services)
  const list = services.length ? services : [cap(t.trade)]
  const siteId = opts.siteId ?? `site_${randomUUID()}`
  const pageId = (slug: string) => (opts.siteId ? `${opts.siteId}_${slug || 'home'}` : `page_${randomUUID()}`)
  const phone = input.phone?.trim() || undefined
  const email = input.email?.trim() || undefined
  const colors = PALETTES[input.palette]?.colors ?? PALETTES.ocean.colors
  // Law firms get what legal clients look for: practice areas, a
  // consultation request, and the notices bar rules expect.
  const law = input.type === 'lawyer'
  const svcHref = law ? '/practice-areas' : '/services'
  const svcLabel = law ? 'Practice Areas' : 'Services'

  const cta = law
    ? { label: 'Request a consultation', href: '/contact' }
    : phone
      ? { label: design === 'bold' ? `Call ${phone}` : 'Call us', href: telHref(phone) }
      : { label: design === 'editorial' ? 'Book a visit' : 'Get in touch', href: '/contact' }

  const site: Site = {
    id: siteId,
    orgId: ownerOrgId,
    subdomain,
    language: input.language === 'es' ? 'es' : 'en',
    business: {
      name,
      schemaType: t.schemaType,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(input.street && input.postalCode && input.region.trim() && city ? { address: { street: input.street, city, region: tidyRegion(input.region), postalCode: input.postalCode, country: 'US' } } : {}),
      ...(input.hours?.length ? { hours: input.hours } : {}),
      ...(city ? { area: place } : {}),
    },
    globals: { colors, ...DESIGN_GLOBALS[design] },
    nav: [
      { label: svcLabel, href: svcHref },
      { label: 'Contact', href: '/contact' },
    ],
    header: law
      ? { topbar: `Serving clients across ${place}`, cta: phone ? { label: `Call ${phone}`, href: telHref(phone) } : { label: cta.label, href: cta.href } }
      : {
          ...(design === 'bold' ? { topbar: `${cap(t.trade)} for homes and businesses across ${place}` } : {}),
          cta: phone && design === 'bold' ? { label: 'Call now', href: telHref(phone) } : { label: cta.label, href: cta.href },
        },
    ...(law
      ? { footerNote: 'Attorney advertising. The information on this website is for general information only and is not legal advice. Contacting us does not create an attorney-client relationship. Prior results do not guarantee a similar outcome.' }
      : {}),
    tagline: input.tagline?.trim() || `${cap(t.trade)} in ${place}. Friendly, local and easy to reach.`,
    updatedAt: now,
  }

  // Law firms lead with what they do and where, the way clients search:
  // "Estate planning and family law attorneys in Columbus."
  const headline = input.headline?.trim()
    ? input.headline.trim().slice(0, 160)
    : law && services.length
      ? `${cap(joinAnd(list.slice(0, 2).map(soften)))} attorneys in ${city}.`
      : t.headline.replace('{city}', city).replace('{name}', name)
  // With no services listed, talk about the trade itself ("roofing").
  const offer = services.length ? list.slice(0, 3).map(soften).join(', ') : t.trade
  const intro = {
    bold: `${name} helps people across ${place} with ${offer}. Straight answers, fair prices and work done right.`,
    editorial: law
      ? `${name} helps people across ${place} with ${offer}. We explain where you stand, your options and what it will cost, in plain English, before you decide anything.`
      : `${name} offers ${offer} in ${place}. Thoughtful, unhurried and always honest.`,
    warm: `${name} brings ${offer} to ${place}. Made by hand, with care, every day.`,
  }[design]
  // "Other" businesses could be anything, so their intro makes no claims.
  const introText = input.type === 'other' ? `${name} serves customers across ${place}${services.length ? ` with ${offer}` : ''}. Friendly, local and easy to reach.` : intro
  const more = law ? 'Practice areas' : { bold: 'See our services', editorial: 'View services', warm: 'See what we offer' }[design]
  // Three ways to say it per design, so neighbouring cards don't repeat.
  const cardText = (s: string, i = 0) =>
    ({
      bold: [
        `${s}, done properly by our team in ${city}. Ask us anything; we're happy to help.`,
        `Clear pricing before we start and a tidy job when we leave. ${cap(soften(s))} you can count on.`,
        `Local, licensed and quick to respond. Tell us what you need and we'll take it from there.`,
      ],
      editorial: law
        ? [
            `${s}: we’ll explain where you stand and the options open to you, in plain English.`,
            `Clear advice on ${soften(s)}, and a straight answer on cost before any work begins.`,
            `Careful, personal representation. You’ll always know what happens next and why.`,
          ]
        : [
        `${s}, with time to talk through exactly what you want.`,
        `Unhurried appointments and honest advice, so you always know your options.`,
        `Careful, personal and never rushed. We'll make sure it's right for you.`,
          ],
      warm: [
        `${s}, made fresh here in ${city}.`,
        `Made by hand in small batches, the way we'd want it ourselves.`,
        `A local favourite. Come by, say hello and see what's new today.`,
      ],
    })[design][i % 3]
  const eyebrow = design === 'bold' ? `${cap(t.trade)} · ${city}` : place

  const heroBlocks = (light: boolean): Element[] => [
    { id: 'hero-kicker', type: 'text', text: eyebrow, style: { fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.12, textTransform: 'uppercase', color: light ? '#dbe3ec' : 'primary' } },
    { id: 'hero-title', type: 'heading', level: 1, text: headline, style: { fontSize: { desktop: design === 'bold' ? 62 : 58, tablet: 48, mobile: 38 }, maxWidth: 720, margin: { desktop: { top: 6, right: 0, bottom: 4, left: 0 } }, ...(light ? { color: '#ffffff' as const } : {}) } },
    { id: 'hero-text', type: 'text', text: introText, style: { fontSize: { desktop: 19, mobile: 17 }, maxWidth: 560, color: light ? '#e2e8ef' : 'muted' } },
    {
      id: 'hero-actions',
      type: 'container',
      layout: 'flex',
      direction: { desktop: 'row' },
      style: { gap: { desktop: 12 }, margin: { desktop: { top: 14, right: 0, bottom: 0, left: 0 } } },
      children: [
        { id: 'hero-cta', type: 'button', label: cta.label, href: cta.href, variant: 'primary', ...(light ? { style: { background: '#ffffff', color: 'secondary' } } : {}) },
        law && phone
          ? { id: 'hero-services', type: 'button', label: 'Call now', href: telHref(phone), variant: 'outline' }
          : { id: 'hero-services', type: 'button', label: more, href: svcHref, variant: 'outline', ...(light ? { style: { color: '#ffffff' } } : {}) },
      ],
    },
  ]

  const card = (s: string, i: number, photo: Photo, aspect: number): Container => ({
    id: `svc-${i + 1}`,
    type: 'container',
    layout: 'flex',
    style: { gap: { desktop: 10 } },
    children: [
      { id: `svc-${i + 1}-img`, type: 'image', src: photo.src, alt: photo.alt, width: photo.width, height: photo.height, aspect, style: { borderRadius: design === 'editorial' ? 2 : 12, margin: { desktop: { top: 0, right: 0, bottom: 8, left: 0 } } } },
      { id: `svc-${i + 1}-h`, type: 'heading', level: 3, text: s, style: { fontSize: { desktop: design === 'bold' ? 22 : 26 } } },
      { id: `svc-${i + 1}-t`, type: 'text', text: cardText(s, i), style: { color: 'muted' } },
    ],
  })

  const servicesSection = (title: string, aspect: number): Container => ({
    id: 'services',
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    style: { padding: section, gap: { desktop: 40 } },
    children: [
      {
        id: 'services-head',
        type: 'container',
        layout: 'flex',
        style: { gap: { desktop: 10 } },
        children: [
          { id: 'services-h', type: 'heading', level: 2, text: title, style: { fontSize: { desktop: 42, mobile: 30 } } },
          { id: 'services-t', type: 'text', text: law ? `The areas of law ${name} handles. Not sure which applies to you? Ask, and we’ll tell you honestly.` : `Here's how ${name} can help. Not sure what you need? Just ask.`, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 560 } },
        ],
      },
      {
        id: 'services-grid',
        type: 'container',
        layout: 'grid',
        columns: { desktop: 3, tablet: 2, mobile: 1 },
        style: { gap: { desktop: 28 } },
        // Three cards, one per photo; the Services page lists everything.
        children: list.slice(0, 3).map((s, i) => card(s, i, photos.cards[i % 3], aspect)),
      },
      ...(list.length > 3
        ? [{ id: 'services-all', type: 'button' as const, label: law ? `All ${list.length} practice areas` : `All ${list.length} services`, href: svcHref, variant: 'outline' as const }]
        : []),
    ],
  })

  const faq: Container = {
    id: 'faq',
    type: 'container',
    tag: 'section',
    layout: 'grid',
    columns: { desktop: 2, mobile: 1 },
    boxed: true,
    style: { background: 'surface', padding: section, gap: { desktop: 48, mobile: 20 } },
    children: [
      { id: 'faq-h', type: 'heading', level: 2, text: law ? 'Questions clients ask' : 'Common questions', style: { fontSize: { desktop: 40, mobile: 30 } } },
      {
        id: 'faq-list',
        type: 'faq',
        items: law
          ? [
              { question: 'What happens at a consultation?', answer: `We listen to what happened, explain where you stand and the options open to you, and tell you what it would cost before you decide anything.` },
              { question: 'Is what I tell you confidential?', answer: `Yes, what you tell us in a consultation is kept confidential. Sending a message through this website doesn't create an attorney-client relationship, so please keep sensitive details for when we speak.` },
              { question: 'How do your fees work?', answer: `It depends on the matter. We explain our fees clearly at the start, in writing, before any work begins.` },
              { question: 'Which areas do you serve?', answer: `We help clients across ${place} and the surrounding area. Not sure if we can help? Just ask.` },
            ]
          : [
          { question: 'Which areas do you serve?', answer: `We work across ${place} and the surrounding area. Not sure if we cover you? Just ask.` },
          { question: 'How do I get a quote?', answer: phone ? `Call us on ${phone} or send a message from our contact page, and we'll get back to you quickly.` : `Send us a message from our contact page and we'll get back to you quickly.` },
          { question: 'How soon can you help?', answer: `Usually quickly. Get in touch and we'll tell you the first time that works for you.` },
            ],
      },
    ],
  }

  const ctaBand: Container = {
    id: 'cta',
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    align: 'center',
    style: { background: 'secondary', color: 'background', padding: { desktop: pad(88), mobile: pad(56, 20) }, gap: { desktop: 16 }, textAlign: { desktop: 'center' } },
    children: [
      { id: 'cta-h', type: 'heading', level: 2, text: law ? 'Talk to us about your situation' : 'Ready when you are', style: { fontSize: { desktop: 44, mobile: 32 }, color: 'background' } },
      { id: 'cta-t', type: 'text', text: law ? `Tell us what happened. ${name} will explain your options and the next step.` : `Tell us what you need and ${name} will take it from there.`, style: { fontSize: { desktop: 18 }, maxWidth: 520 } },
      { id: 'cta-btn', type: 'button', label: cta.label, href: cta.href, variant: 'primary', style: { background: 'background', color: 'secondary', margin: { desktop: { top: 10, right: 0, bottom: 0, left: 0 } } } },
    ],
  }

  let homeBody: Container[]
  if (design === 'bold') {
    homeBody = [
      {
        id: 'hero',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        backgroundImage: { src: photos.hero.src, width: photos.hero.width, height: photos.hero.height, overlay: 0.82, overlayStyle: 'side', priority: true },
        style: { background: 'secondary', padding: { desktop: pad(132), tablet: pad(104), mobile: pad(72, 20) }, gap: { desktop: 14 } },
        children: heroBlocks(true),
      },
      {
        id: 'strip',
        type: 'container',
        tag: 'section',
        layout: 'grid',
        columns: { desktop: 4, tablet: 2, mobile: 1 },
        boxed: true,
        style: { background: 'background', padding: { desktop: pad(8), mobile: pad(8, 20) }, gap: { desktop: 0 } },
        children: [
          ['Clear, upfront prices', 'You know the cost before we start.'],
          [`Local to ${city}`, 'A team from your own neighborhood.'],
          ['Easy to reach', phone ? `Call ${phone} any time.` : 'Message us and we reply fast.'],
          ['Work done right', 'Tidy, careful and properly finished.'],
        ].map(([h, d], i): Container => ({
          id: `strip-${i + 1}`,
          type: 'container',
          layout: 'flex',
          style: { padding: { desktop: pad(26, 24), mobile: pad(16, 0) }, gap: { desktop: 2 } },
          children: [
            { id: `strip-${i + 1}-h`, type: 'text', text: h, style: { fontWeight: 700, fontSize: { desktop: 17 } } },
            { id: `strip-${i + 1}-t`, type: 'text', text: d, style: { color: 'muted', fontSize: { desktop: 15 } } },
          ],
        })),
      },
      { ...servicesSection('What we do', 1.4), style: { background: 'surface', padding: section, gap: { desktop: 40 } } },
      aboutSplit(),
      faq,
      ctaBand,
    ]
  } else if (design === 'editorial') {
    homeBody = [
      {
        id: 'hero',
        type: 'container',
        tag: 'section',
        layout: 'grid',
        columns: { desktop: 2, mobile: 1 },
        align: 'center',
        style: { background: 'surface', gap: { desktop: 0 } },
        children: [
          { id: 'hero-img', type: 'image', src: photos.hero.src, alt: photos.hero.alt, width: photos.hero.width, height: photos.hero.height, aspect: 0.95, priority: true },
          {
            id: 'hero-copy',
            type: 'container',
            layout: 'flex',
            style: { padding: { desktop: pad(72, 64), mobile: pad(44, 20) }, gap: { desktop: 14 } },
            children: heroBlocks(false),
          },
        ],
      },
      {
        id: 'intro',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        align: 'center',
        style: { padding: { desktop: pad(104), mobile: pad(64, 20) }, textAlign: { desktop: 'center' }, gap: { desktop: 16 } },
        children: [
          { id: 'intro-h', type: 'heading', level: 2, text: law ? 'How working with us begins' : `Unhurried, personal and always honest. That's ${name}.`, style: { fontSize: { desktop: 40, mobile: 28 }, maxWidth: 820 } },
          { id: 'intro-t', type: 'text', text: law ? `No jargon and no pressure. Three simple steps, and you decide at every one.` : `We take the time to listen, explain your options and do the work with care. It's why people across ${city} keep coming back.`, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 620 } },
          ...(law
            ? [
                {
                  id: 'steps',
                  type: 'container' as const,
                  layout: 'grid' as const,
                  columns: { desktop: 3, mobile: 1 },
                  style: { gap: { desktop: 32, mobile: 24 }, margin: { desktop: { top: 32, right: 0, bottom: 0, left: 0 } }, textAlign: { desktop: 'left' as const } },
                  children: [
                    ['01', 'Tell us what happened', phone ? `Call ${phone} or send a message. We’ll get back to you promptly.` : 'Send us a message and we’ll get back to you promptly.'],
                    ['02', 'Understand your options', 'We explain where you stand, what could happen next and what it would cost.'],
                    ['03', 'Decide with a clear plan', 'If you want our help, we agree the next steps and fees in writing before any work begins.'],
                  ].map(([n, h, d]): Container => ({
                    id: `step-${n}`,
                    type: 'container',
                    layout: 'flex',
                    style: { gap: { desktop: 8 }, padding: { desktop: pad(28, 28), mobile: pad(22, 20) }, background: 'surface', borderRadius: 2 },
                    children: [
                      { id: `step-${n}-n`, type: 'text', text: n, style: { color: 'primary', fontWeight: 600, fontSize: { desktop: 14 }, letterSpacing: 0.12 } },
                      { id: `step-${n}-h`, type: 'heading', level: 3, text: h, style: { fontSize: { desktop: 24 } } },
                      { id: `step-${n}-t`, type: 'text', text: d, style: { color: 'muted' } },
                    ],
                  })),
                },
              ]
            : []),
        ],
      },
      { ...servicesSection(law ? 'Practice areas' : 'Services', 0.8), style: { padding: { desktop: { top: 0, right: 24, bottom: 104, left: 24 }, mobile: pad(40, 20) }, gap: { desktop: 40 } } },
      faq,
      ctaBand,
    ]
  } else {
    homeBody = [
      {
        id: 'hero',
        type: 'container',
        tag: 'section',
        layout: 'grid',
        columns: { desktop: 2, mobile: 1 },
        align: 'center',
        boxed: true,
        style: { background: 'surface', padding: { desktop: pad(80), mobile: pad(44, 20) }, gap: { desktop: 56, mobile: 28 } },
        children: [
          { id: 'hero-copy', type: 'container', layout: 'flex', style: { gap: { desktop: 14 } }, children: heroBlocks(false) },
          { id: 'hero-img', type: 'image', src: photos.hero.src, alt: photos.hero.alt, width: photos.hero.width, height: photos.hero.height, aspect: 1.1, priority: true, style: { borderRadius: 18 } },
        ],
      },
      servicesSection('What we make', 1.3),
      {
        id: 'about',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { background: 'secondary', color: 'background', padding: { desktop: pad(96), mobile: pad(56, 20) }, gap: { desktop: 16 } },
        children: [
          { id: 'about-h', type: 'heading', level: 2, text: `Made here in ${city}`, style: { fontSize: { desktop: 42, mobile: 30 }, color: 'background' } },
          { id: 'about-t', type: 'text', text: `${name} is a local business, and it shows. Everything is done by hand, by people who care about getting it right, for neighbors who notice the difference.`, style: { fontSize: { desktop: 19 }, maxWidth: 640 } },
        ],
      },
      faq,
      ctaBand,
    ]
  }

  function aboutSplit(): Container {
    const photo = fresh(photos.cards[0])
    return {
      id: 'about',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      columns: { desktop: 2, mobile: 1 },
      align: 'center',
      boxed: true,
      style: { padding: section, gap: { desktop: 64, mobile: 28 } },
      children: [
        { id: 'about-img', type: 'image', src: photo.src, alt: photo.alt, width: photo.width, height: photo.height, aspect: 1.2, style: { borderRadius: 12 } },
        {
          id: 'about-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 14 } },
          children: [
            { id: 'about-k', type: 'text', text: `Why ${city} calls ${name}`, style: { fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.12, textTransform: 'uppercase', color: 'primary' } },
            { id: 'about-h', type: 'heading', level: 2, text: 'The job done right, the first time', style: { fontSize: { desktop: 40, mobile: 30 } } },
            { id: 'about-t', type: 'text', text: `We show up when we say we will, explain what we find in plain English and give you a clear price before any work starts. Then we clean up after ourselves.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
            { id: 'about-btn', type: 'button', label: cta.label, href: cta.href, variant: 'primary', style: { margin: { desktop: { top: 8, right: 0, bottom: 0, left: 0 } } } },
          ],
        },
      ],
    }
  }

  const home: Page = {
    id: pageId(''),
    siteId,
    slug: '',
    name: 'Home',
    status: 'published',
    seo: {
      title: law && services.length ? clip(`${cap(soften(list[0]))} Attorneys in ${place} | ${name}`, 60) : clip(`${name} | ${cap(t.trade)} in ${place}`, 60),
      description: clip(`${name} provides ${t.trade} in ${place}${services.length ? `: ${list.slice(0, 3).map(soften).join(', ')}` : ''}. Friendly, local and easy to reach. Get in touch today.`, 160),
    },
    body: homeBody,
    updatedAt: now,
  }

  const banner = (id: string, title: string, text: string, bg = fresh(photos.hero)): Container => ({
    id,
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    backgroundImage: { src: bg.src, width: bg.width, height: bg.height, overlay: 0.66, overlayStyle: 'full', priority: true },
    style: { background: 'secondary', padding: { desktop: pad(88), mobile: pad(56, 20) }, gap: { desktop: 10 } },
    children: [
      { id: `${id}-h`, type: 'heading', level: 1, text: title, style: { color: '#ffffff', fontSize: { desktop: 52, mobile: 36 } } },
      { id: `${id}-t`, type: 'text', text, style: { color: '#e2e8ef', fontSize: { desktop: 19 }, maxWidth: 600 } },
    ],
  })

  const servicesPage: Page = {
    id: pageId('services'),
    siteId,
    slug: law ? 'practice-areas' : 'services',
    name: law ? 'Practice Areas' : 'Services',
    status: 'published',
    seo: {
      title: law ? clip(`Practice Areas | ${name}, ${place}`, 60) : clip(`${cap(t.trade)} services in ${place} | ${name}`, 60),
      description: law
        ? clip(`${list.join(', ')}: the areas of law ${name} handles for clients in ${place}. Clear advice and straight answers on cost.`, 160)
        : clip(`${list.join(', ')} from ${name}, serving ${place}. Clear pricing and friendly local service.`, 160),
    },
    body: [
      law ? banner('svc-banner', 'Practice areas', `The areas of law ${name} handles for clients across ${place}.`) : banner('svc-banner', 'Our services', `Here's what ${name} can help you with in ${place}.`),
      {
        id: 'svc',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 56 } },
        children: [
          ...list.map((s, i): Container => {
            const photo = fresh(photos.cards[i % 3])
            return {
              id: `item-${i + 1}`,
              type: 'container',
              layout: 'grid',
              columns: { desktop: 2, mobile: 1 },
              align: 'center',
              style: { gap: { desktop: 48, mobile: 16 } },
              children: [
                { id: `item-${i + 1}-img`, type: 'image', src: photo.src, alt: photo.alt, width: photo.width, height: photo.height, aspect: 1.5, style: { borderRadius: design === 'editorial' ? 2 : 12 } },
                {
                  id: `item-${i + 1}-copy`,
                  type: 'container',
                  layout: 'flex',
                  style: { gap: { desktop: 10 } },
                  children: [
                    { id: `item-${i + 1}-h`, type: 'heading', level: 2, text: s, style: { fontSize: { desktop: 34, mobile: 26 } } },
                    { id: `item-${i + 1}-t`, type: 'text', text: law ? `${s}: we’ll listen, explain where you stand and your options, and give you a straight answer on cost before any work begins.` : design === 'bold' ? `${s}: we'll explain your options, give you a clear price and do the job properly.` : `${s}: tell us what you have in mind and we'll take it from there.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
                  ],
                },
              ],
            }
          }),
          { id: 'svc-cta', type: 'button', label: cta.label, href: cta.href, variant: 'primary' },
        ],
      },
    ],
    updatedAt: now,
  }

  const contactLines = [phone ? `Phone: ${phone}` : '', email ? `Email: ${email}` : '', `Serving ${place} and nearby.`].filter(Boolean)
  const contact: Page = {
    id: pageId('contact'),
    siteId,
    slug: 'contact',
    name: 'Contact',
    status: 'published',
    seo: {
      title: law ? clip(`Contact ${name} | Attorneys in ${city}`, 60) : clip(`Contact ${name} | ${cap(t.trade)} in ${city}`, 60),
      description: clip(`Get in touch with ${name} for ${t.trade} in ${place}. Send a message, call or email and we'll get back to you quickly.`, 160),
    },
    body: [
      {
        id: 'contact',
        type: 'container',
        tag: 'section',
        layout: 'grid',
        columns: { desktop: 2, mobile: 1 },
        align: 'start',
        boxed: true,
        style: { padding: section, gap: { desktop: 64, mobile: 28 } },
        children: [
          {
            id: 'contact-copy',
            type: 'container',
            layout: 'flex',
            style: { gap: { desktop: 16 } },
            children: [
              { id: 'contact-h', type: 'heading', level: 1, text: `Contact ${name}`, style: { fontSize: { desktop: 52, mobile: 36 } } },
              { id: 'contact-t', type: 'text', text: contactLines.join('\n\n'), style: { fontSize: { desktop: 19 } } },
              ...(law
                ? [{ id: 'contact-note', type: 'text' as const, text: 'Sending a message doesn’t create an attorney-client relationship. Please don’t include confidential details until we’ve spoken.', style: { color: 'muted' as const, fontSize: { desktop: 15 } } }]
                : []),
              {
                id: 'contact-form',
                type: 'form',
                fields: ['name', 'email', 'phone', 'message'],
                submitLabel: law ? 'Request a consultation' : design === 'editorial' ? 'Send request' : 'Send message',
                thanks: law ? `Thank you. ${name} has your message and will be in touch soon.` : `Thanks! ${name} has your message and will get back to you soon.`,
                style: { margin: { desktop: { top: 12, right: 0, bottom: 0, left: 0 } } },
              },
            ],
          },
          { id: 'contact-img', type: 'image', ...pick(fresh(photos.hero)), aspect: 1.2, priority: true, style: { borderRadius: design === 'editorial' ? 2 : 14 } },
        ],
      },
    ],
    updatedAt: now,
  }

  return { site, pages: dropRepeatedPhotos([home, servicesPage, contact], opts.taken) }
}

// Lower-case a service name for use mid-sentence ("Teeth whitening" →
// "teeth whitening") but leave brand names and acronyms alone ("Invisalign",
// "HVAC repair").
export function soften(s: string): string {
  const [first, ...rest] = s.split(' ')
  return rest.length && /^[A-Z][a-z]+$/.test(first) ? first.toLowerCase() + (rest.length ? ' ' + rest.join(' ') : '') : s
}

function joinAnd(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

// What owners type in a hurry: "jupiter" becomes "Jupiter", "fl" becomes "FL".
export function tidyPlace(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t === t.toLowerCase() ? t.replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()) : t
}
export function tidyRegion(s: string): string {
  const t = s.trim()
  return /^[a-z]{2}$/i.test(t) ? t.toUpperCase() : tidyPlace(t)
}

// Services that say nothing ("everything", "all of it") fall back to the
// trade, so a page never reads "everything, done properly".
const VAGUE = /^(everything|anything|all|all of it|all of the above|whatever|misc|miscellaneous|stuff|things|n\/?a|none|-+|\.+)$/i
export function tidyServices(list: string[]): string[] {
  return list
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => s && !VAGUE.test(s))
    .map((s) => (s === s.toLowerCase() ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .slice(0, 12)
}

const pick = (p: Photo) => ({ src: p.src, alt: p.alt, width: p.width, height: p.height })

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
