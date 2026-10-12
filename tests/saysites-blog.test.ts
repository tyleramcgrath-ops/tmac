import { describe, expect, it } from 'vitest'
import { SCHEDULED_ARTICLES } from '../apps/saysites/lib/articles-scheduled'
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

  it('writes ahead: checked articles, each hidden until its day', () => {
    for (const a of SCHEDULED_ARTICLES) {
      expect(checkArticle(a), a.slug).toBeNull()
      expect(a.body.split(/\s+/).length, a.slug).toBeGreaterThan(450)
      // Articles may quote rules about guarantees; SaySites itself never promises results.
      expect(a.body, a.slug).not.toMatch(/we guarantee|guaranteed (rank|result|lead|traffic)|rank first|more leads|#1 (on|in) google/i)
      expect(`${a.title} ${a.description} ${a.body}`, a.slug).not.toContain('\u2014')
    }
    const slugs = [...LAUNCH_ARTICLES, ...SCHEDULED_ARTICLES].map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('daily articles (from 2026-10-12): 2,000+ words, photos with alt text, FAQ and fresh links', () => {
    const daily = SCHEDULED_ARTICLES.filter((a) => a.published >= '2026-10-12' && a.faq)
    expect(daily.length).toBeGreaterThanOrEqual(2)
    for (const a of daily) {
      expect(bodyWords(a.body).length, a.slug).toBeGreaterThanOrEqual(2000)
      expect(a.title.length, a.slug).toBeLessThanOrEqual(62)
      expect(a.description.length, a.slug).toBeGreaterThanOrEqual(120)
      expect(a.description.length, a.slug).toBeLessThanOrEqual(160)
      expect(a.hero && safeImage(a.hero.src) && a.hero.alt.length > 15, a.slug).toBeTruthy()
      const imgs = imagesOf(a)
      expect(imgs.length, a.slug).toBeGreaterThanOrEqual(3)
      for (const src of imgs) expect(safeImage(src), src).toBe(true)
      expect(a.faq!.length, a.slug).toBeGreaterThanOrEqual(5)
      for (const f of a.faq!) {
        const w = f.a.split(/\s+/).length
        expect(w, f.q).toBeGreaterThanOrEqual(40)
        expect(w, f.q).toBeLessThanOrEqual(80)
      }
      for (const href of ['/pricing', '/redesign', '/signup', '/websites-for/']) expect(a.body, `${a.slug} ${href}`).toContain(`](${href}`)
      expect((a.body.match(/\]\(\/blog\//g) ?? []).length, a.slug).toBeGreaterThanOrEqual(2)
    }
  })

  it('renders body photos as lazy figures with escaped alt text, and drops other hosts', () => {
    const html = renderBody('![A "quoted" <alt>](https://images.unsplash.com/photo-1?w=10)\n\n![x](https://evil.example/p.jpg)')
    expect(html).toContain('<figure><img src="https://images.unsplash.com/photo-1?w=10" alt="A &quot;quoted&quot; &lt;alt&gt;" width="1200" height="800" loading="lazy" decoding="async"></figure>')
    expect(html).not.toContain('evil.example')
  })

  it('duplicate guard: every article is unique (address, title, photos, 5-gram overlap)', () => {
    const all = [...LAUNCH_ARTICLES, ...SCHEDULED_ARTICLES]
    expect(() => assertNoDuplicates(all)).not.toThrow()
    const a = SCHEDULED_ARTICLES[0]
    expect(() => assertNoDuplicates([...all, { ...a, slug: 'copy-of-it', title: 'A different title here' }])).toThrow(/too similar|photo/)
    expect(() => assertNoDuplicates([...all, { ...LAUNCH_ARTICLES[1], slug: 'other-slug', body: 'fresh words '.repeat(200) }])).toThrow(/title/)
    const noPhoto = { ...a, hero: undefined, body: a.body.replace(/^!\[.*$/gm, '') }
    expect(() => assertNoDuplicates([...all.filter((x) => x.slug !== a.slug), noPhoto, { ...noPhoto, slug: 'near-copy', title: 'Another title entirely' }])).toThrow(/too similar/)
  })
})
