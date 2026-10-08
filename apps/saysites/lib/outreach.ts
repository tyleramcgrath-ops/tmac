// Outreach. The team names a trade and a city (or pastes a list):
//
// 1. Find: a few Google searches (SERPAPI_KEY) for "<trade> <city>", keeping
//    businesses' own websites and dropping directories, social sites and
//    government pages. Pasted lists work too, with no searches.
// 2. Build: a free redesign preview of each site, a batch at a time, with
//    the contact email from the business's own website when it lists one. A
//    site that asks not to be sent unsolicited email is marked and left out.
// 3. Email: SaySites never sends these itself. The campaign's CSV carries
//    each business's personal link, unsubscribe link and the wording
//    (outreachEmail), for the team's own sending tool and a separate sending
//    domain. Every email names SaySites, gives our postal address
//    (OUTREACH_ADDRESS, required by CAN-SPAM) and an unsubscribe link.
// 4. Report: once a campaign has enough measured sites, a city report is
//    drafted for the team to publish (lib/prospects buildReport).
//
// Searches cost money (pricing rule: they're ours, a few per campaign);
// previews cost nothing.

import { PRICES } from './billing'
import { ImportError, safeFetch, type Fetcher } from './importer'
import { buildPreview } from './redesign'
import { serpApiKey } from './rankforge/serp'
import { BATCH_MAX, REPORT_MIN_SITES, blockedBy, buildReport, cleanCampaign, hostOf, newToken, type Prospect, type ProspectLine } from './prospects'
import type { Store } from './store'

export interface Campaign {
  slug: string
  title: string
  trade: string
  city: string
  createdAt: string
  // A paused campaign builds nothing.
  paused?: boolean
  searched?: number
  reportSlug?: string
}


export const isLaw = (trade: string) => /law|lawyer|attorney|legal/i.test(trade)

// ---------------------------------------------------------------------------
// Finding businesses
// ---------------------------------------------------------------------------

// Directories, marketplaces, social and news sites: never a business's own site.
const NOT_A_BUSINESS = /(^|\.)(yelp|avvo|justia|findlaw|superlawyers|martindale|lawyers|lawinfo|nolo|legalmatch|upcounsel|bestlawyers|expertise|threebestrated|bbb|angi|angieslist|homeadvisor|thumbtack|houzz|porch|yellowpages|yp|mapquest|nextdoor|facebook|instagram|linkedin|twitter|x|youtube|tiktok|pinterest|reddit|quora|wikipedia|google|bing|apple|amazon|indeed|glassdoor|ziprecruiter|healthgrades|zocdoc|vitals|webmd|opentable|tripadvisor|doordash|grubhub|ubereats|chamberofcommerce|manta|birdeye|podium|forbes|nytimes|patch|usnews|wsj|craigslist|alignable|bark|networx|fixr|buildzoom)\.[a-z.]+$/i

export function businessSite(link: string): string | null {
  const host = hostOf(link)
  if (!host || NOT_A_BUSINESS.test(host) || /\.(gov|edu|mil)$/.test(host) || /(^|\.)(gov|edu)\.[a-z]{2}$/.test(host)) return null
  return `https://${host}/`
}

export async function searchBusinesses(trade: string, city: string, key: string, get: typeof fetch = fetch): Promise<string[]> {
  const found: string[] = []
  for (const q of [`${trade} ${city}`, `${trade} near ${city}`]) {
    const u = new URL('https://serpapi.com/search.json')
    u.searchParams.set('engine', 'google')
    u.searchParams.set('q', q)
    u.searchParams.set('num', '40')
    u.searchParams.set('gl', 'us')
    u.searchParams.set('hl', 'en')
    u.searchParams.set('api_key', key)
    try {
      const r = await get(u, { signal: AbortSignal.timeout(20_000) })
      if (!r.ok) continue
      const data = (await r.json()) as { organic_results?: { link?: string }[]; local_results?: { places?: { links?: { website?: string } }[] } }
      const links = [...(data.organic_results ?? []).map((x) => x.link), ...(data.local_results?.places ?? []).map((x) => x.links?.website)]
      for (const l of links) {
        const site = l ? businessSite(l) : null
        if (site && !found.includes(site)) found.push(site)
      }
    } catch {
      // One failed search shouldn't stop the other.
    }
  }
  return found
}

// Adds businesses to a campaign, skipping ones already in any campaign and
// anyone who unsubscribed.
export async function addProspects(store: Store, campaign: string, lines: ProspectLine[], now = new Date()): Promise<number> {
  const all = await store.prospects()
  const have = new Set(all.map((p) => hostOf(p.url)))
  let added = 0
  for (const line of lines.slice(0, 1000)) {
    const host = hostOf(line.url)
    if (!host || have.has(host) || blockedBy(line, all)) continue
    have.add(host)
    await store.saveProspect({ id: newToken(), campaign, url: line.url, ...(line.email ? { email: line.email } : {}), ...(line.name ? { name: line.name } : {}), createdAt: now.toISOString() })
    added++
  }
  return added
}

export async function startCampaign(store: Store, input: { trade: string; city: string; lines?: ProspectLine[] }, opts: { key?: string | null; get?: typeof fetch; now?: Date } = {}): Promise<{ campaign: Campaign; added: number; searched: boolean }> {
  const now = opts.now ?? new Date()
  const trade = input.trade.trim().slice(0, 60)
  const city = input.city.trim().slice(0, 60)
  let slug = cleanCampaign(`${trade} ${city}`) || `list-${now.getTime()}`
  const taken = new Set((await store.campaigns()).map((c) => c.slug))
  for (let n = 2; taken.has(slug); n++) slug = `${cleanCampaign(`${trade} ${city}`)}-${n}`
  const campaign: Campaign = { slug, title: [trade, city].filter(Boolean).join(', ') || 'Pasted list', trade, city, createdAt: now.toISOString() }
  const key = opts.key === undefined ? serpApiKey() : opts.key
  const found = key && trade && city ? await searchBusinesses(trade, city, key, opts.get) : []
  if (found.length) campaign.searched = found.length
  await store.saveCampaign(campaign)
  const added = await addProspects(store, slug, [...(input.lines ?? []), ...found.map((url) => ({ url }))], now)
  return { campaign, added, searched: !!found.length }
}

// ---------------------------------------------------------------------------
// Building previews
// ---------------------------------------------------------------------------

// A site that asks not to be sent unsolicited email doesn't get one.
const NO_SOLICITING = /(no|not accept|do not send)\s+(unsolicited|commercial|marketing|sales)\s+(e-?mails?|messages|solicitations?|offers)|not\s+(be\s+)?used\s+for\s+(unsolicited|commercial|marketing)|no\s+solicitations?/i

export async function buildProspect(store: Store, p: Prospect, get: Fetcher = safeFetch): Promise<Prospect> {
  let home = ''
  const reading: Fetcher = async (u) => {
    const r = await get(u)
    if (r && !home && /html/i.test(r.type)) home = r.body
    return r
  }
  try {
    const preview = await buildPreview(p.url, reading)
    await store.savePreview(preview, 'outreach')
    const email = p.email ?? preview.detected.email?.toLowerCase()
    const next: Prospect = {
      ...p,
      previewId: preview.id,
      name: p.name ?? preview.detected.name,
      ...(email && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) ? { email } : {}),
      before: preview.before,
      after: { kb: preview.after.kb, scripts: preview.after.scripts },
      ...(NO_SOLICITING.test(home) ? { noEmail: true } : {}),
    }
    delete next.error
    await store.saveProspect(next)
    return next
  } catch (e) {
    const next = { ...p, error: e instanceof ImportError ? e.message.slice(0, 200) : 'Could not build a preview.' }
    await store.saveProspect(next)
    return next
  }
}

// ---------------------------------------------------------------------------
// The email wording, for the CSV
// ---------------------------------------------------------------------------

export function outreachEmail(p: Prospect, c: Campaign, origin: string, followUp: boolean): { subject: string; text: string } {
  const host = hostOf(p.url)
  const name = p.name ?? host
  const link = `${origin}/r/${p.id}`
  const price = isLaw(c.trade) ? `$${PRICES.lawstarter.month} a month for law firms` : `$${PRICES.site.month} a month`
  const weight = p.before && p.after && p.after.kb < p.before.kb ? `Your homepage is ${p.before.kb} KB; the rebuilt one is ${p.after.kb} KB, so it loads faster on phones. ` : ''
  const footer = `\n--\nSaySites, ${process.env.OUTREACH_ADDRESS || '[your postal address]'}\nYou're getting this because ${host} is a public business website. Not interested? ${origin}/unsubscribe/${p.id} and we won't write again.`
  if (followUp)
    return {
      subject: `Re: ${name}, your website rebuilt`,
      text: `Hi,\n\nJust making sure this reached you: we rebuilt ${host} on SaySites, with your own words and photos, and it's yours to look at here:\n${link}\n\nIf you like it, keep it: the first month is free, no card, then ${price}. If not, no problem, and this is the last email.\n\nSaySites${footer}\n`,
    }
  return {
    subject: `${name}, we rebuilt your website (free to keep)`,
    text: `Hi,\n\nWe rebuilt ${host} on SaySites: the same pages, words and photos, plus a fresh design to compare. ${weight}You can see both here:\n${link}\n\nIf you like it, it's yours: claim it with the first month free, no card and no contract. After that it's ${price}, and you change anything by just saying it to Sofie, our website assistant.\n\nNothing is published unless you claim it and confirm you run the business. The preview is private and disappears in 30 days.\n\nSaySites${footer}\n`,
  }
}

// ---------------------------------------------------------------------------
// Building a batch
// ---------------------------------------------------------------------------

export interface OutreachRun {
  built: number
  reports: number
}

// Builds the next batch of previews in running campaigns, then drafts any
// city report that now has enough measured sites. Run from the team's
// "Build the next batch" button.
export async function runOutreach(store: Store, opts: { now?: Date; get?: Fetcher; limit?: number } = {}): Promise<OutreachRun> {
  const now = opts.now ?? new Date()
  const out: OutreachRun = { built: 0, reports: 0 }
  const campaigns = await store.campaigns()
  if (!campaigns.length) return out
  const on = new Set(campaigns.filter((c) => !c.paused).map((c) => c.slug))
  let all = await store.prospects()
  for (const p of all.filter((x) => on.has(x.campaign) && !x.previewId && !x.error && !x.unsubscribedAt).slice(0, Math.min(opts.limit ?? BATCH_MAX, BATCH_MAX))) {
    await buildProspect(store, p, opts.get)
    out.built++
  }
  if (out.built) all = await store.prospects()
  for (const c of campaigns.filter((x) => !x.reportSlug && x.city)) {
    if (all.filter((p) => p.campaign === c.slug && p.before).length < REPORT_MIN_SITES) continue
    const r = buildReport({ slug: c.slug, title: `${c.trade} websites in ${c.city}`.replace(/^./, (x) => x.toUpperCase()), city: c.city, trade: c.trade, intro: '', campaign: c.slug }, all, now)
    if ('error' in r) continue
    await store.saveReport(r)
    await store.saveCampaign({ ...c, reportSlug: r.slug })
    out.reports++
  }
  return out
}
