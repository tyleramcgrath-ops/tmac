// The Google guidelines every SaySites site is built and checked against.
// This is the single place they're tracked: when Google changes a guideline,
// update the entry here and the check that enforces it, and every site gets
// the change at once. Sites are rendered live by one platform, with no
// per-site themes or plugins, so nothing needs updating site by site.
//
// Review against Google's documentation at least every quarter, and
// whenever Google announces a core or spam update.

export const GUIDELINES_REVIEWED = 'September 2026'

export interface Guideline {
  id: string
  title: string
  // What SaySites does about it, in plain words.
  how: string
  // Where it's enforced in the code.
  where: string
  source: { label: string; url: string }
}

export const GUIDELINES: Guideline[] = [
  {
    id: 'essentials',
    title: 'Google Search Essentials',
    how: 'Every page can be crawled and indexed: clean HTML, one clear main heading, a sitemap, robots.txt and canonical addresses on every site.',
    where: 'lib/render.ts, lib/seo.ts',
    source: { label: 'Google Search Essentials', url: 'https://developers.google.com/search/docs/essentials' },
  },
  {
    id: 'spam',
    title: 'Spam policies',
    how: 'Keyword stuffing and near-copy “doorway” pages can’t be published. Sofie never invents facts, results or reviews, and won’t add hidden text or link schemes.',
    where: 'lib/vibe.ts, lib/sofie.ts',
    source: { label: 'Spam policies for Google web search', url: 'https://developers.google.com/search/docs/essentials/spam-policies' },
  },
  {
    id: 'helpful',
    title: 'Helpful, people-first content',
    how: 'The originality check keeps template and thin pages out of Google until they’re written in the owner’s own words, and flags stock filler phrases.',
    where: 'lib/vibe.ts',
    source: { label: 'Creating helpful, reliable, people-first content', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
  },
  {
    id: 'experience',
    title: 'Page experience and Core Web Vitals',
    how: 'Every page must pass a 95+ speed check before it can go live, is built for phones first, and loads no third-party scripts.',
    where: 'lib/speed.ts',
    source: { label: 'Core Web Vitals and Google Search results', url: 'https://developers.google.com/search/docs/appearance/core-web-vitals' },
  },
  {
    id: 'structured-data',
    title: 'Structured data',
    how: 'Each business is described with the right schema.org type (LegalService, Plumber, Dentist…), plus its address, hours, FAQs and breadcrumbs, and only with facts shown on the page.',
    where: 'lib/seo.ts',
    source: { label: 'General structured data guidelines', url: 'https://developers.google.com/search/docs/appearance/structured-data/sd-policies' },
  },
  {
    id: 'titles',
    title: 'Title links and snippets',
    how: 'Every page has a unique title sized to fit Google’s results and a description written for people, checked before publishing.',
    where: 'lib/seo.ts',
    source: { label: 'Influencing your title links', url: 'https://developers.google.com/search/docs/appearance/title-link' },
  },
  {
    id: 'images',
    title: 'Images',
    how: 'Every image needs a description (alt text), is resized for speed and served in modern formats.',
    where: 'lib/seo.ts, lib/render.ts',
    source: { label: 'Google image SEO best practices', url: 'https://developers.google.com/search/docs/appearance/google-images' },
  },
  {
    id: 'reviews',
    title: 'Reviews',
    how: 'Review requests go to every customer, with nothing offered in return. Testimonials on a site are only real quotes, word for word.',
    where: 'lib/reviews.ts, lib/sofie.ts',
    source: { label: 'Google Maps user-contributed content policy', url: 'https://support.google.com/contributionpolicy/answer/7400114' },
  },
]
