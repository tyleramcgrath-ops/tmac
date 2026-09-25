// The Visibility Score: 0 to 100 for how findable a site is, built from what
// actually moves local search: technical health, local signals, content
// depth and freshness, trust, and traffic momentum. Everything it hasn't
// earned yet becomes a quest with its points and, where Sofie can do the
// work, a ready-made request for her.

import { walk, type Page, type Site } from './schema'

export type QuestArea = 'Foundations' | 'Local' | 'Content' | 'Trust' | 'Momentum'

export interface Quest {
  id: string
  area: QuestArea
  points: number
  title: string
  why: string
  href: string
  // A request Sofie can act on straight away.
  sofie?: string
  // The request needs the owner to add something (their reviews) before sending.
  sofieFill?: boolean
}

export interface VisibilityFacts {
  site: Site
  pages: Page[]
  seoErrors: number
  seoTips: number
  fast: boolean
  photos: number
  visits30: number
  visitsPrev30: number
  today: string
}

export interface Visibility {
  score: number
  // Points earned per area, out of what's available.
  areas: { area: QuestArea; earned: number; of: number }[]
  quests: Quest[]
  // Short title for the band the score is in.
  band: string
}

const BANDS: [number, string][] = [
  [90, 'Standout'],
  [75, 'Strong'],
  [55, 'Rising'],
  [35, 'Getting found'],
  [0, 'Just starting'],
]

function words(pages: Page[]): number {
  let n = 0
  for (const p of pages) {
    if (p.status !== 'published') continue
    for (const el of walk(p.body)) {
      const text =
        el.type === 'text' || el.type === 'heading'
          ? el.text
          : el.type === 'faq'
            ? el.items.map((i) => `${i.question} ${i.answer}`).join(' ')
            : ''
      n += text.split(/\s+/).filter(Boolean).length
    }
  }
  return n
}

function has(pages: Page[], type: string): boolean {
  return pages.some((p) => p.status === 'published' && [...walk(p.body)].some((el) => el.type === type))
}

export function visibility(f: VisibilityFacts): Visibility {
  const { site, pages } = f
  const b = site.business
  const base = `/dashboard/sites/${site.id}`
  const trade = b.schemaType === 'LocalBusiness' ? 'what you do' : b.schemaType.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  const town = b.address?.city || b.area?.split(',')[0].trim() || 'your town'
  const posts = pages.filter((p) => p.post && p.status === 'published')
  const lastPost = posts.map((p) => p.post!.date).sort().at(-1)
  const daysSincePost = lastPost ? Math.round((Date.parse(f.today) - Date.parse(lastPost)) / 86_400_000) : Infinity
  const servicePages = pages.filter((p) => p.status === 'published' && !p.post && !['', 'contact', 'blog', 'shop', 'about'].includes(p.slug)).length
  const wordCount = words(pages)

  const all: (Quest & { done: boolean })[] = [
    // Foundations: can Google read it, and trust it technically?
    { id: 'seo-errors', area: 'Foundations', points: 10, done: f.seoErrors === 0, title: 'Fix the SEO problems on your pages', why: 'Pages with missing titles or headings are hard for Google to rank.', href: `${base}/pages` },
    { id: 'seo-tips', area: 'Foundations', points: 5, done: f.seoTips === 0, title: 'Clear every SEO tip', why: 'Small fixes like title length add up across every page.', href: `${base}/pages` },
    { id: 'speed', area: 'Foundations', points: 5, done: f.fast, title: 'Get every page back under the speed budget', why: 'Google ranks fast pages higher, especially on phones.', href: `${base}/pages` },
    { id: 'gsc', area: 'Foundations', points: 5, done: !!site.verification?.google, title: 'Connect Google Search Console', why: 'See the searches you show up for, and tell Google about new pages sooner.', href: `${base}/pages` },
    { id: 'domain', area: 'Foundations', points: 5, done: !!site.customDomain, title: 'Put your site on your own domain', why: 'Your own name builds trust and keeps every ranking you earn.', href: `${base}/settings` },
    // Local: the signals that put you on the map.
    { id: 'address', area: 'Local', points: 7, done: !!b.address?.street, title: 'Add your street address', why: `Local searches like "${trade} near me" lean on a real address.`, href: `${base}/settings` },
    { id: 'phone', area: 'Local', points: 5, done: !!b.phone, title: 'Add your phone number', why: 'A phone number turns searchers into calls, and Google shows it in results.', href: `${base}/settings` },
    { id: 'hours', area: 'Local', points: 5, done: !!b.hours?.length, title: 'Add your opening hours', why: 'Google shows "Open now" to people deciding where to go.', href: `${base}/settings` },
    { id: 'form', area: 'Local', points: 5, done: has(pages, 'form'), title: 'Add a contact form', why: 'Visitors who won\'t call will still send a message.', href: `${base}/sofie`, sofie: 'Add a contact form to my contact page.' },
    { id: 'bing', area: 'Local', points: 3, done: !!site.verification?.bing, title: 'Connect Bing Webmaster Tools', why: 'Bing also powers other search engines and AI assistants.', href: `${base}/pages` },
    // Content: give Google something to rank.
    { id: 'services', area: 'Content', points: 8, done: servicePages >= 3, title: 'Give your main services their own pages', why: `A page per service ranks for searches like "${trade} ${town}" far better than one long list.`, href: `${base}/sofie`, sofie: `Give each of my main services its own page, written for people in ${town}.` },
    { id: 'depth', area: 'Content', points: 7, done: wordCount >= 1200, title: 'Say more about what you do', why: 'Sites with a few hundred useful words per page answer more searches.', href: `${base}/sofie`, sofie: `Add a helpful questions section to my home page answering what people in ${town} usually ask before hiring us.` },
    { id: 'post', area: 'Content', points: 5, done: posts.length > 0, title: 'Publish your first blog post', why: 'Posts answer the questions your customers search for.', href: `${base}/sofie`, sofie: `Write a blog post answering a question people in ${town} often ask about ${trade}.` },
    { id: 'fresh', area: 'Content', points: 5, done: daysSincePost <= 30, title: posts.length ? 'Post something new this month' : 'Keep posting monthly', why: 'Fresh posts show Google your business is active.', href: `${base}/sofie`, sofie: `Write a new blog post for this month, with a seasonal tip about ${trade} in ${town}.` },
    // Trust: what makes a visitor pick you.
    { id: 'logo', area: 'Trust', points: 3, done: !!b.logo, title: 'Add a logo', why: 'A real logo makes a site look established.', href: `${base}/photos` },
    { id: 'photos', area: 'Trust', points: 3, done: f.photos >= 3, title: 'Upload three photos of your own work', why: 'Real photos beat stock photos for trust and for image search.', href: `${base}/photos` },
    { id: 'review-link', area: 'Trust', points: 2, done: !!b.reviewUrl, title: 'Set up your review link', why: 'More reviews help you rank in local search and help people choose you. Get a QR card and messages ready to send.', href: `${base}/reviews` },
    { id: 'reviews', area: 'Trust', points: 2, done: has(pages, 'testimonials'), title: 'Show what customers say', why: 'Reviews on your site help people choose you.', href: `${base}/sofie`, sofie: 'Add a testimonials section to my home page. Here are some real reviews from customers: ', sofieFill: true },
    // Momentum: is it working?
    { id: 'traffic', area: 'Momentum', points: 5, done: f.visits30 > 0, title: 'Get your first visitors', why: 'Share your address on Google, Facebook and your van.', href: `${base}/visitors` },
    { id: 'growth', area: 'Momentum', points: 5, done: f.visits30 > 0 && f.visits30 > f.visitsPrev30, title: 'Grow visits over last month', why: 'Everything above feeds this one.', href: `${base}/visitors` },
  ]

  const score = all.reduce((n, q) => n + (q.done ? q.points : 0), 0)
  const areas = (['Foundations', 'Local', 'Content', 'Trust', 'Momentum'] as QuestArea[]).map((area) => ({
    area,
    earned: all.filter((q) => q.area === area && q.done).reduce((n, q) => n + q.points, 0),
    of: all.filter((q) => q.area === area).reduce((n, q) => n + q.points, 0),
  }))
  // Biggest wins first; things Sofie can do for you break ties.
  const quests = all
    .filter((q) => !q.done)
    .sort((a, b) => b.points - a.points || Number(!!b.sofie) - Number(!!a.sofie))
    .map(({ done: _done, ...q }) => q)
  return { score, areas, quests, band: BANDS.find(([min]) => score >= min)![1] }
}

// Where a quest's button goes: straight to Sofie with the request, or to the page.
export function questLink(q: Quest): string {
  if (!q.sofie) return q.href
  return `${q.href}?${q.sofieFill ? 'fill' : 'talk'}=${encodeURIComponent(q.sofie)}`
}
