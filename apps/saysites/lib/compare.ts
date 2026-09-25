// "SaySites vs <provider>" pages for law firms. Every claim about another
// company is either from its own website or labelled as reported by a named
// reviewer, with the source linked. Checked September 2026; re-check before
// changing any figure.

export interface Comparison {
  slug: string
  name: string
  title: string
  description: string
  h1: string
  lede: string
  // Rows: what, SaySites, them. `src` indexes into sources.
  rows: { what: string; us: string; them: string; src?: number[] }[]
  // When the other provider is the better choice. Honest scope.
  theyFit: string
  weFit: string
  faq: { q: string; a: string }[]
  sources: { label: string; url: string }[]
}

export const CHECKED = 'September 2026'

export const COMPARISONS: Comparison[] = [
  {
    slug: 'justia',
    name: 'Justia',
    title: 'SaySites vs Justia Websites for Law Firms',
    description: 'How a $15 a month SaySites law firm website compares with Justia’s Elevate law firm websites on price, contracts, ownership, editing and speed.',
    h1: 'SaySites vs Justia for law firm websites',
    lede: 'Justia is a well-known legal publisher with a directory, WordPress-based firm websites and marketing services. SaySites is a website builder: a fast, professional site you run yourself by asking an assistant for changes. Here’s an honest side by side.',
    rows: [
      { what: 'Website price', us: '$15 a month. Free during early access.', them: 'Law firm websites “start at just $82.50/month when paid annually,” per Justia. Exact tiers are quoted through a calculator.', src: [0] },
      { what: 'Platform', us: 'SaySites, built for speed: lean pages with no plugins.', them: '“A tailored WordPress platform,” per Justia.', src: [0] },
      { what: 'Contract', us: 'Month to month. Cancel anytime.', them: 'Terms aren’t published on Justia’s site; Lawyerist notes pricing requires contacting Justia.', src: [1] },
      { what: 'If you leave', us: 'Your words, photos, bios and domain are yours to take.', them: 'Reviewers disagree: Lawyerist says you own your website, while Grow Law and Veritas report firms needing a rebuild after leaving.', src: [1, 2, 3] },
      { what: 'Making changes', us: 'Ask Sofie in plain English. You see a draft first and can undo anything.', them: 'Managed by Justia’s team; some reviewers report slow updates. Justia also offers AI writing and chat tools.', src: [2, 3, 0] },
      { what: 'Speed', us: 'Every page must score 95+ on Google PageSpeed before it can go live.', them: 'Justia says its sites perform “well above the average” of WordPress sites on Core Web Vitals.', src: [0] },
      { what: 'Directory and ads', us: 'Not included. SaySites is your website, not a directory or ad agency.', them: 'Directory listings, paid placements and PPC management are available.', src: [0] },
    ],
    theyFit: 'Justia can suit a firm that wants its website, directory profile and marketing handled by one legal-focused vendor and prefers someone else to make the changes.',
    weFit: 'SaySites suits a firm that wants a fast, polished site it controls, changed in minutes by asking, for $15 a month with no contract.',
    faq: [
      { q: 'Can I keep my Justia directory profile and use SaySites for my website?', a: 'Yes. A directory profile and your firm’s own website are separate things. Many firms keep directory listings and link them to their own site.' },
      { q: 'Will moving my website hurt my rankings?', a: 'A careful move keeps what you’ve earned: keep the same domain and recreate pages on the same topics, with the same depth. Sofie can help rebuild your practice area pages and attorney bios in your own words.' },
      { q: 'Is SaySites built on WordPress?', a: 'No. SaySites renders lean pages from its own content model, which is how every page can be held to a 95+ speed score.' },
    ],
    sources: [
      { label: 'Justia: Law Firm Websites (Elevate)', url: 'https://www.justia.com/marketing/elevate/law-firm-websites/' },
      { label: 'Lawyerist: Justia review', url: 'https://lawyerist.com/reviews/seo-marketing/justia/' },
      { label: 'Grow Law: Justia Lawyer Directory review', url: 'https://growlaw.co/blog/justia-lawyer-directory' },
      { label: 'Veritas: Justia marketing review', url: 'https://www.veritaslawfirmmarketing.com/justia-marketing-review-2026/' },
    ],
  },
  {
    slug: 'scorpion',
    name: 'Scorpion',
    title: 'SaySites vs Scorpion for Law Firm Websites',
    description: 'How a $15 a month SaySites law firm website compares with Scorpion’s legal marketing websites on price, contracts, ownership and what happens when you leave.',
    h1: 'SaySites vs Scorpion for law firm websites',
    lede: 'Scorpion is a full-service marketing agency: websites on its own platform, SEO, paid ads and more. SaySites is a website builder you run yourself. They solve different problems, so here’s where each one fits.',
    rows: [
      { what: 'Price', us: '$15 a month. Free during early access.', them: 'Not published. Reviewers report roughly $3,000 to $5,000 a month for smaller firms, and more in competitive markets.', src: [1, 2] },
      { what: 'Contract', us: 'Month to month. Cancel anytime.', them: 'Scorpion’s FAQ: “a 12-month contract for our marketing technology and certain marketing services like search engine optimization.” Ads are month to month.', src: [0] },
      { what: 'Platform', us: 'SaySites, built for speed: lean pages with no plugins.', them: 'Scorpion’s own proprietary CMS, per Scorpion.', src: [0] },
      { what: 'If you leave', us: 'Your words, photos, bios and domain are yours to take, any time.', them: 'Per Scorpion, domains, content and imagery are yours after the contract term, but the CMS isn’t, so the site has to be rebuilt elsewhere.', src: [0] },
      { what: 'Making changes', us: 'Ask Sofie in plain English. You see a draft first and can undo anything.', them: 'Handled through your Scorpion account team.', src: [0] },
      { what: 'Speed', us: 'Every page must score 95+ on Google PageSpeed before it can go live.', them: 'We found no published speed data either way.' },
      { what: 'Ads and SEO services', us: 'Not included. SaySites gives you the site and a Visibility Score showing what to improve.', them: 'Full service: SEO, PPC, Local Services Ads and reputation management.', src: [0] },
    ],
    theyFit: 'Scorpion can suit a larger firm, often personal injury, with a marketing budget in the thousands each month that wants an agency to run paid ads and SEO end to end.',
    weFit: 'SaySites suits a solo or small firm that wants a fast, professional website it owns and controls, without a 12-month commitment or agency fees.',
    faq: [
      { q: 'Can I use SaySites and still run Google Ads?', a: 'Yes. Your ads can point to your SaySites pages. Every page loads fast, which helps both visitors and ad quality.' },
      { q: 'I’m in a Scorpion contract. Can I prepare a site now?', a: 'Yes. You can build and refine your SaySites site on its free saysites.com address, then point your domain to it when you’re ready.' },
      { q: 'Is SaySites an agency?', a: 'No. It’s a website builder with an assistant, Sofie, who makes changes when you ask. There are no account managers or retainers.' },
    ],
    sources: [
      { label: 'Scorpion: FAQ', url: 'https://www.scorpion.co/faq/' },
      { label: 'Lucky Fish Media: FindLaw vs Scorpion vs a specialist', url: 'https://www.luckyfishmedia.com/2026/findlaw-vs-scorpion-vs-hiring-a-legal-marketing-specialist-an-honest-comparison/' },
      { label: 'Juris Digital: Scorpion review for law firms', url: 'https://jurisdigital.com/guides/scorpion-marketing-review-law-firms/' },
    ],
  },
]

export function comparison(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug)
}
