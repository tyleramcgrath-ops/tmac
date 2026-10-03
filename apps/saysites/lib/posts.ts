// Blog posts are ordinary pages at /blog/<slug> with post details, plus a
// /blog page listing them. These build both from what the owner types.

import { wordsFor } from './site-words'
import { randomUUID } from 'crypto'
import type { Element, Page, Site } from './schema'

export interface PostInput {
  title: string
  date: string // YYYY-MM-DD
  body: string // blank lines separate paragraphs; "## " starts a subheading
  image?: { src: string; alt: string }
}

const section = { desktop: { top: 80, right: 24, bottom: 96, left: 24 }, mobile: { top: 44, right: 20, bottom: 56, left: 20 } }

export function postSlug(title: string): string {
  const s = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return s || 'post'
}

function excerptOf(body: string): string {
  const first = body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('## ')) ?? body.replace(/^## .*\n?/, '')
  const flat = first.replace(/\s+/g, ' ').trim()
  return flat.length <= 200 ? flat : flat.slice(0, 199).replace(/\s+\S*$/, '') + '…'
}

function bodyElements(body: string): Element[] {
  const out: Element[] = []
  let n = 0
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push({ id: `post-p${++n}`, type: 'text', text: para.join('\n\n'), style: { fontSize: { desktop: 19, mobile: 17 } } })
    para = []
  }
  for (const block of body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    if (block.startsWith('## ')) {
      flush()
      // The subheading is the first line; anything under it is a paragraph.
      const [line, ...rest] = block.split('\n')
      out.push({ id: `post-h${++n}`, type: 'heading', level: 2, text: line.slice(3).trim().slice(0, 300), style: { fontSize: { desktop: 30, mobile: 24 }, margin: { desktop: { top: 18, right: 0, bottom: 0, left: 0 } } } })
      if (rest.join('\n').trim()) para.push(rest.join('\n').trim())
    } else para.push(block)
  }
  flush()
  return out
}

export function buildPostPage(site: Site, input: PostInput, existing?: Page): Page {
  const slug = existing?.slug ?? `blog/${postSlug(input.title)}`
  const title = input.title.trim()
  const excerpt = excerptOf(input.body)
  const seoTitle = `${title} | ${site.business.name}`
  const w = wordsFor(site.language)
  return {
    id: existing?.id ?? `page_${randomUUID()}`,
    siteId: site.id,
    slug,
    name: title.slice(0, 60),
    status: 'published',
    seo: {
      title: seoTitle.length <= 70 ? seoTitle : title.slice(0, 70),
      description: excerpt.slice(0, 170),
      ...(input.image ? { ogImage: input.image.src } : {}),
    },
    post: { title: title.slice(0, 140), date: input.date, excerpt: excerpt.slice(0, 300), ...(input.image ? { image: input.image } : {}) },
    body: [
      {
        id: 'post',
        type: 'container',
        tag: 'article',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 18 } },
        children: [
          {
            id: 'post-in',
            type: 'container',
            layout: 'flex',
            style: { gap: { desktop: 16 }, maxWidth: 760 },
            children: [
              { id: 'post-back', type: 'button', label: w.allPosts, href: '/blog', variant: 'outline', style: { fontSize: { desktop: 14 } } },
              { id: 'post-date', type: 'text', text: new Date(`${input.date}T12:00:00Z`).toLocaleDateString(w.locale, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }), style: { color: 'muted', fontWeight: 600, fontSize: { desktop: 15 }, margin: { desktop: { top: 16, right: 0, bottom: 0, left: 0 } } } },
              { id: 'post-title', type: 'heading', level: 1, text: title.slice(0, 300), style: { fontSize: { desktop: 50, tablet: 42, mobile: 34 } } },
              ...(input.image
                ? [{ id: 'post-img', type: 'image' as const, src: input.image.src, alt: input.image.alt, width: 1600, height: 1067, aspect: 1.6, priority: true, style: { borderRadius: Math.min(site.globals.radius, 14), margin: { desktop: { top: 12, right: 0, bottom: 12, left: 0 } } } }]
                : []),
              ...bodyElements(input.body),
              { id: 'post-cta', type: 'button', label: site.header?.cta?.label ?? w.getInTouch, href: site.header?.cta?.href ?? '/contact', variant: 'primary', style: { margin: { desktop: { top: 20, right: 0, bottom: 0, left: 0 } } } },
            ],
          },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

export function buildBlogIndex(site: Site, id?: string): Page {
  const w = wordsFor(site.language)
  return {
    id: id ?? `page_${randomUUID()}`,
    siteId: site.id,
    slug: 'blog',
    name: w.blogName,
    status: 'published',
    seo: {
      title: w.blogTitle(site.business.name).slice(0, 60),
      description: w.blogIntro(site.business.name).slice(0, 160),
    },
    body: [
      {
        id: 'blog',
        type: 'container',
        tag: 'section',
        layout: 'flex',
        boxed: true,
        style: { padding: section, gap: { desktop: 14 } },
        children: [
          { id: 'blog-h', type: 'heading', level: 1, text: w.blogHeading, style: { fontSize: { desktop: 52, mobile: 36 } } },
          { id: 'blog-t', type: 'text', text: w.blogIntro(site.business.name), style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 560 } },
          { id: 'blog-posts', type: 'posts', style: { margin: { desktop: { top: 32, right: 0, bottom: 0, left: 0 } } } },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

// The post's own text back out of its page, for editing.
export function postBodyText(page: Page): string {
  const inner = page.body[0]?.children.find((c) => c.id === 'post-in')
  if (!inner || inner.type !== 'container') return ''
  return inner.children
    .flatMap((el) => (el.type === 'heading' && el.level === 2 ? [`## ${el.text}`] : el.type === 'text' && el.id.startsWith('post-p') ? [el.text] : []))
    .join('\n\n')
}
