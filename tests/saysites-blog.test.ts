import { describe, expect, it } from 'vitest'
import { LAUNCH_ARTICLES, allArticles, checkArticle, headingsOf, publishedArticles, renderBody, slugify } from '../apps/saysites/lib/articles'
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
    expect(live.length).toBe(LAUNCH_ARTICLES.length - 1)
  })
})
