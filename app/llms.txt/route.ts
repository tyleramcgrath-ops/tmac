import { GUIDES } from '@/lib/content/guides'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { SITE, abs } from '@/lib/site'

export const revalidate = 86400

// llms.txt: a plain map of the site for AI assistants (https://llmstxt.org).
export function GET() {
  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.name} is a free U.S. attorney directory and plain-English legal information site covering all 50 states and D.C. It is not a law firm and does not give legal advice.`,
    '',
    '## Find a lawyer',
    `- [Attorney search](${abs('/find-a-lawyer')}): search lawyers by practice area and city`,
    `- [Free case review](${abs('/get-started')}): describe a legal problem and get matched with attorneys`,
    `- [Lawyers by state](${abs('/states')})`,
    `- [Lawyers by city](${abs('/cities')})`,
    '',
    '## Practice area guides',
    ...PRACTICE_AREAS.filter((p) => p.guide).map((p) => `- [${p.lawyerTitle}](${abs(`/practice-area/${p.slug}`)}): ${p.short}`),
    '',
    '## Legal guides',
    ...GUIDES.map((g) => `- [${g.title}](${abs(`/guide/${g.slug}`)}): ${g.description}`),
    '',
    '## Reference',
    `- [Common legal questions](${abs('/questions')})`,
    `- [Legal dictionary](${abs('/glossary')})`,
    `- [Legal emergency steps](${abs('/emergency')})`,
    '',
    '## Optional',
    `- [About and editorial policy](${abs('/about')})`,
    `- [Disclaimer](${abs('/disclaimer')})`,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
