// saysites.com's own blog: guides and news on getting found in Google and
// in AI answers. Articles come from two places: the launch set below (in
// code) and anything written at /dashboard/blog (table ss_articles). An
// article saved in the dashboard replaces a launch article with the same
// address, so every article can be edited without a deploy.
//
// The writing rules are the product's rules: no invented numbers, studies or
// quotes; link to the source for every outside fact (Google's own
// documentation where possible); never promise rankings or leads; never
// name or make claims about a competitor.
//
// Bodies are a small, safe subset of Markdown (renderBody): ## and ###
// headings, paragraphs, - lists, 1. lists, > quotes, **bold** and
// [links](https://…). Everything else is shown as plain text.

import type { Store } from './store'

export type ArticleKind = 'guide' | 'news'

export interface Article {
  slug: string
  title: string
  description: string
  kind: ArticleKind
  // Three or so short takeaways, shown first: the answer before the detail.
  summary: string[]
  body: string
  published: string // YYYY-MM-DD
  updated?: string // YYYY-MM-DD
  status: 'draft' | 'published'
}

export const KIND_LABEL: Record<ArticleKind, string> = { guide: 'Guide', news: 'News' }
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const DAY = /^\d{4}-\d{2}-\d{2}$/

const GOOGLE_AI = 'https://developers.google.com/search/docs/appearance/ai-features'
const GOOGLE_HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
const GOOGLE_LOCAL_SD = 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const GOOGLE_INTRO_SD = 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data'
const GBP_RANKING = 'https://support.google.com/business/answer/7091'

export const LAUNCH_ARTICLES: Article[] = [
  {
    slug: 'how-ai-search-chooses-who-to-recommend',
    title: 'How AI search decides which businesses to mention',
    description: 'What Google’s AI Overviews and AI assistants look for when they answer “who should I call?”, and what a law firm, practice or local business can do about it.',
    kind: 'guide',
    summary: [
      'AI answers are built from pages the search engine has already found and indexed, so the basics of being found still come first.',
      'Pages that answer a specific question clearly, near the top, are easier to quote than pages that circle around it.',
      'Consistent business details, real specifics and genuine reviews give an AI answer something solid to repeat.',
    ],
    body: `When someone asks Google, or an AI assistant, “who’s a good estate planning lawyer near me?”, the answer is no longer only a list of ten links. More and more often it’s a written answer at the top, with a few sources cited underneath. Being one of those sources is the new version of being on page one.

Nobody outside these companies knows exactly how each system picks its sources, and anyone who claims to is guessing. But the companies say a fair amount publicly, and what they say is consistent.

## AI answers start from the same index as search

Google says its AI features, such as AI Overviews, draw on the same systems and the same index as regular search, and that there are no special requirements to appear in them beyond being indexed and eligible to show a snippet. You can read this in Google’s own [guide to AI features and your website](${GOOGLE_AI}).

That matters, because it means the unglamorous basics still decide whether you’re even in the running:

- Your pages can be crawled and indexed (nothing blocks them, they load quickly, they work on phones).
- Each important topic has its own page, with a clear title and heading.
- Your business name, address and phone number are the same everywhere they appear.

## Clear answers are easier to quote

An AI answer is a summary. It’s much easier to summarise a page that answers the question directly than one that buries the answer under three paragraphs of introduction.

For a service page, that usually means:

- A heading that matches the question people ask, such as “How much does a will cost?” or “Do I need a lawyer after a minor car accident?”
- A plain, direct answer in the first sentence or two under it.
- Then the detail: what it depends on, what happens next, what to bring.

## Specifics beat adjectives

“Experienced, caring, trusted” appears on almost every website, so it tells an answer engine nothing. Specific, checkable details do: the areas of law you practise, the towns you serve, your hours, the languages you speak, the insurance you accept, the year you opened. Only ever publish details that are true. Never invent results, reviews or credentials.

## Your reputation lives off your website too

For local businesses, Google says prominence is one of the factors in local results, and that reviews and how well-known a business is across the web feed into it ([Google Business Profile help](${GBP_RANKING})). Keep your Google Business Profile complete and accurate, and ask happy clients for honest reviews.

## What this means in practice

1. Make sure every service you want to be found for has its own page.
2. Rewrite the top of each page so it answers the question first.
3. Add the plain facts people and AI both look for.
4. Keep your business details identical everywhere.
5. Check which sites AI answers cite for your most important searches, and compare their pages with yours.

The last step is the one most firms skip. It’s exactly what the [Citation Gap scan](/#citation-gap) in every SaySites dashboard does.`,
    published: '2026-10-03',
    status: 'published',
  },
  {
    slug: 'google-ai-overviews-for-law-firms',
    title: 'Google AI Overviews: what law firms should know',
    description: 'A plain-English guide to Google’s AI Overviews for law firms: what they are, where the sources come from, and what to change on your website.',
    kind: 'guide',
    summary: [
      'AI Overviews are written summaries Google shows above some search results, with links to the pages they drew on.',
      'Google says there’s nothing special to do to appear in them beyond being indexed and eligible for a snippet.',
      'Practice-area pages that answer real client questions plainly are the best preparation.',
    ],
    body: `For many legal questions, Google now shows a written summary above the usual results, called an AI Overview, with links to a handful of sources. If a prospective client searches “what happens at a first DUI hearing?”, the first thing they read may be that summary, not your website.

## Where the sources come from

Google’s [guide to AI features](${GOOGLE_AI}) says AI Overviews are built from its regular search index, and that a page needs to be indexed and eligible to show a snippet to be included. There is no separate submission, tag or file that gets a page in. Be wary of anyone selling a shortcut.

## What makes a practice-area page quotable

Think about how a client actually asks. They rarely search for “personal injury legal services”. They ask questions:

- “How long do I have to file a car accident claim in Ohio?”
- “Do I need a lawyer for a slip and fall?”
- “How much does a personal injury lawyer cost?”

A page that answers questions like these, under headings that match them, gives Google something precise to summarise. Keep each answer accurate and specific to your state, and say when the answer depends on the facts of the case.

## Things to avoid

- **Thin pages for every town.** Google’s spam policies warn against near-identical pages made only to rank. One strong page per practice area beats twenty copies.
- **Promising outcomes.** Besides your bar’s advertising rules, vague guarantees give an answer engine nothing it can use.
- **Hiding the answer.** If the useful part only appears after a long introduction, or inside a pop-up, it’s harder to find and quote.

## Keep the human reader first

Google’s advice on [helpful, people-first content](${GOOGLE_HELPFUL}) applies here too: write for the client who is worried and short on time, and the page will also read well to a machine.

## A short checklist

1. One page per practice area, each with a clear title and main heading.
2. The questions clients ask, as headings, with direct answers.
3. Your jurisdiction, offices and contact details on every page.
4. Attorney bios with real, checkable credentials.
5. A fast site that works well on phones.

Every SaySites law firm site is built this way from the start, and the dashboard shows which sources Google’s AI Overview cites for the searches that matter to you.`,
    published: '2026-10-03',
    status: 'published',
  },
  {
    slug: 'write-pages-ai-answers-can-quote',
    title: 'How to write pages AI answers can quote: a checklist',
    description: 'A practical checklist for service pages that answer engines can understand and quote: question headings, answer-first writing, specifics, and structure.',
    kind: 'guide',
    summary: [
      'Lead with the answer, then explain.',
      'Use the client’s own question as the heading.',
      'Prefer lists, short paragraphs and plain tables for facts that compare.',
    ],
    body: `AI answers are made by pulling the clearest, most relevant passages from pages that rank. You can’t control which passage gets chosen, but you can make sure your pages have good ones to choose from. Here’s the checklist we use on every SaySites site.

## 1. One topic per page

A page about “Services” that covers six things in a sentence each is hard to quote on any of them. Give each service its own page, with a title and main heading that say exactly what it is.

## 2. Use real questions as headings

Write down the questions clients ask on the phone. Turn the most common ones into headings on the page they belong to, worded the way people say them: “How long does a crown take?”, “Is a consultation free?”

## 3. Answer first

Under each question, answer it in the first sentence. Then add what it depends on, exceptions and next steps. If the honest answer is “it depends”, say what it depends on.

## 4. Be specific, and only say what’s true

Prices or price ranges you’re comfortable publishing, timeframes, the areas you serve, opening hours, what to bring. Never invent figures, reviews or results: a wrong fact repeated by an AI answer is worse than no fact.

## 5. Structure helps

- Short paragraphs, one idea each.
- Bulleted or numbered lists for steps and options.
- A simple table when you’re comparing (for example, treatment options and recovery times).

## 6. Mark up the facts

[Structured data](${GOOGLE_INTRO_SD}) tells search engines in a standard format what your business is, where it is and when it’s open. It doesn’t replace good writing, but it removes guesswork.

## 7. Check what’s being quoted

Search your most important questions and see which sites the answer cites. Compare their pages with yours: what do they answer that you don’t? That comparison is exactly what the [Citation Gap scan](/#citation-gap) does for you.`,
    published: '2026-10-03',
    status: 'published',
  },
  {
    slug: 'structured-data-for-local-businesses',
    title: 'Structured data for local businesses: what to mark up and why',
    description: 'What structured data is, which types matter for law firms, medical practices and local services, and the mistakes that cause problems.',
    kind: 'guide',
    summary: [
      'Structured data describes your business in a format search engines read reliably.',
      'Start with your business type, name, address, phone, hours and the services you offer.',
      'Only mark up what’s visible on the page. Never describe content that isn’t there.',
    ],
    body: `Structured data is a short block of code, invisible to visitors, that tells search engines facts about a page in a standard vocabulary (schema.org). Google explains it in its [introduction to structured data](${GOOGLE_INTRO_SD}).

## What it’s for

A person can tell from your contact page that you open at 9 and close at 5. A search engine can usually work that out too, but structured data removes the guesswork. It states your business type, name, address, phone number, opening hours and more, in a form every search engine reads the same way.

## The types that matter most

Google’s [local business documentation](${GOOGLE_LOCAL_SD}) covers the core. In practice:

- **A specific business type.** For example LegalService for a law firm, a medical type such as MedicalClinic or Dentist for a practice, or a home-services type such as Plumber.
- **Name, address and phone**, exactly as they appear on the page and on your Google Business Profile.
- **Opening hours**, kept current when they change.
- **Your services**, each described on the page that’s about it.
- **Breadcrumbs**, so search engines understand how your pages fit together.

## Common mistakes

- **Marking up things that aren’t on the page.** Google’s guidelines require structured data to describe content visitors can actually see. FAQ markup with no visible questions, or review stars for reviews that aren’t shown, can cause problems.
- **Out-of-date details.** Hours or an address in the markup that disagree with the page.
- **Copy-pasted markup** from another site, still naming the wrong business.

## Does it help with AI answers?

Search engines use structured data to understand pages, and AI answers are built from what they understand. It isn’t a shortcut: Google says there’s no special markup needed for its AI features ([AI features and your website](${GOOGLE_AI})). But accurate markup makes your facts unambiguous, which is what you want any summary of your business to be built on.

Every SaySites site writes this markup for you from your business details, and checks it on every page before it goes live.`,
    published: '2026-10-03',
    status: 'published',
  },
  {
    slug: 'see-where-you-stand-in-ai-answers',
    title: 'New: see where your pages stand in AI answers',
    description: 'Every SaySites dashboard now includes Citation Gap: pick a page and a search, and see how it compares with the pages Google ranks and quotes.',
    kind: 'news',
    summary: [
      'Pick a page and the search you want it to win.',
      'Get a Google ranking score and an AI answer score, and whether Google’s AI Overview cites you.',
      'See the changes that close the gap, most valuable first.',
    ],
    body: `Today we added Citation Gap to the SEO tab of every SaySites dashboard.

## What it does

Choose one of your pages and the search you want it to win, for example “estate planning lawyer columbus”. Citation Gap reads Google’s top results for that search, and its AI Overview if one is shown, and compares your page with the pages that rank.

You get:

- **A Google ranking score** for how your page compares with what ranks, check by check.
- **An AI answer score** for how quotable your page is, and whether Google’s AI Overview cites you or other sites.
- **A short list of changes**, most valuable first, each with an estimate of the time it takes. Ask for any change in plain words, and approve it before it goes live.

## Honest by design

The scores compare your page with the pages Google is showing that day. They aren’t a promise of a ranking; nobody honest can make one. What they give you is a clear view of what the pages that win are doing, and what yours is missing.

Each scan runs live Google searches, so scans per site are limited. The site audit and competitor comparison are included with every site.`,
    published: '2026-10-03',
    status: 'published',
  },
]

// Newest first; on the same day, launch articles keep their order above.
const launchIndex = (a: Article) => {
  const i = LAUNCH_ARTICLES.findIndex((x) => x.slug === a.slug)
  return i < 0 ? -1 : i
}
const byDateDesc = (a: Article, b: Article) => b.published.localeCompare(a.published) || launchIndex(a) - launchIndex(b)

// Every article, dashboard edits winning over the launch set.
export async function allArticles(store: Store): Promise<Article[]> {
  const saved = await store.articles().catch(() => [] as Article[])
  const map = new Map(LAUNCH_ARTICLES.map((a) => [a.slug, a]))
  for (const a of saved) map.set(a.slug, a)
  return [...map.values()].sort(byDateDesc)
}

export async function publishedArticles(store: Store): Promise<Article[]> {
  const today = new Date().toISOString().slice(0, 10)
  return (await allArticles(store)).filter((a) => a.status === 'published' && a.published <= today)
}

export const isLaunchArticle = (slug: string) => LAUNCH_ARTICLES.some((a) => a.slug === slug)

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

// --- the body format --------------------------------------------------------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const safeHref = (u: string) => /^(https:\/\/|\/(?!\/)|#)/.test(u)

function inline(text: string): string {
  let out = ''
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    out += esc(text.slice(last, m.index))
    if (m[1] !== undefined) {
      const href = m[2]
      out += safeHref(href) ? `<a href="${esc(href)}"${href.startsWith('https://') ? ' rel="noopener"' : ''}>${esc(m[1])}</a>` : esc(m[0])
    } else {
      out += `<strong>${esc(m[3])}</strong>`
    }
    last = re.lastIndex
  }
  return out + esc(text.slice(last))
}

export const headingId = (t: string) => slugify(t) || 'section'

export function headingsOf(body: string): { id: string; text: string }[] {
  return body
    .split('\n')
    .filter((l) => l.startsWith('## '))
    .map((l) => ({ id: headingId(l.slice(3).trim()), text: l.slice(3).trim() }))
}

// Body text to safe HTML. Nothing the author types becomes raw markup.
export function renderBody(body: string): string {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n{2,}/)
  const html: string[] = []
  for (const raw of blocks) {
    const b = raw.trim()
    if (!b) continue
    const lines = b.split('\n').map((l) => l.trim())
    if (b.startsWith('### ')) html.push(`<h3>${inline(b.slice(4))}</h3>`)
    else if (b.startsWith('## ')) html.push(`<h2 id="${headingId(b.slice(3).trim())}">${inline(b.slice(3))}</h2>`)
    else if (lines.every((l) => /^[-*] /.test(l))) html.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`)
    else if (lines.every((l) => /^\d+\. /.test(l))) html.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`)
    else if (lines.every((l) => l.startsWith('>'))) html.push(`<blockquote><p>${inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`)
    else html.push(`<p>${inline(lines.join(' '))}</p>`)
  }
  return html.join('\n')
}

export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220))

// Checks an article from the dashboard form. Returns the problem in plain words.
export function checkArticle(a: Article): string | null {
  if (!SLUG.test(a.slug) || a.slug.length > 80) return 'The address can use only lowercase letters, numbers and dashes.'
  if (a.title.length < 10 || a.title.length > 110) return 'The title should be 10 to 110 characters.'
  if (a.description.length < 50 || a.description.length > 170) return 'The description should be 50 to 170 characters.'
  if (!DAY.test(a.published)) return 'The publish date isn’t a real date.'
  if (a.body.split(/\s+/).filter(Boolean).length < 150) return 'The article needs at least 150 words.'
  if (a.summary.length > 5) return 'Keep the key points to five or fewer.'
  return null
}
