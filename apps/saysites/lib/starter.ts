// Builds a complete starter website from a few facts about the business.
//
// This is the deterministic first draft: Home, Services and Contact pages
// with real photography, local SEO titles, LocalBusiness data and an FAQ.
// Each kind of business gets one of three designs, the same ones shown on
// saysites.com: "bold" for trades (a full-bleed photo header), "editorial" for
// salons, dentists and law firms (serif type, split photo), and "warm" for
// food and shops. Sofie then edits the result through the same validated
// content model.

import { randomUUID } from 'crypto'
import type { Container, Element, GlobalStyles, Page, Site } from './schema'
import { photosFor, type Photo } from './photos'

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
}

export interface StarterOptions {
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
  const photos = photosFor(input.type)
  const name = input.name.trim()
  const city = input.city.trim()
  const place = `${city}, ${input.region.trim()}`
  const services = input.services.map((s) => s.trim()).filter(Boolean).slice(0, 12)
  const list = services.length ? services : [cap(t.trade)]
  const siteId = opts.siteId ?? `site_${randomUUID()}`
  const pageId = (slug: string) => (opts.siteId ? `${opts.siteId}_${slug || 'home'}` : `page_${randomUUID()}`)
  const phone = input.phone?.trim() || undefined
  const email = input.email?.trim() || undefined
  const colors = PALETTES[input.palette]?.colors ?? PALETTES.ocean.colors

  const cta = phone
    ? { label: design === 'bold' ? `Call ${phone}` : 'Call us', href: telHref(phone) }
    : { label: design === 'editorial' ? 'Book a visit' : 'Get in touch', href: '/contact' }

  const site: Site = {
    id: siteId,
    orgId: ownerOrgId,
    subdomain,
    language: 'en',
    business: {
      name,
      schemaType: t.schemaType,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(input.street && input.postalCode ? { address: { street: input.street, city, region: input.region.trim(), postalCode: input.postalCode, country: 'US' } } : {}),
      ...(input.hours?.length ? { hours: input.hours } : {}),
    },
    globals: { colors, ...DESIGN_GLOBALS[design] },
    nav: [
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact' },
    ],
    header: {
      ...(design === 'bold' ? { topbar: `${cap(t.trade)} for homes and businesses across ${place}` } : {}),
      cta: phone && design === 'bold' ? { label: 'Call now', href: telHref(phone) } : { label: cta.label, href: cta.href },
    },
    tagline: input.tagline?.trim() || `${cap(t.trade)} in ${place}. Friendly, local and easy to reach.`,
    updatedAt: now,
  }

  const headline = t.headline.replace('{city}', city).replace('{name}', name)
  const offer = list.slice(0, 3).map(soften).join(', ')
  const intro = {
    bold: `${name} helps people across ${place} with ${offer}. Straight answers, fair prices and work done right.`,
    editorial: `${name} offers ${offer} in ${place}. Thoughtful, unhurried and always honest.`,
    warm: `${name} brings ${offer} to ${place}. Made by hand, with care, every day.`,
  }[design]
  const more = { bold: 'See our services', editorial: 'View services', warm: 'See what we offer' }[design]
  const cardText = (s: string) =>
    ({
      bold: `${s}, done properly by our team in ${city}. Ask us anything; we're happy to help.`,
      editorial: `${s}, with time to talk through exactly what you want.`,
      warm: `${s}, made fresh here in ${city}.`,
    })[design]
  const eyebrow = design === 'bold' ? `${cap(t.trade)} · ${city}` : place

  const heroBlocks = (light: boolean): Element[] => [
    { id: 'hero-kicker', type: 'text', text: eyebrow, style: { fontSize: { desktop: 13 }, fontWeight: 600, letterSpacing: 0.12, textTransform: 'uppercase', color: light ? '#dbe3ec' : 'primary' } },
    { id: 'hero-title', type: 'heading', level: 1, text: headline, style: { fontSize: { desktop: design === 'bold' ? 62 : 58, tablet: 48, mobile: 38 }, maxWidth: 720, margin: { desktop: { top: 6, right: 0, bottom: 4, left: 0 } }, ...(light ? { color: '#ffffff' as const } : {}) } },
    { id: 'hero-text', type: 'text', text: intro, style: { fontSize: { desktop: 19, mobile: 17 }, maxWidth: 560, color: light ? '#e2e8ef' : 'muted' } },
    {
      id: 'hero-actions',
      type: 'container',
      layout: 'flex',
      direction: { desktop: 'row' },
      style: { gap: { desktop: 12 }, margin: { desktop: { top: 14, right: 0, bottom: 0, left: 0 } } },
      children: [
        { id: 'hero-cta', type: 'button', label: cta.label, href: cta.href, variant: 'primary', ...(light ? { style: { background: '#ffffff', color: 'secondary' } } : {}) },
        { id: 'hero-services', type: 'button', label: more, href: '/services', variant: 'outline', ...(light ? { style: { color: '#ffffff' } } : {}) },
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
      { id: `svc-${i + 1}-t`, type: 'text', text: cardText(s), style: { color: 'muted' } },
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
          { id: 'services-t', type: 'text', text: `Here's how ${name} can help. Not sure what you need? Just ask.`, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 560 } },
        ],
      },
      {
        id: 'services-grid',
        type: 'container',
        layout: 'grid',
        columns: { desktop: 3, tablet: 2, mobile: 1 },
        style: { gap: { desktop: 28 } },
        children: list.slice(0, 6).map((s, i) => card(s, i, photos.cards[i % 3], aspect)),
      },
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
      { id: 'faq-h', type: 'heading', level: 2, text: 'Common questions', style: { fontSize: { desktop: 40, mobile: 30 } } },
      {
        id: 'faq-list',
        type: 'faq',
        items: [
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
      { id: 'cta-h', type: 'heading', level: 2, text: 'Ready when you are', style: { fontSize: { desktop: 44, mobile: 32 }, color: 'background' } },
      { id: 'cta-t', type: 'text', text: `Tell us what you need and ${name} will take it from there.`, style: { fontSize: { desktop: 18 }, maxWidth: 520 } },
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
          { id: 'intro-h', type: 'heading', level: 2, text: `Unhurried, personal and always honest. That's ${name}.`, style: { fontSize: { desktop: 40, mobile: 28 }, maxWidth: 820 } },
          { id: 'intro-t', type: 'text', text: `We take the time to listen, explain your options and do the work with care. It's why people across ${city} keep coming back.`, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 620 } },
        ],
      },
      { ...servicesSection('Services', 0.8), style: { padding: { desktop: { top: 0, right: 24, bottom: 104, left: 24 }, mobile: pad(40, 20) }, gap: { desktop: 40 } } },
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
    const photo = photos.cards[0]
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
      title: clip(`${name} | ${cap(t.trade)} in ${place}`, 60),
      description: clip(`${name} provides ${t.trade} in ${place}: ${list.slice(0, 3).map(soften).join(', ')}. Friendly, local and easy to reach. Get in touch today.`, 160),
    },
    body: homeBody,
    updatedAt: now,
  }

  const banner = (id: string, title: string, text: string): Container => ({
    id,
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    backgroundImage: { src: photos.hero.src, width: photos.hero.width, height: photos.hero.height, overlay: 0.66, overlayStyle: 'full', priority: true },
    style: { background: 'secondary', padding: { desktop: pad(88), mobile: pad(56, 20) }, gap: { desktop: 10 } },
    children: [
      { id: `${id}-h`, type: 'heading', level: 1, text: title, style: { color: '#ffffff', fontSize: { desktop: 52, mobile: 36 } } },
      { id: `${id}-t`, type: 'text', text, style: { color: '#e2e8ef', fontSize: { desktop: 19 }, maxWidth: 600 } },
    ],
  })

  const servicesPage: Page = {
    id: pageId('services'),
    siteId,
    slug: 'services',
    name: 'Services',
    status: 'published',
    seo: {
      title: clip(`${cap(t.trade)} services in ${place} | ${name}`, 60),
      description: clip(`${list.join(', ')} from ${name}, serving ${place}. Clear pricing and friendly local service.`, 160),
    },
    body: [
      banner('svc-banner', 'Our services', `Here's what ${name} can help you with in ${place}.`),
      {
        id: 'svc',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 56 } },
        children: [
          ...list.map((s, i): Container => {
            const photo = photos.cards[i % 3]
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
                    { id: `item-${i + 1}-t`, type: 'text', text: design === 'bold' ? `${s}: we'll explain your options, give you a clear price and do the job properly.` : `${s}: tell us what you have in mind and we'll take it from there.`, style: { color: 'muted', fontSize: { desktop: 18 } } },
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
      title: clip(`Contact ${name} | ${cap(t.trade)} in ${city}`, 60),
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
              {
                id: 'contact-form',
                type: 'form',
                fields: ['name', 'email', 'phone', 'message'],
                submitLabel: design === 'editorial' ? 'Send request' : 'Send message',
                thanks: `Thanks! ${name} has your message and will get back to you soon.`,
                style: { margin: { desktop: { top: 12, right: 0, bottom: 0, left: 0 } } },
              },
            ],
          },
          { id: 'contact-img', type: 'image', src: photos.hero.src, alt: photos.hero.alt, width: photos.hero.width, height: photos.hero.height, aspect: 1.2, priority: true, style: { borderRadius: design === 'editorial' ? 2 : 14 } },
        ],
      },
    ],
    updatedAt: now,
  }

  return { site, pages: [home, servicesPage, contact] }
}

// Lower-case a service name for use mid-sentence ("Teeth whitening" →
// "teeth whitening") but leave brand names and acronyms alone ("Invisalign",
// "HVAC repair").
export function soften(s: string): string {
  const [first, ...rest] = s.split(' ')
  return rest.length && /^[A-Z][a-z]+$/.test(first) ? first.toLowerCase() + (rest.length ? ' ' + rest.join(' ') : '') : s
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
