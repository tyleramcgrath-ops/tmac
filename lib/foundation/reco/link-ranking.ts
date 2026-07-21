// Relevance-based internal-link target selection. When RankForge auto-links an
// orphan / no-outbound page, it should link to the MOST TOPICALLY RELATED
// pages already on the site — not an arbitrary few. Relevant internal links
// pass more value, help real users, and read as editorial rather than spam,
// which is what's actually best for SEO. Relevance is computed from titles +
// URL slugs, the signals available everywhere this runs — server-side in the
// operator fix generator (lib/foundation/operator/fixgen.ts, from crawl data)
// and client-side in the WordPress optimizer panels (from the live site
// listing) — so every automatic internal-linking path picks the same way.
// The anchor text is the target page's own title, per Google's
// descriptive-anchor guidance.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from',
  'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'your', 'our',
  'you', 'we', 'it', 'this', 'that', 'how', 'what', 'why', 'best', 'top', 'guide', 'page', 'home',
])

// Meaningful, deduped tokens from a page's title + URL slug.
export function linkTokens(title: string, url: string): Set<string> {
  let slug = url
  try {
    slug = new URL(url).pathname
  } catch {
    /* keep raw url */
  }
  const raw = `${title} ${slug.replace(/[-_/]+/g, ' ')}`.toLowerCase()
  const tokens = raw.split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  return new Set(tokens)
}

export interface LinkCandidate {
  url: string
  title: string
}

function cleanAnchor(title: string, url: string): string {
  const a = title.replace(/<[^>]+>/g, '').split(/[·|—–|]/)[0].trim()
  return a || url
}

// Rank candidate pages by topical overlap with the source page and take the
// top `n`. Falls back to original order (first-`n`) when nothing overlaps, so
// auto-linking still adds links rather than silently doing nothing — never
// worse than the previous arbitrary pick, and better whenever a relevant page
// exists.
export function rankLinkCandidates(
  source: LinkCandidate,
  candidates: LinkCandidate[],
  n = 3
): { url: string; anchor: string }[] {
  const srcTokens = linkTokens(source.title, source.url)
  const scored = candidates.map((c, i) => {
    const t = linkTokens(c.title, c.url)
    let overlap = 0
    for (const tok of t) if (srcTokens.has(tok)) overlap++
    return { c, i, overlap }
  })
  // Highest topical overlap first; stable tie-break by original order.
  scored.sort((a, b) => b.overlap - a.overlap || a.i - b.i)
  return scored.slice(0, n).map(({ c }) => ({ url: c.url, anchor: cleanAnchor(c.title, c.url) }))
}
