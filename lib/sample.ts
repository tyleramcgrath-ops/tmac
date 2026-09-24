// A realistic sample site — a local plumber — used by the tests and the demo
// renderer. It is the shape of what Sofie will generate from a Business
// Profile in Phase 4.

import type { Page, Site } from './schema'

const NOW = '2026-09-24T00:00:00.000Z'

export const sampleSite: Site = {
  id: 'site_sample',
  orgId: 'org_sample',
  subdomain: 'rivertown-plumbing',
  language: 'en',
  business: {
    name: 'Rivertown Plumbing',
    schemaType: 'Plumber',
    phone: '(555) 201-4480',
    email: 'hello@rivertownplumbing.com',
    address: { street: '118 Mill Street', city: 'Rivertown', region: 'OH', postalCode: '44101', country: 'US' },
    hours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
    priceRange: '$$',
  },
  globals: {
    colors: {
      primary: '#0f5ea8',
      secondary: '#0b2e4f',
      accent: '#f5a524',
      text: '#1b2430',
      muted: '#5b6675',
      background: '#ffffff',
      surface: '#f2f5f9',
    },
    fonts: { heading: 'sans', body: 'sans' },
    baseFontSize: 17,
    typeScale: 1.25,
    radius: 10,
    containerWidth: 1140,
  },
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'Call (555) 201-4480', href: 'tel:+15552014480' },
  ],
  updatedAt: NOW,
}

const pad = (y: number, x = 24) => ({ top: y, right: x, bottom: y, left: x })

export const sampleHome: Page = {
  id: 'page_home',
  siteId: 'site_sample',
  slug: '',
  name: 'Home',
  status: 'published',
  seo: {
    title: 'Rivertown Plumbing | 24/7 Plumber in Rivertown, OH',
    description:
      'Licensed Rivertown plumbers for leaks, drains, water heaters and emergencies. Upfront pricing, same-day service, and a 1-year guarantee on every job.',
  },
  body: [
    {
      id: 'hero',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      direction: { desktop: 'row', mobile: 'column' },
      align: 'center',
      style: { background: 'surface', padding: { desktop: pad(72), mobile: pad(40, 16) }, gap: { desktop: 48, mobile: 24 } },
      children: [
        {
          id: 'hero-copy',
          type: 'container',
          layout: 'flex',
          style: { gap: { desktop: 16 } },
          children: [
            { id: 'hero-title', type: 'heading', level: 1, text: 'Fast, honest plumbing in Rivertown', style: { fontSize: { desktop: 48, mobile: 34 } } },
            {
              id: 'hero-text',
              type: 'text',
              text: 'Leaks, clogs, water heaters and emergencies — fixed right the first time, with the price agreed before we start.',
              style: { color: 'muted', fontSize: { desktop: 20, mobile: 18 } },
            },
            {
              id: 'hero-actions',
              type: 'container',
              layout: 'flex',
              direction: { desktop: 'row' },
              style: { gap: { desktop: 12 } },
              children: [
                { id: 'hero-call', type: 'button', label: 'Call now', href: 'tel:+15552014480', variant: 'primary' },
                { id: 'hero-services', type: 'button', label: 'Our services', href: '/services', variant: 'outline' },
              ],
            },
          ],
        },
        { id: 'hero-img', type: 'image', src: '/media/van.jpg', alt: 'Rivertown Plumbing van outside a customer home', width: 1200, height: 800, priority: true, style: { borderRadius: 16 } },
      ],
    },
    {
      id: 'why',
      type: 'container',
      tag: 'section',
      layout: 'grid',
      boxed: true,
      columns: { desktop: 3, tablet: 2, mobile: 1 },
      style: { padding: { desktop: pad(64), mobile: pad(40, 16) }, gap: { desktop: 32 } },
      children: [
        { id: 'why-1', type: 'container', layout: 'flex', children: [
          { id: 'why-1-h', type: 'heading', level: 2, text: 'Upfront pricing' },
          { id: 'why-1-t', type: 'text', text: 'You approve the price before any work begins. No surprises on the invoice.' },
        ] },
        { id: 'why-2', type: 'container', layout: 'flex', children: [
          { id: 'why-2-h', type: 'heading', level: 2, text: 'Same-day service' },
          { id: 'why-2-t', type: 'text', text: 'Call before noon and a licensed plumber is at your door the same day.' },
        ] },
        { id: 'why-3', type: 'container', layout: 'flex', children: [
          { id: 'why-3-h', type: 'heading', level: 2, text: '1-year guarantee' },
          { id: 'why-3-t', type: 'text', text: 'If our repair fails within a year, we come back and fix it free.' },
        ] },
      ],
    },
    {
      id: 'faq',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { background: 'surface', padding: { desktop: pad(64), mobile: pad(40, 16) }, gap: { desktop: 16 } },
      children: [
        { id: 'faq-h', type: 'heading', level: 2, text: 'Common questions' },
        {
          id: 'faq-list',
          type: 'faq',
          items: [
            { question: 'Do you handle emergencies?', answer: 'Yes. We answer the phone 24/7 for burst pipes, flooding and no-heat water heaters.' },
            { question: 'Are you licensed and insured?', answer: 'Every plumber on our team is state-licensed, and we carry full liability insurance.' },
          ],
        },
      ],
    },
  ],
  updatedAt: NOW,
}

export const sampleServices: Page = {
  id: 'page_services',
  siteId: 'site_sample',
  slug: 'services',
  name: 'Services',
  status: 'published',
  seo: {
    title: 'Plumbing Services in Rivertown, OH | Rivertown Plumbing',
    description: 'Drain cleaning, leak repair, water heater installation and emergency plumbing across Rivertown and nearby towns. Licensed, insured, guaranteed.',
  },
  body: [
    {
      id: 'svc',
      type: 'container',
      tag: 'section',
      layout: 'flex',
      boxed: true,
      style: { padding: { desktop: pad(64), mobile: pad(40, 16) }, gap: { desktop: 16 } },
      children: [
        { id: 'svc-h', type: 'heading', level: 1, text: 'Plumbing services' },
        { id: 'svc-t', type: 'text', text: 'Drain cleaning and repair.\n\nLeak detection and pipe repair.\n\nWater heater repair and installation.' },
        { id: 'svc-cta', type: 'button', label: 'Back to home', href: '/', variant: 'secondary' },
      ],
    },
  ],
  updatedAt: NOW,
}

export const samplePages: Page[] = [sampleHome, sampleServices]
