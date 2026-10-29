import type { PageAnalysis, Report } from '../types'

// CSV competitor-comparison export.

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const COLUMNS: { header: string; value: (a: PageAnalysis) => unknown }[] = [
  { header: 'Page', value: (a) => (a.isUser ? 'YOUR PAGE' : `Competitor #${a.position}`) },
  { header: 'Position', value: (a) => a.position ?? '' },
  { header: 'URL', value: (a) => a.page?.finalUrl ?? a.serp?.url ?? '' },
  { header: 'Crawl status', value: (a) => a.page?.crawlError ?? 'OK' },
  { header: 'Title', value: (a) => a.page?.title ?? '' },
  { header: 'Title length', value: (a) => a.page?.titleLength ?? '' },
  { header: 'Meta description', value: (a) => a.page?.metaDescription ?? '' },
  { header: 'Meta length', value: (a) => a.page?.metaDescriptionLength ?? '' },
  { header: 'H1', value: (a) => a.page?.h1.join(' | ') ?? '' },
  { header: 'H2 count', value: (a) => a.page?.h2Count ?? '' },
  { header: 'H3 count', value: (a) => a.page?.h3Count ?? '' },
  { header: 'Word count', value: (a) => a.page?.wordCount ?? '' },
  { header: 'Images', value: (a) => a.page?.images.count ?? '' },
  { header: 'Images missing alt', value: (a) => a.page?.images.missingAlt ?? '' },
  { header: 'Internal links', value: (a) => a.page?.links.internal ?? '' },
  { header: 'External links', value: (a) => a.page?.links.external ?? '' },
  { header: 'Schema types', value: (a) => a.page?.schemaTypes.join('; ') ?? '' },
  { header: 'Has FAQ', value: (a) => (a.page ? (a.page.hasFaqSection ? 'yes' : 'no') : '') },
  { header: 'Keyword in title', value: (a) => flag(a, (u) => u.inTitle) },
  { header: 'Keyword in H1', value: (a) => flag(a, (u) => u.inH1) },
  { header: 'Keyword in first 100 words', value: (a) => flag(a, (u) => u.inFirst100Words) },
  { header: 'Keyword density %', value: (a) => a.keywords?.usage.density ?? '' },
  { header: 'Performance score', value: (a) => a.pageSpeed?.performance ?? '' },
  { header: 'LCP (ms)', value: (a) => a.pageSpeed?.lcpMs ?? '' },
  { header: 'CLS', value: (a) => a.pageSpeed?.cls ?? '' },
]

function flag(a: PageAnalysis, pick: (u: NonNullable<PageAnalysis['keywords']>['usage']) => boolean): string {
  return a.keywords ? (pick(a.keywords.usage) ? 'yes' : 'no') : ''
}

export function reportToCsv(report: Report): string {
  const rows: string[] = [COLUMNS.map((c) => csvEscape(c.header)).join(',')]
  const analyses: PageAnalysis[] = []
  if (report.results?.userAnalysis) analyses.push(report.results.userAnalysis)
  analyses.push(...(report.results?.competitors ?? []))
  for (const a of analyses) {
    rows.push(COLUMNS.map((c) => csvEscape(c.value(a))).join(','))
  }
  return rows.join('\r\n')
}
