// The shared Google-position lookup behind both the point-in-time rankings
// tool and the scheduled rank-tracking job. Its contract is that it never
// throws — a failed lookup degrades to "no position to report" rather than
// taking down a whole tracking run.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchKeywordPosition, hostOf, serpApiKey } from '../lib/foundation/serp'

const realFetch = globalThis.fetch

function respond(body: unknown, init: { ok?: boolean; json?: () => unknown } = {}) {
  globalThis.fetch = vi.fn(async () => ({
    ok: init.ok ?? true,
    json: init.json ?? (async () => body),
  })) as unknown as typeof fetch
}

beforeEach(() => {
  delete process.env.SERPAPI_KEY
})

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('serpApiKey', () => {
  it('is null when unset or blank', () => {
    expect(serpApiKey()).toBeNull()
    process.env.SERPAPI_KEY = ''
    expect(serpApiKey()).toBeNull()
    process.env.SERPAPI_KEY = 'k'
    expect(serpApiKey()).toBe('k')
  })
})

describe('hostOf', () => {
  it('normalizes a bare domain, a URL, and a www host to the same key', () => {
    expect(hostOf('acme.com')).toBe('acme.com')
    expect(hostOf('https://www.acme.com/pricing')).toBe('acme.com')
    expect(hostOf('www.acme.com')).toBe('acme.com')
    expect(hostOf('HTTP://ACME.COM')).toBe('acme.com')
  })

  it('returns empty for input that is not a host, rather than throwing', () => {
    // Callers pass a stored project domain; a malformed one should not take
    // down a scheduled run with an unhandled URL parse error.
    expect(hostOf('not a domain')).toBe('')
    expect(hostOf('')).toBe('')
  })
})

describe('fetchKeywordPosition', () => {
  it('reports the position of the first result on the tracked host', async () => {
    respond({
      organic_results: [
        { link: 'https://competitor.com/a', position: 1 },
        { link: 'https://www.acme.com/pricing', position: 2 },
      ],
    })
    expect(await fetchKeywordPosition('best crm', 'acme.com', 'k')).toEqual({
      keyword: 'best crm',
      position: 2,
      url: 'https://www.acme.com/pricing',
      topResult: 'https://competitor.com/a',
    })
  })

  it('reports a null position honestly when the host is nowhere in the results', async () => {
    respond({ organic_results: [{ link: 'https://competitor.com/a', position: 1 }] })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toEqual({
      keyword: 'q', position: null, url: null, topResult: 'https://competitor.com/a',
    })
  })

  it('falls back to the result index when the API omits an explicit position', async () => {
    // Otherwise the row reads as "found the URL but not ranking", which is
    // self-contradictory and would register as a rank drop.
    respond({ organic_results: [{ link: 'https://other.com' }, { link: 'https://acme.com/x' }] })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toMatchObject({
      position: 2, url: 'https://acme.com/x',
    })
  })

  it('skips unparsable result links instead of throwing', async () => {
    respond({ organic_results: [{ link: 'not a url', position: 1 }, { link: 'https://acme.com/x', position: 2 }] })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toMatchObject({ position: 2 })
  })

  it('returns an empty row on an HTTP error', async () => {
    respond({}, { ok: false })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toEqual({
      keyword: 'q', position: null, url: null, topResult: null,
    })
  })

  it('returns an empty row when the network fails', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('ETIMEDOUT') }) as unknown as typeof fetch
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toMatchObject({ position: null })
  })

  it('returns an empty row when the body is not JSON', async () => {
    respond(null, { json: () => { throw new SyntaxError('bad') } })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toMatchObject({ position: null })
  })

  it('handles a response with no organic_results array at all', async () => {
    respond({ error: 'Your account ran out of searches.' })
    expect(await fetchKeywordPosition('q', 'acme.com', 'k')).toEqual({
      keyword: 'q', position: null, url: null, topResult: null,
    })
  })
})
