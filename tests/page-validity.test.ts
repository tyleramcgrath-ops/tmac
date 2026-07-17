import { describe, expect, it } from 'vitest'
import { assessPageValidity } from '../app/api/seo-scan/page-validity'

const REAL_PAGE = `<!doctype html><html lang="en"><head><title>Acme Plumbing — Emergency Plumber</title>
<meta name="description" content="24/7 emergency plumbing."></head>
<body><h1>Emergency Plumbing</h1><p>${'We fix burst pipes, water heaters, and drains. '.repeat(30)}</p></body></html>`

describe('assessPageValidity — error pages excluded', () => {
  it('rejects a 403 with an HTML body (firewall message, not the site)', () => {
    const v = assessPageValidity('<html><body><p>Forbidden: request blocked.</p></body></html>', 403)
    expect(v.ok).toBe(false)
    expect(v.reason).toBe('http_error')
  })

  it.each([404, 429, 500, 502, 503])('rejects HTTP %i even with a substantial body', (status) => {
    const v = assessPageValidity(REAL_PAGE, status)
    expect(v.ok).toBe(false)
    expect(v.reason).toBe('http_error')
  })

  it('rejects status 0 (network failure)', () => {
    expect(assessPageValidity('<html><body>x</body></html>', 0).ok).toBe(false)
  })
})

describe('assessPageValidity — WAF/challenge pages excluded', () => {
  it('rejects a Cloudflare JS challenge even when served with status 200', () => {
    const html = `<!doctype html><html><head><title>Just a moment...</title></head>
      <body><div id="challenge-platform">Checking your browser before accessing example.com</div></body></html>`
    const v = assessPageValidity(html, 200)
    expect(v.ok).toBe(false)
    expect(v.reason).toBe('waf_challenge')
  })

  it('rejects "Attention Required! | Cloudflare" block pages', () => {
    const html = `<html><head><title>Attention Required! | Cloudflare</title></head><body>${'x'.repeat(300)}</body></html>`
    expect(assessPageValidity(html, 403).reason).toBe('waf_challenge')
  })

  it('rejects Imperva/Incapsula and PerimeterX interstitials', () => {
    expect(assessPageValidity('<html><body>Request unsuccessful. Incapsula incident ID: 1</body></html>', 200).reason).toBe('waf_challenge')
    expect(assessPageValidity('<html><body><div id="px-captcha"></div>Please verify you are a human</body></html>', 200).reason).toBe('waf_challenge')
  })

  it('rejects egress-proxy denial bodies as proxy_denial, never as site findings', () => {
    const v = assessPageValidity('Host not in allowlist: example.org. Add this host to your network egress settings.', 403)
    expect(v.ok).toBe(false)
    expect(v.reason).toBe('proxy_denial')
  })
})

describe('assessPageValidity — empty and non-HTML responses', () => {
  it('rejects empty responses', () => {
    expect(assessPageValidity('', 200).reason).toBe('empty_response')
    expect(assessPageValidity('   \n ', 200).reason).toBe('empty_response')
  })

  it('rejects non-HTML payloads (JSON served at a page URL)', () => {
    expect(assessPageValidity('{"ok":true,"items":[1,2,3]}', 200).reason).toBe('not_html')
  })

  it('rejects trivially small documents with no analyzable content', () => {
    expect(assessPageValidity('<html><body>hi</body></html>', 200).reason).toBe('no_content')
  })
})

describe('assessPageValidity — valid pages preserved', () => {
  it('accepts a normal 200 HTML page', () => {
    expect(assessPageValidity(REAL_PAGE, 200)).toEqual({ ok: true })
  })

  it('accepts a page that merely mentions security topics in its content', () => {
    const html = `<!doctype html><html><head><title>What is a WAF? — Security Guide</title></head>
      <body><h1>Web Application Firewalls explained</h1>
      <p>${'A WAF filters traffic. CAPTCHA systems and DDoS mitigation are related controls. '.repeat(20)}</p></body></html>`
    expect(assessPageValidity(html, 200).ok).toBe(true)
  })
})
