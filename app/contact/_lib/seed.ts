import type { ScanInput } from './types'

// Case-study figures and client names as published on the Contact Studios
// site. Grouped so the results wall can lead with the strongest number.
export interface CaseStudy {
  client: string
  services: string[]
  headline: { value: string; label: string }
  support: { value: string; label: string }[]
  /** Weight in the results grid — one hero, the rest secondary. */
  size?: 'hero' | 'wide' | 'normal'
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    client: 'Delta Munchies',
    services: ['SEO', 'Content strategy', 'Content writing', 'Content management'],
    headline: { value: '$3.4M', label: 'Revenue generated' },
    support: [
      { value: '54,510', label: 'Transactions' },
      { value: '847,221', label: 'Users' },
    ],
    size: 'hero',
  },
  {
    client: 'Shopify',
    services: ['Video production', 'Video SEO', 'YouTube strategy'],
    headline: { value: '20.3M', label: 'Views' },
    support: [
      { value: '405,000', label: 'Subscribers generated' },
      { value: '149,000', label: 'Leads generated' },
    ],
    size: 'wide',
  },
  {
    client: 'Botany Farms',
    services: ['SEO', 'Content strategy', 'Content writing'],
    headline: { value: '$2.1M', label: 'Revenue generated' },
    support: [
      { value: '24,729', label: 'Transactions' },
      { value: '608,934', label: 'Users' },
    ],
  },
  {
    client: 'Causal',
    services: ['SEO', 'Content strategy', 'Content management'],
    headline: { value: '1.07M', label: 'Monthly visitors' },
    support: [
      { value: '$82,000', label: 'Monthly traffic value' },
      { value: '8,800', label: 'Top-3 positions' },
    ],
  },
  {
    client: 'FOCL',
    services: ['SEO', 'Content strategy', 'Content writing'],
    headline: { value: '$1.8M', label: 'Revenue generated' },
    support: [
      { value: '23,102', label: 'Transactions' },
      { value: '602,992', label: 'Users' },
    ],
  },
  {
    client: 'HØJ',
    services: ['SEO', 'Content strategy', 'Content management'],
    headline: { value: '1.3M', label: 'Users from search' },
    support: [
      { value: '800+', label: '#1 rankings' },
      { value: '550,000', label: 'Monthly page views' },
    ],
  },
  {
    client: 'Herb',
    services: ['SEO', 'Affiliate marketing'],
    headline: { value: '$40K', label: 'Monthly affiliate revenue' },
    support: [
      { value: '8,500', label: 'Top-10 rankings' },
      { value: '670', label: '#1 rankings' },
    ],
  },
  {
    client: 'TubeBuddy',
    services: ['Video production', 'Video SEO', 'YouTube strategy'],
    headline: { value: '3.6M', label: 'Views' },
    support: [
      { value: '57%', label: 'YoY subscriber growth' },
      { value: '160', label: 'Short videos produced' },
    ],
  },
]

export const CLIENT_LOGOS = [
  'Shopify',
  'Delta Munchies',
  'Botany Farms',
  'FOCL',
  'HØJ',
  'Herb',
  'Causal',
  'TubeBuddy',
  'Dragon Hemp',
  'Alexsei',
  'Landish',
  'Broya',
]

export interface Service {
  name: string
  body: string
}

export const SERVICES: Service[] = [
  {
    name: 'Search market analysis',
    body: 'We size the real opportunity — in Google and in the models — before you spend a pound against it.',
  },
  {
    name: '"New" search strategy',
    body: 'One strategy that captures your search market wherever the searching actually happens.',
  },
  {
    name: 'Technical SEO',
    body: 'A site that crawls cleanly for search engines and parses cleanly for language models.',
  },
  {
    name: 'Content writing',
    body: 'Research-led writing, edited and published — built for the reader and the algorithm at once.',
  },
  {
    name: 'Image creation',
    body: 'Original visuals that look like your brand and are optimised to be found.',
  },
  {
    name: 'LLM SEO',
    body: 'The work that gets you named inside ChatGPT, AI Overviews and the rest of the new front page.',
  },
]

export interface ProcessStep {
  title: string
  body: string
}

export const PROCESS: ProcessStep[] = [
  {
    title: 'Real-time, tactical strategy',
    body: 'Talk to your strategist in a shared channel, not a monthly call. Keyword lists, outlines and technical fixes as they happen.',
  },
  {
    title: 'All your content, one dashboard',
    body: 'See what is being written, what is live and what is next — in a library that stays searchable.',
  },
  {
    title: 'End-to-end production',
    body: 'We research, write and edit the posts that rank, and turn readers into leads.',
  },
  {
    title: 'Optimised and published',
    body: 'Custom imagery, meta written, then published straight to your blog on schedule.',
  },
]

export interface Testimonial {
  quote: string
  name: string
  role: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Contact helped us scale our SEO content from the ground up. Now search is our biggest ROI marketing channel by far — $3 million generated and growing.',
    name: 'Dylan Glines',
    role: 'CEO, Botany Farms',
  },
  {
    quote:
      'Thanks to their SEO content strategy, our shop went from 30k visitors per month to 150k. We got to sit back and watch content go live and generate traffic like crazy.',
    name: 'Simon Folmann',
    role: 'CEO, HØJ',
  },
  {
    quote: 'Our traffic has already doubled. The ROI on their content is off the charts.',
    name: 'Shaun Nguyen',
    role: 'PR Director, Delta Munchies',
  },
  {
    quote:
      'Contact is easily within the top 1% of SEO and content marketing talent out there.',
    name: 'Mark Doble',
    role: 'CEO, Alexsei',
  },
]

/** Prefilled so the scanner is never a blank page. */
export const EXAMPLE_SCANS: (ScanInput & { label: string })[] = [
  {
    label: 'DTC wellness',
    brand: 'Botany Farms',
    domain: 'botanyfarms.com',
    category: 'hemp-derived CBD and THC gummies, flower and pre-rolls sold direct to consumer',
    competitors: ['Delta Munchies', 'FOCL', 'Charlotte’s Web'],
    market: 'United States',
  },
  {
    label: 'B2B SaaS',
    brand: 'Causal',
    domain: 'causal.app',
    category: 'financial modelling and planning software for startup finance teams',
    competitors: ['Pigment', 'Mosaic', 'Runway'],
    market: 'United States',
  },
  {
    label: 'Creator tooling',
    brand: 'TubeBuddy',
    domain: 'tubebuddy.com',
    category: 'YouTube channel management, keyword research and thumbnail testing tools',
    competitors: ['VidIQ', 'Morningfame'],
    market: 'Global',
  },
]

export const EMPTY_SCAN: ScanInput = {
  brand: '',
  domain: '',
  category: '',
  competitors: [],
  market: 'United States',
}
