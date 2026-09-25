// A quick, free look at a page's HTML: how heavy it is, how many scripts it
// loads, and whether the basics Google reads are there. Used to compare an
// owner's current home page with the SaySites version.

export interface Audit {
  kb: number
  scripts: number
  stylesheets: number
  images: number
  imagesNoAlt: number
  h1s: number
  titleLength: number
  hasDescription: boolean
  schema: string[]
  viewport: boolean
}

export function audit(html: string): Audit {
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  const schema = new Set<string>()
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*(?:"([^"]+)"|\[([^\]]+)\])/g)) (t[1] ?? t[2]).split(',').map((x) => x.replace(/"/g, '').trim()).filter(Boolean).forEach((x) => schema.add(x))
  }
  return {
    kb: Math.round(Buffer.byteLength(html) / 102.4) / 10,
    scripts: (html.match(/<script\b(?![^>]*application\/(ld\+)?json)[^>]*>/gi) ?? []).length,
    stylesheets: (html.match(/<link\b[^>]*rel\s*=\s*["']?stylesheet/gi) ?? []).length,
    images: imgs.length,
    imagesNoAlt: imgs.filter((i) => !/\salt\s*=\s*["'][^"']+["']/i.test(i)).length,
    h1s: (html.match(/<h1[\s>]/gi) ?? []).length,
    titleLength: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim().length,
    hasDescription: /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["'][^"']{20,}/i.test(html),
    schema: [...schema].slice(0, 12),
    viewport: /<meta[^>]*name\s*=\s*["']viewport["']/i.test(html),
  }
}
