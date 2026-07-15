/**
 * PREVIEW DATA — NORTH STAR FLAGSHIP EXPERIENCE
 *
 * Everything in this file is clearly labeled preview/demo content.
 * It exists because the canonical backend contracts (persistence, Agent OS,
 * scheduler, real crawl evidence pipeline) are not available in this
 * repository/branch. Nothing here should be read as a real business result.
 *
 * Rules this file follows:
 *  - No fabricated revenue, lead, call, or ROI numbers.
 *  - No fabricated confidence percentages.
 *  - No competitor or industry benchmark claims.
 *  - Every "opportunity" claim is phrased as verified-vs-unverified —
 *    nothing shown without evidence backing it.
 *
 * Codex: this module is intentionally isolated. Swap PREVIEW_SCENARIOS for
 * real API/contract data and delete this file — nothing outside
 * app/north-star and components/north-star imports from here.
 */

export const IS_PREVIEW_DATA = true

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PreviewScenarioId =
  | 'opportunity-found'
  | 'no-changes'
  | 'waiting-approval'
  | 'check-failed'
  | 'insufficient-evidence'
  | 'automation-not-connected'
  | 'first-visit'

export interface EvidenceItem {
  label: string
  detail: string
}

export interface GuideStep {
  title: string
  description: string
  timeEstimate: string
  whatYouNeed: string
}

export type PrepareItemStatus = 'ready' | 'needs-info' | 'needs-approval'

export interface PrepareItem {
  label: string
  detail: string
  status: PrepareItemStatus
}

export type OpportunityPriority = 'high' | 'medium' | 'low'

export interface Opportunity {
  headline: string
  priority: OpportunityPriority
  affectedAreas: string[]
  businessReason: string
  evidenceSummary: string
  affectedPages: { url: string; label: string }[]
  evidenceSource: string
  evidence: EvidenceItem[]
  cannotMeasure: string[]
  additionalDataNeeded: string[]
  guideSteps: GuideStep[]
  prepareChecklist: PrepareItem[]
}

export type DigitalDnaUnderstanding =
  | 'well-understood'
  | 'partially-understood'
  | 'needs-verification'
  | 'not-connected'

export interface DigitalDnaArea {
  key: string
  label: string
  understanding: DigitalDnaUnderstanding
  evidenceCount: number
  note: string
}

export type ActivityStatus =
  | 'waiting'
  | 'checking'
  | 'understanding'
  | 'preparing'
  | 'finished'
  | 'needs-attention'
  | 'waiting-approval'

export type ActivityPersistence = 'temporary' | 'persistent' | 'not-connected'

export interface ActivityItem {
  id: string
  label: string
  status: ActivityStatus
  startedAt: string | null
  finishedAt: string | null
  finding: string | null
  actionRequired: boolean
  persistence: ActivityPersistence
  technicalDetail: string
}

export type HistoryOutcome =
  | 'no-change'
  | 'opportunity-found'
  | 'waiting-approval'
  | 'action-completed'
  | 'result-unknown'
  | 'check-incomplete'

export interface HistoryItem {
  id: string
  date: string
  outcome: HistoryOutcome
  summary: string
  johnActed: boolean | null
  followUp: string | null
}

export type RunOutcome =
  | 'completed'
  | 'failed'
  | 'duplicate'
  | 'insufficient-evidence'
  | 'waiting-approval'

export interface PendingApproval {
  title: string
  detail: string
  preparedBy: string
  beforeState: string
  afterState: string
  whatChanges: string
  whyRecommended: string
  requiredSpend: string
  customerImpact: string
  rollbackPlan: string
  whatWillBeMeasured: string
}

export interface PreviewScenario {
  id: PreviewScenarioId
  switcherLabel: string
  switcherHint: string
  business: { name: string; domain: string; ownerFirstName: string }
  lastCheckedAt: string | null
  lastCheckStatus: 'completed' | 'failed' | 'incomplete' | 'never'
  pagesChecked: number
  briefing: {
    headline: string
    subline: string
    materialChange: boolean
    actionRequired: boolean
    automationConnected: boolean
    automationNote: string
  }
  opportunity: Opportunity | null
  opportunityStale: boolean
  pendingApproval: PendingApproval | null
  digitalDna: DigitalDnaArea[]
  activity: ActivityItem[]
  history: HistoryItem[]
  defaultRunOutcome: RunOutcome
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

const BUSINESS = { name: 'Martinez Plumbing & Drain', domain: 'martinezplumbing.com', ownerFirstName: 'John' }

const CONTACT_OPPORTUNITY: Opportunity = {
  headline: 'Customers may have trouble reaching you from your most important pages.',
  priority: 'high',
  affectedAreas: ['Website', 'Conversion paths', 'Reputation'],
  businessReason:
    'When someone lands on your homepage or a service page ready to call, every extra second spent hunting for your phone number is a chance they give up and call the next plumber instead.',
  evidenceSummary: 'Your homepage does not show a clickable phone number or contact method before a visitor scrolls.',
  affectedPages: [
    { url: 'https://martinezplumbing.com/', label: 'Homepage' },
    { url: 'https://martinezplumbing.com/emergency-service', label: 'Emergency Service page' },
    { url: 'https://martinezplumbing.com/contact', label: 'Contact page' },
  ],
  evidenceSource: "Found during North Star's website check this morning at 6:12 AM.",
  evidence: [
    { label: 'Homepage contact visibility', detail: 'No phone number or contact button appears before scrolling.' },
    { label: 'Business info structure', detail: 'No structured business listing found describing your phone, address, or hours.' },
    { label: 'Consistency across pages', detail: '2 of 14 pages checked show a phone number; 12 do not.' },
  ],
  cannotMeasure: [
    'How many visitors actually leave without contacting you',
    'Whether visitors who do see your number choose to call',
    'Any revenue or job impact this may be causing',
  ],
  additionalDataNeeded: [
    'Call tracking or analytics showing what visitors do after landing on a page',
    'A few weeks of data after a change, to compare before and after',
  ],
  guideSteps: [
    {
      title: 'Add your phone number to the top of your homepage',
      description: 'Visitors should see it in the first screen — no scrolling required.',
      timeEstimate: '10–15 minutes',
      whatYouNeed: 'Access to your website editor',
    },
    {
      title: 'Add a "Call Now" button for mobile visitors',
      description: 'Most visitors are on their phone. Tapping to call should take exactly one tap.',
      timeEstimate: '10 minutes',
      whatYouNeed: 'Access to your website editor',
    },
    {
      title: 'Use the same number and address everywhere',
      description: 'Check that your emergency service and contact pages match your homepage exactly.',
      timeEstimate: '15 minutes',
      whatYouNeed: 'Your current business phone, address, and hours',
    },
    {
      title: 'Ask North Star to check again',
      description: 'We will confirm the changes are visible and consistent across your site.',
      timeEstimate: 'Automatic on next check',
      whatYouNeed: 'Nothing — just press Check my business now',
    },
  ],
  prepareChecklist: [
    {
      label: 'Business name, phone, and hours',
      detail: 'We need your exact current details before preparing anything for publishing.',
      status: 'needs-info',
    },
    {
      label: 'Preferred contact method',
      detail: 'Phone call, contact form, or both — once your details are confirmed.',
      status: 'needs-info',
    },
    {
      label: 'Draft homepage contact placement',
      detail: 'North Star can propose where the number and button should go once your details are confirmed. Nothing is published without your review.',
      status: 'needs-approval',
    },
  ],
}

function dnaAreas(overrides: Partial<Record<string, DigitalDnaArea>> = {}): DigitalDnaArea[] {
  const base: DigitalDnaArea[] = [
    { key: 'identity', label: 'Business identity', understanding: 'well-understood', evidenceCount: 3, note: 'Business name, primary trade, and service area confirmed from your website.' },
    { key: 'services', label: 'Services', understanding: 'well-understood', evidenceCount: 5, note: '5 services identified: drain cleaning, water heater repair, emergency plumbing, and 2 more.' },
    { key: 'locations', label: 'Locations', understanding: 'partially-understood', evidenceCount: 1, note: 'One service area confirmed. Not yet verified whether you serve neighboring towns.' },
    { key: 'customers', label: 'Customers', understanding: 'needs-verification', evidenceCount: 0, note: 'No customer data connected yet.' },
    { key: 'website', label: 'Website', understanding: 'well-understood', evidenceCount: 14, note: '14 pages checked this morning.' },
    { key: 'reputation', label: 'Reputation', understanding: 'partially-understood', evidenceCount: 2, note: 'Found reviews on 2 platforms. Sentiment trends not yet analyzed.' },
    { key: 'marketing', label: 'Marketing activity', understanding: 'needs-verification', evidenceCount: 0, note: 'No advertising accounts connected.' },
    { key: 'offers', label: 'Offers & promotions', understanding: 'not-connected', evidenceCount: 0, note: 'No current promotions found on your website.' },
    { key: 'competitors', label: 'Competitors', understanding: 'needs-verification', evidenceCount: 0, note: 'Needs more checks over time before we can compare confidently.' },
    { key: 'seasonality', label: 'Seasonality', understanding: 'needs-verification', evidenceCount: 0, note: 'Needs several months of data to identify patterns.' },
    { key: 'conversion', label: 'Conversion paths', understanding: 'partially-understood', evidenceCount: 1, note: "This morning's check found one likely friction point." },
  ]
  return base.map((a) => (overrides[a.key] ? { ...a, ...overrides[a.key] } : a))
}

/* ------------------------------------------------------------------ */
/* Scenario 1 — Opportunity found                                      */
/* ------------------------------------------------------------------ */

const opportunityFound: PreviewScenario = {
  id: 'opportunity-found',
  switcherLabel: 'Opportunity found',
  switcherHint: 'A verified contact-path issue is ready to review.',
  business: BUSINESS,
  lastCheckedAt: 'Today, 6:12 AM',
  lastCheckStatus: 'completed',
  pagesChecked: 14,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: 'Your business is stable today. One opportunity is worth reviewing.',
    materialChange: true,
    actionRequired: false,
    automationConnected: true,
    automationNote: 'Daily checks are on. North Star checked your site automatically at 6:00 AM.',
  },
  opportunity: CONTACT_OPPORTUNITY,
  opportunityStale: false,
  pendingApproval: null,
  digitalDna: dnaAreas(),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'finished', startedAt: '6:04 AM', finishedAt: '6:11 AM', finding: '14 pages checked. 1 opportunity found.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Crawled martinezplumbing.com — 14 pages, sitemap-aware.' },
    { id: 'a2', label: 'Understanding what changed', status: 'finished', startedAt: '6:11 AM', finishedAt: '6:12 AM', finding: 'No major changes since your last check, 3 days ago.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Diffed against previous crawl snapshot (3 days old).' },
    { id: 'a3', label: 'Preparing your briefing', status: 'finished', startedAt: '6:12 AM', finishedAt: '6:12 AM', finding: 'Briefing ready.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Aggregated fixes and generated opportunity summary.' },
    { id: 'a4', label: 'Watching for your next check', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'persistent', technicalDetail: 'Scheduled for tomorrow, 6:00 AM.' },
  ],
  history: [
    { id: 'h1', date: 'Today', outcome: 'opportunity-found', summary: 'Found that contact info is hard to find on your homepage.', johnActed: null, followUp: 'Waiting on you to review.' },
    { id: 'h2', date: '3 days ago', outcome: 'no-change', summary: 'Nothing new. Your site looked the same as the check before.', johnActed: null, followUp: null },
    { id: 'h3', date: '1 week ago', outcome: 'action-completed', summary: 'You added a new photo to your Google Business Profile.', johnActed: true, followUp: 'Too early to know the effect yet.' },
    { id: 'h4', date: '2 weeks ago', outcome: 'opportunity-found', summary: 'Found 3 pages loading slowly on mobile.', johnActed: true, followUp: 'You said this was fixed. We confirmed it on the next check.' },
  ],
  defaultRunOutcome: 'completed',
}

/* ------------------------------------------------------------------ */
/* Scenario 2 — No material changes                                    */
/* ------------------------------------------------------------------ */

const noChanges: PreviewScenario = {
  id: 'no-changes',
  switcherLabel: 'No material changes',
  switcherHint: 'A quiet, stable day — nothing new to review.',
  business: BUSINESS,
  lastCheckedAt: 'Today, 6:05 AM',
  lastCheckStatus: 'completed',
  pagesChecked: 14,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: 'Nothing important changed since your last check. Everything looks the way you left it.',
    materialChange: false,
    actionRequired: false,
    automationConnected: true,
    automationNote: 'Daily checks are on. North Star checked your site automatically at 6:00 AM.',
  },
  opportunity: null,
  opportunityStale: false,
  pendingApproval: null,
  digitalDna: dnaAreas({ conversion: { key: 'conversion', label: 'Conversion paths', understanding: 'well-understood', evidenceCount: 2, note: 'Contact information is now visible and consistent across your site.' } }),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'finished', startedAt: '6:00 AM', finishedAt: '6:06 AM', finding: '14 pages checked. No new issues found.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Crawled martinezplumbing.com — 14 pages, sitemap-aware.' },
    { id: 'a2', label: 'Understanding what changed', status: 'finished', startedAt: '6:06 AM', finishedAt: '6:07 AM', finding: 'No differences from yesterday.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Diffed against previous crawl snapshot (1 day old).' },
    { id: 'a3', label: 'Preparing your briefing', status: 'finished', startedAt: '6:07 AM', finishedAt: '6:07 AM', finding: 'Briefing ready — a quiet day.', actionRequired: false, persistence: 'persistent', technicalDetail: 'No fixes or opportunities above the reporting threshold.' },
    { id: 'a4', label: 'Watching for your next check', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'persistent', technicalDetail: 'Scheduled for tomorrow, 6:00 AM.' },
  ],
  history: [
    { id: 'h1', date: 'Today', outcome: 'no-change', summary: 'Nothing new. Your site looked the same as yesterday.', johnActed: null, followUp: null },
    { id: 'h2', date: 'Yesterday', outcome: 'action-completed', summary: 'You fixed the contact info visibility issue we found.', johnActed: true, followUp: 'Confirmed live on this check.' },
    { id: 'h3', date: '3 days ago', outcome: 'opportunity-found', summary: 'Found that contact info was hard to find on your homepage.', johnActed: true, followUp: 'You resolved this.' },
    { id: 'h4', date: '1 week ago', outcome: 'no-change', summary: 'Nothing new that day.', johnActed: null, followUp: null },
  ],
  defaultRunOutcome: 'completed',
}

/* ------------------------------------------------------------------ */
/* Scenario 3 — Waiting for approval                                   */
/* ------------------------------------------------------------------ */

const waitingApproval: PreviewScenario = {
  id: 'waiting-approval',
  switcherLabel: 'Waiting for approval',
  switcherHint: 'North Star prepared something and needs your go-ahead.',
  business: BUSINESS,
  lastCheckedAt: 'Today, 6:09 AM',
  lastCheckStatus: 'completed',
  pagesChecked: 14,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: 'North Star prepared something for your review before it goes live.',
    materialChange: true,
    actionRequired: true,
    automationConnected: true,
    automationNote: 'Daily checks are on. North Star checked your site automatically at 6:00 AM.',
  },
  opportunity: CONTACT_OPPORTUNITY,
  opportunityStale: false,
  pendingApproval: {
    title: 'Updated holiday hours for your Google Business Profile',
    detail:
      'Your website lists different holiday hours than your Google Business Profile. North Star prepared an update so both match. Nothing has been published — this is only a draft waiting on you.',
    preparedBy: 'North Star',
    beforeState: 'Google Business Profile shows regular hours for Dec 24, Dec 25, and Jan 1 — no holiday adjustment listed.',
    afterState: 'Google Business Profile shows closed Dec 25, reduced hours Dec 24 and Jan 1 — matching your website exactly.',
    whatChanges: "Your Google Business Profile hours will be updated to match the holiday hours already listed on your website (closed Dec 25, reduced hours Dec 24 and Jan 1).",
    whyRecommended: 'Customers checking Google before calling see different hours than your website shows. Mismatched hours are a common reason people give up and call a competitor instead.',
    requiredSpend: 'None — this is a listing update, not an ad or paid change.',
    customerImpact: 'Anyone viewing your Google Business Profile will see the corrected hours immediately after publishing.',
    rollbackPlan: 'North Star keeps the previous hours on file. If anything looks wrong, tell Compass "undo the holiday hours change" and it reverts within one check cycle.',
    whatWillBeMeasured: 'Whether your website and Google Business Profile hours stay in sync on your next few checks.',
  },
  digitalDna: dnaAreas(),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'finished', startedAt: '6:00 AM', finishedAt: '6:08 AM', finding: '14 pages checked. Found a mismatch in holiday hours.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Crawled martinezplumbing.com — 14 pages, sitemap-aware.' },
    { id: 'a2', label: 'Preparing an update for your review', status: 'waiting-approval', startedAt: '6:08 AM', finishedAt: '6:09 AM', finding: 'Draft ready: matching holiday hours across your website and Google Business Profile.', actionRequired: true, persistence: 'temporary', technicalDetail: 'Draft change queued; requires explicit approval before publishing.' },
    { id: 'a3', label: 'Preparing your briefing', status: 'finished', startedAt: '6:09 AM', finishedAt: '6:09 AM', finding: 'Briefing ready.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Included pending-approval item in summary.' },
    { id: 'a4', label: 'Watching for your next check', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'persistent', technicalDetail: 'Scheduled for tomorrow, 6:00 AM.' },
  ],
  history: [
    { id: 'h1', date: 'Today', outcome: 'waiting-approval', summary: 'Prepared a holiday-hours update for your review.', johnActed: null, followUp: 'Waiting on your approval.' },
    { id: 'h2', date: 'Yesterday', outcome: 'opportunity-found', summary: 'Found that contact info is hard to find on your homepage.', johnActed: false, followUp: 'Still open — not yet addressed.' },
    { id: 'h3', date: '2 days ago', outcome: 'no-change', summary: 'Nothing new that day.', johnActed: null, followUp: null },
  ],
  defaultRunOutcome: 'waiting-approval',
}

/* ------------------------------------------------------------------ */
/* Scenario 4 — Check failed                                           */
/* ------------------------------------------------------------------ */

const checkFailed: PreviewScenario = {
  id: 'check-failed',
  switcherLabel: 'Check failed',
  switcherHint: "This morning's website check could not complete.",
  business: BUSINESS,
  lastCheckedAt: 'Today, 6:02 AM (failed)',
  lastCheckStatus: 'failed',
  pagesChecked: 0,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: "We tried to check your website this morning but couldn't reach it. We'll try again automatically.",
    materialChange: false,
    actionRequired: true,
    automationConnected: true,
    automationNote: 'Your next automatic check is scheduled for tomorrow at 6:00 AM. You can also try again right now.',
  },
  opportunity: CONTACT_OPPORTUNITY,
  opportunityStale: true,
  pendingApproval: null,
  digitalDna: dnaAreas(),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'needs-attention', startedAt: '6:00 AM', finishedAt: '6:02 AM', finding: "Couldn't connect to martinezplumbing.com — the site may be down or blocking our request.", actionRequired: true, persistence: 'persistent', technicalDetail: 'HTTP request timed out after 30s across 3 retry attempts.' },
    { id: 'a2', label: 'Understanding what changed', status: 'waiting', startedAt: null, finishedAt: null, finding: 'Skipped — no successful check to compare.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Blocked on successful crawl.' },
    { id: 'a3', label: 'Preparing your briefing', status: 'finished', startedAt: '6:02 AM', finishedAt: '6:02 AM', finding: 'Briefing prepared using your last successful check, 4 days ago.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Fell back to most recent successful snapshot.' },
    { id: 'a4', label: 'Retrying automatically', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'persistent', technicalDetail: 'Scheduled retry tomorrow, 6:00 AM.' },
  ],
  history: [
    { id: 'h1', date: 'Today', outcome: 'check-incomplete', summary: "We couldn't finish checking your website.", johnActed: null, followUp: 'We will try again automatically tomorrow morning.' },
    { id: 'h2', date: '4 days ago', outcome: 'opportunity-found', summary: 'Found that contact info is hard to find on your homepage.', johnActed: null, followUp: 'Still open.' },
    { id: 'h3', date: '1 week ago', outcome: 'no-change', summary: 'Nothing new that day.', johnActed: null, followUp: null },
  ],
  defaultRunOutcome: 'failed',
}

/* ------------------------------------------------------------------ */
/* Scenario 5 — Check interrupted, not enough evidence gathered         */
/* ------------------------------------------------------------------ */

const insufficientEvidence: PreviewScenario = {
  id: 'insufficient-evidence',
  switcherLabel: 'Insufficient evidence',
  switcherHint: 'The connection dropped before enough pages were gathered.',
  business: BUSINESS,
  lastCheckedAt: 'Today, 6:03 AM (incomplete)',
  lastCheckStatus: 'incomplete',
  pagesChecked: 1,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: "Today's check stopped early — only 1 page loaded before the connection dropped.",
    materialChange: false,
    actionRequired: false,
    automationConnected: true,
    automationNote: 'Daily checks are on. North Star will try a full check again tomorrow at 6:00 AM — you can also try again now.',
  },
  opportunity: null,
  opportunityStale: false,
  pendingApproval: null,
  digitalDna: dnaAreas({
    identity: { key: 'identity', label: 'Business identity', understanding: 'partially-understood', evidenceCount: 1, note: 'Business name confirmed from the one page loaded. Not enough to confirm anything further.' },
    services: { key: 'services', label: 'Services', understanding: 'needs-verification', evidenceCount: 0, note: "The connection dropped before your services page loaded." },
    locations: { key: 'locations', label: 'Locations', understanding: 'needs-verification', evidenceCount: 0, note: 'Not reached before the connection dropped.' },
    customers: { key: 'customers', label: 'Customers', understanding: 'not-connected', evidenceCount: 0, note: 'No customer data connected yet.' },
    website: { key: 'website', label: 'Website', understanding: 'partially-understood', evidenceCount: 1, note: '1 of 14 usual pages loaded before the check stopped.' },
    reputation: { key: 'reputation', label: 'Reputation', understanding: 'needs-verification', evidenceCount: 0, note: 'Not reached before the connection dropped.' },
    marketing: { key: 'marketing', label: 'Marketing activity', understanding: 'not-connected', evidenceCount: 0, note: 'No advertising accounts connected.' },
    offers: { key: 'offers', label: 'Offers & promotions', understanding: 'not-connected', evidenceCount: 0, note: 'Not reached before the connection dropped.' },
    competitors: { key: 'competitors', label: 'Competitors', understanding: 'needs-verification', evidenceCount: 0, note: 'Needs more checks over time before we can compare confidently.' },
    seasonality: { key: 'seasonality', label: 'Seasonality', understanding: 'needs-verification', evidenceCount: 0, note: 'Needs several months of data to identify patterns.' },
    conversion: { key: 'conversion', label: 'Conversion paths', understanding: 'needs-verification', evidenceCount: 0, note: 'Not reached before the connection dropped.' },
  }),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'needs-attention', startedAt: '6:00 AM', finishedAt: '6:03 AM', finding: 'Found 1 page before the connection dropped — not enough to responsibly update what I know.', actionRequired: false, persistence: 'temporary', technicalDetail: 'Crawl interrupted after 1 page; connection reset before sitemap traversal completed.' },
    { id: 'a2', label: 'Understanding what changed', status: 'waiting', startedAt: null, finishedAt: null, finding: 'Skipped — not enough evidence gathered to compare.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Insufficient page count to run the diff step.' },
    { id: 'a3', label: 'Preparing your briefing', status: 'finished', startedAt: '6:03 AM', finishedAt: '6:03 AM', finding: 'Briefing prepared, noting the check was incomplete.', actionRequired: false, persistence: 'persistent', technicalDetail: 'Briefing generated without updating Digital DNA beyond what was confirmed.' },
    { id: 'a4', label: 'Retrying automatically', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'persistent', technicalDetail: 'Scheduled retry tomorrow, 6:00 AM.' },
  ],
  history: [
    { id: 'h1', date: 'Today', outcome: 'check-incomplete', summary: 'Only 1 page loaded before the connection dropped — not enough to update what I know.', johnActed: null, followUp: 'We will try a full check again tomorrow morning.' },
    { id: 'h2', date: '2 days ago', outcome: 'no-change', summary: 'Nothing new that day.', johnActed: null, followUp: null },
    { id: 'h3', date: '1 week ago', outcome: 'opportunity-found', summary: 'Found that contact info is hard to find on your homepage.', johnActed: true, followUp: 'You said this was fixed. We confirmed it on the next check.' },
  ],
  defaultRunOutcome: 'insufficient-evidence',
}

/* ------------------------------------------------------------------ */
/* Scenario 6 — Persistent automation not connected                    */
/* ------------------------------------------------------------------ */

const automationNotConnected: PreviewScenario = {
  id: 'automation-not-connected',
  switcherLabel: 'Automation not connected',
  switcherHint: 'Only manual checks have run so far — no daily schedule yet.',
  business: BUSINESS,
  lastCheckedAt: '4 days ago, 11:40 AM',
  lastCheckStatus: 'completed',
  pagesChecked: 14,
  briefing: {
    headline: `Good morning, ${BUSINESS.ownerFirstName}.`,
    subline: 'Your last check was 4 days ago. Automatic daily checks are not turned on yet.',
    materialChange: false,
    actionRequired: false,
    automationConnected: false,
    automationNote: 'North Star only checks your business when you press Check my business now. Turn on daily checks so we can catch changes automatically — even while you sleep.',
  },
  opportunity: CONTACT_OPPORTUNITY,
  opportunityStale: true,
  pendingApproval: null,
  digitalDna: dnaAreas({
    seasonality: { key: 'seasonality', label: 'Seasonality', understanding: 'not-connected', evidenceCount: 0, note: 'Needs regular checks over time — not possible with manual checks alone.' },
    competitors: { key: 'competitors', label: 'Competitors', understanding: 'not-connected', evidenceCount: 0, note: 'Needs regular checks over time — not possible with manual checks alone.' },
  }),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'finished', startedAt: '4 days ago, 11:36 AM', finishedAt: '4 days ago, 11:40 AM', finding: '14 pages checked. 1 opportunity found.', actionRequired: false, persistence: 'temporary', technicalDetail: 'Manually triggered crawl — no schedule configured.' },
    { id: 'a2', label: 'Automatic daily checks', status: 'waiting', startedAt: null, finishedAt: null, finding: 'Not turned on yet.', actionRequired: false, persistence: 'not-connected', technicalDetail: 'No cron/scheduler entry configured for this account.' },
    { id: 'a3', label: 'Watching for your next manual check', status: 'waiting', startedAt: null, finishedAt: null, finding: null, actionRequired: false, persistence: 'temporary', technicalDetail: 'Awaiting user-triggered run.' },
  ],
  history: [
    { id: 'h1', date: '4 days ago', outcome: 'opportunity-found', summary: 'Found that contact info is hard to find on your homepage.', johnActed: null, followUp: 'Still open.' },
    { id: 'h2', date: '2 weeks ago', outcome: 'no-change', summary: 'Nothing new that day.', johnActed: null, followUp: null },
    { id: 'h3', date: '3 weeks ago', outcome: 'result-unknown', summary: "You said you'd updated your service area listing, but the next manual check couldn't confirm the change had gone live.", johnActed: true, followUp: 'Ask North Star to check again to confirm it went live.' },
    { id: 'h4', date: '5 weeks ago', outcome: 'opportunity-found', summary: 'Found 3 pages loading slowly on mobile.', johnActed: true, followUp: 'You said this was fixed.' },
  ],
  defaultRunOutcome: 'completed',
}

/* ------------------------------------------------------------------ */
/* Scenario 7 — First visit, limited evidence                          */
/* ------------------------------------------------------------------ */

const firstVisit: PreviewScenario = {
  id: 'first-visit',
  switcherLabel: 'First visit',
  switcherHint: 'Brand new account — only the homepage has been checked so far.',
  business: BUSINESS,
  lastCheckedAt: 'Just now',
  lastCheckStatus: 'completed',
  pagesChecked: 1,
  briefing: {
    headline: `Welcome, ${BUSINESS.ownerFirstName}.`,
    subline: "We just checked your homepage for the first time. We'll understand your business a lot better after a few more checks.",
    materialChange: false,
    actionRequired: false,
    automationConnected: false,
    automationNote: 'This was your first check. Turn on daily checks, or check again anytime, to help North Star learn more.',
  },
  opportunity: {
    ...CONTACT_OPPORTUNITY,
    evidenceSummary: 'Your homepage does not show a clickable phone number or contact method before a visitor scrolls.',
    evidenceSource: 'Found during your first check — homepage only. Checking more pages will confirm this.',
    evidence: [
      { label: 'Homepage contact visibility', detail: 'No phone number or contact button appears before scrolling.' },
    ],
    affectedPages: [{ url: 'https://martinezplumbing.com/', label: 'Homepage' }],
  },
  opportunityStale: false,
  pendingApproval: null,
  digitalDna: dnaAreas({
    identity: { key: 'identity', label: 'Business identity', understanding: 'partially-understood', evidenceCount: 1, note: 'Business name confirmed from your homepage. Trade and full service area not yet verified.' },
    services: { key: 'services', label: 'Services', understanding: 'needs-verification', evidenceCount: 1, note: 'One service mentioned on your homepage. More pages will reveal your full service list.' },
    locations: { key: 'locations', label: 'Locations', understanding: 'not-connected', evidenceCount: 0, note: 'Not yet checked.' },
    customers: { key: 'customers', label: 'Customers', understanding: 'not-connected', evidenceCount: 0, note: 'No customer data connected yet.' },
    website: { key: 'website', label: 'Website', understanding: 'partially-understood', evidenceCount: 1, note: '1 page checked so far (homepage).' },
    reputation: { key: 'reputation', label: 'Reputation', understanding: 'not-connected', evidenceCount: 0, note: 'Not yet checked.' },
    marketing: { key: 'marketing', label: 'Marketing activity', understanding: 'not-connected', evidenceCount: 0, note: 'No advertising accounts connected.' },
    offers: { key: 'offers', label: 'Offers & promotions', understanding: 'not-connected', evidenceCount: 0, note: 'Not yet checked.' },
    competitors: { key: 'competitors', label: 'Competitors', understanding: 'not-connected', evidenceCount: 0, note: 'Not yet checked.' },
    seasonality: { key: 'seasonality', label: 'Seasonality', understanding: 'not-connected', evidenceCount: 0, note: 'Needs months of data.' },
    conversion: { key: 'conversion', label: 'Conversion paths', understanding: 'needs-verification', evidenceCount: 1, note: 'One early observation from your homepage only.' },
  }),
  activity: [
    { id: 'a1', label: 'Checking your website', status: 'finished', startedAt: 'Just now', finishedAt: 'Just now', finding: '1 page checked (homepage). More pages coming next check.', actionRequired: false, persistence: 'temporary', technicalDetail: 'First crawl — homepage only, further pages queued for next run.' },
    { id: 'a2', label: 'Understanding what changed', status: 'waiting', startedAt: null, finishedAt: null, finding: 'Not applicable yet — this is your first check.', actionRequired: false, persistence: 'temporary', technicalDetail: 'No prior snapshot to compare against.' },
    { id: 'a3', label: 'Learning your Digital DNA', status: 'understanding', startedAt: 'Just now', finishedAt: null, finding: null, actionRequired: false, persistence: 'temporary', technicalDetail: 'Initial extraction of business identity signals in progress.' },
  ],
  history: [
    { id: 'h1', date: 'Just now', outcome: 'opportunity-found', summary: 'First check complete — found one early opportunity worth reviewing.', johnActed: null, followUp: 'Check again soon for a fuller picture.' },
  ],
  defaultRunOutcome: 'completed',
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const PREVIEW_SCENARIOS: Record<PreviewScenarioId, PreviewScenario> = {
  'opportunity-found': opportunityFound,
  'no-changes': noChanges,
  'waiting-approval': waitingApproval,
  'check-failed': checkFailed,
  'insufficient-evidence': insufficientEvidence,
  'automation-not-connected': automationNotConnected,
  'first-visit': firstVisit,
}

export const DEFAULT_SCENARIO_ID: PreviewScenarioId = 'opportunity-found'
