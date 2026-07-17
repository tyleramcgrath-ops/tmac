// Page validity gate shared by /api/seo-scan and /api/crawl.
//
// A fetched response must pass this gate before it enters any analysis
// pipeline. Error pages, WAF/bot-challenge pages, proxy denial pages, and
// empty responses must never be scored — scoring them fabricates audits
// (fix recommendations derived from a firewall's denial message). Blocked
// pages are reported as blocked/unknown, never as findings about the site.

export interface PageValidity {
  ok: boolean
  // Machine-readable reason a page was rejected. Undefined when ok.
  reason?:
    | 'http_error'
    | 'empty_response'
    | 'waf_challenge'
    | 'proxy_denial'
    | 'not_html'
    | 'no_content'
  // Human-readable detail safe to surface in the UI.
  detail?: string
}

// Statuses that may carry an HTML body which must still never be analyzed.
const ERROR_STATUS = (status: number) => status >= 400 || status === 0

// Signatures of WAF / bot-challenge interstitials that can arrive with any
// status code (Cloudflare sometimes serves challenges with 200/503).
const CHALLENGE_PATTERNS: RegExp[] = [
  /just a moment\.\.\./i, // Cloudflare JS challenge title
  /attention required!?\s*\|\s*cloudflare/i,
  /cf-browser-verification|cf_chl_|challenge-platform/i,
  /checking your browser before accessing/i,
  /ddos protection by/i,
  /verify you are a human|are you a robot/i,
  /<title>[^<]*access denied[^<]*<\/title>/i,
  /pardon our interruption/i, // Distil/Imperva
  /request unsuccessful\. incapsula/i,
  /captcha-delivery\.com|geo\.captcha/i, // DataDome
  /px-captcha|_px_/i, // PerimeterX
]

// Signatures of egress/proxy denial bodies (e.g. corporate gateways).
const PROXY_DENIAL_PATTERNS: RegExp[] = [
  /host not in allowlist/i,
  /blocked by (your )?(network|proxy|firewall) polic/i,
  /access to this site is restricted by your administrator/i,
]

const MIN_MEANINGFUL_CHARS = 200 // an HTML doc smaller than this has no analyzable content

export function assessPageValidity(html: string, status: number): PageValidity {
  if (!html || html.trim().length === 0) {
    return { ok: false, reason: 'empty_response', detail: `Empty response (status ${status || 'none'}).` }
  }

  const head = html.slice(0, 40_000)

  for (const re of PROXY_DENIAL_PATTERNS) {
    if (re.test(head)) {
      return {
        ok: false,
        reason: 'proxy_denial',
        detail: 'The response is a network/proxy denial page, not the website. Nothing about this page is known.',
      }
    }
  }

  for (const re of CHALLENGE_PATTERNS) {
    if (re.test(head)) {
      return {
        ok: false,
        reason: 'waf_challenge',
        detail: 'The site served a bot-protection challenge instead of content. The real page could not be read.',
      }
    }
  }

  if (ERROR_STATUS(status)) {
    return {
      ok: false,
      reason: 'http_error',
      detail: `The server responded with HTTP ${status || 'no status'}. Error pages are never analyzed.`,
    }
  }

  // A response that isn't an HTML document (e.g. JSON, XML sitemap, binary
  // served with a wrong URL) has nothing our extractor can honestly score.
  if (!/<(!doctype\s+html|html|head|body|title|h1|p|div)\b/i.test(head)) {
    return { ok: false, reason: 'not_html', detail: 'The response is not an HTML document.' }
  }

  if (html.length < MIN_MEANINGFUL_CHARS) {
    return {
      ok: false,
      reason: 'no_content',
      detail: 'The document is too small to contain meaningful content.',
    }
  }

  return { ok: true }
}
