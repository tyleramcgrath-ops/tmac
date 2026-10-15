import { describe, expect, it } from 'vitest'
import { cleanSiteUrl, readMockupForm } from '../apps/saysites/lib/mockups'
import { MemoryStore } from '../apps/saysites/lib/store'

const form = (o: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(o)) f.set(k, v)
  return f
}

describe('SaySites free homepage mockups', () => {
  it('tidies the website address and rejects anything that isn’t one', () => {
    expect(cleanSiteUrl('MacMahonLaw.com')).toBe('https://macmahonlaw.com')
    expect(cleanSiteUrl('http://example.com/about')).toBe('http://example.com/about')
    expect(cleanSiteUrl('not a site')).toBeNull()
    expect(cleanSiteUrl('')).toBeNull()
  })

  it('needs a site, a name and a real email', () => {
    expect(readMockupForm(form({ url: 'x', name: 'A', email: 'a@b.co' }))).toMatchObject({ error: expect.stringMatching(/website/) })
    expect(readMockupForm(form({ url: 'a.com', name: '', email: 'a@b.co' }))).toMatchObject({ error: expect.stringMatching(/name/) })
    expect(readMockupForm(form({ url: 'a.com', name: 'A', email: 'nope' }))).toMatchObject({ error: expect.stringMatching(/email/) })
    expect(readMockupForm(form({ url: 'a.com', name: 'Ann', email: 'ann@a.com', business: 'Ann Law' }))).toEqual({ ok: { url: 'https://a.com', name: 'Ann', email: 'ann@a.com', business: 'Ann Law' } })
  })

  it('keeps requests newest first and marks them sent', async () => {
    const store = new MemoryStore()
    await store.saveMockup({ id: 'm1', url: 'https://a.com', name: 'A', email: 'a@a.com', at: '2026-10-15T10:00:00Z', status: 'new' })
    await store.saveMockup({ id: 'm2', url: 'https://b.com', name: 'B', email: 'b@b.com', at: '2026-10-15T11:00:00Z', status: 'new' })
    await store.saveMockup({ id: 'm1', url: 'https://a.com', name: 'A', email: 'a@a.com', at: '2026-10-15T10:00:00Z', status: 'sent' })
    const list = await store.mockups()
    expect(list).toHaveLength(2)
    expect(list.find((m) => m.id === 'm1')!.status).toBe('sent')
  })
})
