import { describe, expect, it } from 'vitest'
import { SCHEDULED_ARTICLES } from '../apps/saysites/lib/articles-scheduled'
import { DAILY_ARTICLES } from '../apps/saysites/lib/articles-daily'
import { LAUNCH_ARTICLES, allArticles, assertNoDuplicates, bodyWords, checkArticle, headingsOf, imagesOf, publishedArticles, renderBody, safeImage, slugify } from '../apps/saysites/lib/articles'
import { MemoryStore } from '../apps/saysites/lib/store'

describe('SaySites blog', () => {
  it('launch articles pass the same checks as the editor', () => {
    for (const a of LAUNCH_ARTICLES) expect(checkArticle(a), a.slug).toBeNull()
    expect(new Set(LAUNCH_ARTICLES.map((a) => a.slug)).size).toBe(LAUNCH_ARTICLES.length)
  })

  it('never promises rankings or leads, and links only to safe addresses', () => {
    for (const a of LAUNCH_ARTICLES) {
      const text = `${a.title} ${a.description} ${a.summary.join(' ')} ${a.body}`.toLowerCase()
      expect(text).not.toMatch(/guarantee(d)? (a |#1 |first )?(rank|position|lead)|we promise .*rank/)
      expect(text).not.toMatch(/\$\d/)
      for (const m of a.body.matchAll(/\]\(([^)]+)\)/g)) expect(m[1]).toMatch(/^(https:\/\/|\/)/)
    }
  })

  it('renders the body as safe HTML', () => {
    const html = renderBody('## Why it <matters>\n\nA [link](https://example.com) and **bold** <script>x</script>\n\n- one\n- two\n\n1. first\n2. second\n\n> quoted\n\n[bad](javascript:alert(1))')
    expect(html).toContain('<h2 id="why-it-matters">Why it &lt;matters&gt;</h2>')
    expect(html).toContain('<a href="https://example.com" rel="noopener">link</a>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>')
    expect(html).toContain('<ol><li>first</li><li>second</li></ol>')
    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('href="javascript')
    expect(headingsOf('## One\n\ntext\n\n## Two')).toEqual([{ id: 'one', text: 'One' }, { id: 'two', text: 'Two' }])
    expect(slugify('Google’s AI Overviews: what to know!')).toBe('google-s-ai-overviews-what-to-know')
  })

  it('lets the dashboard edit, hide and add articles', async () => {
    const store = new MemoryStore()
    const first = LAUNCH_ARTICLES[0]
    await store.saveArticle({ ...first, title: 'Edited title for the launch article', status: 'draft' })
    await store.saveArticle({ ...first, slug: 'future-post', title: 'A post for next year', published: '2099-01-01', status: 'published' })
    const all = await allArticles(store)
    expect(all.find((a) => a.slug === first.slug)?.title).toBe('Edited title for the launch article')
    const live = await publishedArticles(store)
    expect(live.some((a) => a.slug === first.slug)).toBe(false)
    expect(live.some((a) => a.slug === 'future-post')).toBe(false)
    const today = new Date().toISOString().slice(0, 10)
    expect(live.length).toBe(LAUNCH_ARTICLES.length - 1 + SCHEDULED_ARTICLES.filter((a) => a.published <= today).length)
  })

  it('writes ahead: one checked article a day, each hidden until its day', () => {
    for (const a of SCHEDULED_ARTICLES) {
      expect(checkArticle(a), a.slug).toBeNull()
      expect(a.body.split(/\s+/).length, a.slug).toBeGreaterThan(450)
      // Promises, not quotes: articles may quote bar rules that ban guarantees.
      expect(a.body, a.slug).not.toMatch(/we guarantee|guaranteed (results|rankings|leads)|rank(s)? #1|rank first|more leads/i)
    }
    // One a day until the daily run began; two a day since (the owner, October 10, 2026).
    const perDay = new Map<string, number>()
    for (const a of SCHEDULED_ARTICLES) perDay.set(a.published, (perDay.get(a.published) ?? 0) + 1)
    for (const [day, n] of perDay) expect(n, day).toBeLessThanOrEqual(3)
    const slugs = [...LAUNCH_ARTICLES, ...SCHEDULED_ARTICLES].map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never publishes the same or near-same content twice', () => {
    const all = [...LAUNCH_ARTICLES, ...SCHEDULED_ARTICLES]
    expect(() => assertNoDuplicates(all)).not.toThrow()
    const titles = all.map((a) => a.title.toLowerCase())
    expect(new Set(titles).size).toBe(titles.length)
    const faqs = all.flatMap((a) => (a.faq ?? []).map((f) => f.a.toLowerCase()))
    expect(new Set(faqs).size).toBe(faqs.length)
    // The guard really does catch a copy, a reworded copy's twin and a reused photo.
    const a = DAILY_ARTICLES[0]
    expect(() => assertNoDuplicates([a, { ...a, slug: 'copy', title: 'A copy' }])).toThrow(/too similar|photo/)
    expect(() => assertNoDuplicates([a, { ...a, title: 'Other title', body: 'Fresh words.' }])).toThrow(/address/)
  })

  it('daily articles meet the daily run’s bar', () => {
    expect(DAILY_ARTICLES.length).toBeGreaterThanOrEqual(1)
    for (const a of DAILY_ARTICLES) {
      expect(checkArticle(a), a.slug).toBeNull()
      expect(bodyWords(a.body).length, a.slug).toBeGreaterThanOrEqual(2000)
      expect(a.title.length, a.slug).toBeLessThanOrEqual(62)
      expect(a.description.length, a.slug).toBeGreaterThanOrEqual(120)
      expect(a.description.length, a.slug).toBeLessThanOrEqual(160)
      expect(a.summary.length, a.slug).toBeGreaterThanOrEqual(3)
      expect(a.hero && safeImage(a.hero.src) && a.hero.alt.length > 20, a.slug).toBeTruthy()
      const inBody = imagesOf(a).length - 1
      expect(inBody, a.slug).toBeGreaterThanOrEqual(2)
      expect(inBody, a.slug).toBeLessThanOrEqual(3)
      for (const m of a.body.matchAll(/^!\[([^\]]+)\]\((\S+)\)$/gm)) {
        expect(safeImage(m[2]), m[2]).toBe(true)
        expect(m[1].length, m[2]).toBeGreaterThan(20)
      }
      expect(a.faq?.length ?? 0, a.slug).toBeGreaterThanOrEqual(5)
      expect(a.faq?.length ?? 0, a.slug).toBeLessThanOrEqual(8)
      for (const f of a.faq ?? []) {
        const n = f.a.split(/\s+/).length
        expect(n, f.q).toBeGreaterThanOrEqual(40)
        expect(n, f.q).toBeLessThanOrEqual(80)
      }
      const text = `${a.title} ${a.description} ${a.summary.join(' ')} ${a.body} ${(a.faq ?? []).map((f) => f.q + ' ' + f.a).join(' ')}`
      expect(text, a.slug).not.toContain('\u2014')
      expect(text, a.slug).not.toMatch(/guarantee(d)? (you |a |more )?(rank|position|lead|calls)|more leads|rank first|#1 on google/i)
      for (const link of ['/websites-for/', '/pricing', '/redesign', '/signup']) expect(a.body, `${a.slug} ${link}`).toContain(`](${link}`)
      expect([...a.body.matchAll(/\]\(\/blog\/[a-z0-9-]+\)/g)].length, a.slug).toBeGreaterThanOrEqual(2)
      for (const m of a.body.matchAll(/\]\(([^)]+)\)/g)) expect(m[1]).toMatch(/^(https:\/\/|\/)/)
    }
  })
})
