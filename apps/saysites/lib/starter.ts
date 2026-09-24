// Builds a complete starter website from a few facts about the business.
//
// This is the deterministic first draft: Home, Services and Contact pages
// with real structure, local SEO titles, LocalBusiness data and an FAQ. In
// Phase 4 Sofie writes the copy and picks the design instead; the output is
// the same validated shape, so everything downstream stays the same.

import { randomUUID } from 'crypto'
import type { Container, GlobalStyles, Page, Site } from './schema'

export const BUSINESS_TYPES = {
  plumber: { label: 'Plumber', schemaType: 'Plumber', trade: 'plumbing' },
  electrician: { label: 'Electrician', schemaType: 'Electrician', trade: 'electrical work' },
  hvac: { label: 'Heating & air', schemaType: 'HVACBusiness', trade: 'heating and air conditioning' },
  roofer: { label: 'Roofer', schemaType: 'RoofingContractor', trade: 'roofing' },
  landscaper: { label: 'Landscaping', schemaType: 'LandscapingBusiness', trade: 'landscaping' },
  cleaner: { label: 'Cleaning', schemaType: 'HousekeepingService', trade: 'cleaning' },
  dentist: { label: 'Dentist', schemaType: 'Dentist', trade: 'dental care' },
  salon: { label: 'Hair salon', schemaType: 'HairSalon', trade: 'hair care' },
  restaurant: { label: 'Restaurant', schemaType: 'Restaurant', trade: 'food' },
  lawyer: { label: 'Law firm', schemaType: 'LegalService', trade: 'legal help' },
  autorepair: { label: 'Auto repair', schemaType: 'AutoRepair', trade: 'auto repair' },
  store: { label: 'Shop', schemaType: 'Store', trade: 'products' },
  other: { label: 'Other', schemaType: 'LocalBusiness', trade: 'services' },
} as const
export type BusinessTypeKey = keyof typeof BUSINESS_TYPES

export const PALETTES: Record<string, { label: string; colors: GlobalStyles['colors'] }> = {
  ocean: { label: 'Ocean', colors: { primary: '#0f5ea8', secondary: '#0b2e4f', accent: '#f5a524', text: '#1b2430', muted: '#5b6675', background: '#ffffff', surface: '#f2f5f9' } },
  forest: { label: 'Forest', colors: { primary: '#1f7a4d', secondary: '#12402a', accent: '#e0a526', text: '#1a2620', muted: '#56635b', background: '#ffffff', surface: '#f1f6f2' } },
  sunset: { label: 'Sunset', colors: { primary: '#c2410c', secondary: '#431407', accent: '#f59e0b', text: '#241a16', muted: '#6b5a52', background: '#ffffff', surface: '#fbf3ee' } },
  plum: { label: 'Plum', colors: { primary: '#6d28d9', secondary: '#2e1065', accent: '#f472b6', text: '#1f1a2b', muted: '#625a70', background: '#ffffff', surface: '#f5f2fb' } },
  slate: { label: 'Slate', colors: { primary: '#1e293b', secondary: '#0f172a', accent: '#0ea5e9', text: '#111827', muted: '#4b5563', background: '#ffffff', surface: '#f3f4f6' } },
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
const section = { desktop: pad(72), mobile: pad(44, 16) }

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function buildStarterSite(input: StarterInput, ownerOrgId: string, subdomain: string, now = new Date().toISOString()): { site: Site; pages: Page[] } {
  const t = BUSINESS_TYPES[input.type]
  const name = input.name.trim()
  const place = `${input.city.trim()}, ${input.region.trim()}`
  const services = input.services.map((s) => s.trim()).filter(Boolean).slice(0, 12)
  const list = services.length ? services : [`${cap(t.trade)}`]
  const siteId = `site_${randomUUID()}`
  const phone = input.phone?.trim() || undefined

  const site: Site = {
    id: siteId,
    orgId: ownerOrgId,
    subdomain,
    language: 'en',
    business: {
      name,
      schemaType: t.schemaType,
      ...(phone ? { phone } : {}),
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    },
    globals: {
      colors: PALETTES[input.palette]?.colors ?? PALETTES.ocean.colors,
      fonts: { heading: 'sans', body: 'sans' },
      baseFontSize: 17,
      typeScale: 1.25,
      radius: 10,
      containerWidth: 1140,
    },
    nav: [
      { label: 'Services', href: '/services' },
      { label: 'Contact', href: '/contact' },
      ...(phone ? [{ label: `Call ${phone}`, href: telHref(phone) }] : []),
    ],
    updatedAt: now,
  }

  const cta = phone
    ? { id: 'x', type: 'button' as const, label: 'Call now', href: telHref(phone), variant: 'primary' as const }
    : { id: 'x', type: 'button' as const, label: 'Contact us', href: '/contact', variant: 'primary' as const }

  const home: Page = {
    id: `page_${randomUUID()}`,
    siteId,
    slug: '',
    name: 'Home',
    status: 'published',
    seo: {
      title: clip(`${name} | ${cap(t.trade)} in ${place}`, 60),
      description: clip(`${name} provides ${t.trade} in ${place}: ${list.slice(0, 3).map(soften).join(', ')}. Friendly, local and easy to reach. Get in touch today.`, 160),
    },
    body: [
      {
        id: 'hero',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { background: 'surface', padding: { desktop: pad(88), mobile: pad(48, 16) }, gap: { desktop: 20 } },
        children: [
          { id: 'hero-title', type: 'heading', level: 1, text: `${cap(t.trade)} in ${input.city.trim()} you can count on`, style: { fontSize: { desktop: 52, mobile: 34 }, maxWidth: 820 } },
          { id: 'hero-text', type: 'text', text: `${name} helps people across ${place} with ${list.slice(0, 3).map(soften).join(', ')}. Straight answers, fair prices and work done right.`, style: { color: 'muted', fontSize: { desktop: 20, mobile: 18 }, maxWidth: 680 } },
          {
            id: 'hero-actions',
            type: 'container',
            layout: 'flex',
            direction: { desktop: 'row' },
            style: { gap: { desktop: 12 } },
            children: [{ ...cta, id: 'hero-cta' }, { id: 'hero-services', type: 'button', label: 'See our services', href: '/services', variant: 'outline' }],
          },
        ],
      },
      {
        id: 'services',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 32 } },
        children: [
          { id: 'services-h', type: 'heading', level: 2, text: 'What we do' },
          {
            id: 'services-grid',
            type: 'container',
            layout: 'grid',
            columns: { desktop: 3, tablet: 2, mobile: 1 },
            style: { gap: { desktop: 20 } },
            children: list.slice(0, 6).map((s, i): Container => ({
              id: `svc-${i + 1}`,
              type: 'container',
              layout: 'flex',
              style: { background: 'surface', borderRadius: 14, padding: { desktop: pad(24) }, gap: { desktop: 6 } },
              children: [
                { id: `svc-${i + 1}-h`, type: 'heading', level: 3, text: s },
                { id: `svc-${i + 1}-t`, type: 'text', text: `${s}, done properly by our team in ${input.city.trim()}. Get in touch with any questions.`, style: { color: 'muted' } },
              ],
            })),
          },
        ],
      },
      {
        id: 'faq',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { background: 'surface', padding: section, gap: { desktop: 16 } },
        children: [
          { id: 'faq-h', type: 'heading', level: 2, text: 'Common questions' },
          {
            id: 'faq-list',
            type: 'faq',
            items: [
              { question: `Which areas do you serve?`, answer: `We work across ${place} and the surrounding area. Not sure if we cover you? Just ask.` },
              { question: 'How do I get a quote?', answer: phone ? `Call us on ${phone} or send a message from our contact page, and we'll get back to you quickly.` : `Send us a message from our contact page and we'll get back to you quickly.` },
            ],
          },
        ],
      },
      {
        id: 'cta',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        align: 'center',
        style: { background: 'secondary', color: 'background', padding: section, gap: { desktop: 16 }, textAlign: { desktop: 'center' } },
        children: [
          { id: 'cta-h', type: 'heading', level: 2, text: 'Ready when you are' },
          { id: 'cta-t', type: 'text', text: `Tell us what you need and ${name} will take it from there.` },
          { ...cta, id: 'cta-btn', variant: 'secondary' as const, style: { background: 'accent', color: 'text' } },
        ],
      },
    ],
    updatedAt: now,
  }

  const servicesPage: Page = {
    id: `page_${randomUUID()}`,
    siteId,
    slug: 'services',
    name: 'Services',
    status: 'published',
    seo: {
      title: clip(`${cap(t.trade)} services in ${place} | ${name}`, 60),
      description: clip(`${list.join(', ')} from ${name}, serving ${place}. Clear pricing and friendly local service.`, 160),
    },
    body: [
      {
        id: 'svc',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 12 } },
        children: [
          { id: 'svc-h', type: 'heading', level: 1, text: 'Our services' },
          { id: 'svc-intro', type: 'text', text: `Here's what ${name} can help you with in ${place}.`, style: { color: 'muted', fontSize: { desktop: 19 } } },
          ...list.flatMap((s, i) => [
            { id: `item-${i + 1}-h`, type: 'heading' as const, level: 2, text: s, style: { margin: { desktop: { top: 24, right: 0, bottom: 0, left: 0 } } } },
            { id: `item-${i + 1}-t`, type: 'text' as const, text: `${s}: we'll explain your options, give you a clear price and do the job properly.` },
          ]),
          { ...cta, id: 'svc-cta', style: { margin: { desktop: { top: 24, right: 0, bottom: 0, left: 0 } } } },
        ],
      },
    ],
    updatedAt: now,
  }

  const contactLines = [phone ? `Phone: ${phone}` : '', input.email?.trim() ? `Email: ${input.email.trim()}` : '', `Serving ${place} and nearby.`].filter(Boolean)
  const contact: Page = {
    id: `page_${randomUUID()}`,
    siteId,
    slug: 'contact',
    name: 'Contact',
    status: 'published',
    seo: {
      title: clip(`Contact ${name} | ${cap(t.trade)} in ${input.city.trim()}`, 60),
      description: clip(`Get in touch with ${name} for ${t.trade} in ${place}. Call or email us and we'll get back to you quickly.`, 160),
    },
    body: [
      {
        id: 'contact',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 16 } },
        children: [
          { id: 'contact-h', type: 'heading', level: 1, text: `Contact ${name}` },
          { id: 'contact-t', type: 'text', text: contactLines.join('\n\n'), style: { fontSize: { desktop: 19 } } },
          { ...cta, id: 'contact-cta' },
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
