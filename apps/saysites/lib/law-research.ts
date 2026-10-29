// Our October 2026 test of 105 top-ranking law firm websites (method and
// data: marketing/law-research in the repo; article: /blog/we-tested-top-
// ranking-law-firm-websites). Middle (median) values; Lighthouse figures from
// a mobile test of 10. SaySites figures are our example law sites, measured
// the same way on our test server. Never name a firm or vendor with these.
export const LAW_RESEARCH = {
  date: 'October 2026',
  sites: 105,
  lighthouseSample: 10,
  article: '/blog/we-tested-top-ranking-law-firm-websites',
  rows: [
    { label: 'Mobile speed score (out of 100)', them: '52', us: '100 (every page must reach 95)' },
    { label: 'Main content shown on a phone', them: '9.6 seconds', us: '1.2 seconds' },
    { label: 'Page size', them: '2.2 MB', us: 'About 100 KB' },
    { label: 'Script tags on the home page', them: '45', us: 'No third-party scripts' },
    { label: 'Request form on the home page', them: 'About 3 in 4', us: 'On every page' },
    { label: 'Attorneys described for Google', them: '7% use the attorney type', us: 'Every attorney shown' },
    { label: 'Calls measured', them: 'About 1 in 4', us: 'Every call tap, built in' },
  ],
} as const
