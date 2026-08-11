// Comparison content for /contact/compare.
//
// Ground rules for everything in this file, because dishonest comparison pages
// lose trust faster than they win traffic:
//   - No invented weaknesses. Every "con" is either published behaviour or a
//     straightforward consequence of the product's shape.
//   - Contact Scan's own limitations are listed as plainly as anyone else's.
//     It is a free one-shot scanner, not a monitoring platform, and the pages
//     say so.
//   - Pricing is what the vendors published as of the date below, gathered
//     from public pricing pages and industry round-ups. It moves constantly,
//     so every page tells the reader to check before buying.

export const PRICING_CHECKED = 'August 2026'

export interface Row {
  label: string
  ours: string
  theirs: string
  /** Who genuinely has the advantage on this dimension. */
  edge: 'ours' | 'theirs' | 'even'
}

export interface Faq {
  q: string
  a: string
}

export interface Comparison {
  slug: string
  name: string
  /** Vendor site, for the reader to verify anything here. */
  url: string
  category: string
  blurb: string
  metaTitle: string
  metaDescription: string
  intro: string[]
  rows: Row[]
  theirPros: string[]
  theirCons: string[]
  verdict: string
  chooseThem: string
  chooseUs: string
  faqs: Faq[]
}

/** What Contact Scan is, in one place, so no page can drift from another. */
export const SCAN = {
  name: 'Contact Scan',
  what: 'a free LLM visibility scan: it writes the questions your buyers actually ask, puts them to an assistant cold, and reports whether you were named, where, and who won instead',
  pros: [
    'Free, with no account, no card and no sales call',
    'A finished report in about a minute',
    'Shows the assistant’s full answer, so every result is auditable',
    'Asks cold, then grades with a separate call — the grader never sees the brand it is grading for',
    'The score is computed from the results, not asked of a model, so a rerun of the same scan gives the same number',
    'Names every competing brand the answer mentioned, and counts share of voice',
  ],
  cons: [
    'One-off scans — no scheduled tracking, alerting or trend charts over time',
    'Six questions per scan, not a continuous sample of hundreds',
    'History is saved in your browser, not a shared team workspace',
    'No integrations, API, or crawl of the sources behind an answer',
    'Measures the assistants it is configured for, not every engine on the market',
  ],
}

export const COMPARISONS: Comparison[] = [
  {
    slug: 'profound',
    name: 'Profound',
    url: 'https://www.tryprofound.com',
    category: 'Enterprise AI visibility platform',
    blurb:
      'The enterprise end of the category: deep answer-engine analytics, agent traffic data and custom reporting, priced accordingly.',
    metaTitle: 'Contact Scan vs Profound: features, pricing, and which is better in 2026',
    metaDescription:
      'An honest comparison of Contact Scan and Profound for tracking brand visibility in AI answers — what each measures, real pricing, free options, and which one fits your team in 2026.',
    intro: [
      'Profound is one of the best-known platforms in AI search visibility, aimed squarely at enterprise marketing teams. It monitors how brands surface across answer engines at scale, layers on citation and agent-traffic analytics, and wraps it in the reporting a large organisation needs.',
      'Contact Scan solves a much narrower problem: it answers "am I in the answer, right now, and who is there instead" in about a minute, for free, without an account. These are not the same purchase, and the honest comparison is about scope and commitment rather than which is better.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free one-shot visibility scan', theirs: 'A continuous enterprise monitoring platform', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Published plans start around $499/mo; enterprise agreements are quoted', edge: 'ours' },
      { label: 'Free option', ours: 'The whole product', theirs: 'Demo-led; no self-serve free tier', edge: 'ours' },
      { label: 'Time to first result', ours: 'About a minute, no signup', theirs: 'A sales conversation and onboarding first', edge: 'ours' },
      { label: 'Method and accuracy', ours: 'Six live answers per scan, each shown in full and graded by a separate call', theirs: 'Large, continuous prompt samples across many engines — a far more statistically representative picture', edge: 'theirs' },
      { label: 'Tracking over time', ours: 'Scans saved locally; no trends or alerts', theirs: 'Historical trends, alerting and reporting', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'A full platform to learn, with the depth that implies', edge: 'ours' },
      { label: 'Best for', ours: 'Finding out where you stand today', theirs: 'Running AI visibility as an ongoing programme', edge: 'even' },
    ],
    theirPros: [
      'Breadth of engines and volume of prompts tracked',
      'Citation and agent-traffic analytics that a one-shot scan cannot produce',
      'Historical trends, alerting and enterprise reporting',
      'Support and onboarding for large teams',
    ],
    theirCons: [
      'Enterprise pricing puts it out of reach for small teams and solo operators',
      'No self-serve free tier — evaluation goes through sales',
      'More platform than a team needs if the question is simply "are we visible?"',
    ],
    verdict:
      'If AI visibility is a budgeted programme with a team behind it, Profound is built for that and Contact Scan is not. If you want an answer this afternoon, or you are still working out whether this problem is real for your brand, start with the free scan and take the evidence into that buying conversation.',
    chooseThem: 'You need continuous tracking, alerting and reporting across many engines, and you have the budget to run it as a programme.',
    chooseUs: 'You want to know where you stand today, for free, without a sales call — and you want to read the actual answers rather than a dashboard summary.',
    faqs: [
      {
        q: 'Is Contact Scan a good Profound alternative?',
        a: 'It is a good free starting point, not a like-for-like replacement. Contact Scan tells you whether you appear in AI answers today and who appears instead. Profound tracks that continuously at enterprise scale with alerting and reporting. Many teams use a free scan first to decide whether the paid programme is worth funding.',
      },
      {
        q: 'Profound vs Contact Scan — which is better?',
        a: 'They are better at different jobs. For a one-off, auditable read on your visibility, Contact Scan is faster and free. For ongoing measurement across many engines with historical trends, Profound is the more capable product.',
      },
      {
        q: 'How much does Profound cost?',
        a: `Published plans have started around $499 per month, with enterprise agreements quoted individually. Pricing was last checked in ${PRICING_CHECKED} and changes often, so confirm on their site.`,
      },
      {
        q: 'Can I try Profound for free?',
        a: 'Profound is demo-led rather than self-serve, so evaluation usually starts with a sales conversation. Contact Scan requires no account, which is why it is often the first thing teams run.',
      },
    ],
  },
  {
    slug: 'peec-ai',
    name: 'Peec AI',
    url: 'https://peec.ai',
    category: 'Mid-market AI visibility tracking',
    blurb:
      'A fast-growing mid-market tracker: prompt monitoring, competitor benchmarking and reporting at agency-friendly prices.',
    metaTitle: 'Contact Scan vs Peec AI: features, pricing, and which is better in 2026',
    metaDescription:
      'Contact Scan vs Peec AI compared for AI search visibility tracking — pricing, free options, measurement method, speed and ease of use, with an honest verdict for 2026.',
    intro: [
      'Peec AI has become one of the popular mid-market answers to AI visibility: track a set of prompts, watch your share of voice against competitors, and report it to clients or leadership on a schedule.',
      'Contact Scan overlaps only at the moment of measurement. It runs a fresh scan on demand and shows you the raw answers behind it, but it does not watch anything for you between runs.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free one-shot visibility scan', theirs: 'A subscription prompt-tracking platform', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Published plans have started around €89/mo, rising with prompt volume and seats', edge: 'ours' },
      { label: 'Free option', ours: 'The whole product', theirs: 'Trial-led rather than a permanent free tier', edge: 'ours' },
      { label: 'Time to first result', ours: 'About a minute, no signup', theirs: 'Sign up, configure prompts, wait for the first run', edge: 'ours' },
      { label: 'Method and accuracy', ours: 'Six live answers per scan, shown in full, graded by a separate call', theirs: 'Scheduled sampling of a larger prompt set — better at representing the average, not just a moment', edge: 'theirs' },
      { label: 'Tracking over time', ours: 'Scans saved locally; no trends or alerts', theirs: 'Trends, competitor benchmarking and scheduled reports', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Straightforward, but it is still a platform to set up', edge: 'ours' },
      { label: 'Best for', ours: 'A quick, auditable read', theirs: 'Agencies reporting to clients month after month', edge: 'even' },
    ],
    theirPros: [
      'Priced for agencies and mid-market teams rather than enterprise',
      'Competitor benchmarking and share-of-voice over time',
      'Scheduled reporting that suits client work',
      'Larger prompt sets than a single scan can cover',
    ],
    theirCons: [
      'A recurring cost, which is hard to justify before you know the problem is real',
      'Setup and configuration before the first useful number',
      'Trial-led rather than permanently free',
    ],
    verdict:
      'For agency reporting and month-over-month movement, Peec AI is doing a job Contact Scan does not attempt. Contact Scan is the better first move: prove the gap exists, in writing, with the answers attached — then decide whether continuous tracking earns its subscription.',
    chooseThem: 'You are reporting to clients or leadership on a cadence and need the trend line, not a snapshot.',
    chooseUs: 'You want a free, immediate answer with the raw model output attached, and you do not want another subscription yet.',
    faqs: [
      {
        q: 'Is Contact Scan a good Peec AI alternative?',
        a: 'For a free one-off check, yes. For scheduled tracking, competitor trends and client reporting, Peec AI does things Contact Scan deliberately does not.',
      },
      {
        q: 'Peec AI vs Contact Scan — which is better?',
        a: 'Peec AI is better if you need the trend line over weeks. Contact Scan is better if you want a free, auditable snapshot in the next few minutes.',
      },
      {
        q: 'How much does Peec AI cost?',
        a: `Published plans have started around €89 per month and scale with prompt volume and seats. Checked ${PRICING_CHECKED}; verify current pricing on their site.`,
      },
      {
        q: 'Does Contact Scan track my visibility over time?',
        a: 'Not automatically. Each scan is saved in your browser so you can rerun the same brand later and compare, but there is no scheduling or alerting. That is exactly what a paid tracker like Peec AI adds.',
      },
    ],
  },
  {
    slug: 'otterly-ai',
    name: 'Otterly.AI',
    url: 'https://otterly.ai',
    category: 'Budget AI search monitoring',
    blurb:
      'One of the most affordable ongoing monitors in the category, tracking prompts and links across the major answer engines.',
    metaTitle: 'Contact Scan vs Otterly.AI: features, pricing, and which is better in 2026',
    metaDescription:
      'Contact Scan vs Otterly.AI for AI search monitoring — a fair look at pricing from $29/mo, free options, what each tool measures, and which suits small teams in 2026.',
    intro: [
      'Otterly.AI is the budget-friendly entry point to continuous AI search monitoring, with published plans starting well below the rest of the category and a following among smaller marketing teams.',
      'Contact Scan is free but one-shot. The real question is not price, it is whether you need something watching your prompts every week or an answer right now.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free one-shot visibility scan', theirs: 'A low-cost ongoing monitor', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Published tiers from about $29/mo, up to roughly $489/mo', edge: 'ours' },
      { label: 'Free option', ours: 'The whole product', theirs: 'Paid from the entry tier', edge: 'ours' },
      { label: 'Time to first result', ours: 'About a minute, no signup', theirs: 'Account and prompt setup first', edge: 'ours' },
      { label: 'Method and accuracy', ours: 'Six live answers, shown in full, graded separately', theirs: 'Repeated tracking of your prompt list across engines over time', edge: 'theirs' },
      { label: 'Tracking over time', ours: 'Scans saved locally; no trends or alerts', theirs: 'Ongoing monitoring with change tracking', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Simple for the category, still a setup step', edge: 'ours' },
      { label: 'Best for', ours: 'A first look, free', theirs: 'Small teams wanting cheap continuous cover', edge: 'even' },
    ],
    theirPros: [
      'Among the cheapest ongoing monitoring in the category',
      'Covers the major answer engines rather than one',
      'Link and mention tracking over time',
      'Approachable for small marketing teams',
    ],
    theirCons: [
      'Still a subscription, and the entry tier is limited on prompt volume',
      'Requires an account and configuration before the first result',
      'Trend data only becomes useful after weeks of collection',
    ],
    verdict:
      'Otterly.AI is a sensible, low-cost way to keep watching. Contact Scan is the fastest way to find out whether there is anything worth watching. If the free scan shows you are absent from the answers that matter, Otterly is a reasonable next step that will not blow a budget.',
    chooseThem: 'You already know you have a visibility problem and want affordable, continuous monitoring of it.',
    chooseUs: 'You want a free answer immediately, with the model output shown, before committing to any subscription.',
    faqs: [
      {
        q: 'Is Contact Scan a good Otterly.AI alternative?',
        a: 'As a free snapshot, yes. As a replacement for ongoing monitoring, no — Otterly.AI keeps checking your prompts on a schedule, which Contact Scan does not do.',
      },
      {
        q: 'Otterly.AI vs Contact Scan — which is better?',
        a: 'Otterly.AI wins on continuity and cost-per-month value if you need monitoring. Contact Scan wins on immediacy, price and transparency for a one-off read.',
      },
      {
        q: 'How much does Otterly.AI cost?',
        a: `Published tiers have started at roughly $29 per month, with higher plans around $189 and $489. Checked ${PRICING_CHECKED}; confirm on their pricing page.`,
      },
      {
        q: 'What is the best free AI visibility tool?',
        a: 'For a free, no-account check that shows you the actual AI answers, Contact Scan is a strong option. Semrush and Ahrefs also publish free checkers, and HubSpot offers a free grader — each measures something slightly different, so running more than one is reasonable.',
      },
    ],
  },
  {
    slug: 'scrunch-ai',
    name: 'Scrunch AI',
    url: 'https://www.scrunchai.com',
    category: 'Enterprise AI visibility and agent experience',
    blurb:
      'Enterprise-oriented visibility and "agent experience" tooling, now part of Sitecore following its 2026 acquisition.',
    metaTitle: 'Contact Scan vs Scrunch AI: features, pricing, and which is better in 2026',
    metaDescription:
      'Contact Scan vs Scrunch AI compared — AI visibility measurement, pricing from around $250/mo, free options, method and ease of use, with an honest 2026 verdict.',
    intro: [
      'Scrunch AI works the enterprise end of AI visibility, extending past measurement into how AI agents encounter and read your site. It was acquired by Sitecore in 2026, which points it further toward large content organisations.',
      'Contact Scan does one slice of that: it shows you what an assistant says when a buyer asks, and whether you are in it. Free, immediately, with the answers on screen.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free one-shot visibility scan', theirs: 'An enterprise visibility and agent-experience platform', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Published entry around $250/mo, with enterprise agreements above that', edge: 'ours' },
      { label: 'Free option', ours: 'The whole product', theirs: 'No self-serve free tier', edge: 'ours' },
      { label: 'Time to first result', ours: 'About a minute, no signup', theirs: 'Onboarding, usually sales-assisted', edge: 'ours' },
      { label: 'Method and accuracy', ours: 'Six live answers, shown in full, graded separately', theirs: 'Continuous monitoring plus analysis of how agents crawl and read your site', edge: 'theirs' },
      { label: 'Tracking over time', ours: 'Scans saved locally; no trends or alerts', theirs: 'Ongoing tracking and enterprise reporting', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Depth means a learning curve', edge: 'ours' },
      { label: 'Best for', ours: 'A quick, auditable read', theirs: 'Large sites optimising for AI agents end to end', edge: 'even' },
    ],
    theirPros: [
      'Goes beyond measurement into how agents crawl and consume your site',
      'Enterprise reporting and continuous monitoring',
      'Backing and integration path following the Sitecore acquisition',
      'Suited to large content estates',
    ],
    theirCons: [
      'Entry pricing is well above what a small team will approve on a hunch',
      'No self-serve free tier for evaluation',
      'Broader than necessary if you only want to know whether you are cited',
    ],
    verdict:
      'Scrunch AI is aimed at organisations treating AI agents as a channel to be engineered. That is real work and Contact Scan does not do it. What Contact Scan does is make the case: run the free scan, see which competitor keeps getting named instead of you, and use that to justify the bigger investment.',
    chooseThem: 'You run a large site and want to optimise the whole agent experience, not just measure mentions.',
    chooseUs: 'You want evidence today, at no cost, with the raw answers attached.',
    faqs: [
      {
        q: 'Is Contact Scan a good Scrunch AI alternative?',
        a: 'For free, immediate measurement, yes. Scrunch AI covers agent crawling and enterprise workflows that a single scan does not touch.',
      },
      {
        q: 'Scrunch AI vs Contact Scan — which is better?',
        a: 'Scrunch AI is the more complete enterprise platform. Contact Scan is better when you want a fast, free, auditable answer without procurement.',
      },
      {
        q: 'How much does Scrunch AI cost?',
        a: `Published entry pricing has been around $250 per month, with larger agreements quoted. Checked ${PRICING_CHECKED}; confirm directly, particularly given the Sitecore acquisition.`,
      },
      {
        q: 'Do I need an enterprise tool to check AI visibility?',
        a: 'No. To find out whether you are named in AI answers, a free scan is enough. Enterprise tooling earns its cost when you need continuous measurement, many engines, and the workflow to act on it across a large team.',
      },
    ],
  },
  {
    slug: 'semrush-ai-visibility',
    name: 'Semrush AI Visibility',
    url: 'https://www.semrush.com/free-tools/ai-search-visibility-checker/',
    category: 'Free checker plus paid AI toolkit',
    blurb:
      'A free AI visibility score from a household-name SEO suite, with deeper AI tracking available inside the paid product.',
    metaTitle: 'Contact Scan vs Semrush AI Visibility Checker: which is better in 2026',
    metaDescription:
      'Contact Scan vs Semrush’s AI Visibility Checker — how each measures brand presence in AI answers, what is free, daily limits, accuracy and ease of use in 2026.',
    intro: [
      'Semrush publishes a free AI Search Visibility Checker that scores a brand out of 100 from its index of prompts, with heavier AI tracking inside the paid Semrush toolkit. For anyone already living in Semrush, it is the path of least resistance.',
      'Contact Scan takes the opposite approach to the same question. Rather than scoring you against an index, it asks live questions and shows you the answers that came back, so you can read exactly what a buyer would see.',
    ],
    rows: [
      { label: 'What it is', ours: 'A live scan against fresh answers', theirs: 'A score derived from an indexed prompt set, plus paid tracking', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Checker is free; deeper AI tracking sits inside paid Semrush plans', edge: 'even' },
      { label: 'Free option', ours: 'Unlimited scans, no account', theirs: 'Free checker, reported around three uses per day', edge: 'ours' },
      { label: 'Time to first result', ours: 'About a minute', theirs: 'Seconds for the free score', edge: 'theirs' },
      { label: 'Method and accuracy', ours: 'Live answers shown in full and graded by a separate call', theirs: 'Large indexed prompt corpus — broader sample, but you do not see the underlying answers', edge: 'even' },
      { label: 'Tracking over time', ours: 'Scans saved locally', theirs: 'Available in the paid toolkit', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Very easy, and familiar if you already use Semrush', edge: 'even' },
      { label: 'Best for', ours: 'Seeing the actual answers and who won them', theirs: 'A fast score inside an existing SEO workflow', edge: 'even' },
    ],
    theirPros: [
      'Genuinely free for a quick score, with no account needed',
      'Very fast — a number in seconds',
      'Backed by a large prompt index and competitor comparison',
      'Sits alongside the rest of your SEO data if you are already a customer',
    ],
    theirCons: [
      'Free use is capped at a few checks per day',
      'You get a score rather than the answers behind it',
      'Continuous AI tracking requires a paid Semrush plan',
    ],
    verdict:
      'These pair well rather than compete. Semrush gives you a fast score from a broad index; Contact Scan shows you the actual sentences, the placement, and which rival got recommended instead. If you want a number, use Semrush. If you want the evidence to take to a content meeting, run the scan.',
    chooseThem: 'You want an instant score, or you already run your SEO programme inside Semrush.',
    chooseUs: 'You want to read the real answers, see every brand named, and run as many scans as you like without a daily cap.',
    faqs: [
      {
        q: 'Is Contact Scan a good Semrush alternative?',
        a: 'For AI visibility specifically, it is a good free complement. Semrush is a full SEO suite and Contact Scan is not trying to replace that — it replaces the single step of checking whether AI answers mention you.',
      },
      {
        q: 'Semrush AI Visibility Checker vs Contact Scan — which is better?',
        a: 'Semrush is faster to a number and draws on a bigger sample. Contact Scan is more transparent, because it shows the full answer text and every brand in it, and it has no daily limit.',
      },
      {
        q: 'Is the Semrush AI visibility checker free?',
        a: `Yes, the standalone checker is free and has been usable a few times per day without an account. Deeper AI tracking is part of paid Semrush plans. Checked ${PRICING_CHECKED}.`,
      },
      {
        q: 'Why do two AI visibility tools give different scores?',
        a: 'Because they measure different things. Index-based tools score you against a stored corpus of prompts; live tools ask fresh questions and read the replies. Model answers also vary between runs, so any single score is a sample rather than a fixed ranking.',
      },
    ],
  },
  {
    slug: 'ahrefs-brand-radar',
    name: 'Ahrefs Brand Radar',
    url: 'https://ahrefs.com/brand-radar',
    category: 'Brand mentions across AI engines',
    blurb:
      'Ahrefs’ take on AI visibility: brand mentions and citations across the major AI platforms, tied to its backlink and authority data.',
    metaTitle: 'Contact Scan vs Ahrefs Brand Radar: features, pricing, and which wins in 2026',
    metaDescription:
      'Contact Scan vs Ahrefs Brand Radar for AI search visibility — coverage across AI platforms, free access, method, speed and accuracy, with a straight verdict for 2026.',
    intro: [
      'Ahrefs Brand Radar tracks how often a brand is mentioned and cited across the major AI platforms, and connects that to the link and authority data Ahrefs already holds. That connection is the interesting part: it hints at why you are or are not being cited.',
      'Contact Scan answers a narrower question with more of the receipt: here is the question, here is the answer, here is where you appeared in it, here is everyone else who did.',
    ],
    rows: [
      { label: 'What it is', ours: 'A live scan against fresh answers', theirs: 'Mention and citation tracking across AI platforms', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Brand checks are available free; the full Ahrefs suite is paid', edge: 'even' },
      { label: 'Free option', ours: 'Unlimited scans, no account', theirs: 'Free brand checks across several AI platforms', edge: 'even' },
      { label: 'Time to first result', ours: 'About a minute', theirs: 'Fast', edge: 'theirs' },
      { label: 'Method and accuracy', ours: 'Live answers shown in full and graded separately', theirs: 'Aggregated mention and citation frequency across six AI platforms', edge: 'theirs' },
      { label: 'Engine coverage', ours: 'The assistants the deployment is configured for', theirs: 'Broad — ChatGPT, Gemini, Perplexity, Copilot and Google AI surfaces', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Easy, and richer if you already use Ahrefs', edge: 'even' },
      { label: 'Best for', ours: 'Reading the answers your buyers get', theirs: 'Mention volume across engines, tied to authority data', edge: 'even' },
    ],
    theirPros: [
      'Coverage across six AI platforms rather than one',
      'Free brand checks without a card',
      'Links AI mentions to backlink and authority data, which suggests the fix',
      'Backed by a mature crawling infrastructure',
    ],
    theirCons: [
      'Aggregate frequency rather than the individual answers a buyer reads',
      'Full value depends on an Ahrefs subscription',
      'Built around brand mentions, not the buyer question that produced them',
    ],
    verdict:
      'Brand Radar is the stronger tool for breadth — more engines, more volume, and authority data that hints at causes. Contact Scan is stronger for depth on a single question: what exactly did the assistant say, and who did it recommend? Used together, one tells you the scale of the gap and the other tells you what it looks like.',
    chooseThem: 'You want mention volume across many AI platforms, especially if you already pay for Ahrefs.',
    chooseUs: 'You want to see the literal answers and the competitors inside them, and you want a prioritised plan off the back of it.',
    faqs: [
      {
        q: 'Is Contact Scan a good Ahrefs Brand Radar alternative?',
        a: 'It is a good free complement. Brand Radar covers more engines and more volume; Contact Scan shows the actual answers and produces an action plan from them.',
      },
      {
        q: 'Ahrefs Brand Radar vs Contact Scan — which is better?',
        a: 'Brand Radar is better for breadth of coverage. Contact Scan is better for auditable, question-level evidence and for getting to a plan quickly.',
      },
      {
        q: 'Is Ahrefs Brand Radar free?',
        a: `Ahrefs has offered free brand checks across several AI platforms without a card, with fuller functionality inside paid plans. Checked ${PRICING_CHECKED}; confirm on their site.`,
      },
      {
        q: 'Which AI engines should I be tracking?',
        a: 'Start with the assistants your buyers actually use — ChatGPT dominates AI referral traffic, with Perplexity, Gemini and Copilot behind it. Coverage matters more once you are running a continuous programme; for a first read, one engine tells you plenty.',
      },
    ],
  },
  {
    slug: 'hubspot-aeo-grader',
    name: 'HubSpot AEO Grader',
    url: 'https://www.hubspot.com',
    category: 'Free one-shot AI visibility grader',
    blurb:
      'A free brand snapshot from HubSpot, checking a set of prompts across several assistants and scoring the result.',
    metaTitle: 'Contact Scan vs HubSpot AEO Grader: free AI visibility tools compared (2026)',
    metaDescription:
      'Two free AI visibility checkers compared: Contact Scan and HubSpot’s AEO Grader. What each measures, prompt limits, transparency, speed and which to use in 2026.',
    intro: [
      'HubSpot’s AEO Grader is the closest thing in this list to a direct comparison: both are free, both are one-shot, and both answer "does AI mention my brand?" without a subscription. HubSpot runs a set of prompts across several assistants and grades the outcome.',
      'The differences are in what you get back and how much you can inspect. This is the fairest fight on the site, so the table below is the honest one.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free one-shot visibility scan', theirs: 'A free one-shot brand grader', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'Free', edge: 'even' },
      { label: 'Free option', ours: 'Unlimited scans, no account', theirs: 'Free, reported around 25 prompts, no card required', edge: 'even' },
      { label: 'Engine coverage', ours: 'The assistants the deployment is configured for', theirs: 'Several assistants including ChatGPT, Gemini and Perplexity', edge: 'theirs' },
      { label: 'Prompt volume', ours: 'Six questions per scan, written for your category', theirs: 'A larger prompt allowance', edge: 'theirs' },
      { label: 'Method and accuracy', ours: 'Answers shown in full; graded by a separate call that never sees the tracked brand', theirs: 'Graded snapshot across a wider prompt set', edge: 'ours' },
      { label: 'What you get back', ours: 'Every answer, every brand named, share of voice, and a prioritised plan', theirs: 'A score and summary report', edge: 'ours' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'Easy, and useful if you already run HubSpot', edge: 'even' },
    ],
    theirPros: [
      'Genuinely free with no card',
      'Covers several assistants in one run',
      'A larger prompt allowance than a single Contact Scan',
      'Fits neatly if your marketing already runs on HubSpot',
    ],
    theirCons: [
      'A graded summary rather than the answers themselves',
      'Designed partly as an entry point into the HubSpot ecosystem',
      'Less useful if you want to interrogate a specific buyer question',
    ],
    verdict:
      'Both are free, so run both — they disagree in interesting ways. HubSpot covers more assistants and more prompts, which makes it the better breadth check. Contact Scan shows the actual sentences, names every competing brand in them, and hands you a prioritised plan, which makes it the better evidence.',
    chooseThem: 'You want breadth across several assistants for free, or your stack is already HubSpot.',
    chooseUs: 'You want to read what the assistant actually said, see who beat you, and leave with a plan rather than a grade.',
    faqs: [
      {
        q: 'Is Contact Scan a good HubSpot AEO Grader alternative?',
        a: 'Yes, and they are complementary. HubSpot checks more prompts across more assistants; Contact Scan shows you the underlying answers and turns them into a plan. Both are free, so there is little reason to pick just one.',
      },
      {
        q: 'HubSpot AEO Grader vs Contact Scan — which is better?',
        a: 'HubSpot is better for breadth. Contact Scan is better for transparency and for producing something actionable from the result.',
      },
      {
        q: 'Are free AI visibility checkers accurate?',
        a: 'They are samples, not verdicts. Assistants answer the same question differently between runs, so any single check is a snapshot. Contact Scan is explicit about this and shows the raw answers so you can judge them yourself.',
      },
      {
        q: 'What is the best free AI visibility tool in 2026?',
        a: 'There is no single winner. HubSpot and Semrush give you fast breadth, Ahrefs offers free brand checks across several engines, and Contact Scan gives you the full answers plus a plan. Running two or three takes ten minutes and gives a far more reliable picture than trusting one score.',
      },
    ],
  },
  {
    slug: 'contact-studios',
    name: 'Contact Studios',
    url: 'https://www.contact.so',
    category: 'Full-service search agency',
    blurb:
      'The agency behind the scanner. Where the tool measures the gap, the agency is the team that closes it.',
    metaTitle: 'Contact Scan vs Contact Studios: free tool or full agency in 2026?',
    metaDescription:
      'Should you run the free Contact Scan or hire Contact Studios? An honest look at what the tool measures, what the agency does, cost, speed and when each one is the right call.',
    intro: [
      'This is the odd comparison on the list, because they are the same brand. Contact Scan is the free tool; Contact Studios is the search agency that built it. One measures the problem, the other is hired to fix it.',
      'Worth being blunt: a scan will never write your content, earn you placements in the roundups the models quote, or fix your technical SEO. It tells you, precisely and for free, whether those things are worth paying for.',
    ],
    rows: [
      { label: 'What it is', ours: 'A free measurement tool', theirs: 'A full-service SEO, content and video agency', edge: 'even' },
      { label: 'Pricing', ours: 'Free', theirs: 'A retainer, scoped on a call', edge: 'ours' },
      { label: 'Free option', ours: 'The whole product', theirs: 'The scan itself, plus the initial call', edge: 'even' },
      { label: 'Time to first result', ours: 'About a minute', theirs: 'A strategy in weeks, results over months', edge: 'ours' },
      { label: 'What it changes', ours: 'Nothing — it only measures', theirs: 'Content, technical SEO, placements and the work that moves visibility', edge: 'theirs' },
      { label: 'Depth', ours: 'Six buyer questions, one moment in time', theirs: 'Full search market analysis, strategy and ongoing execution', edge: 'theirs' },
      { label: 'Ease of use', ours: 'Two fields and a button', theirs: 'A partnership, with the onboarding that implies', edge: 'ours' },
      { label: 'Best for', ours: 'Deciding whether you have a problem', theirs: 'Actually fixing it', edge: 'even' },
    ],
    theirPros: [
      'Does the work rather than reporting on it — content, technical SEO, placements',
      'Published client outcomes across revenue, rankings and views',
      'Strategy grounded in your whole search market, not six questions',
      'A team that keeps going after the report is read',
    ],
    theirCons: [
      'A retainer, which is a real budget decision',
      'Results build over months, not minutes',
      'More than you need if you only want to check where you stand',
    ],
    verdict:
      'Run the scan first — it is free and takes a minute. If it shows you are already named in the answers your buyers ask, you may not need an agency yet. If a competitor owns every answer, you now have the evidence, in their own words, to bring to the call.',
    chooseThem: 'The scan found a real gap and you want a team to close it across content, technical SEO and placements.',
    chooseUs: 'You want to know where you stand before spending anything.',
    faqs: [
      {
        q: 'Is Contact Scan free?',
        a: 'Yes. No account, no card, no sales call. It is built by Contact Studios as a way to show the problem rather than describe it.',
      },
      {
        q: 'Do I need an agency to improve my AI visibility?',
        a: 'Not always. Being named in AI answers largely comes from third-party coverage — roundups, comparisons and reviews the model trusts — plus clear, quotable facts on your own pages. A capable in-house team can do that. An agency helps when you want it done faster and at scale.',
      },
      {
        q: 'What does Contact Studios actually do?',
        a: 'Search market analysis, search strategy, technical SEO, content writing and production, image creation, and LLM SEO — the work that gets a brand cited in AI answers as well as ranked in Google.',
      },
      {
        q: 'Will the scan tell me what to fix?',
        a: 'Yes. Every scan ends with a verdict and three to five prioritised actions drawn from what the answers actually showed — which competitor keeps winning, and which buyer questions you disappear from.',
      },
    ],
  },
]

export function findComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((item) => item.slug === slug)
}

/** Everything except the given slug, for cross-linking between pages. */
export function otherComparisons(slug: string): Comparison[] {
  return COMPARISONS.filter((item) => item.slug !== slug)
}
