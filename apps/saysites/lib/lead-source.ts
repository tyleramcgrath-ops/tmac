// Where a lead came from, without JavaScript on customer sites.
//
// Customer pages are cached, so they can't set cookies, but the visit
// beacon (lib/serve visitBeacon) is fetched fresh on every page view and its
// Referer is the page's full address. So the beacon reads the ad and
// campaign tags on the page the visitor landed on (gclid, fbclid, utm_…),
// and remembers them in one small first-party cookie. When that visitor
// sends a form, the lead is labelled with it.
//
// What we can't know without JavaScript is which website sent someone
// (document.referrer). Untagged visits are labelled "Search or direct" and
// never guessed. Owners tag their Google Business Profile link (googleMapsLink)
// so Maps leads are counted too.

export const SOURCE_COOKIE = 'ss_src'
export const DIRECT = 'Search or direct'
const MAX_AGE = 90 * 86_400

export interface LeadSource {
  label: string
  // The first page they landed on, e.g. "/practice-areas/probate".
  landing: string
  campaign?: string
}

const NAMES: Record<string, string> = {
  google: 'Google',
  bing: 'Bing',
  facebook: 'Facebook or Instagram',
  fb: 'Facebook or Instagram',
  instagram: 'Facebook or Instagram',
  ig: 'Facebook or Instagram',
  meta: 'Facebook or Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  yelp: 'Yelp',
  nextdoor: 'Nextdoor',
  avvo: 'Avvo',
  justia: 'Justia',
  findlaw: 'FindLaw',
  martindale: 'Martindale',
  superlawyers: 'Super Lawyers',
  healthgrades: 'Healthgrades',
  zocdoc: 'Zocdoc',
  angi: 'Angi',
  thumbtack: 'Thumbtack',
  newsletter: 'Email',
  email: 'Email',
}

const title = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40)

// The source a tagged address says, or null for an untagged one.
export function sourceFromUrl(url: URL): Omit<LeadSource, 'landing'> | null {
  const q = url.searchParams
  const campaign = (q.get('utm_campaign') ?? '').trim().slice(0, 80) || undefined
  const withCampaign = (label: string) => ({ label, ...(campaign ? { campaign } : {}) })
  if (q.has('gclid') || q.has('gbraid') || q.has('wbraid')) return withCampaign('Google Ads')
  if (q.has('msclkid')) return withCampaign('Microsoft Ads')
  if (q.has('fbclid')) return withCampaign('Facebook or Instagram')
  if (q.has('ttclid')) return withCampaign('TikTok')
  if (q.has('li_fat_id')) return withCampaign('LinkedIn')
  const src = (q.get('utm_source') ?? '').trim().toLowerCase()
  const medium = (q.get('utm_medium') ?? '').trim().toLowerCase()
  if (!src && !medium) return null
  if (src === 'google' && /^(gbp|gmb|maps|local|organic_local|business_profile)$/.test(medium)) return withCampaign('Google Maps')
  if (src === 'google' && /^(cpc|ppc|paid|ads|paidsearch)$/.test(medium)) return withCampaign('Google Ads')
  if (/^(cpc|ppc|paid|paidsocial|paid_social)$/.test(medium) && NAMES[src]) return withCampaign(`${NAMES[src]} ads`)
  if (medium === 'email' || medium === 'newsletter') return withCampaign('Email')
  return withCampaign(NAMES[src] ?? (src ? title(src) : title(medium)))
}

export function readSource(cookieHeader: string | null): LeadSource | null {
  const raw = (cookieHeader ?? '').split(/;\s*/).find((c) => c.startsWith(`${SOURCE_COOKIE}=`))
  if (!raw) return null
  try {
    const v = JSON.parse(decodeURIComponent(raw.slice(SOURCE_COOKIE.length + 1)))
    if (typeof v?.label !== 'string' || typeof v?.landing !== 'string') return null
    return { label: v.label.slice(0, 40), landing: v.landing.slice(0, 200), ...(typeof v.campaign === 'string' && v.campaign ? { campaign: v.campaign.slice(0, 80) } : {}) }
  } catch {
    return null
  }
}

export function sourceCookie(s: LeadSource): string {
  return `${SOURCE_COOKIE}=${encodeURIComponent(JSON.stringify(s))}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; HttpOnly; Secure`
}

// What the beacon should remember for this page view, if anything: a tagged
// visit always wins (the latest ad they clicked); an untagged one only marks
// where a new visitor first landed.
export function sourceToSet(pageUrl: URL, path: string, current: LeadSource | null): LeadSource | null {
  const tagged = sourceFromUrl(pageUrl)
  if (tagged) return { ...tagged, landing: path }
  if (!current) return { label: DIRECT, landing: path }
  return null
}

// The link owners put on their Google Business Profile so Maps leads show.
export const googleMapsLink = (siteUrl: string) => `${siteUrl.replace(/\/+$/, '')}/?utm_source=google&utm_medium=gbp`
