// Perplexity is the only answer engine that exposes its real grounding
// sources, so checkCitation is the single place that decides whether a brand
// was genuinely cited. Its answer feeds the citation-loss and
// position-drop alerts, which email a customer to say they lost a citation —
// a false negative here is an email claiming a loss that never happened.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkCitation, perplexityApiKey } from '../lib/foundation/ai-citations'

const realFetch = globalThis.fetch

function respond(body: unknown, init: { ok?: boolean; status?: number; json?: () => unknown } = {}) {
  globalThis.fetch = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: init.json ?? (async () => body),
  })) as unknown as typeof fetch
}

beforeEach(() => {
  delete process.env.PERPLEXITY_API_KEY
})

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('perplexityApiKey', () => {
  it('is null when unset or blank rather than an empty string', () => {
    expect(perplexityApiKey()).toBeNull()
    process.env.PERPLEXITY_API_KEY = ''
    expect(perplexityApiKey()).toBeNull()
    process.env.PERPLEXITY_API_KEY = 'pk'
    expect(perplexityApiKey()).toBe('pk')
  })
})

describe('checkCitation: reads real sources, never invents one', () => {
  it('finds the brand in the citations list and reports its 1-based position', async () => {
    respond({ citations: ['https://other.com/a', 'https://acme.com/pricing', 'https://third.com'] })
    const out = await checkCitation('best crm', 'acme.com', 'k')
    expect(out).toEqual({
      available: true, cited: true, position: 2,
      citedUrl: 'https://acme.com/pricing', sourceCount: 3,
    })
  })

  it('counts a subdomain of the brand as the brand', async () => {
    respond({ citations: ['https://blog.acme.com/post'] })
    expect(await checkCitation('q', 'acme.com', 'k')).toMatchObject({ cited: true, position: 1 })
  })

  it('does not count a lookalike domain as the brand', async () => {
    respond({ citations: ['https://notacme.com/x', 'https://acme.com.evil.net/y'] })
    expect(await checkCitation('q', 'acme.com', 'k')).toMatchObject({ cited: false, position: null })
  })

  it('ignores www on either side', async () => {
    respond({ citations: ['https://www.acme.com/x'] })
    expect(await checkCitation('q', 'www.acme.com', 'k')).toMatchObject({ cited: true, position: 1 })
  })

  it('reports an honest not-cited when the sources are all other domains', async () => {
    respond({ citations: ['https://a.com', 'https://b.com'] })
    expect(await checkCitation('q', 'acme.com', 'k')).toEqual({
      available: true, cited: false, position: null, citedUrl: null, sourceCount: 2,
    })
  })

  it('reads search_results when the response uses that shape instead', async () => {
    respond({ search_results: [{ url: 'https://acme.com/a' }] })
    expect(await checkCitation('q', 'acme.com', 'k')).toMatchObject({ cited: true, position: 1, sourceCount: 1 })
  })

  it('falls back to search_results when citations is present but empty', async () => {
    // Perplexity returns both keys on newer responses and may send an empty
    // citations array alongside a populated search_results. Treating the empty
    // array as authoritative reports a lost citation that was never lost.
    respond({ citations: [], search_results: [{ url: 'https://other.com' }, { url: 'https://acme.com/x' }] })
    expect(await checkCitation('q', 'acme.com', 'k')).toMatchObject({
      cited: true, position: 2, citedUrl: 'https://acme.com/x', sourceCount: 2,
    })
  })

  it('drops blank and unparsable source URLs from the count', async () => {
    respond({ citations: ['', 'not a url', 'https://acme.com/x'] })
    const out = await checkCitation('q', 'acme.com', 'k')
    expect(out.sourceCount).toBe(2)
    expect(out.cited).toBe(true)
  })
})

describe('checkCitation: an unusable response is unavailable, never "not cited"', () => {
  it('reports unavailable when the API is unreachable', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('ECONNRESET') }) as unknown as typeof fetch
    const out = await checkCitation('q', 'acme.com', 'k')
    expect(out.available).toBe(false)
    expect(out.message).toMatch(/Could not reach Perplexity/)
  })

  it('reports unavailable on an HTTP error, naming the status', async () => {
    respond({}, { ok: false, status: 429 })
    const out = await checkCitation('q', 'acme.com', 'k')
    expect(out).toMatchObject({ available: false, cited: false, sourceCount: 0 })
    expect(out.message).toMatch(/429/)
  })

  it('reports unavailable when the body is not JSON, instead of throwing at the caller', async () => {
    // A 200 with an HTML error page would otherwise escape as an exception and
    // abort the whole scheduled citation run, not just this one query.
    respond(null, { json: () => { throw new SyntaxError('Unexpected token <') } })
    const out = await checkCitation('q', 'acme.com', 'k')
    expect(out.available).toBe(false)
    expect(out.cited).toBe(false)
  })

  it('treats a well-formed response with no sources as available but not cited', async () => {
    respond({ citations: [] })
    expect(await checkCitation('q', 'acme.com', 'k')).toEqual({
      available: true, cited: false, position: null, citedUrl: null, sourceCount: 0,
    })
  })
})
