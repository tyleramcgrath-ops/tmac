// Content for the "Websites for <trade>" landing pages on saysites.com.
// Every page is written for one kind of business: what its customers search
// for, what its website has to do, and what SaySites builds for it.

import type { BusinessTypeKey } from '../starter'

export interface Industry {
  // URL slug: /websites-for/<slug>
  slug: string
  // The starter type and showcase example it maps to.
  type: BusinessTypeKey
  example: string
  // Plural noun used in copy, e.g. "plumbers", "law firms".
  plural: string
  // <title> (under 60 chars) and meta description (under 160).
  title: string
  description: string
  // Hero
  kicker: string
  h1: string
  lede: string
  // What people in this trade struggle with online (3-4 short items).
  problems: { title: string; body: string }[]
  // The pages SaySites builds for them, with a line on why each matters.
  pages: { name: string; why: string }[]
  // Search specifics: the searches their customers make and how the site is set up to rank.
  searches: string[]
  seo: { title: string; body: string }[]
  // Things Sofie can do for this trade, as plain requests.
  sofie: string[]
  // Real questions, honest answers (rendered as FAQPage structured data).
  faq: { q: string; a: string }[]
}
